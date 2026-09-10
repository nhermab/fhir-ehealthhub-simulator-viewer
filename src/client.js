import {
  filterFixtures,
  outcome,
  redactHeaders,
  SSIN,
  SSIN_OID,
  validateSsin,
} from "./fhir.js";
import { secureHeaders } from "./auth.js";
export const defaults = {
  mode: "demo",
  base: "http://localhost:8080/fhir",
  transport: "proxy",
  timeout: 30000,
  strictSsin: false,
  partial: false,
  headers: "{}",
  tokenEndpoint: "",
  clientId: "",
  scope: "",
  audience: "",
  grant: "credentials",
  theme: "light",
};
const fixture = async (path) => {
  const r = await fetch("/fixtures/" + path);
  if (!r.ok) throw Error("Missing demo fixture: " + path);
  return r.json();
};
let cached;
export async function demoData() {
  return (cached ||= Promise.all(
    [
      "DocRefLabReportContainedExample",
      "DocRefLabReportExample",
      "DocRefTelemonitoringExample",
      "DocRefMinimalExample",
    ].map((id) =>
      fixture("document-references/DocumentReference-" + id + ".json"),
    ),
  ));
}
export function targetUrl(base, path) {
  const root = new URL(base.replace(/\/$/, "") + "/");
  const url = new URL(path, root);
  if (
    url.origin !== root.origin ||
    !url.pathname.startsWith(root.pathname) ||
    url.username ||
    url.password
  )
    throw Error(
      "Request target must stay within the configured FHIR base. Change the connection explicitly to access another hub.",
    );
  return url.href;
}
export async function transport(request, settings, signal) {
  if (settings.transport === "proxy")
    return fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
      redirect: "error",
      credentials: "omit",
    });
  return fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.method === "POST" ? request.body : undefined,
    signal,
    redirect: "error",
    credentials: "omit",
  });
}
export async function requestFHIR(path, options, context) {
  const { settings, auth, onLog } = context,
    start = performance.now();
  const request = {
    url: targetUrl(settings.base, path),
    method: options.method || "GET",
    headers: {
      Accept: options.accept || "application/fhir+json; fhirVersion=4.0",
      "Content-Type": options.contentType || "application/fhir+json",
      ...JSON.parse(settings.headers || "{}"),
      ...(settings.partial ? { "X-Simulate-Partial-Failure": "true" } : {}),
    },
    body: options.body,
  };
  if (options.method === "POST" && typeof request.body === "object")
    request.body = JSON.stringify(request.body);
  const controller = new AbortController(),
    timer = setTimeout(
      () => controller.abort(),
      Number(settings.timeout) || 30000,
    );
  let response,
    data,
    raw,
    responseHeaders = {},
    status = 0;
  try {
    if (settings.mode !== "demo")
      request.headers = await secureHeaders(request, auth);
    response =
      settings.mode === "demo"
        ? await demoRequest(path, request, settings)
        : await transport(request, settings, controller.signal);
    status = response.status;
    responseHeaders = Object.fromEntries(response.headers);
    if (response.headers.get("dpop-nonce"))
      auth.nonce = response.headers.get("dpop-nonce");
    if (
      response.headers.get("content-type")?.includes("pdf") ||
      response.headers.get("content-type")?.includes("octet-stream")
    ) {
      data = await response.blob();
      raw = `[Binary payload: ${data.size} bytes, ${data.type}]`;
    } else {
      raw = await response.text();
      try {
        data = JSON.parse(raw);
      } catch {
        data = raw;
      }
    }
    onLog({
      ...request,
      headers: redactHeaders(request.headers),
      status,
      responseHeaders: redactedResponse(responseHeaders),
      data,
      raw,
      ms: Math.round(performance.now() - start),
      time: new Date().toISOString(),
      demo: settings.mode === "demo",
    });
    if (!response.ok) {
      const error = Error(
        data?.issue
          ?.map((i) => i.diagnostics || i.details?.text || i.code)
          .join("; ") ||
          data?.error ||
          `HTTP ${status}: ${String(raw).slice(0, 200)}`,
      );
      error.status = status;
      error.outcome = data;
      throw error;
    }
    return data;
  } catch (error) {
    if (!status)
      onLog({
        ...request,
        headers: redactHeaders(request.headers),
        status: 0,
        responseHeaders: {},
        data: { error: error.message },
        raw: error.message,
        ms: Math.round(performance.now() - start),
        time: new Date().toISOString(),
        demo: settings.mode === "demo",
      });
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
function redactedResponse(headers) {
  return redactHeaders(headers);
}
export async function demoRequest(path, request, settings) {
  const url = new URL(path, "http://demo/fhir/");
  const route = url.pathname.replace(/^\/fhir\//, "");
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/fhir+json",
        "X-Viewer-Source": "offline-fixture",
      },
    });
  if (route === "metadata")
    return json(
      await fixture(
        "metadata/CapabilityStatement-BeInterhubDocumentResponder.json",
      ),
    );
  const docs = await demoData();
  if (route === "DocumentReference/_search") {
    const p = new URLSearchParams(request.body),
      identifier = p.get("patient.identifier");
    if (!identifier)
      return json(
        outcome("required", "Mandatory patient.identifier is missing."),
        400,
      );
    const parts = identifier.split("|");
    if (parts.length > 1 && ![SSIN, SSIN_OID].includes(parts[0]))
      return json(
        outcome("value", "Unsupported patient identifier system."),
        400,
      );
    const valid = validateSsin(parts.at(-1), settings.strictSsin);
    if (!valid.valid) return json(outcome("value", valid.message), 400);
    p.set(
      "patient.identifier",
      parts.length > 1 ? parts[0] + "|" + valid.normalized : valid.normalized,
    );
    const all = filterFixtures(docs, p),
      count = Math.max(1, Math.min(100, Number(p.get("_count")) || 20)),
      offset = Number(p.get("_offset")) || 0;
    const entry = all
      .slice(offset, offset + count)
      .map((resource) => ({
        fullUrl: settings.base + "/DocumentReference/" + resource.id,
        resource,
        search: { mode: "match" },
      }));
    if (settings.partial)
      entry.push({
        resource: await fixture(
          "operation-outcomes/OperationOutcome-OutcomePartialFailureExample.json",
        ),
        search: { mode: "outcome" },
      });
    const link = [];
    if (offset + count < all.length) {
      p.set("_offset", offset + count);
      link.push({
        relation: "next",
        url: settings.base + "/DocumentReference/_search?" + p,
      });
    }
    return json({
      resourceType: "Bundle",
      type: "searchset",
      total: all.length,
      entry,
      link,
    });
  }
  if (route === "DocumentReference/$retrieve-document") {
    let body;
    try {
      body = JSON.parse(request.body);
    } catch {
      return json(outcome("structure", "Invalid Parameters JSON."), 400);
    }
    const ref = body.parameter?.find(
      (p) => p.name === "documentReference",
    )?.valueReference;
    const id = ref?.reference || ref?.identifier?.value;
    if (!id)
      return json(
        outcome("required", "Missing documentReference parameter."),
        400,
      );
    if (/withdrawn/i.test(id))
      return json(
        outcome(
          "not-found",
          "Document withdrawn by its source system. Clear stale bookmarks.",
        ),
        410,
      );
    const doc = docs.find(
      (d) =>
        d.id === id.split("/").at(-1) ||
        d.masterIdentifier?.value === id ||
        d.identifier?.some((i) => i.value === id),
    );
    if (!doc || doc.id === "DocRefMinimalExample")
      return json(
        outcome(
          "not-found",
          "No payload fixture is available for this document reference.",
        ),
        404,
      );
    const tele = doc.id.includes("Telemonitoring");
    if (request.headers.Accept.includes("application/pdf"))
      return fetch(
        "/fixtures/binaries/" +
          (tele ? "holter-001.pdf" : "rendered-lab-report-example-01.pdf"),
      );
    return json(
      await fixture(
        "document-bundles/Bundle-" +
          (tele ? "BundleTelemonitoringExample" : "BundleLabReportExample") +
          ".json",
      ),
    );
  }
  if (route.startsWith("DocumentReference/")) {
    const d = docs.find((d) => d.id === route.split("/").at(-1));
    return d
      ? json(d)
      : json(outcome("not-found", "DocumentReference not found."), 404);
  }
  if (route.startsWith("Bundle/")) {
    try {
      return json(
        await fixture(
          "document-bundles/Bundle-" + route.split("/").at(-1) + ".json",
        ),
      );
    } catch {
      return json(outcome("not-found", "Bundle not found."), 404);
    }
  }
  if (route.startsWith("Binary/")) {
    const id = route.split("/").at(-1);
    if (!["holter-001", "rendered-lab-report-example-01"].includes(id))
      return json(outcome("not-found", "Binary not found."), 404);
    return fetch("/fixtures/binaries/" + id + ".pdf");
  }
  return json(
    outcome(
      "not-supported",
      "This interaction is not included in the offline fixture transport.",
    ),
    400,
  );
}
