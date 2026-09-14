// Code examples and starter pages for connecting to the Belgian Interhub FHIR backend
import { SSIN, SSIN_OID } from "./fhir.js";
import { highlight } from "./highlight.js";

/** Card ids carry their language: py-quickstart, java-hapi, curl-search, ... */
const LANG_BY_PREFIX = {
  py: "python",
  js: "javascript",
  java: "java",
  cs: "csharp",
  curl: "bash",
};
const langOf = (id, explicit) =>
  explicit || LANG_BY_PREFIX[String(id).split("-")[0]] || "plain";

const esc = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const icon = (name) => {
  const paths = {
    copy: "M9 9h12v12H9zM15 5V2H2v13h3",
    check: "m5 12 4 4L19 6",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    globe:
      "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M2 12h20M12 2c6 6 6 14 0 20-6-6-6-14 0-20",
    terminal: "m4 17 6-6-6-6m8 14h8",
    code: "m8 5-7 7 7 7m8-14 7 7-7 7m-3-16-2 18",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z",
    shield: "M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6zM8 12l3 3 5-6",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  };
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.file}"/></svg>`;
};

function getActiveConfig(state) {
  const base = state.settings.base || "https://dev-api.ehealthhub.be";
  const patient = state.query?.patient || "79080412345";
  const system = state.query?.system || SSIN;
  const token = state.auth?.token || "";
  const isDemo = state.settings.mode === "demo";
  return { base, patient, system, token, isDemo };
}

function renderLangNav(activeLang) {
  const languages = [
    ["code-python", "Python", "python"],
    ["code-javascript", "JavaScript / Node.js", "javascript"],
    ["code-java", "Java", "java"],
    ["code-csharp", "C# (.NET)", "csharp"],
    ["code-curl", "cURL / CLI", "curl"],
  ];

  return `<nav class="code-lang-nav" aria-label="Language selection">${languages
    .map(
      ([pageId, label, id]) =>
        `<a href="#${pageId}" class="code-lang-pill ${activeLang === id ? "active" : ""}">${icon("code")} <span>${esc(label)}</span></a>`,
    )
    .join("")}</nav>`;
}

function renderContextBanner(config) {
  return `<section class="context-banner" aria-label="Active Backend Context">
    <div class="context-items">
      <div class="context-item">
        <label>Active FHIR Base URL</label>
        <code>${esc(config.base)}</code>
      </div>
      <div class="context-item">
        <label>Patient SSIN</label>
        <code>${esc(config.patient)}</code>
      </div>
      <div class="context-item">
        <label>Environment</label>
        <span><span class="status-dot"></span> <b>${config.isDemo ? "Offline Demo Fixtures" : "Live Backend"}</b></span>
      </div>
      ${
        config.token
          ? `<div class="context-item"><label>Auth Token</label><span class="badge mint">Loaded (${esc(config.token.slice(0, 10))}…)</span></div>`
          : ""
      }
    </div>
    <div class="context-actions">
      <button type="button" class="btn copy-btn" data-action="copy-text" data-text="${esc(config.base)}">${icon("copy")} <span>Copy Base URL</span></button>
      <a href="#settings" class="btn">${icon("settings")} <span>Configure Endpoint</span></a>
    </div>
  </section>`;
}

function renderCodeCard({
  id,
  title,
  description,
  filename,
  badgeText,
  runCommand,
  code,
  notes,
  lang,
}) {
  const language = langOf(id, lang);
  const lineCount = String(code ?? "").split("\n").length;
  return `<article class="panel code-card">
    <header class="code-card-header">
      <div class="code-card-title">
        <h3>${esc(title)}</h3>
        ${badgeText ? `<span class="badge neutral">${esc(badgeText)}</span>` : ""}
      </div>
      <div class="code-card-meta">
        ${filename ? `<span class="file-pill">${esc(filename)}</span>` : ""}
        ${runCommand ? `<div class="run-hint" title="Command to execute">${icon("terminal")} <code>${esc(runCommand)}</code></div>` : ""}
        <button type="button" class="btn primary copy-btn" data-action="copy-code" data-target="${esc(id)}">${icon("copy")} <span>Copy code</span></button>
      </div>
    </header>
    ${description ? `<p class="code-card-desc">${description}</p>` : ""}
    <div class="code-card-body">
      <div class="code-shell" data-lang="${esc(language)}"><div class="code-gutter" aria-hidden="true">${Array.from({ length: lineCount }, (_, i) => i + 1).join("\n")}</div><pre class="code-block" id="${esc(id)}" tabindex="0"><code>${highlight(code, language)}</code></pre></div>
      ${notes ? `<div class="code-notes">${notes}</div>` : ""}
    </div>
  </article>`;
}

// ==========================================
// 1. PYTHON PAGE
// ==========================================
export function codePythonPage(state) {
  const config = getActiveConfig(state);
  const base = config.base;
  const ssin = config.patient;
  const sys = config.system;
  const tokenHeader = config.token
    ? `\n# Optional: Pass active session bearer token\nHEADERS["Authorization"] = "Bearer ${config.token}"`
    : "";

  const quickstartPy = `"""
Belgian Interhub FHIR R4 - Python Quickstart
Connects to: ${base}
Patient SSIN: ${ssin}

Requirements:
    pip install requests
"""

import sys
import json
import requests

BASE_URL = "${base}"
PATIENT_SSIN = "${ssin}"
SSIN_SYSTEM = "${sys}"

HEADERS = {
    "Accept": "application/fhir+json; fhirVersion=4.0"
}${tokenHeader}

def main():
    print("=" * 60)
    print("Belgian Federated Health Network - Interhub Explorer (Python)")
    print(f"Target Base: {BASE_URL}")
    print("=" * 60)

    # 1. CapabilityStatement / Metadata check
    print("\\n[1/4] Verifying server conformance (GET /metadata)...")
    try:
        meta_resp = requests.get(f"{BASE_URL}/metadata", headers=HEADERS, timeout=10)
        meta_resp.raise_for_status()
        meta = meta_resp.json()
        fhir_version = meta.get("fhirVersion", "Unknown")
        software = meta.get("software", {}).get("name", "FHIR Server")
        print(f"  --> Connected! FHIR Version: {fhir_version} | Software: {software}")
    except Exception as err:
        print(f"  [!] Failed to connect to {BASE_URL}: {err}")
        sys.exit(1)

    # 2. ITI-67 Document Discovery (Find DocumentReferences)
    # Mandated as POST application/x-www-form-urlencoded to protect SSIN in access logs
    print(f"\\n[2/4] Discovering documents for patient {PATIENT_SSIN} (POST /DocumentReference/_search)...")
    search_data = {
        "patient.identifier": f"{SSIN_SYSTEM}|{PATIENT_SSIN}",
        "status": "current",
        "searchtype": "federated",
        "_sort": "-date",
        "_count": "20",
    }
    search_headers = {
        **HEADERS,
        "Content-Type": "application/x-www-form-urlencoded"
    }

    search_resp = requests.post(
        f"{BASE_URL}/DocumentReference/_search",
        data=search_data,
        headers=search_headers,
        timeout=15
    )
    search_resp.raise_for_status()
    bundle = search_resp.json()

    total = bundle.get("total", 0)
    entries = bundle.get("entry", [])
    print(f"  --> Found {total} total document matches (returned {len(entries)} on this page):")

    first_doc_id = None
    for idx, entry in enumerate(entries, 1):
        # Detect downstream partial failures in federated hubs
        if entry.get("search", {}).get("mode") == "outcome":
            issue = entry.get("resource", {}).get("issue", [{}])[0]
            print(f"      [!] Hub warning: {issue.get('diagnostics', 'Downstream failure')}")
            continue

        res = entry.get("resource", {})
        doc_id = res.get("id")
        if not first_doc_id:
            first_doc_id = doc_id

        title = (res.get("content", [{}])[0].get("attachment", {}).get("title")
                 or res.get("description")
                 or "Untitled document")
        doc_date = res.get("date", "Unknown date")
        doc_type = res.get("type", {}).get("text") or "Clinical Report"
        print(f"  {idx}. [{doc_id}] {title}")
        print(f"      Type: {doc_type} | Date: {doc_date}")

    if not first_doc_id:
        print("\\nNo documents found for this SSIN. Exiting.")
        return

    # 3. Belgian $retrieve-document Operation (FHIR Clinical Document Bundle)
    print(f"\\n[3/4] Retrieving full clinical document bundle for '{first_doc_id}'...")
    retrieve_body = {
        "resourceType": "Parameters",
        "parameter": [
            {
                "name": "documentReference",
                "valueReference": {
                    "reference": f"DocumentReference/{first_doc_id}"
                }
            }
        ]
    }
    retrieve_headers = {
        **HEADERS,
        "Content-Type": "application/fhir+json"
    }

    doc_resp = requests.post(
        f"{BASE_URL}/DocumentReference/$retrieve-document",
        json=retrieve_body,
        headers=retrieve_headers,
        timeout=15
    )
    doc_resp.raise_for_status()
    doc_bundle = doc_resp.json()

    comp = doc_bundle.get("entry", [{}])[0].get("resource", {})
    comp_title = comp.get("title", "Clinical Document")
    print(f"  --> Retrieved {doc_bundle.get('type')} Bundle!")
    print(f"      Root Composition: '{comp_title}'")
    print(f"      Contained resources: {len(doc_bundle.get('entry', []))} items")

    # 4. Content Negotiation: Retrieve Hub PDF Rendering
    print(f"\\n[4/4] Retrieving Hub PDF rendering via content negotiation...")
    pdf_headers = {
        **HEADERS,
        "Content-Type": "application/fhir+json",
        "Accept": "application/pdf"
    }
    pdf_resp = requests.post(
        f"{BASE_URL}/DocumentReference/$retrieve-document",
        json=retrieve_body,
        headers=pdf_headers,
        timeout=15
    )
    if pdf_resp.status_code == 200:
        out_filename = f"{first_doc_id}.pdf"
        with open(out_filename, "wb") as f:
            f.write(pdf_resp.content)
        print(f"  --> Saved PDF rendering ({len(pdf_resp.content)} bytes) to '{out_filename}'")
    else:
        print(f"  --> PDF not available for this document (HTTP {pdf_resp.status_code})")

    print("\\nSuccess! You can now explore resources using Python.")

if __name__ == "__main__":
    main()
`;

  const discoveryPy = `# ITI-67 Document Discovery with Pagination and Error Handling
import requests

BASE_URL = "${base}"
SSIN = "${ssin}"

def search_documents(patient_ssin, category=None, continuation_token=None):
    url = f"{BASE_URL}/DocumentReference/_search"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/fhir+json; fhirVersion=4.0"
    }
    
    # In Belgian Interhub, pagination is continued by resending the _continuation token via POST
    if continuation_token:
        data = {"_continuation": continuation_token}
    else:
        data = {
            "patient.identifier": f"${sys}|{patient_ssin}",
            "status": "current",
            "searchtype": "federated",
            "_sort": "-date",
            "_count": "10"
        }
        if category:
            data["category"] = category

    resp = requests.post(url, data=data, headers=headers)
    resp.raise_for_status()
    bundle = resp.json()

    # Check for next page link
    next_link = next((l["url"] for l in bundle.get("link", []) if l.get("relation") == "next"), None)
    
    return bundle, next_link

# Example: Run query
bundle, next_link = search_documents("${ssin}", category="labresult")
print(f"Total results: {bundle.get('total')}")
`;

  const stdlibPy = `# Zero-Dependency Python (Standard Library urllib only - no pip required)
import json
import urllib.request
import urllib.parse

BASE_URL = "${base}"
SSIN = "${ssin}"

# POST application/x-www-form-urlencoded
form_data = urllib.parse.urlencode({
    "patient.identifier": f"${sys}|{SSIN}",
    "status": "current",
    "searchtype": "federated"
}).encode("utf-8")

req = urllib.request.Request(
    f"{BASE_URL}/DocumentReference/_search",
    data=form_data,
    headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/fhir+json; fhirVersion=4.0"
    },
    method="POST"
)

with urllib.request.urlopen(req) as resp:
    result = json.loads(resp.read().decode("utf-8"))
    print(f"Connected! Matches found: {result.get('total')}")
`;

  return `<div class="code-page">
    ${renderLangNav("python")}
    ${renderContextBanner(config)}
    ${renderCodeCard({
      id: "py-quickstart",
      title: "1. Complete All-in-One Quickstart Script",
      description:
        "A standalone script covering the full workflow: connectivity check, ITI-67 document discovery, FHIR document retrieval, and PDF streaming.",
      filename: "quickstart.py",
      badgeText: "Python 3.8+ · requests",
      runCommand: "pip install requests && python quickstart.py",
      code: quickstartPy,
      notes:
        "<strong>Why POST for search?</strong> The Belgian specification mandates <code>POST DocumentReference/_search</code> with <code>application/x-www-form-urlencoded</code> so national patient SSINs are never exposed in access logs, proxies, or URLs.",
    })}
    ${renderCodeCard({
      id: "py-discovery",
      title: "2. Document Discovery & Paging (ITI-67)",
      description:
        "How to query by patient SSIN, filter by document category (e.g. <code>labresult</code> or LOINC code), and handle continuation tokens.",
      filename: "search_documents.py",
      badgeText: "Search & Pagination",
      code: discoveryPy,
    })}
    ${renderCodeCard({
      id: "py-stdlib",
      title: "3. Zero-Dependency Python (urllib standard library)",
      description:
        "Running in a restricted environment without package installation? Use Python's built-in <code>urllib</code> module.",
      filename: "search_stdlib.py",
      badgeText: "Zero dependencies",
      runCommand: "python search_stdlib.py",
      code: stdlibPy,
    })}
    ${renderCodeCard({
      id: "py-observations",
      title: "4. Laboratory Observation Search (Transaction 3 / DIGIRELAB)",
      description:
        "Query discrete analyte time series (e.g. Fasting Glucose LOINC <code>1558-6</code>) across federated regional hubs without fetching complete documents.",
      filename: "search_observations.py",
      badgeText: "Transaction 3 · PCC-44",
      code: `import requests

FHIR_BASE = "${base}"
SSIN = "${ssin}"

# Transaction 3: POST [base]/Observation/_search
response = requests.post(
    f"{FHIR_BASE}/Observation/_search",
    headers={"Accept": "application/fhir+json; fhirVersion=4.0"},
    data={
        "patient.identifier": f"https://www.ehealth.fgov.be/standards/fhir/core/NamingSystem/ssin|{SSIN}",
        "code": "http://loinc.org|1558-6",
        "searchtype": "federated",
        "_sort": "-date",
    }
)
response.raise_for_status()
bundle = response.json()

print(f"Total observations found: {bundle.get('total', 0)}")
for entry in bundle.get("entry", []):
    res = entry.get("resource", {})
    if res.get("resourceType") == "Observation":
        val = res.get("valueQuantity", {})
        code_text = res.get("code", {}).get("coding", [{}])[0].get("display", "Analyte")
        print(f"  • {code_text}: {val.get('value')} {val.get('unit')} (Effective: {res.get('effectiveDateTime')})")
        derived = res.get("derivedFrom", [{}])[0].get("identifier", {}).get("value")
        print(f"    Source report uniqueId: {derived}")
`,
    })}
  </div>`;
}

// ==========================================
// 2. JAVASCRIPT / NODE.JS PAGE
// ==========================================
export function codeJavascriptPage(state) {
  const config = getActiveConfig(state);
  const base = config.base;
  const ssin = config.patient;
  const sys = config.system;

  const quickstartJs = `/**
 * Belgian Interhub FHIR R4 - JavaScript / Node.js Quickstart
 * Connects to: ${base}
 * Patient SSIN: ${ssin}
 * 
 * Works natively in Node.js 18+, Bun, Deno, and modern browsers (Zero dependencies).
 */

import { writeFile } from "node:fs/promises";

const BASE_URL = "${base}";
const PATIENT_SSIN = "${ssin}";
const SSIN_SYSTEM = "${sys}";

const COMMON_HEADERS = {
  "Accept": "application/fhir+json; fhirVersion=4.0",
};

async function main() {
  console.log("=".repeat(60));
  console.log("Belgian Interhub Explorer (JavaScript / Node.js)");
  console.log(\`Target Base: \${BASE_URL}\`);
  console.log("=".repeat(60));

  // 1. Verify Conformance (GET /metadata)
  console.log("\\n[1/4] Checking server conformance (GET /metadata)...");
  const metaRes = await fetch(\`\${BASE_URL}/metadata\`, {
    headers: COMMON_HEADERS,
  });
  if (!metaRes.ok) {
    throw new Error(\`Failed to connect: \${metaRes.status} \${metaRes.statusText}\`);
  }
  const meta = await metaRes.json();
  console.log(\`  --> Connected! FHIR Version: \${meta.fhirVersion} | Software: \${meta.software?.name || "Interhub"}\`);

  // 2. Discover Documents (ITI-67 POST form-urlencoded)
  console.log(\`\\n[2/4] Searching documents for SSIN \${PATIENT_SSIN} (POST /DocumentReference/_search)...\`);
  const form = new URLSearchParams({
    "patient.identifier": \`\${SSIN_SYSTEM}|\${PATIENT_SSIN}\`,
    "status": "current",
    "searchtype": "federated",
    "_sort": "-date",
    "_count": "20",
  });

  const searchRes = await fetch(\`\${BASE_URL}/DocumentReference/_search\`, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!searchRes.ok) {
    throw new Error(\`Search failed: \${searchRes.status} \${searchRes.statusText}\`);
  }

  const searchBundle = await searchRes.json();
  console.log(\`  --> Found \${searchBundle.total ?? 0} matches (returned \${searchBundle.entry?.length || 0}):\`);

  let firstDocId = null;
  for (const entry of searchBundle.entry || []) {
    if (entry.search?.mode === "outcome") {
      console.warn("  [!] Downstream hub notice:", entry.resource?.issue?.[0]?.diagnostics);
      continue;
    }
    const doc = entry.resource;
    if (!firstDocId && doc?.id) firstDocId = doc.id;
    const title = doc?.content?.[0]?.attachment?.title || doc?.description || "Untitled document";
    console.log(\`  - [\${doc.id}] \${title} (\${doc.date || "undated"})\`);
  }

  if (!firstDocId) {
    console.log("No documents available to retrieve.");
    return;
  }

  // 3. Belgian $retrieve-document (Retrieve Clinical Document Bundle)
  console.log(\`\\n[3/4] Retrieving full clinical document bundle for '\${firstDocId}'...\`);
  const retrieveBody = {
    resourceType: "Parameters",
    parameter: [
      {
        name: "documentReference",
        valueReference: { reference: \`DocumentReference/\${firstDocId}\` },
      },
    ],
  };

  const docRes = await fetch(\`\${BASE_URL}/DocumentReference/$retrieve-document\`, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      "Content-Type": "application/fhir+json",
    },
    body: JSON.stringify(retrieveBody),
  });
  const docBundle = await docRes.json();
  const composition = docBundle.entry?.[0]?.resource;
  console.log(\`  --> Retrieved \${docBundle.type} Bundle! Root Composition: '\${composition?.title}'\`);
  console.log(\`      Contained resources: \${docBundle.entry?.length || 0} entries\`);

  // 4. Content Negotiation: Retrieve Hub PDF Rendering
  console.log(\`\\n[4/4] Retrieving Hub PDF rendering via content negotiation...\`);
  const pdfRes = await fetch(\`\${BASE_URL}/DocumentReference/$retrieve-document\`, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      "Content-Type": "application/fhir+json",
      "Accept": "application/pdf",
    },
    body: JSON.stringify(retrieveBody),
  });

  if (pdfRes.ok) {
    const arrayBuffer = await pdfRes.arrayBuffer();
    const filename = \`\${firstDocId}.pdf\`;
    await writeFile(filename, Buffer.from(arrayBuffer));
    console.log(\`  --> Saved PDF (\${arrayBuffer.byteLength} bytes) to '\${filename}'\`);
  } else {
    console.log(\`  --> PDF not available (HTTP \${pdfRes.status})\`);
  }

  console.log("\\nSuccess! Quickstart complete.");
}

main().catch(console.error);
`;

  const browserJs = `// Client-Side Browser Integration (React, Vue, or Vanilla JS)
// Note: If calling from a browser on a different origin without CORS,
// route through this viewer's local proxy (/api/proxy) or configure CORS on the backend.

export async function fetchPatientDocuments(ssin, baseUrl = "${base}") {
  const form = new URLSearchParams({
    "patient.identifier": \`${sys}|\${ssin}\`,
    "status": "current",
    "searchtype": "federated"
  });

  const response = await fetch(\`\${baseUrl}/DocumentReference/_search\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/fhir+json; fhirVersion=4.0"
    },
    body: form.toString()
  });

  if (!response.ok) {
    throw new Error(\`Search failed with status \${response.status}\`);
  }

  const bundle = await response.json();
  
  // Separate documents from downstream OperationOutcome issues
  const documents = (bundle.entry || [])
    .filter(e => e.resource?.resourceType === "DocumentReference" && e.search?.mode !== "outcome")
    .map(e => e.resource);

  return documents;
}
`;

  return `<div class="code-page">
    ${renderLangNav("javascript")}
    ${renderContextBanner(config)}
    ${renderCodeCard({
      id: "js-quickstart",
      title: "1. Complete Node.js Quickstart Script",
      description:
        "Uses native <code>fetch</code> and Node.js built-ins. Zero external dependencies needed.",
      filename: "quickstart.mjs",
      badgeText: "Node.js 18+ · Native fetch",
      runCommand: "node quickstart.mjs",
      code: quickstartJs,
      notes:
        '<strong>ES Modules:</strong> Save as <code>quickstart.mjs</code> or ensure your <code>package.json</code> contains <code>"type": "module"</code>.',
    })}
    ${renderCodeCard({
      id: "js-browser",
      title: "2. Browser / Frontend Integration Helper",
      description:
        "Reusable async function for web applications (React, Angular, Vue, or Vanilla JS) to discover documents.",
      filename: "interhub-client.js",
      badgeText: "Browser / Frontend",
      code: browserJs,
    })}
    ${renderCodeCard({
      id: "js-observations",
      title: "3. Laboratory Observation Search (Transaction 3 / DIGIRELAB)",
      description:
        "Query discrete laboratory results by LOINC analyte code using native fetch and URLSearchParams.",
      filename: "search_observations.mjs",
      badgeText: "Transaction 3 · PCC-44",
      code: `const FHIR_BASE = "${base}";
const SSIN = "${ssin}";

const response = await fetch(\`\${FHIR_BASE}/Observation/_search\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/fhir+json; fhirVersion=4.0",
  },
  body: new URLSearchParams({
    "patient.identifier": \`https://www.ehealth.fgov.be/standards/fhir/core/NamingSystem/ssin|\${SSIN}\`,
    code: "http://loinc.org|1558-6",
    _sort: "-date",
  }),
});

if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
const bundle = await response.json();

console.log(\`Found \${bundle.total} observation(s)\`);
for (const entry of bundle.entry || []) {
  const obs = entry.resource;
  if (obs?.resourceType === "Observation") {
    console.log(\`\${obs.code.coding[0].display}: \${obs.valueQuantity.value} \${obs.valueQuantity.unit}\`);
  }
}
`,
    })}
  </div>`;
}

// ==========================================
// 3. JAVA PAGE
// ==========================================
export function codeJavaPage(state) {
  const config = getActiveConfig(state);
  const base = config.base;
  const ssin = config.patient;
  const sys = config.system;

  const quickstartJava = `/**
 * Belgian Interhub FHIR R4 - Java Quickstart
 * Connects to: ${base}
 * Patient SSIN: ${ssin}
 *
 * Uses modern Java standard library (java.net.http.HttpClient).
 * Zero third-party dependencies required!
 * 
 * Run with Java 11+:
 *     java Quickstart.java
 */

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Duration;

public class Quickstart {
    private static final String BASE_URL = "${base}";
    private static final String PATIENT_SSIN = "${ssin}";
    private static final String SSIN_SYSTEM = "${sys}";

    public static void main(String[] args) throws Exception {
        System.out.println("============================================================");
        System.out.println("Belgian Interhub Explorer (Java Standard HttpClient)");
        System.out.println("Target Base: " + BASE_URL);
        System.out.println("============================================================");

        HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

        // 1. Conformance Check (GET /metadata)
        System.out.println("\\n[1/4] Checking server conformance (GET /metadata)...");
        HttpRequest metaReq = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "/metadata"))
            .header("Accept", "application/fhir+json")
            .GET()
            .build();

        HttpResponse<String> metaRes = client.send(metaReq, HttpResponse.BodyHandlers.ofString());
        if (metaRes.statusCode() != 200) {
            System.err.println("Failed to connect: HTTP " + metaRes.statusCode());
            return;
        }
        System.out.println("  --> Connected! Conformance HTTP " + metaRes.statusCode());

        // 2. ITI-67 Document Discovery (POST form-urlencoded)
        System.out.println("\\n[2/4] Discovering documents for patient " + PATIENT_SSIN + " (POST /DocumentReference/_search)...");
        String formBody = "patient.identifier=" + URLEncoder.encode(SSIN_SYSTEM + "|" + PATIENT_SSIN, StandardCharsets.UTF_8)
            + "&status=current"
            + "&searchtype=federated"
            + "&_sort=-date"
            + "&_count=20";

        HttpRequest searchReq = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "/DocumentReference/_search"))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .header("Accept", "application/fhir+json; fhirVersion=4.0")
            .POST(HttpRequest.BodyPublishers.ofString(formBody))
            .build();

        HttpResponse<String> searchRes = client.send(searchReq, HttpResponse.BodyHandlers.ofString());
        System.out.println("  --> Search response: HTTP " + searchRes.statusCode());
        
        // Print snippet of response JSON
        String body = searchRes.body();
        System.out.println("  --> Bundle Preview: " + body.substring(0, Math.min(250, body.length())) + "...");

        // 3. Belgian $retrieve-document Operation (FHIR Clinical Document Bundle)
        System.out.println("\\n[3/4] Retrieving clinical document bundle (POST /DocumentReference/$retrieve-document)...");
        String retrieveJson = """
            {
              "resourceType": "Parameters",
              "parameter": [
                {
                  "name": "documentReference",
                  "valueReference": {
                    "reference": "DocumentReference/DocRefLabReportContainedExample"
                  }
                }
              ]
            }
            """;

        HttpRequest docReq = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "/DocumentReference/$retrieve-document"))
            .header("Content-Type", "application/fhir+json")
            .header("Accept", "application/fhir+json; fhirVersion=4.0")
            .POST(HttpRequest.BodyPublishers.ofString(retrieveJson))
            .build();

        HttpResponse<String> docRes = client.send(docReq, HttpResponse.BodyHandlers.ofString());
        System.out.println("  --> Retrieval response: HTTP " + docRes.statusCode());

        // 4. Retrieve Hub PDF Rendering via Content Negotiation
        System.out.println("\\n[4/4] Retrieving Hub PDF rendering (Accept: application/pdf)...");
        HttpRequest pdfReq = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "/DocumentReference/$retrieve-document"))
            .header("Content-Type", "application/fhir+json")
            .header("Accept", "application/pdf")
            .POST(HttpRequest.BodyPublishers.ofString(retrieveJson))
            .build();

        HttpResponse<byte[]> pdfRes = client.send(pdfReq, HttpResponse.BodyHandlers.ofByteArray());
        if (pdfRes.statusCode() == 200) {
            String pdfPath = "downloaded-report.pdf";
            Files.write(Paths.get(pdfPath), pdfRes.body());
            System.out.println("  --> Saved PDF binary (" + pdfRes.body().length + " bytes) to '" + pdfPath + "'");
        } else {
            System.out.println("  --> PDF response: HTTP " + pdfRes.statusCode());
        }

        System.out.println("\\nSuccess! Java quickstart completed.");
    }
}
`;

  const hapiJava = `// Using HAPI FHIR Client in Spring Boot or Enterprise Java
// Maven dependency: ca.uhn.hapi.fhir:hapi-fhir-client:7.6.0
//                   ca.uhn.hapi.fhir:hapi-fhir-structures-r4:7.6.0

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.rest.client.api.IGenericClient;
import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.DocumentReference;
import org.hl7.fhir.r4.model.Parameters;
import org.hl7.fhir.r4.model.Reference;

public class HapiInterhubClient {
    public static void main(String[] args) {
        FhirContext ctx = FhirContext.forR4();
        IGenericClient client = ctx.newRestfulGenericClient("${base}");

        // 1. Discover Documents via POST
        Bundle searchBundle = client.search()
            .forResource(DocumentReference.class)
            .where(DocumentReference.PATIENT.hasId("${sys}|${ssin}"))
            .and(DocumentReference.STATUS.exactly().code("current"))
            .usingStyle(ca.uhn.fhir.rest.api.SearchStyleEnum.POST)
            .returnBundle(Bundle.class)
            .execute();

        System.out.println("Found documents: " + searchBundle.getTotal());

        // 2. Invoke Belgian $retrieve-document Operation
        Parameters inParams = new Parameters();
        inParams.addParameter()
            .setName("documentReference")
            .setValue(new Reference("DocumentReference/DocRefLabReportContainedExample"));

        Parameters outParams = client.operation()
            .onType(DocumentReference.class)
            .named("$retrieve-document")
            .withParameters(inParams)
            .useHttpGet(false)
            .execute();

        System.out.println("Operation succeeded!");
    }
}
`;

  return `<div class="code-page">
    ${renderLangNav("java")}
    ${renderContextBanner(config)}
    ${renderCodeCard({
      id: "java-quickstart",
      title: "1. Complete Java Standard Library Quickstart",
      description:
        "Uses standard <code>java.net.http.HttpClient</code> available in Java 11+. Zero external JARs or dependencies required.",
      filename: "Quickstart.java",
      badgeText: "Java 11+ · Standard Library",
      runCommand: "java Quickstart.java",
      code: quickstartJava,
      notes:
        "<strong>Single-File Execution:</strong> In Java 11+, you can run source code directly without precompiling: <code>java Quickstart.java</code>.",
    })}
    ${renderCodeCard({
      id: "java-hapi",
      title: "2. HAPI FHIR Client Integration",
      description:
        "How to use the normative HAPI FHIR Java client with strongly typed R4 resource models.",
      filename: "HapiInterhubClient.java",
      badgeText: "HAPI FHIR R4",
      code: hapiJava,
    })}
    ${renderCodeCard({
      id: "java-observations",
      title: "3. Laboratory Observation Search (Transaction 3)",
      description:
        "Query discrete laboratory results using standard Java 11+ HttpClient.",
      filename: "SearchObservations.java",
      badgeText: "Transaction 3 · PCC-44",
      code: `import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

public class SearchObservations {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        String body = "patient.identifier=" + URLEncoder.encode("https://www.ehealth.fgov.be/standards/fhir/core/NamingSystem/ssin|${ssin}", StandardCharsets.UTF_8)
                    + "&code=" + URLEncoder.encode("http://loinc.org|1558-6", StandardCharsets.UTF_8)
                    + "&_sort=-date";

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("${base}/Observation/_search"))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .header("Accept", "application/fhir+json; fhirVersion=4.0")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("Status: " + response.statusCode());
        System.out.println("Response:\n" + response.body());
    }
}
`,
    })}
  </div>`;
}

// ==========================================
// 4. C# (.NET) PAGE
// ==========================================
export function codeCsharpPage(state) {
  const config = getActiveConfig(state);
  const base = config.base;
  const ssin = config.patient;
  const sys = config.system;

  const quickstartCs = `// Belgian Interhub FHIR R4 - C# (.NET) Quickstart
// Connects to: ${base}
// Patient SSIN: ${ssin}
//
// Uses standard .NET 6/7/8/9 HttpClient and System.Text.Json.
// Zero third-party NuGet packages required!
//
// To run:
//     dotnet new console -o InterhubQuickstart
//     cd InterhubQuickstart
//     (replace Program.cs with this file)
//     dotnet run

using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

var baseUrl = "${base}";
var patientSsin = "${ssin}";
var ssinSystem = "${sys}";

using var client = new HttpClient();
client.Timeout = TimeSpan.FromSeconds(15);

Console.WriteLine(new string('=', 60));
Console.WriteLine("Belgian Interhub Explorer (C# .NET HttpClient)");
Console.WriteLine($"Target Base: {baseUrl}");
Console.WriteLine(new string('=', 60));

// 1. Check Capabilities (GET /metadata)
Console.WriteLine("\\n[1/4] Checking server conformance (GET /metadata)...");
using var metaReq = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/metadata");
metaReq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/fhir+json"));

var metaRes = await client.SendAsync(metaReq);
if (!metaRes.IsSuccessStatusCode)
{
    Console.Error.WriteLine($"Failed to connect: {metaRes.StatusCode}");
    return;
}
Console.WriteLine($"  --> Connected! Metadata HTTP {metaRes.StatusCode}");

// 2. ITI-67 Document Discovery (POST form-urlencoded)
Console.WriteLine($"\\n[2/4] Searching documents for SSIN {patientSsin} (POST /DocumentReference/_search)...");
var formValues = new Dictionary<string, string>
{
    { "patient.identifier", $"{ssinSystem}|{patientSsin}" },
    { "status", "current" },
    { "searchtype", "federated" },
    { "_sort", "-date" },
    { "_count", "20" }
};

using var searchReq = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/DocumentReference/_search")
{
    Content = new FormUrlEncodedContent(formValues)
};
searchReq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/fhir+json"));

var searchRes = await client.SendAsync(searchReq);
var searchJson = await searchRes.Content.ReadAsStringAsync();
using var searchDoc = JsonDocument.Parse(searchJson);

var total = searchDoc.RootElement.TryGetProperty("total", out var t) ? t.GetInt32() : 0;
Console.WriteLine($"  --> Search completed! Total matches reported: {total}");

string? firstDocId = null;
if (searchDoc.RootElement.TryGetProperty("entry", out var entries))
{
    foreach (var entry in entries.EnumerateArray())
    {
        if (entry.TryGetProperty("resource", out var res))
        {
            var id = res.GetProperty("id").GetString();
            firstDocId ??= id;
            var desc = res.TryGetProperty("description", out var d) ? d.GetString() : "Clinical Document";
            Console.WriteLine($"  - [{id}] {desc}");
        }
    }
}

firstDocId ??= "DocRefLabReportContainedExample";

// 3. Belgian $retrieve-document Operation (FHIR Clinical Document Bundle)
Console.WriteLine($"\\n[3/4] Retrieving clinical document bundle for '{firstDocId}'...");
var retrievePayload = new
{
    resourceType = "Parameters",
    parameter = new[]
    {
        new
        {
            name = "documentReference",
            valueReference = new { reference = $"DocumentReference/{firstDocId}" }
        }
    }
};

var jsonContent = new StringContent(
    JsonSerializer.Serialize(retrievePayload),
    Encoding.UTF8,
    "application/fhir+json"
);

using var docReq = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/DocumentReference/$retrieve-document")
{
    Content = jsonContent
};
docReq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/fhir+json"));

var docRes = await client.SendAsync(docReq);
Console.WriteLine($"  --> Retrieval HTTP status: {docRes.StatusCode}");

// 4. Retrieve Hub PDF Rendering
Console.WriteLine("\\n[4/4] Retrieving Hub PDF rendering (Accept: application/pdf)...");
using var pdfReq = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/DocumentReference/$retrieve-document")
{
    Content = new StringContent(
        JsonSerializer.Serialize(retrievePayload),
        Encoding.UTF8,
        "application/fhir+json"
    )
};
pdfReq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/pdf"));

var pdfRes = await client.SendAsync(pdfReq);
if (pdfRes.IsSuccessStatusCode)
{
    var pdfBytes = await pdfRes.Content.ReadAsByteArrayAsync();
    var pdfFile = $"{firstDocId}.pdf";
    await File.WriteAllBytesAsync(pdfFile, pdfBytes);
    Console.WriteLine($"  --> Saved PDF ({pdfBytes.Length} bytes) to '{pdfFile}'");
}
else
{
    Console.WriteLine($"  --> PDF not available (HTTP {pdfRes.StatusCode})");
}

Console.WriteLine("\\nSuccess! C# quickstart completed.");
`;

  const firelyCs = `// Using Firely .NET SDK (Hl7.Fhir.R4)
// Install via NuGet:
//     dotnet add package Hl7.Fhir.R4

using Hl7.Fhir.Model;
using Hl7.Fhir.Rest;

var client = new FhirClient("${base}");

// Discover documents via ITI-67 search parameters
var q = new SearchParams()
    .Add("patient.identifier", "${sys}|${ssin}")
    .Add("status", "current")
    .Add("searchtype", "federated");

Bundle searchResults = await client.SearchAsync<DocumentReference>(q);
Console.WriteLine($"Found {searchResults.Total} matching documents.");
`;

  return `<div class="code-page">
    ${renderLangNav("csharp")}
    ${renderContextBanner(config)}
    ${renderCodeCard({
      id: "cs-quickstart",
      title: "1. Complete C# (.NET) Quickstart Script",
      description:
        "Modern top-level statements using .NET standard <code>HttpClient</code> and <code>System.Text.Json</code>. No NuGet packages needed.",
      filename: "Program.cs",
      badgeText: ".NET 6/7/8/9 · HttpClient",
      runCommand: "dotnet run",
      code: quickstartCs,
    })}
    ${renderCodeCard({
      id: "cs-firely",
      title: "2. Firely .NET FHIR SDK Integration",
      description:
        "Using the official HL7 Firely .NET SDK with strongly-typed FHIR R4 models.",
      filename: "FirelyClient.cs",
      badgeText: "Hl7.Fhir.R4",
      runCommand: "dotnet add package Hl7.Fhir.R4",
      code: firelyCs,
    })}
    ${renderCodeCard({
      id: "cs-observations",
      title: "3. Laboratory Observation Search (Transaction 3)",
      description:
        "Query discrete analyte results with .NET HttpClient.",
      filename: "SearchObservations.cs",
      badgeText: "Transaction 3 · PCC-44",
      code: `using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

using var client = new HttpClient();
var parameters = new[]
{
    new KeyValuePair<string, string>("patient.identifier", "https://www.ehealth.fgov.be/standards/fhir/core/NamingSystem/ssin|${ssin}"),
    new KeyValuePair<string, string>("code", "http://loinc.org|1558-6"),
    new KeyValuePair<string, string>("_sort", "-date")
};

var response = await client.PostAsync("${base}/Observation/_search", new FormUrlEncodedContent(parameters));
var json = await response.Content.ReadAsStringAsync();
Console.WriteLine($"Status: {response.StatusCode}");
Console.WriteLine(json);
`,
    })}
  </div>`;
}

// ==========================================
// 5. CURL / CLI PAGE
// ==========================================
export function codeCurlPage(state) {
  const config = getActiveConfig(state);
  const base = config.base;
  const ssin = config.patient;
  const sys = config.system;

  const scriptSh = `#!/usr/bin/env bash
# Belgian Interhub FHIR R4 - Bash / cURL Explorer
set -euo pipefail

BASE_URL="${base}"
SSIN="${ssin}"
SYSTEM="${sys}"

echo "============================================================"
echo "Belgian Interhub Terminal Explorer"
echo "Target Base: \${BASE_URL}"
echo "Patient SSIN: \${SSIN}"
echo "============================================================"

# 1. CapabilityStatement
echo -e "\\n[1/4] Server metadata:"
curl -s "\${BASE_URL}/metadata" \\
  -H "Accept: application/fhir+json" | jq '.fhirVersion, .software.name'

# 2. ITI-67 Document Search
echo -e "\\n[2/4] Searching documents for SSIN \${SSIN}:"
curl -s -X POST "\${BASE_URL}/DocumentReference/_search" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "Accept: application/fhir+json; fhirVersion=4.0" \\
  -d "patient.identifier=\${SYSTEM}|\${SSIN}&status=current&searchtype=federated" | \\
  jq '{total: .total, documents: [.entry[]? | select(.search.mode != "outcome") | {id: .resource.id, title: .resource.description, date: .resource.date}]}'

# 3. Retrieve FHIR Clinical Document
echo -e "\\n[3/4] Retrieving laboratory report bundle:"
curl -s -X POST "\${BASE_URL}/DocumentReference/\\$retrieve-document" \\
  -H "Content-Type: application/fhir+json" \\
  -H "Accept: application/fhir+json; fhirVersion=4.0" \\
  -d '{
    "resourceType": "Parameters",
    "parameter": [{
      "name": "documentReference",
      "valueReference": { "reference": "DocumentReference/DocRefLabReportContainedExample" }
    }]
  }' | jq '{type: .type, title: .entry[0].resource.title, totalEntries: (.entry | length)}'

# 4. Download PDF Rendering
echo -e "\\n[4/4] Downloading Hub PDF rendering directly to disk:"
curl -s -X POST "\${BASE_URL}/DocumentReference/\\$retrieve-document" \\
  -H "Content-Type: application/fhir+json" \\
  -H "Accept: application/pdf" \\
  -d '{
    "resourceType": "Parameters",
    "parameter": [{
      "name": "documentReference",
      "valueReference": { "reference": "DocumentReference/DocRefLabReportContainedExample" }
    }]
  }' --output lab-report.pdf

echo "Done! Saved lab-report.pdf."
`;

  return `<div class="code-page">
    ${renderLangNav("curl")}
    ${renderContextBanner(config)}
    ${renderCodeCard({
      id: "curl-script",
      title: "1. All-in-One Shell Script",
      description:
        "Run the entire workflow directly in your terminal using <code>curl</code> and <code>jq</code>.",
      filename: "explore.sh",
      badgeText: "Bash / cURL",
      runCommand: "chmod +x explore.sh && ./explore.sh",
      code: scriptSh,
    })}
    ${renderCodeCard({
      id: "curl-search",
      title: "2. ITI-67 Document Discovery Command",
      description:
        "Standard POST form-urlencoded search query with patient SSIN identifier.",
      badgeText: "POST /DocumentReference/_search",
      code: `curl -i -X POST "${base}/DocumentReference/_search" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "Accept: application/fhir+json; fhirVersion=4.0" \\
  -d "patient.identifier=${encodeURIComponent(sys)}%7C${ssin}&status=current&searchtype=federated"`,
    })}
    ${renderCodeCard({
      id: "curl-retrieve",
      title: "3. Belgian $retrieve-document Operation (JSON Bundle)",
      description:
        "Retrieves the normative FHIR Document Bundle (Composition + contained clinical entries).",
      badgeText: "POST /DocumentReference/$retrieve-document",
      code: `curl -i -X POST "${base}/DocumentReference/\\$retrieve-document" \\
  -H "Content-Type: application/fhir+json" \\
  -H "Accept: application/fhir+json; fhirVersion=4.0" \\
  -d '{
    "resourceType": "Parameters",
    "parameter": [
      {
        "name": "documentReference",
        "valueReference": {
          "reference": "DocumentReference/DocRefLabReportContainedExample"
        }
      }
    ]
  }'`,
    })}
    ${renderCodeCard({
      id: "curl-pdf",
      title: "4. Retrieve Hub-Rendered PDF Binary Stream",
      description:
        "Content negotiation: setting <code>Accept: application/pdf</code> streams raw binary.",
      badgeText: "Accept: application/pdf",
      code: `curl -X POST "${base}/DocumentReference/\\$retrieve-document" \\
  -H "Content-Type: application/fhir+json" \\
  -H "Accept: application/pdf" \\
  -d '{
    "resourceType": "Parameters",
    "parameter": [
      {
        "name": "documentReference",
        "valueReference": {
          "reference": "DocumentReference/DocRefLabReportContainedExample"
        }
      }
    ]
  }' --output document.pdf`,
    })}
    ${renderCodeCard({
      id: "curl-observation",
      title: "5. Laboratory Observation Search (Transaction 3)",
      description:
        "Search discrete laboratory results by LOINC code (e.g. Fasting Glucose <code>1558-6</code>).",
      filename: "curl-observation.sh",
      badgeText: "POST Observation/_search",
      code: `curl -X POST "${base}/Observation/_search" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "Accept: application/fhir+json; fhirVersion=4.0" \\
  --data-urlencode "patient.identifier=https://www.ehealth.fgov.be/standards/fhir/core/NamingSystem/ssin|${ssin}" \\
  --data-urlencode "code=http://loinc.org|1558-6" \\
  --data-urlencode "_sort=-date"`,
    })}
  </div>`;
}
