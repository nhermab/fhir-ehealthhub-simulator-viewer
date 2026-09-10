import test from "node:test";
import assert from "node:assert/strict";
import {
  codePythonPage,
  codeJavascriptPage,
  codeJavaPage,
  codeCsharpPage,
  codeCurlPage,
} from "../src/code-examples.js";

const mockState = {
  settings: {
    mode: "live",
    base: "http://localhost:8080/fhir",
    strictSsin: false,
    headers: "",
  },
  query: {
    patient: "79080412345",
    system: "https://www.ehealth.fgov.be/standards/fhir/core/NamingSystem/ssin",
    status: "current",
  },
  auth: {
    token: "mock-token-12345",
  },
};

test("codePythonPage renders full quickstart and interpolates active backend settings", () => {
  const html = codePythonPage(mockState);
  assert.ok(html.includes("Belgian Interhub FHIR R4 - Python Quickstart"));
  assert.ok(html.includes("http://localhost:8080/fhir"));
  assert.ok(html.includes("79080412345"));
  assert.ok(html.includes("pip install requests"));
  assert.ok(html.includes('data-action="copy-code"'));
  assert.ok(html.includes('data-target="py-quickstart"'));
  assert.ok(html.includes("search_documents.py"));
  assert.ok(html.includes("urllib.request"));
});

test("codeJavascriptPage renders Node.js and browser examples", () => {
  const html = codeJavascriptPage(mockState);
  assert.ok(html.includes("JavaScript / Node.js Quickstart"));
  assert.ok(html.includes("http://localhost:8080/fhir"));
  assert.ok(html.includes("node quickstart.mjs"));
  assert.ok(html.includes('data-target="js-quickstart"'));
  assert.ok(html.includes("fetchPatientDocuments"));
  assert.ok(html.includes('data-action="copy-code"'));
});

test("codeJavaPage renders Java 11+ HttpClient and HAPI FHIR examples", () => {
  const html = codeJavaPage(mockState);
  assert.ok(html.includes("Java Quickstart"));
  assert.ok(html.includes("http://localhost:8080/fhir"));
  assert.ok(html.includes("java.net.http.HttpClient"));
  assert.ok(html.includes("java Quickstart.java"));
  assert.ok(html.includes("HAPI FHIR"));
  assert.ok(html.includes('data-action="copy-code"'));
});

test("codeCsharpPage renders .NET top-level statements and Firely SDK", () => {
  const html = codeCsharpPage(mockState);
  assert.ok(html.includes("C# (.NET) Quickstart"));
  assert.ok(html.includes("http://localhost:8080/fhir"));
  assert.ok(html.includes("dotnet run"));
  assert.ok(html.includes("FormUrlEncodedContent"));
  assert.ok(html.includes("FirelyClient"));
  assert.ok(html.includes('data-action="copy-code"'));
});

test("codeCurlPage renders bash explore script and individual cURL commands", () => {
  const html = codeCurlPage(mockState);
  assert.ok(
    html.includes("cURL &amp; CLI Quickstart") || html.includes("cURL / CLI"),
  );
  assert.ok(html.includes("http://localhost:8080/fhir"));
  assert.ok(html.includes("explore.sh"));
  assert.ok(html.includes("DocumentReference/_search"));
  assert.ok(html.includes("$retrieve-document"));
  assert.ok(html.includes("lab-report.pdf"));
  assert.ok(html.includes('data-action="copy-code"'));
});

test("dynamically adapts when user changes endpoint in settings", () => {
  const customState = {
    ...mockState,
    settings: {
      ...mockState.settings,
      base: "https://hub.example.be/fhir-r4",
    },
    query: {
      ...mockState.query,
      patient: "85021512345",
    },
  };

  const py = codePythonPage(customState);
  assert.ok(py.includes("https://hub.example.be/fhir-r4"));
  assert.ok(py.includes("85021512345"));

  const js = codeJavascriptPage(customState);
  assert.ok(js.includes("https://hub.example.be/fhir-r4"));
  assert.ok(js.includes("85021512345"));

  const java = codeJavaPage(customState);
  assert.ok(java.includes("https://hub.example.be/fhir-r4"));
  assert.ok(java.includes("85021512345"));

  const cs = codeCsharpPage(customState);
  assert.ok(cs.includes("https://hub.example.be/fhir-r4"));
  assert.ok(cs.includes("85021512345"));
});
