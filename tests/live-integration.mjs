import assert from "node:assert/strict";
const base = "http://localhost:4173";
const send = async (
  path,
  method = "GET",
  body,
  accept = "application/fhir+json",
) =>
  fetch(base + "/api/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({
      url: "http://localhost:8080/fhir/" + path,
      method,
      headers: {
        Accept: accept,
        "Content-Type": path.endsWith("_search")
          ? "application/x-www-form-urlencoded"
          : "application/fhir+json",
        "X-Simulate-Partial-Failure": "true",
      },
      body,
    }),
  });
let r = await send("metadata");
assert.equal(r.status, 200);
assert.equal((await r.json()).resourceType, "CapabilityStatement");
r = await send(
  "DocumentReference/_search",
  "POST",
  "patient.identifier=79080412345",
);
assert.equal(r.status, 200);
const b = await r.json();
assert.equal(b.type, "searchset");
assert.ok(b.entry.some((e) => e.resource.resourceType === "OperationOutcome"));
assert.ok(b.entry.some((e) => e.resource.resourceType === "DocumentReference"));
const retrieve = (id) =>
  JSON.stringify({
    resourceType: "Parameters",
    parameter: [
      {
        name: "documentReference",
        valueReference: { reference: "DocumentReference/" + id },
      },
    ],
  });
r = await send(
  "DocumentReference/$retrieve-document",
  "POST",
  retrieve("DocRefLabReportContainedExample"),
);
assert.equal(r.status, 200);
assert.equal((await r.json()).type, "document");
r = await send(
  "DocumentReference/$retrieve-document",
  "POST",
  retrieve("DocRefLabReportContainedExample"),
  "application/pdf",
);
assert.equal(r.status, 200);
assert.match(r.headers.get("content-type"), /pdf/);
assert.ok((await r.arrayBuffer()).byteLength > 100);
r = await send(
  "DocumentReference/$retrieve-document",
  "POST",
  retrieve("withdrawn"),
);
assert.equal(r.status, 410);
assert.equal((await r.json()).resourceType, "OperationOutcome");
r = await send(
  "DocumentReference/$retrieve-document",
  "POST",
  retrieve("non-existent-document"),
);
assert.equal(r.status, 404);
r = await send("DocumentReference/_search", "POST", "category=labresult");
assert.equal(r.status, 400);
// Only the two transactions are served; everything else answers not-supported.
for (const path of [
  "Bundle/BundleLabReportExample",
  "Binary/rendered-lab-report-example-01",
  "DocumentReference/DocRefLabReportContainedExample",
]) {
  r = await send(path);
  assert.equal(r.status, 404, path);
  assert.equal((await r.json()).issue[0].code, "not-supported", path);
}
// Paging stays on POST and the continuation token hides the query criteria.
r = await send(
  "DocumentReference/_search",
  "POST",
  "patient.identifier=79080412345&_count=2",
);
const firstPage = await r.json();
assert.equal(firstPage.total, 4);
const next = firstPage.link.find((l) => l.relation === "next");
assert.ok(next && !next.url.includes("79080412345"));
r = await send(
  "DocumentReference/_search",
  "POST",
  new URL(next.url).searchParams.toString(),
);
const secondPage = await r.json();
assert.equal(secondPage.total, 4);
assert.notDeepEqual(
  secondPage.entry.map((e) => e.resource.id),
  firstPage.entry.map((e) => e.resource.id),
);
r = await send(
  "DocumentReference/$retrieve-document",
  "POST",
  retrieve("DocRefMinimalExample"),
  "application/pdf",
);
assert.equal(r.status, 406);
// Transaction 3: Laboratory Observation Search
r = await send(
  "Observation/_search",
  "POST",
  "patient.identifier=79080412345&code=http%3A%2F%2Floinc.org%7C1558-6",
);
assert.equal(r.status, 200);
const obsBundle = await r.json();
assert.equal(obsBundle.type, "searchset");
assert.ok(obsBundle.entry.some((e) => e.resource.resourceType === "Observation"));
assert.ok(obsBundle.entry.some((e) => e.resource.resourceType === "OperationOutcome"));
r = await send(
  "Observation/_search",
  "POST",
  "patient.identifier=79080412345",
);
assert.equal(r.status, 400);
r = await send("Observation/InterhubObsGlucoseDiscreteExample");
assert.equal(r.status, 404);
r = await fetch(base + "/api/proxy", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "https://evil.test" },
  body: "{}",
});
assert.equal(r.status, 403);
r = await fetch(base + "/api/proxy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://example.com", method: "GET" }),
});
assert.equal(r.status, 403);
console.log(
  "Live Java integration: metadata, search, partial failure, FHIR retrieval, PDF, opaque POST pagination, " +
    "Transaction 3 observation search, 410, 406, 404, 400, the three-transaction surface and proxy origin guards passed.",
);
