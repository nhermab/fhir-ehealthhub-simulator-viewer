import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SSIN,
  SSIN_OID,
  searchParams,
  observationSearchParams,
  retrieveBody,
  validateSsin,
  validateResource,
  splitSearch,
  filterFixtures,
  filterObservationFixtures,
  redactHeaders,
  curlCommand,
} from "../src/fhir.js";
import { targetUrl } from "../src/client.js";
const load = async (id) =>
  JSON.parse(
    await readFile(
      new URL(
        "../public/fixtures/document-references/DocumentReference-" +
          id +
          ".json",
        import.meta.url,
      ),
    ),
  );
const lab = await load("DocRefLabReportContainedExample"),
  minimal = await load("DocRefMinimalExample"),
  tele = await load("DocRefTelemonitoringExample");
test("SSIN formatting, malformed input, strict checksum and post-2000 rule", () => {
  assert.equal(validateSsin("79.08.04-123.45").normalized, "79080412345");
  assert.equal(validateSsin("12345").valid, false);
  assert.equal(validateSsin("79080412345", true).valid, false);
  for (const prefix of ["790804123", "010203456"]) {
    const n = Number(prefix) + (prefix.startsWith("01") ? 2000000000 : 0);
    const ssin = prefix + String(97 - (n % 97)).padStart(2, "0");
    assert.equal(validateSsin(ssin, true).valid, true);
  }
});
test("POST form retains repeated date parameters and both SSIN systems", () => {
  const p = searchParams({
    patient: "79080412345",
    system: SSIN_OID,
    from: "2026-03-01",
    to: "2026-03-31",
    category: "labresult",
    "author.identifier": "system|123",
    _count: "10",
  });
  assert.deepEqual(p.getAll("date"), ["ge2026-03-01", "le2026-03-31"]);
  assert.equal(p.get("patient.identifier"), SSIN_OID + "|79080412345");
  assert.throws(() => searchParams({ patient: "bad" }));
  assert.throws(() =>
    searchParams({
      patient: "79080412345",
      from: "2026-04-01",
      to: "2026-01-01",
    }),
  );
});
test("retrieve operation supports logical and business identifiers", () => {
  assert.equal(
    retrieveBody("DocumentReference/a").parameter[0].valueReference.reference,
    "DocumentReference/a",
  );
  assert.equal(
    retrieveBody({ system: "urn:ietf:rfc:3986", value: "urn:oid:1.2" })
      .parameter[0].valueReference.identifier.value,
    "urn:oid:1.2",
  );
});
test("minimal checks omit comprehensive-only obligations", () => {
  assert.ok(validateResource(minimal).every((c) => c.pass));
  assert.ok(!validateResource(minimal).some((c) => c.path === "author"));
  assert.ok(validateResource(lab).every((c) => c.pass));
  const bad = structuredClone(lab);
  bad.author[0].reference = "#missing";
  assert.equal(
    validateResource(bad).find((c) => c.path === "author").pass,
    false,
  );
});
test("partial outcomes do not disappear into a successful status", () => {
  const b = {
    resourceType: "Bundle",
    type: "searchset",
    entry: [
      { resource: lab, search: { mode: "match" } },
      {
        resource: {
          resourceType: "OperationOutcome",
          issue: [{ severity: "warning", code: "timeout" }],
        },
        search: { mode: "outcome" },
      },
    ],
  };
  assert.equal(splitSearch(b).documents.length, 1);
  assert.equal(splitSearch(b).issues[0].code, "timeout");
  assert.throws(() => splitSearch({ resourceType: "OperationOutcome" }));
});
test("fixture filters enforce system, category, type, dates, contained authors and IDs", () => {
  const docs = [lab, minimal, tele];
  const p = new URLSearchParams({
    "patient.identifier": SSIN_OID + "|79080412345",
    category: "labresult",
  });
  assert.deepEqual(
    filterFixtures(docs, p).map((d) => d.id),
    [lab.id],
  );
  p.set("category", "wrong|labresult");
  assert.equal(filterFixtures(docs, p).length, 0);
  p.delete("category");
  p.set("author.identifier", "10000007999");
  assert.equal(filterFixtures(docs, p).length, 1);
  p.delete("author.identifier");
  p.append("date", "ge2026-03-15");
  p.append("date", "le2026-03-15");
  assert.equal(filterFixtures(docs, p).length, 1);
  p.delete("date");
  p.set("patient.identifier", "bad|79080412345");
  assert.equal(filterFixtures(docs, p).length, 0);
});
test("external targets and path escapes are rejected before credentials are attached", () => {
  assert.equal(
    targetUrl("http://localhost:8080/fhir", "metadata"),
    "http://localhost:8080/fhir/metadata",
  );
  for (const path of [
    "https://evil.test/fhir",
    "//evil.test/path",
    "../token",
    "/fhir-other",
    "http://a:b@localhost:8080/fhir/foo",
  ])
    assert.throws(() => targetUrl("http://localhost:8080/fhir", path));
});
test("trace headers and cURL do not expose credentials", () => {
  const h = redactHeaders({
    Authorization: "Bearer secret",
    DPoP: "secret",
    "X-API-Key": "secret",
    Accept: "application/fhir+json",
  });
  assert.equal(h.Authorization, "[REDACTED]");
  assert.equal(h.Accept, "application/fhir+json");
  const curl = curlCommand({
    url: "http://localhost/fhir",
    method: "POST",
    headers: h,
    body: "a='test'",
  });
  assert.ok(!curl.includes("secret"));
  assert.ok(curl.includes("'\\''"));
});
test("document Bundle checks detect broken closure and Composition ordering", async () => {
  const b = JSON.parse(
    await readFile(
      new URL(
        "../public/fixtures/document-bundles/Bundle-BundleLabReportExample.json",
        import.meta.url,
      ),
    ),
  );
  assert.ok(
    validateResource(b).find((c) => c.path === "entry[0].resource").pass,
  );
  b.entry[0].resource.subject = { reference: "Patient/missing" };
  assert.ok(
    validateResource(b).some(
      (c) => !c.pass && c.path.endsWith("subject.reference"),
    ),
  );
});

test("observationSearchParams validates mandatory code and builds URLSearchParams", () => {
  const p = observationSearchParams({
    patient: "79080412345",
    code: "1558-6",
    from: "2026-01-01",
    to: "2026-12-31",
    searchtype: "federated",
  });
  assert.equal(p.get("patient.identifier"), SSIN + "|79080412345");
  assert.equal(p.get("code"), "1558-6");
  assert.deepEqual(p.getAll("date"), ["ge2026-01-01", "le2026-12-31"]);
  assert.equal(p.get("searchtype"), "federated");

  assert.throws(() => observationSearchParams({ patient: "79080412345", code: "" }));
  assert.throws(() => observationSearchParams({ patient: "bad", code: "1558-6" }));
});

test("validateResource checks BeInterhubLabObservation structural rules and prohibited elements", async () => {
  const obs = JSON.parse(
    await readFile(
      new URL(
        "../public/fixtures/resources/Observation-InterhubObsGlucoseDiscreteExample.json",
        import.meta.url,
      ),
    ),
  );
  const checks = validateResource(obs);
  assert.ok(checks.length > 5);
  assert.ok(checks.every((c) => c.pass), "Valid lab observation passes all structural checks");

  for (const path of ["identifier", "performer"]) {
    const missing = structuredClone(obs);
    delete missing[path];
    assert.ok(
      validateResource(missing).some((c) => c.path.startsWith(path) && !c.pass),
      `Missing inherited mandatory ${path} fails structural checks`,
    );
  }

  // Prohibited elements check
  const badObs = structuredClone(obs);
  badObs.hasMember = [{ reference: "Observation/other" }];
  const badChecks = validateResource(badObs);
  assert.equal(badChecks.find((c) => c.path === "hasMember").pass, false);
});

test("filterObservationFixtures filters observations by code, SSIN, and date", async () => {
  const glucose = JSON.parse(
    await readFile(
      new URL(
        "../public/fixtures/resources/Observation-InterhubObsGlucoseDiscreteExample.json",
        import.meta.url,
      ),
    ),
  );
  const creatinine = JSON.parse(
    await readFile(
      new URL(
        "../public/fixtures/resources/Observation-InterhubObsCreatinineDiscreteExample.json",
        import.meta.url,
      ),
    ),
  );
  const all = [glucose, creatinine];

  const filteredGlucose = filterObservationFixtures(all, new URLSearchParams({
    "patient.identifier": "79080412345",
    code: "1558-6",
  }));
  assert.equal(filteredGlucose.length, 1);
  assert.equal(filteredGlucose[0].id, "InterhubObsGlucoseDiscreteExample");

  const filteredBoth = filterObservationFixtures(all, new URLSearchParams({
    "patient.identifier": "79080412345",
    code: "1558-6,2160-0",
  }));
  assert.equal(filteredBoth.length, 2);

  const filteredNone = filterObservationFixtures(all, new URLSearchParams({
    "patient.identifier": "79080412345",
    code: "9999-9",
  }));
  assert.equal(filteredNone.length, 0);
});
