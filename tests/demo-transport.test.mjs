import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { demoRequest, defaults } from "../src/client.js";
import { retrieveBody, searchParams } from "../src/fhir.js";

const fixtures = fileURLToPath(new URL("../public/fixtures/", import.meta.url));

// The offline transport reads its fixtures through fetch(); serve them from disk instead.
globalThis.fetch = async (path) => {
  const file = String(path).replace(/^\/fixtures\//, "");
  try {
    const body = await readFile(fixtures + file);
    return new Response(body, {
      headers: {
        "Content-Type": file.endsWith(".pdf")
          ? "application/pdf"
          : "application/fhir+json",
      },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
};

const settings = { ...defaults, base: "http://localhost:8080/fhir" };
const send = (path, { body = "", accept = "application/fhir+json", ...rest } = {}) =>
  demoRequest(path, { body, headers: { Accept: accept } }, { ...settings, ...rest });
const search = (query, extra) =>
  send("DocumentReference/_search", {
    body: searchParams({ patient: "79080412345", ...query }).toString(),
    ...extra,
  });

test("demo mode serves only the two transactions and the CapabilityStatement", async () => {
  const metadata = await (await send("metadata")).json();
  assert.equal(metadata.resourceType, "CapabilityStatement");
  assert.equal(metadata.kind, "instance");
  assert.deepEqual(
    metadata.rest[0].resource[0].interaction.map((i) => i.code),
    ["search-type"],
  );

  for (const route of [
    "DocumentReference/DocRefLabReportExample",
    "Bundle/BundleLabReportExample",
    "Binary/holter-001",
    "Patient/PatientPeeters",
  ]) {
    const response = await send(route);
    assert.equal(response.status, 404, route);
    assert.equal((await response.json()).issue[0].code, "not-supported", route);
  }
});

test("discovery reports the full total and pages with an opaque continuation token", async () => {
  const first = await (await search({ _count: "2" })).json();
  assert.equal(first.total, 4);
  assert.equal(first.entry.length, 2);
  assert.ok(first.link.some((l) => l.relation === "self"));

  const next = first.link.find((l) => l.relation === "next");
  assert.ok(next, "a truncated result set carries a next link");
  const token = new URL(next.url).searchParams.get("_continuation");
  assert.ok(token && !token.includes("79080412345"), "the token hides the SSIN");

  const second = await (
    await send("DocumentReference/_search", {
      body: new URLSearchParams({ _continuation: token }).toString(),
    })
  ).json();
  assert.equal(second.total, 4);
  assert.equal(second.entry.length, 2);
  assert.notDeepEqual(
    second.entry.map((e) => e.resource.id),
    first.entry.map((e) => e.resource.id),
  );
});

test("discovery rejects an unusable query rather than answering a wrong list", async () => {
  const missingPatient = await send("DocumentReference/_search", {
    body: "category=labresult",
  });
  assert.equal(missingPatient.status, 400);
  assert.equal((await missingPatient.json()).issue[0].code, "required");

  for (const query of [{ searchtype: "global" }, { _sort: "author" }]) {
    const response = await search(query);
    assert.equal(response.status, 400, JSON.stringify(query));
    assert.equal((await response.json()).issue[0].code, "value");
  }

  const badToken = await send("DocumentReference/_search", {
    body: "_continuation=not-a-real-token",
  });
  assert.equal(badToken.status, 400);

  const asPdf = await search({}, { accept: "application/pdf" });
  assert.equal(asPdf.status, 406);
});

test("a local search never reports a downstream fan-out failure", async () => {
  const federated = await (
    await search({ searchtype: "federated" }, { partial: true })
  ).json();
  const local = await (
    await search({ searchtype: "local" }, { partial: true })
  ).json();

  assert.ok(
    federated.entry.some((e) => e.search.mode === "outcome"),
    "a federated fan-out surfaces the partial failure",
  );
  assert.ok(local.entry.every((e) => e.search.mode === "match"));
});

test("retrieval answers the document, the hub rendering, 404, 410 and 406", async () => {
  const retrieve = (id, accept) =>
    send("DocumentReference/$retrieve-document", {
      body: JSON.stringify(retrieveBody("DocumentReference/" + id)),
      accept,
    });

  const bundle = await (await retrieve("DocRefLabReportContainedExample")).json();
  assert.equal(bundle.type, "document");
  assert.equal(bundle.entry[0].resource.resourceType, "Composition");

  const pdf = await retrieve("DocRefLabReportContainedExample", "application/pdf");
  assert.equal(pdf.status, 200);
  assert.match(pdf.headers.get("content-type"), /pdf/);

  const withdrawn = await retrieve("withdrawn");
  assert.equal(withdrawn.status, 410);

  const missing = await retrieve("non-existent-document");
  assert.equal(missing.status, 404);

  const noRendering = await retrieve("DocRefMinimalExample", "application/pdf");
  assert.equal(noRendering.status, 406);
  assert.equal((await noRendering.json()).issue[0].code, "not-supported");

  const noParameter = await send("DocumentReference/$retrieve-document", {
    body: JSON.stringify({ resourceType: "Parameters", parameter: [] }),
  });
  assert.equal(noParameter.status, 400);
  assert.equal((await noParameter.json()).issue[0].code, "required");
});

test("retrieval resolves a logical reference by business identifier", async () => {
  const response = await send("DocumentReference/$retrieve-document", {
    body: JSON.stringify(
      retrieveBody({
        system: "urn:ietf:rfc:3986",
        value: "urn:uuid:7ed170b3-38d1-4ba5-8a60-1f722b107707",
      }),
    ),
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).id, "BundleTelemonitoringExample");
});

test("Transaction 3: demo mode searches lab observations and supports continuation paging", async () => {
  const searchObs = (params = {}) =>
    send("Observation/_search", {
      body: new URLSearchParams({
        "patient.identifier": "79080412345",
        code: "http://loinc.org|1558-6",
        ...params,
      }).toString(),
    });

  const res = await searchObs();
  assert.equal(res.status, 200);
  const bundle = await res.json();
  assert.equal(bundle.resourceType, "Bundle");
  assert.equal(bundle.type, "searchset");
  assert.equal(bundle.total, 1);
  assert.equal(bundle.entry[0].resource.id, "InterhubObsGlucoseDiscreteExample");

  // Missing code
  const noCode = await send("Observation/_search", {
    body: new URLSearchParams({ "patient.identifier": "79080412345" }).toString(),
  });
  assert.equal(noCode.status, 400);

  // GET on Observation is refused
  const getObs = await send("Observation");
  assert.equal(getObs.status, 405);
});
