import {
  filterFixtures,
  filterObservationFixtures,
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
  theme: "dark",
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
let cachedObs;
export async function demoObservations() {
  return (cachedObs ||= Promise.all(
    [
      "Observation-InterhubObsGlucoseDiscreteExample.json",
      "Observation-InterhubObsCreatinineDiscreteExample.json",
    ].map((f) => fixture("resources/" + f)),
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
/**
 * The offline transport mirrors the responding hub: exactly two transactions, the same status
 * codes, and the same opaque POST-based pagination. Demo mode is meant to teach the wire
 * contract, so anything the live simulator refuses is refused here too.
 */
export const UNSUPPORTED_INTERACTION =
  "This Belgian Interhub responder serves exactly three transactions: getTransactionList — " +
  "POST [base]/DocumentReference/_search (MHD ITI-67), getTransaction — " +
  "POST [base]/DocumentReference/$retrieve-document, and laboratory observation search — " +
  "POST [base]/Observation/_search. GET [base]/metadata returns the " +
  "CapabilityStatement. No other path, resource type or interaction is available.";
const PDF_RENDERINGS = {
  DocRefLabReportContainedExample: "rendered-lab-report-example-01.pdf",
  DocRefLabReportExample: "rendered-lab-report-example-01.pdf",
  DocRefTelemonitoringExample: "holter-001.pdf",
};
const PAYLOAD_BUNDLES = {
  DocRefLabReportContainedExample: "BundleLabReportExample",
  DocRefLabReportExample: "BundleLabReportExample",
  DocRefTelemonitoringExample: "BundleTelemonitoringExample",
};
const encodeContinuation = (params) =>
  btoa(params.toString())
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const decodeContinuation = (token) => {
  try {
    return new URLSearchParams(
      atob(token.replace(/-/g, "+").replace(/_/g, "/")),
    );
  } catch {
    return null;
  }
};
export async function demoRequest(path, request, settings) {
  const url = new URL(path, "http://demo/fhir/");
  const route = url.pathname.replace(/^\/fhir\//, "").replace(/\/$/, "");
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/fhir+json",
        "X-Viewer-Source": "offline-fixture",
      },
    });
  const unsupported = () =>
    json(outcome("not-supported", UNSUPPORTED_INTERACTION), 404);
  const wantsPdf = () =>
    (request.headers.Accept || "").toLowerCase().includes("application/pdf");
  if (route === "metadata")
    return json(
      await fixture(
        "metadata/CapabilityStatement-BeInterhubDocumentResponderSimulator.json",
      ),
    );
  const docs = await demoData();
  if (route === "DocumentReference/_search") {
    if (wantsPdf())
      return json(
        outcome(
          "not-supported",
          "getTransactionList answers a FHIR searchset Bundle. application/pdf is only available on $retrieve-document.",
        ),
        406,
      );
    let p = new URLSearchParams(request.body);
    if (p.get("_continuation")) {
      p = decodeContinuation(p.get("_continuation"));
      if (!p)
        return json(
          outcome(
            "value",
            "The supplied _continuation token is unknown or expired. Re-run the original POST /DocumentReference/_search query to obtain a fresh result set.",
          ),
          400,
        );
    }
    const identifier = p.get("patient.identifier");
    if (!identifier)
      return json(
        outcome("required", "Mandatory patient.identifier is missing."),
        400,
      );
    const parts = identifier.split("|");
    if (parts.length > 1 && ![SSIN, SSIN_OID].includes(parts[0]))
      return json(
        outcome(
          "value",
          "Unsupported patient identifier system '" + parts[0] + "'.",
        ),
        400,
      );
    const valid = validateSsin(parts.at(-1), settings.strictSsin);
    if (!valid.valid) return json(outcome("value", valid.message), 400);
    const scope = p.get("searchtype") || "federated";
    if (!["local", "federated"].includes(scope))
      return json(
        outcome(
          "value",
          "Unsupported searchtype '" + scope + "'. Use 'local' or 'federated'.",
        ),
        400,
      );
    if (p.get("_sort") && !["date", "-date"].includes(p.get("_sort")))
      return json(
        outcome(
          "value",
          "Unsupported _sort '" +
            p.get("_sort") +
            "'. Interhub defines -date (default) and date.",
        ),
        400,
      );
    p.set(
      "patient.identifier",
      parts.length > 1 ? parts[0] + "|" + valid.normalized : valid.normalized,
    );
    // transactions.md §2.2: status defaults to current.
    if (!p.get("status")) p.set("status", "current");
    const all = filterFixtures(docs, p),
      count = Math.max(1, Math.min(200, Number(p.get("_count")) || 20)),
      offset = Number(p.get("_offset")) || 0;
    const page = all.slice(offset, offset + count);
    const entry = page.map((resource) => ({
      fullUrl: settings.base + "/DocumentReference/" + resource.id,
      resource,
      search: { mode: "match" },
    }));
    // A local search never fans out, so it never reports a downstream partial failure.
    if (settings.partial && scope !== "local")
      entry.push({
        resource: await fixture(
          "operation-outcomes/OperationOutcome-OutcomePartialFailureExample.json",
        ),
        search: { mode: "outcome" },
      });
    const link = [
      { relation: "self", url: settings.base + "/DocumentReference/_search" },
    ];
    if (offset + page.length < all.length) {
      const nextParams = new URLSearchParams(p);
      nextParams.set("_offset", offset + page.length);
      link.push({
        relation: "next",
        url:
          settings.base +
          "/DocumentReference/_search?_continuation=" +
          encodeContinuation(nextParams),
      });
    }
    return json({
      resourceType: "Bundle",
      type: "searchset",
      timestamp: new Date().toISOString(),
      total: all.length,
      link,
      entry,
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
        outcome(
          "required",
          "Mandatory parameter 'documentReference' is missing. Supply a Parameters resource with parameter[name=documentReference].valueReference.",
        ),
        400,
      );
    const doc = docs.find(
      (d) =>
        d.id === id.split("/").at(-1) ||
        d.masterIdentifier?.value === id ||
        d.identifier?.some((i) => i.value === id),
    );
    if (
      doc?.status === "entered-in-error" ||
      (!doc && /withdrawn|gone/i.test(id))
    )
      return json(
        outcome(
          "not-found",
          "The hub knew this document but its source system has withdrawn it. Clear any stale bookmark rather than retrying.",
        ),
        410,
      );
    if (!doc)
      return json(
        outcome(
          "not-found",
          "The requested document uniqueId does not exist, or is no longer served by this hub.",
        ),
        404,
      );
    if (wantsPdf()) {
      const rendering = PDF_RENDERINGS[doc.id];
      if (!rendering)
        return json(
          outcome(
            "not-supported",
            "This hub publishes no PDF rendering for document reference '" +
              id +
              "'. Retrieve the structured document Bundle instead.",
          ),
          406,
        );
      return fetch("/fixtures/binaries/" + rendering);
    }
    const payload = PAYLOAD_BUNDLES[doc.id];
    if (!payload)
      return json(
        outcome(
          "not-found",
          "The requested document uniqueId does not exist, or is no longer served by this hub.",
        ),
        404,
      );
    return json(await fixture("document-bundles/Bundle-" + payload + ".json"));
  }
  if (route === "Observation/_search") {
    if (wantsPdf())
      return json(
        outcome(
          "not-supported",
          "Laboratory observation search answers a FHIR searchset Bundle. application/pdf is only available on $retrieve-document.",
        ),
        406,
      );
    let p = new URLSearchParams(request.body);
    if (p.get("_continuation")) {
      p = decodeContinuation(p.get("_continuation"));
      if (!p)
        return json(
          outcome(
            "value",
            "The supplied _continuation token is unknown or expired. Re-run the original POST /Observation/_search query to obtain a fresh result set.",
          ),
          400,
        );
    }
    const identifier = p.get("patient.identifier");
    if (!identifier)
      return json(
        outcome("required", "Mandatory patient.identifier is missing."),
        400,
      );
    const parts = identifier.split("|");
    if (parts.length > 1 && ![SSIN, SSIN_OID].includes(parts[0]))
      return json(
        outcome(
          "value",
          "Unsupported patient identifier system '" + parts[0] + "'.",
        ),
        400,
      );
    const valid = validateSsin(parts.at(-1), settings.strictSsin);
    if (!valid.valid) return json(outcome("value", valid.message), 400);

    const code = p.get("code");
    if (!code || !code.trim())
      return json(
        outcome(
          "required",
          "Transaction 3 mandates 'code' specifying one or more LOINC analyte codes.",
        ),
        400,
      );

    const scope = p.get("searchtype") || "federated";
    if (!["local", "federated"].includes(scope))
      return json(
        outcome(
          "value",
          "Unsupported searchtype '" + scope + "'. Use 'local' or 'federated'.",
        ),
        400,
      );
    if (p.get("_sort") && !["date", "-date"].includes(p.get("_sort")))
      return json(
        outcome(
          "value",
          "Unsupported _sort '" +
            p.get("_sort") +
            "'. Interhub defines -date (default) and date.",
        ),
        400,
      );

    p.set(
      "patient.identifier",
      parts.length > 1 ? parts[0] + "|" + valid.normalized : valid.normalized,
    );

    const observations = await demoObservations();
    const all = filterObservationFixtures(observations, p),
      count = Math.max(1, Math.min(200, Number(p.get("_count")) || 20)),
      offset = Number(p.get("_offset")) || 0;
    const page = all.slice(offset, offset + count);
    const entry = page.map((resource) => ({
      fullUrl: settings.base + "/Observation/" + resource.id,
      resource,
      search: { mode: "match" },
    }));

    if (settings.partial && scope !== "local")
      entry.push({
        resource: await fixture(
          "operation-outcomes/OperationOutcome-OutcomePartialFailureExample.json",
        ),
        search: { mode: "outcome" },
      });

    const link = [
      { relation: "self", url: settings.base + "/Observation/_search" },
    ];
    if (offset + page.length < all.length) {
      const nextParams = new URLSearchParams(p);
      nextParams.set("_offset", offset + page.length);
      link.push({
        relation: "next",
        url:
          settings.base +
          "/Observation/_search?_continuation=" +
          encodeContinuation(nextParams),
      });
    }
    return json({
      resourceType: "Bundle",
      type: "searchset",
      timestamp: new Date().toISOString(),
      total: all.length,
      link,
      entry,
    });
  }
  if (route === "Observation") {
    return json(
      outcome(
        "not-supported",
        "HTTP method not allowed on this endpoint; use POST to [base]/Observation/_search",
      ),
      405,
    );
  }
  return unsupported();
}
