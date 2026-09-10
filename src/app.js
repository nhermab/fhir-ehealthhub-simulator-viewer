import {
  SSIN,
  SSIN_OID,
  pretty,
  extension,
  value,
  codeText,
  humanName,
  referenceText,
  title,
  isMinimal,
  searchParams,
  retrieveBody,
  splitSearch,
  validateResource,
  curlCommand,
  validateSsin,
} from "./fhir.js";
import { defaults, requestFHIR, transport } from "./client.js";
import { generateKey, thumbprint, decodeJwt, tokenRequest } from "./auth.js";
const $ = (s) => document.querySelector(s);
const esc = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icons = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  code: "m8 5-7 7 7 7m8-14 7 7-7 7m-3-16-2 18",
  shield: "M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6zM8 12l3 3 5-6",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z",
  book: "M12 5C8 2 3 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1v16",
  pulse: "M2 12h5l3-8 4 16 3-8h5",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  down: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  check: "m5 12 4 4L19 6",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  globe:
    "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M2 12h20M12 2c6 6 6 14 0 20-6-6-6-14 0-20",
  key: "M15 7a5 5 0 1 1-2 4L3 21H1v-4l8-8a5 5 0 0 1 6-2z",
  close: "m6 6 12 12M6 18 18 6",
  chevron: "m9 5 7 7-7 7",
  lab: "M9 2h6M10 2v7L3 21h18L14 9V2M7 15h10",
  heart: "M20 4c-3-3-7-1-8 1-1-2-5-4-8-1-6 6 8 16 8 16S26 10 20 4",
  copy: "M9 9h12v12H9zM15 5V2H2v13h3",
  alert: "m12 3 10 18H2zM12 9v5m0 3v1",
  sun: "M12 3V1m0 22v-2M3 12H1m22 0h-2M5 5 3 3m18 18-2-2M19 5l2-2M3 21l2-2M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
  upload: "M12 16V3m-5 5 5-5 5 5M4 17v4h16v-4",
  network:
    "M12 3v6M4 15v-3h16v3M9 2h6v5H9zM1 16h6v5H1zM9 16h6v5H9zM17 16h6v5h-6zM12 12v4",
};
const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.file}"/></svg>`;
const btn = (label, action, style = "", extra = "") =>
  `<button type="button" class="btn ${style}" data-action="${action}" ${extra}>${label}</button>`;
const badge = (label, cls = "") =>
  `<span class="badge ${cls}">${esc(label)}</span>`;
const kv = (key, v) =>
  `<div class="kv"><dt>${esc(key)}</dt><dd>${esc(v ?? "Not supplied")}</dd></div>`;
const date = (x) =>
  x
    ? new Date(x).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Undated";
const field = (label, name, val = "", type = "text", extra = "") =>
  `<label class="field"><span>${esc(label)}</span><input name="${name}" type="${type}" value="${esc(val)}" ${extra}></label>`;
const select = (label, name, options, val) =>
  `<label class="field"><span>${esc(label)}</span><select name="${name}">${options.map(([v, t]) => `<option value="${esc(v)}" ${v === val ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>`;
const area = (label, name, val = "", extra = "") =>
  `<label class="field"><span>${esc(label)}</span><textarea name="${name}" spellcheck="false" ${extra}>${esc(val)}</textarea></label>`;
const json = (x) =>
  `<pre class="json" tabindex="0">${esc(typeof x === "string" ? x : pretty(x))}</pre>`;
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem("interhub-settings") || "{}");
} catch {}
if (!saved || typeof saved !== "object" || Array.isArray(saved)) saved = {};
delete saved.headers;
try {
  const u = new URL(saved.base || defaults.base);
  if (!["http:", "https:"].includes(u.protocol)) saved = {};
} catch {
  saved = {};
}
const state = {
  settings: { ...defaults, ...saved },
  auth: {
    token: "",
    proof: "none",
    nonce: "",
    jwk: null,
    keyId: "",
    clientSecret: "",
    assertion: "",
  },
  page: "documents",
  documents: [],
  issues: [],
  searchBundle: null,
  selected: null,
  detailTab: "overview",
  payload: null,
  pdf: null,
  logs: [],
  logIndex: 0,
  logTab: "response",
  busy: false,
  error: "",
  query: {
    patient: "79080412345",
    system: SSIN,
    status: "current",
    _sort: "-date",
    _count: "20",
    searchtype: "federated",
  },
  localFilter: "",
  category: "",
  view: "list",
  capability: null,
  igText: "",
  igFile: "transactions.md",
  console: {
    method: "POST",
    path: "DocumentReference/_search",
    contentType: "application/x-www-form-urlencoded",
    accept: "application/fhir+json; fhirVersion=4.0",
    body: "",
  },
};
state.console.body = searchParams(state.query).toString();
const pages = {
  documents: [
    "Document workspace",
    "Discover, inspect, and retrieve across the Belgian hub network.",
  ],
  timeline: [
    "Patient timeline",
    "A chronological view of the documents in your current search.",
  ],
  console: ["FHIR console", "Every request. Every response. Nothing hidden."],
  auth: [
    "Authentication",
    "Configure trust, acquire tokens, and sign your requests.",
  ],
  conformance: [
    "IG workbench",
    "Inspect local profile checks and the responding hub’s capabilities.",
  ],
  guide: [
    "Implementation guide",
    "The local Belgian Interhub specification, always within reach.",
  ],
  settings: [
    "Connections & preferences",
    "Your endpoints, transport, and workspace settings.",
  ],
};
function notify(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => $("#toast").classList.remove("show"), 3500);
}
function clearPayload() {
  if (state.pdf) URL.revokeObjectURL(state.pdf);
  state.pdf = null;
  state.payload = null;
}
function selectDoc(id) {
  state.selected = state.documents.find((d) => d.id === id) || null;
  state.detailTab = "overview";
  clearPayload();
}
async function run(fn) {
  if (state.busy) return;
  state.busy = true;
  state.error = "";
  render();
  try {
    await fn();
  } catch (e) {
    state.error =
      e.name === "AbortError"
        ? "Request timed out. Check the connection and timeout settings."
        : e.message;
    notify(state.error);
  } finally {
    state.busy = false;
    render();
  }
}
const request = (path, opts = {}) =>
  requestFHIR(path, opts, {
    settings: state.settings,
    auth: state.auth,
    onLog: (log) => {
      state.logs.unshift(log);
      state.logs = state.logs.slice(0, 60);
      state.logIndex = 0;
    },
  });
async function search(next) {
  const params = next
    ? new URL(next).searchParams
    : searchParams(state.query, state.settings.strictSsin);
  const bundle = await request("DocumentReference/_search", {
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    body: params.toString(),
  });
  const result = splitSearch(bundle);
  state.documents = result.documents;
  state.issues = result.issues;
  state.searchBundle = bundle;
  selectDoc(result.documents[0]?.id);
}
function render() {
  document.documentElement.dataset.theme = state.settings.theme;
  document.title = `${pages[state.page][0]} · Interhub`;
  $("#app").innerHTML =
    `<aside class="sidebar"><a class="brand" href="#documents"><span class="brandmark">${icon("grid")}</span><span>interhub<span class="brand-sub">BELGIAN eHEALTH</span></span></a><div class="workspace-label">WORKSPACE</div><nav aria-label="Main navigation">${[
      ["documents", "file", "Documents"],
      ["timeline", "clock", "Patient timeline"],
      ["console", "code", "FHIR console"],
      ["auth", "shield", "Authentication"],
    ]
      .map(([id, i, t]) => nav(id, i, t))
      .join("")}<div class="workspace-label secondary">DEVELOPER TOOLS</div>${[
      ["conformance", "check", "IG workbench"],
      ["guide", "book", "Implementation guide"],
      ["settings", "settings", "Connections"],
    ]
      .map(([id, i, t]) => nav(id, i, t))
      .join(
        "",
      )}</nav><div class="sidebar-bottom"><div class="network-tile"><span class="status-dot"></span><b>${state.settings.mode === "demo" ? "Offline demo" : "Live connection"}</b><p>${state.settings.mode === "demo" ? "Belgian IG sample fixtures" : esc(new URL(state.settings.base).host)}</p>${badge("FHIR R4", "dark-badge")}${badge("MHD", "dark-badge")}</div><div class="user"><span class="avatar">DE</span><div><b>Developer workspace</b><small>Local session · ${state.auth.token ? "Token loaded" : "No token"}</small></div>${btn(icon("sun"), "theme", "icon-btn", 'aria-label="Toggle color theme"')}</div></div></aside><div class="shell"><header class="topbar"><div class="breadcrumb">Workspace ${icon("chevron")} <b>${pages[state.page][0]}</b></div><div class="top-actions">${badge("IG 0.2.0", "neutral")}<span class="env"><span class="status-dot"></span>${state.settings.mode === "demo" ? "Demo environment" : "Live environment"}</span>${btn(icon("settings"), "settings", "icon-btn", 'aria-label="Connection settings"')}</div></header><main id="main" tabindex="-1"><div class="page-head"><div><div class="eyebrow">BELGIAN FEDERATED HEALTH NETWORK</div><h1>${pages[state.page][0]}</h1><p>${pages[state.page][1]}</p></div><div class="head-actions">${state.page === "documents" ? btn(icon("upload") + " Import FHIR", "import") + btn(icon("globe") + " Connection", "settings", "primary") : badge(state.settings.mode === "demo" ? "SYNTHETIC DATA" : "LIVE DATA", state.settings.mode === "demo" ? "neutral" : "warning")}</div></div>${state.error ? `<div class="notice error" role="alert">${icon("alert")}<span>${esc(state.error)}</span>${btn(icon("close"), "dismiss-error", "icon-btn", 'aria-label="Dismiss error"')}</div>` : ""}${state.busy ? '<div class="loading-line" role="status" aria-label="Working"></div>' : ""}${{ documents: documentsPage, timeline: timelinePage, console: consolePage, auth: authPage, conformance: conformancePage, guide: guidePage, settings: settingsPage }[state.page]()}</main><footer><span><span class="status-dot"></span> ${state.settings.mode === "demo" ? "Fixture transport · no backend required" : "Live transport · " + esc(state.settings.transport)}</span><span>Belgian Interhub <span class="footer-sep">/</span> IHE MHD <span class="footer-sep">/</span> HL7 FHIR R4</span></footer></div><input type="file" id="import-file" accept="application/json,.json" hidden><input type="file" id="config-file" accept="application/json,.json" hidden>`;
  wireForms();
}
function nav(id, i, t) {
  return `<a href="#${id}" aria-label="${t}" class="nav-item ${state.page === id ? "active" : ""}" ${state.page === id ? 'aria-current="page"' : ""}>${icon(i)}<span>${t}</span>${id === "console" && state.logs.length ? `<span class="nav-count">${state.logs.length}</span>` : ""}</a>`;
}
function documentsPage() {
  const patient = state.documents
    .flatMap((d) => d.contained || [])
    .find((r) => r.resourceType === "Patient");
  const count = state.documents.length,
    full = state.documents.filter((d) => !isMinimal(d)).length;
  return `<section class="patient-card"><div class="patient-avatar">${
    patient
      ? esc(
          humanName(patient)
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join(""),
        )
      : icon("search")
  }</div><div class="patient-info"><div class="overline">PATIENT CONTEXT ${badge(state.settings.mode === "demo" ? "SYNTHETIC" : "SEARCH", "neutral")}</div><h2>${patient ? esc(humanName(patient)) : "Patient document search"}</h2><span>${patient ? esc([patient.gender, date(patient.birthDate)].join(" · ")) : "Search by Belgian national identifier"}</span></div><div class="patient-id"><span>SSIN / INSS</span><code>${esc(state.query.patient)}</code></div><div class="patient-id"><span>Search scope</span><b>${state.query.searchtype === "local" ? "Local hub" : "Federated network"}</b></div><div class="patient-id last"><span>Patient snapshot</span><b>${patient ? "Contained in metadata" : "Not supplied"}</b></div></section><section class="stats-grid">${stat("file", "Documents returned", count, "Current search page", "mint")}${stat("shield", "Comprehensive", full, "Rich Belgian metadata", "blue")}${stat("network", "Home communities", new Set(state.documents.map((d) => String(value(extension(d, "home-community-id"))))).size, "Represented in results", "purple")}${stat("pulse", "Response status", state.issues.length ? "Partial" : state.searchBundle ? "Complete" : "Ready", state.issues.length ? `${state.issues.length} downstream issue(s)` : "Discovery · ITI-67", state.issues.length ? "amber" : "mint")}</section><section class="search-panel"><form id="search-form"><div class="search-primary">${field("Patient identifier", "patient", state.query.patient, "text", 'required inputmode="numeric" autocomplete="off"')}${select(
    "Identifier system",
    "system",
    [
      [SSIN, "Belgian SSIN (canonical)"],
      [SSIN_OID, "Belgian SSIN (OID)"],
    ],
    state.query.system,
  )}${select(
    "Scope",
    "searchtype",
    [
      ["federated", "Federated"],
      ["local", "Local hub"],
    ],
    state.query.searchtype,
  )}<button class="btn primary" ${state.busy ? "disabled" : ""}>${icon("search")} Find documents</button></div><details class="advanced"><summary>Advanced search <span>Clinical type, dates, authors, identifiers & pagination</span></summary><div class="form-grid">${field("Category token", "category", state.query.category || "", "text", 'placeholder="labresult or system|code"')}${field("Clinical type token", "type", state.query.type || "", "text", 'placeholder="http://loinc.org|11502-2"')}${field("From document date", "from", state.query.from || "", "date")}${field("To document date", "to", state.query.to || "", "date")}${field("Author identifier", "author.identifier", state.query["author.identifier"] || "")}${field("Logical document ID", "_id", state.query._id || "")}${field("Business identifier", "identifier", state.query.identifier || "")}${select(
    "Status",
    "status",
    [
      ["current", "Current"],
      ["superseded", "Superseded"],
      ["entered-in-error", "Entered in error"],
      ["", "Any"],
    ],
    state.query.status,
  )}${select(
    "Order",
    "_sort",
    [
      ["-date", "Newest first"],
      ["date", "Oldest first"],
    ],
    state.query._sort,
  )}${field("Results per page", "_count", state.query._count, "number", 'min="1" max="100"')}</div></details></form></section>${state.issues.length ? `<div class="notice warning">${icon("alert")}<div><b>Some sources could not be reached</b><p>These results are incomplete. Available documents remain accessible.</p>${state.issues.map((i) => `<small>${esc(i.details?.coding?.map((c) => c.code).join(", "))} ${esc(i.diagnostics || i.details?.text || i.code)}</small>`).join("")}</div></div>` : ""}<div class="documents-layout"><section class="document-list panel"><div class="panel-heading"><h2>Documents <span class="count">${count}</span></h2><div class="segmented">${btn(icon("file"), "list-view", state.view === "list" ? "selected" : "", 'aria-label="List view"')}${btn(icon("clock"), "timeline-view", state.view === "timeline" ? "selected" : "", 'aria-label="Timeline view"')}</div></div><div class="list-controls"><div class="filter-search">${icon("search")}<input id="local-filter" aria-label="Filter returned documents" placeholder="Filter these documents…" value="${esc(state.localFilter)}"></div><div class="chips">${[
    ["", "All documents"],
    ["labresult", "Laboratory"],
    ["telemonitoring", "Telemonitoring"],
    ["minimal", "Minimal"],
  ]
    .map(([k, v]) =>
      btn(
        v,
        "category",
        state.category === k ? "chip active" : "chip",
        `data-value="${k}"`,
      ),
    )
    .join(
      "",
    )}</div></div><div id="document-rows">${documentRows()}</div><div class="list-footer"><span>${count} on this page ${state.searchBundle?.total != null ? "· " + state.searchBundle.total + " total matches" : ""}</span>${state.searchBundle?.link?.some((l) => l.relation === "next") ? btn("Next page " + icon("arrow"), "next") : badge("POST · ITI-67", "neutral")}</div></section><section class="detail-panel panel">${detailPanel()}</section></div>`;
}
function stat(i, label, note, sub, cls) {
  return `<div class="stat"><div class="stat-top"><span>${label}</span><span class="stat-icon ${cls}">${icon(i)}</span></div><strong>${note}</strong><small>${sub}</small></div>`;
}
function documentRows() {
  const list = state.documents.filter(
    (d) =>
      (!state.category ||
        (state.category === "minimal"
          ? isMinimal(d)
          : d.category?.some((c) =>
              c.coding?.some((c) => c.code === state.category),
            ))) &&
      pretty(d).toLowerCase().includes(state.localFilter.toLowerCase()),
  );
  if (!list.length)
    return `<div class="empty">${icon("search")}<h3>No documents to show</h3><p>${state.documents.length ? "Try another filter." : "Enter a patient SSIN and run a search."}</p></div>`;
  return list
    .map((d) => {
      const tele = d.category?.some((c) =>
          c.coding?.some((x) => x.code === "telemonitoring"),
        ),
        active = d.id === state.selected?.id;
      return `<button class="doc-row ${active ? "selected" : ""} ${state.view === "timeline" ? "timeline-row" : ""}" data-action="select-document" data-id="${esc(d.id)}"><span class="doc-icon ${tele ? "purple" : "mint"}">${icon(tele ? "heart" : isMinimal(d) ? "file" : "lab")}</span><span class="doc-body"><span class="doc-title">${esc(title(d))}</span><span class="doc-description">${esc(codeText(d.type))}</span><span class="doc-meta">${esc(referenceText(d.custodian, d))} <span>·</span> ${date(d.date)}</span><span class="doc-badges">${badge(d.status)}${badge(isMinimal(d) ? "Minimal" : "Comprehensive", "neutral")}${badge(d.content?.[0]?.attachment?.language || "No language", "neutral")}</span></span>${icon("chevron")}</button>`;
    })
    .join("");
}
function detailPanel() {
  const d = state.selected;
  if (!d)
    return `<div class="empty">${icon("file")}<h3>A closer look</h3><p>Select a document to inspect its Belgian metadata and retrieve the clinical payload.</p></div>`;
  return `<div class="detail-heading"><span class="overline">DOCUMENT INSPECTOR</span>${btn(icon("down"), "export-document", "icon-btn", 'aria-label="Export selected document JSON"')}</div><div class="detail-title"><h2>${esc(title(d))}</h2><p>${esc(d.id)}</p>${badge(isMinimal(d) ? "MHD Minimal" : "MHD Comprehensive")}${badge("FHIR R4", "neutral")}</div><div class="tabs" role="tablist">${[
    ["overview", "Overview"],
    ["payload", "Clinical"],
    ["metadata", "Metadata"],
    ["json", "JSON"],
    ["validation", "Checks"],
  ]
    .map(
      ([k, v]) =>
        `<button role="tab" aria-selected="${state.detailTab === k}" data-action="detail-tab" data-value="${k}" class="${state.detailTab === k ? "active" : ""}">${v}</button>`,
    )
    .join(
      "",
    )}</div><div class="detail-content">${{ overview: overview, metadata: metadata, payload: clinical, json: () => `${state.payload ? '<div class="section-label">RETRIEVED PAYLOAD</div>' + json(state.payload) + '<div class="section-label">DOCUMENT REFERENCE</div>' : ""}${json(d)}`, validation: () => checksView(state.payload || d) }[state.detailTab](d)}</div><div class="retrieve-bar">${d._viewerImportedBundle ? '<span class="muted">Imported document Bundle · use the export button to save</span>' : btn(icon("down") + " Retrieve FHIR", "retrieve", "primary", state.busy ? "disabled" : "")}${d._viewerImportedBundle ? "" : btn("View PDF", "pdf", "", state.busy ? "disabled" : "")}</div>`;
}
function overview(d) {
  const access = extension(d, "patient-access"),
    permission = value(access?.extension?.find((e) => e.url === "access")),
    home = value(extension(d, "home-community-id"));
  return `<div class="section-label">CLINICAL CONTEXT</div><dl class="kv-grid">${kv("Document type", codeText(d.type))}${kv("Category", d.category?.map(codeText).join(", "))}${kv("Created", date(d.content?.[0]?.attachment?.creation))}${kv("Clinical status", d.docStatus || d.status)}${kv("Practice setting", codeText(d.context?.practiceSetting))}${kv("Confidentiality", d.securityLabel?.map(codeText).join(", "))}</dl><div class="section-label">AUTHORING PARTIES</div><div class="parties">${(d.author || []).map((a) => `<div class="party"><span class="party-icon">${icon("file")}</span><div><b>${esc(referenceText(a, d))}</b><small>${esc(value(extension(a, "hcparty-type"))?.display || value(extension(a, "hcparty-type"))?.code || "Author")}</small></div></div>`).join("") || '<p class="muted">Authors are optional in the Minimal profile.</p>'}</div><div class="access-card">${icon("shield")}<div><b>Patient access: ${esc(permission || "not specified")}</b><p>${esc(access?.extension?.map((e) => e.url + ": " + value(e)).join(" · ") || "No patient access extension was supplied.")}</p></div></div>${extension(d, "end-to-end-encryption") ? '<div class="notice warning">Encrypted payload · ETK decryption requires an external recipient integration.</div>' : ""}<div class="section-label">HOME COMMUNITY</div><code class="wrap-code">${esc(typeof home === "object" ? pretty(home) : home || "Not supplied")}</code>${d.relatesTo?.length ? `<div class="section-label">DOCUMENT RELATIONSHIPS</div>${d.relatesTo.map((r) => `<div class="relation">${badge(r.code, "neutral")}<p>${esc(r.target?.display || r.target?.identifier?.value || r.target?.reference)}</p></div>`).join("")}` : ""}`;
}
function metadata(d) {
  return `<div class="section-label">BUSINESS IDENTIFIERS</div><dl>${kv("Master identifier", d.masterIdentifier?.value)}${kv("Identifier system", d.masterIdentifier?.system)}${(d.identifier || []).map((i) => kv(i.system, i.value)).join("")}</dl><div class="section-label">ATTACHMENT & CONTEXT</div>${json({ content: d.content, context: d.context })}<div class="section-label">BELGIAN EXTENSIONS</div>${json(d.extension || [])}<div class="section-label">CONTAINED RESOURCES</div>${(d.contained || []).map((r) => `<details class="resource"><summary>${esc(r.resourceType)} · ${esc(humanName(r))}</summary>${json(r)}</details>`).join("") || '<p class="muted">No contained resources.</p>'}<div class="section-label">ATTESTATION</div>${json({ authenticator: d.authenticator, custodian: d.custodian, relatesTo: d.relatesTo })}`;
}
function narrative(text) {
  const parsed = new DOMParser().parseFromString(text || "", "text/html");
  parsed
    .querySelectorAll("script,style,iframe,object,embed")
    .forEach((e) => e.remove());
  return esc(parsed.body.textContent).replaceAll("\n", "<br>");
}
function clinical() {
  if (state.pdf)
    return `<iframe class="pdf-preview" title="Retrieved PDF document" src="${state.pdf}"></iframe>${btn(icon("down") + " Download PDF", "download-pdf")}`;
  const b = state.payload;
  if (!b)
    return `<div class="empty">${icon("lab")}<h3>Open the clinical document</h3><p>Retrieve the immutable document Bundle or the hub-rendered PDF.</p>${btn("Retrieve document " + icon("arrow"), "retrieve", "primary")}</div>`;
  if (b.resourceType === "Binary")
    return `<h3>Binary payload</h3>${json({ contentType: b.contentType, id: b.id })}<p>Use PDF retrieval to preview PDF content.</p>`;
  if (b.resourceType !== "Bundle") return json(b);
  const composition = b.entry?.[0]?.resource;
  const sections = (s) =>
    (s || [])
      .map(
        (s) =>
          `<article class="clinical-section"><h3>${esc(s.title || codeText(s.code))}</h3><div class="narrative">${narrative(s.text?.div)}</div>${sections(s.section)}</article>`,
      )
      .join("");
  return `<div class="clinical-header">${badge(b.type, "neutral")}<h3>${esc(composition?.title || "Clinical document")}</h3><p>${date(composition?.date || b.timestamp)} · ${esc(composition?.status || "")}</p></div>${sections(composition?.section)}<div class="section-label">DISCRETE OBSERVATIONS</div>${
    (b.entry || [])
      .filter((e) => e.resource?.resourceType === "Observation")
      .map(
        ({ resource: r }) =>
          `<div class="observation"><div><b>${esc(codeText(r.code))}</b><small>${esc(r.code?.coding?.[0]?.code || "")} · ${esc(r.status || "")}</small></div><strong>${esc(r.valueQuantity?.value ?? r.valueString ?? codeText(r.valueCodeableConcept))} <small>${esc(r.valueQuantity?.unit || "")}</small></strong>${r.referenceRange ? `<p>Reference: ${esc(r.referenceRange.map((x) => x.text || [x.low?.value, x.high?.value].join(" – ")).join(", "))}</p>` : ""}${r.component ? json(r.component) : ""}</div>`,
      )
      .join("") ||
    '<p class="muted">No discrete observations in this Bundle.</p>'
  }<div class="section-label">RESOURCE EXPLORER · ${b.entry?.length || 0} ENTRIES</div>${(b.entry || []).map(({ resource: r, fullUrl }) => `<details class="resource"><summary>${esc(r?.resourceType)} <span>${esc(r?.id)}</span></summary><code class="wrap-code">${esc(fullUrl)}</code>${json(r)}</details>`).join("")}`;
}
function checksView(r) {
  const checks = validateResource(r),
    pass = checks.filter((c) => c.pass).length;
  return `<div class="check-summary">${icon("shield")}<div><b>${pass} / ${checks.length} local checks passed</b><p>Structural checks derived from the local FSH. Not a full FHIR validator or certification.</p></div></div>${checks.map((c) => `<div class="check-row ${c.pass ? "pass" : "fail"}">${icon(c.pass ? "check" : "alert")}<div><code>${esc(c.path)}</code><small>${esc(c.requirement)}</small></div>${badge(c.pass ? "Pass" : "Review", c.pass ? "" : "warning")}</div>`).join("")}`;
}
function timelinePage() {
  return `<section class="panel timeline-panel"><div class="panel-heading"><h2>Document history</h2>${btn("Back to documents", "documents")}</div>${
    [...state.documents]
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .map(
        (d) =>
          `<div class="history-row"><div class="history-date">${date(d.date)}</div><div class="history-dot"></div><div class="history-card"><div>${badge(d.status)}${badge(isMinimal(d) ? "Minimal" : "Comprehensive", "neutral")}</div><h3>${esc(title(d))}</h3><p>${esc(referenceText(d.custodian, d))}</p>${d.relatesTo?.map((r) => `<p>${esc(r.code)} · ${esc(r.target?.display || r.target?.identifier?.value)}</p>`).join("") || ""}${btn("Inspect document " + icon("arrow"), "open-document", "", `data-id="${esc(d.id)}"`)}</div></div>`,
      )
      .join("") ||
    '<div class="empty"><h3>No timeline yet</h3><p>Run a patient document search first.</p></div>'
  }</section>`;
}
function consolePage() {
  const c = state.console,
    log = state.logs[state.logIndex];
  return `<div class="console-layout"><section class="panel request-builder"><div class="panel-heading"><h2>Request builder</h2>${badge(state.settings.mode === "demo" ? "FIXTURE TRANSPORT" : "LIVE TRANSPORT", "neutral")}</div><div class="preset-row">${[
    ["search", "ITI-67 Search"],
    ["retrieve", "ITI-68 Retrieve"],
    ["metadata", "Capabilities"],
    ["withdrawn", "410 Gone"],
    ["missing", "404 Not found"],
  ]
    .map(([k, v]) => btn(v, "preset", "chip", `data-value="${k}"`))
    .join("")}</div><form id="console-form"><div class="request-url">${select(
    "Method",
    "method",
    [
      ["POST", "POST"],
      ["GET", "GET"],
    ],
    c.method,
  )}${field("Path relative to FHIR base", "path", c.path, "text", "required")}<button class="btn primary" ${state.busy ? "disabled" : ""}>${icon("arrow")} Send</button></div><p class="base-hint">${esc(state.settings.base)}</p><div class="form-grid two">${field("Content-Type", "contentType", c.contentType)}${field("Accept", "accept", c.accept)}</div>${area("Request body", "body", c.body, 'rows="8" class="code-input"')}<p class="muted">Authentication and custom connection headers are applied automatically. Responses stay in memory.</p></form></section><section class="panel request-history"><div class="panel-heading"><h2>Session traffic <span class="count">${state.logs.length}</span></h2>${btn("Clear", "clear-logs", "text-btn")}</div><div class="history-list">${state.logs.map((l, i) => `<button class="traffic-row ${i === state.logIndex ? "active" : ""}" data-action="select-log" data-value="${i}"><span class="method">${l.method}</span><span class="traffic-path">${esc(new URL(l.url).pathname)}<small>${new Date(l.time).toLocaleTimeString()} · ${l.ms} ms ${l.demo ? "· Demo" : ""}</small></span>${badge(l.status || "ERR", l.status >= 400 || !l.status ? "warning" : "")}</button>`).join("") || '<div class="empty"><p>Send a request to start tracing.</p></div>'}</div></section></div><section class="panel response-panel"><div class="panel-heading"><h2>HTTP inspector ${log ? badge(log.status || "Network error", log.status >= 400 ? "warning" : "") : ""}</h2><div>${log ? btn(icon("copy") + " Copy cURL", "copy-curl") + btn(icon("down") + " Export trace", "export-trace") : ""}</div></div><div class="tabs">${[
    ["response", "Response body"],
    ["request", "Request"],
    ["headers", "Response headers"],
    ["curl", "cURL"],
  ]
    .map(([k, v]) =>
      btn(
        v,
        "log-tab",
        state.logTab === k ? "active" : "",
        `data-value="${k}"`,
      ),
    )
    .join(
      "",
    )}<span class="response-timing">${log ? log.ms + " ms · " + new TextEncoder().encode(log.raw || "").length.toLocaleString() + " text bytes" : ""}</span></div>${log ? json(state.logTab === "response" ? (log.data instanceof Blob ? log.raw : log.data) : state.logTab === "headers" ? log.responseHeaders : state.logTab === "curl" ? curlCommand(log) : { url: log.url, method: log.method, headers: log.headers, body: log.body }) : '<div class="empty"><h3>Your responses will appear here</h3><p>Inspect JSON, OperationOutcome issues, HTTP headers, and reproducible cURL commands.</p></div>'}</section>`;
}
function authPage() {
  const a = state.auth,
    s = state.settings,
    claims = decodeJwt(a.token);
  return `<div class="auth-banner"><div class="banner-icon">${icon("shield")}</div><div><h2>A transparent authentication workbench</h2><p>Bring your hub token, connect to an authorization server, or test proof-of-possession.</p></div>${badge(a.token ? "TOKEN LOADED" : "NO TOKEN", a.token ? "" : "neutral")}</div><div class="two-column"><section class="panel padded"><div class="section-label">01 / ACCESS TOKEN</div><h2>Hub authentication</h2><form id="auth-form">${area("Bearer / DPoP access token", "token", a.token, 'rows="4" autocomplete="off"')}${select(
    "Request protection",
    "proof",
    [
      ["none", "Bearer only / no proof"],
      ["dpop", "DPoP · ES256 / RS256"],
      ["signature", "HTTP Message Signatures · RFC 9421"],
    ],
    a.proof,
  )}<div class="form-grid two">${field("Server DPoP nonce", "nonce", a.nonce)}${field("Signing key identifier (kid)", "keyId", a.keyId)}</div>${area("Private signing JWK (session only)", "jwk", a.jwk ? pretty(a.jwk) : "", 'rows="5" autocomplete="off" placeholder="Import a private EC P-256 or RSA JWK"')}<div class="button-row"><button class="btn primary">Apply authentication</button>${btn("Generate P-256 key", "generate-key")}${btn("Clear secrets", "clear-auth", "text-btn")}</div></form><div class="notice subtle"><span>${icon("key")}</span><p>Tokens, private keys, client secrets, and assertions are held in this tab’s memory. Reloading clears them. The Java simulator currently does not validate authentication.</p></div>${a.jwk ? `<div class="section-label">PUBLIC KEY THUMBPRINT</div><code class="wrap-code" id="thumbprint">Calculating…</code>` : ""}</section><section class="panel padded"><div class="section-label">02 / TOKEN ACQUISITION</div><h2>Authorization server</h2><form id="token-form">${select(
    "Connection route",
    "grant",
    [
      ["credentials", "Hub / national IAM · Client credentials"],
      ["exchange", "STS bridge · SAML2 token exchange"],
    ],
    s.grant,
  )}${field("Token endpoint URL", "tokenEndpoint", s.tokenEndpoint, "url", 'placeholder="https://authorization.example/token" required')}${field("OAuth client ID", "clientId", s.clientId, "text", "required")}<div class="form-grid two">${field("Scopes", "scope", s.scope)}${field("Audience (optional)", "audience", s.audience)}</div>${field("Client secret (optional; otherwise private_key_jwt)", "clientSecret", a.clientSecret, "password", 'autocomplete="off"')}${area("SAML2 subject token (base64url, exchange route only)", "assertion", a.assertion, 'rows="3" autocomplete="off"')}<button class="btn primary" ${state.busy ? "disabled" : ""}>${icon("key")} Request access token</button><p class="muted">Uses the selected direct/proxy transport, even in demo mode. Configure an allowed proxy origin for your authorization server. DPoP token requests use the current key.</p></form></section></div><section class="panel padded"><div class="panel-heading"><h2>JWT claims inspector</h2>${badge("DECODED · NOT VERIFIED", "warning")}</div>${claims ? `${claims.exp ? `<div class="notice ${claims.exp * 1000 < Date.now() ? "warning" : "subtle"}">Token ${claims.exp * 1000 < Date.now() ? "expired" : "expires"} ${esc(new Date(claims.exp * 1000).toLocaleString())}</div>` : ""}${json(claims)}` : '<p class="muted">Load a JWT to inspect its issuer, audience, lifetime, Belgian requester context, and cnf key binding. Opaque access tokens are also supported.</p>'}</section><div class="notice subtle">${icon("book")}<p>DPoP constrains token use; it does not sign the request body. Use HTTP Message Signatures for body integrity. mTLS certificates, IAM registration, consent, therapeutic links, institutional trust, and ETK decryption are supplied by your hub infrastructure. <a href="https://www.rfc-editor.org/rfc/rfc9449.html" target="_blank" rel="noreferrer">RFC 9449</a> · <a href="https://www.rfc-editor.org/rfc/rfc9421.html" target="_blank" rel="noreferrer">RFC 9421</a></p></div>`;
}
function conformancePage() {
  const all = state.documents.flatMap(validateResource),
    pass = all.filter((x) => x.pass).length;
  const cap = state.capability;
  return `<section class="stats-grid">${stat("shield", "Local checks", all.length, "Across current search results", "mint")}${stat("check", "Passed", pass, "Structural rules satisfied", "blue")}${stat("alert", "Needs review", all.length - pass, "Inspect the document checks", "amber")}${stat("network", "Responder", cap?.fhirVersion || "Not queried", "CapabilityStatement", "purple")}</section><div class="two-column"><section class="panel padded"><div class="panel-heading"><h2>Responder capabilities</h2>${btn("Fetch /metadata", "capabilities", "primary", state.busy ? "disabled" : "")}</div>${
    cap
      ? `<dl class="kv-grid">${kv("Name", cap.name)}${kv("Status", cap.status)}${kv("FHIR version", cap.fhirVersion)}${kv("Formats", cap.format?.join(", "))}</dl>${(
          cap.rest || []
        )
          .flatMap((r) => r.resource || [])
          .map(
            (r) =>
              `<details class="resource" open><summary>${esc(r.type)}</summary><p>${esc(r.interaction?.map((i) => i.code).join(" · "))}</p><div class="chips">${r.searchParam?.map((p) => badge(p.name, "neutral")).join("") || ""}</div>${r.operation?.map((o) => `<p><code>$${esc(o.name)}</code> ${esc(o.definition)}</p>`).join("") || ""}</details>`,
          )
          .join(
            "",
          )}<details class="resource"><summary>Raw CapabilityStatement</summary>${json(cap)}</details>`
      : '<div class="empty">' +
        icon("network") +
        "<h3>Discover the responder</h3><p>Read advertised interactions, search parameters, and operations.</p></div>"
  }</section><section class="panel padded"><h2>Implementation coverage</h2><p class="muted">Client features derived from the supplied IG; this is not a conformance certification.</p>${[
    [
      "ITI-67 discovery",
      "POST form search, both SSIN systems, all documented filters, pagination, partial outcomes.",
      "Implemented",
    ],
    [
      "ITI-68 retrieval",
      "POST Parameters, reference or business identifier, document Bundle and PDF; 404 / 410 handling.",
      "Implemented",
    ],
    [
      "Belgian metadata",
      "Minimal / Comprehensive, contained parties, patient access, routing, record time, ETK and relationships.",
      "Implemented",
    ],
    [
      "Clinical rendering",
      "Composition narratives, lab values, telemonitoring resources, nested sections, full resource JSON.",
      "Implemented",
    ],
    [
      "Authentication",
      "Bearer, private_key_jwt, client credentials, SAML2 exchange, DPoP and HTTP signatures.",
      "Client tools",
    ],
    [
      "Profile validation",
      "Selected structural FSH rules and bundle reference closure. Full terminology and inherited invariants require a FHIR validator.",
      "Partial",
    ],
    [
      "Infrastructure",
      "mTLS, trust validation, consent, therapeutic links, metahub discovery, ETK depot / decryption, audit retention.",
      "External",
    ],
  ]
    .map(
      ([a, b, c]) =>
        `<div class="coverage-row"><div><b>${a}</b><p>${b}</p></div>${badge(c, c === "Implemented" ? "" : "neutral")}</div>`,
    )
    .join(
      "",
    )}</section></div><section class="panel padded"><h2>Document checks</h2>${state.documents.map((d) => `<details class="resource"><summary>${esc(title(d))} ${badge(isMinimal(d) ? "Minimal" : "Comprehensive", "neutral")}</summary>${checksView(d)}</details>`).join("") || "<p>Run a document search to check returned metadata.</p>"}</section>`;
}
const guides = [
  ["transactions.md", "Transactions & wire contract"],
  ["envelope-and-metadata.md", "Envelope & metadata"],
  ["minimal-vs-comprehensive.md", "Minimal vs Comprehensive"],
  ["security.md", "Security & authentication"],
  ["end-to-end-encryption.md", "End-to-end encryption"],
  ["architecture.md", "Federated architecture"],
  ["lab-report-sharing.md", "Laboratory reports"],
  ["mapping-telemonitoring-to-hub.md", "Telemonitoring"],
  ["mapping-kmehr-to-hub.md", "KMEHR mapping"],
  ["ihe-mhd-alignment.md", "IHE MHD alignment"],
  ["ehds-alignment.md", "EHDS alignment"],
  ["resource-considerations.md", "Resource considerations"],
  ["index.md", "Guide introduction"],
  ["tmp-base-message.md", "Base message proposal"],
  ["be-interhub-documentreference.fsh", "FSH · Comprehensive"],
  ["be-interhub-minimal-documentreference.fsh", "FSH · Minimal"],
  ["be-interhub-document-bundle.fsh", "FSH · Document bundle"],
  ["be-interhub-extensions.fsh", "FSH · Belgian extensions"],
  ["be-interhub-capabilities.fsh", "FSH · Capabilities"],
  ["be-interhub-codesystems.fsh", "FSH · Terminology"],
  ["telemonitoring-diagnosticreport.fsh", "FSH · Telemonitoring"],
  ["telemonitoring-mapping-example.fsh", "FSH · Telemonitoring example"],
  ["be-interhub-examples.fsh", "FSH · Examples"],
  ["aliases.fsh", "FSH · Aliases"],
];
function guidePage() {
  return `<div class="guide-layout"><section class="panel guide-nav">${guides.map(([f, t]) => btn(t, "guide-file", state.igFile === f ? "active" : "", `data-value="${f}"`)).join("")}</section><section class="panel guide-reader"><div class="panel-heading"><h2>${esc(guides.find((x) => x[0] === state.igFile)?.[1])}</h2><a class="btn" href="/ig/${esc(state.igFile)}" target="_blank" rel="noreferrer">Open source ${icon("arrow")}</a></div><p class="source-note">Read-only snapshot of the supplied specification · Markdown / FSH source</p><input id="guide-search" placeholder="Find in this source…" aria-label="Find in guide source"><pre id="guide-source" class="guide-source" tabindex="0">${esc(state.igText || "Loading source…")}</pre></section></div>`;
}
function settingsPage() {
  const s = state.settings;
  return `<div class="two-column"><section class="panel padded"><div class="section-label">CONNECTION</div><h2>Your FHIR endpoint</h2><form id="settings-form">${select(
    "Environment",
    "mode",
    [
      ["demo", "Offline demo · bundled simulator fixtures"],
      ["live", "Live · configured FHIR server"],
    ],
    s.mode,
  )}${field("FHIR base URL", "base", s.base, "url", "required")}${select(
    "HTTP transport",
    "transport",
    [
      ["proxy", "Local proxy · avoids browser CORS"],
      ["direct", "Direct browser fetch · server must allow CORS"],
    ],
    s.transport,
  )}<div class="form-grid two">${field("Request timeout (milliseconds)", "timeout", s.timeout, "number", 'min="1000" max="120000"')}${select(
    "Appearance",
    "theme",
    [
      ["light", "Light"],
      ["dark", "Dark"],
    ],
    s.theme,
  )}</div><label class="toggle-row"><input type="checkbox" name="strictSsin" ${s.strictSsin ? "checked" : ""}><span><b>Strict SSIN checksum</b><small>Validate modulo-97, including the post-2000 rule. Demo patients use synthetic identifiers.</small></span></label><label class="toggle-row"><input type="checkbox" name="partial" ${s.partial ? "checked" : ""}><span><b>Simulate partial failure</b><small>Sends X-Simulate-Partial-Failure: true and exposes downstream OperationOutcome issues.</small></span></label>${area("Additional request headers (JSON object)", "headers", s.headers, 'rows="5" placeholder=\'{"X-Correlation-ID": "developer-session"}\'')}<p class="muted">Custom headers stay in memory and are excluded from saved/exported preferences. Use Authentication for tokens and proof headers.</p><button class="btn primary">Save connection</button></form></section><div><section class="panel padded"><div class="section-label">WORKSPACE</div><h2>Portable preferences</h2><p class="muted">Export or import endpoint and display settings. Tokens, signing keys, custom headers, SSINs, documents, and traffic are excluded.</p><div class="button-row">${btn(icon("down") + " Export settings", "export-settings")}${btn(icon("upload") + " Import settings", "import-settings")}</div></section><section class="panel padded"><h2>Connect to the Java simulator</h2><ol class="instructions"><li>Start your existing simulator on port 8080.</li><li>Select <b>Live</b> with base <code>http://localhost:8080/fhir</code>.</li><li>Use the <b>Local proxy</b> transport, save, then discover the server’s capabilities.</li></ol>${btn(icon("network") + " Test connection", "test-connection", "primary")}<p class="muted">Proxy origins default to localhost:8080 and 127.0.0.1:8080. For another hub or token server, set <code>PROXY_ALLOWED_ORIGINS</code> on this viewer’s Node process.</p></section><section class="panel padded"><h2>Session controls</h2><p class="muted">Clear patient documents, traffic, authentication, and saved preferences.</p>${btn("Reset workspace", "reset", "danger")}</section></div></div>`;
}
function persist() {
  const { headers, ...preferences } = state.settings;
  localStorage.setItem("interhub-settings", JSON.stringify(preferences));
}
function download(name, content, type = "application/json") {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([typeof content === "string" ? content : pretty(content)], {
          type,
        });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function retrieve(pdf = false) {
  const selected = state.selected;
  if (!selected) throw Error("Select a document first.");
  const data = await request("DocumentReference/$retrieve-document", {
    method: "POST",
    body: retrieveBody("DocumentReference/" + selected.id),
    accept: pdf ? "application/pdf" : "application/fhir+json; fhirVersion=4.0",
  });
  if (state.selected !== selected) return;
  clearPayload();
  if (data instanceof Blob) {
    if (data.type !== "application/pdf")
      throw Error(
        "Encrypted or unsupported binary content; inspect the HTTP response.",
      );
    state.pdf = URL.createObjectURL(data);
  } else if (
    pdf &&
    data.resourceType === "Binary" &&
    data.contentType === "application/pdf" &&
    data.data
  ) {
    state.pdf = URL.createObjectURL(
      new Blob([Uint8Array.from(atob(data.data), (c) => c.charCodeAt(0))], {
        type: "application/pdf",
      }),
    );
  } else state.payload = data;
  state.detailTab = "payload";
}
function applySettings(input) {
  const s = { ...state.settings, ...input };
  const base = new URL(s.base);
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  )
    throw Error(
      "Use an HTTP(S) base URL without credentials, query, or fragment.",
    );
  if (
    !["demo", "live"].includes(s.mode) ||
    !["proxy", "direct"].includes(s.transport) ||
    !["light", "dark"].includes(s.theme)
  )
    throw Error("Invalid connection options.");
  if (Number(s.timeout) < 1000 || Number(s.timeout) > 120000)
    throw Error("Timeout must be 1000–120000 ms.");
  const headers = JSON.parse(s.headers || "{}");
  if (
    !headers ||
    Array.isArray(headers) ||
    typeof headers !== "object" ||
    Object.values(headers).some((v) => typeof v !== "string")
  )
    throw Error("Headers must be a JSON object of strings.");
  for (const key of Object.keys(headers))
    if (/authorization|dpop|signature|content-digest|cookie|host/i.test(key))
      throw Error(
        "Configure authorization and proof headers in Authentication.",
      );
  new Headers(headers);
  s.base = base.href.replace(/\/$/, "");
  state.settings = s;
  persist();
}
function wireForms() {
  $("#search-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    state.query = Object.fromEntries(new FormData(e.target));
    run(() => search());
  });
  $("#local-filter")?.addEventListener("input", (e) => {
    state.localFilter = e.target.value;
    $("#document-rows").innerHTML = documentRows();
  });
  $("#console-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    state.console = Object.fromEntries(new FormData(e.target));
    run(async () => {
      const c = state.console;
      await request(c.path, {
        method: c.method,
        body: c.method === "POST" ? c.body : undefined,
        accept: c.accept,
        contentType: c.contentType,
      });
    });
  });
  $("#auth-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try {
      const jwk = f.jwk.trim() ? JSON.parse(f.jwk) : null;
      if (
        jwk &&
        (!jwk.d ||
          !["EC", "RSA"].includes(jwk.kty) ||
          (jwk.kty === "EC" && jwk.crv !== "P-256"))
      )
        throw Error("Use a private EC P-256 or RSA JWK.");
      Object.assign(state.auth, {
        token: f.token.trim(),
        proof: f.proof,
        nonce: f.nonce,
        keyId: f.keyId,
        jwk,
      });
      render();
      notify("Authentication applied to this session.");
    } catch (e) {
      notify(e.message);
    }
  });
  if ($("#thumbprint"))
    thumbprint(state.auth.jwk)
      .then((t) => {
        if ($("#thumbprint")) $("#thumbprint").textContent = t;
      })
      .catch((e) => notify(e.message));
  $("#token-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    Object.assign(state.settings, {
      tokenEndpoint: f.tokenEndpoint,
      clientId: f.clientId,
      scope: f.scope,
      audience: f.audience,
      grant: f.grant,
    });
    Object.assign(state.auth, {
      clientSecret: f.clientSecret,
      assertion: f.assertion,
    });
    run(async () => {
      const url = new URL(f.tokenEndpoint);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw Error("Invalid token endpoint URL.");
      const req = await tokenRequest(state.settings, state.auth);
      const response = await transport(
        req,
        state.settings,
        AbortSignal.timeout(Number(state.settings.timeout)),
      );
      if (response.headers.get("dpop-nonce"))
        state.auth.nonce = response.headers.get("dpop-nonce");
      const data = await response.json();
      if (!response.ok || !data.access_token)
        throw Error(
          data.error_description ||
            data.error ||
            "Token endpoint returned no access_token.",
        );
      state.auth.token = data.access_token;
      notify(
        "Access token acquired. Token responses are not recorded in traffic.",
      );
    });
  });
  $("#settings-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try {
      applySettings({
        ...f,
        strictSsin: !!f.strictSsin,
        partial: !!f.partial,
        timeout: Number(f.timeout),
      });
      state.documents = [];
      state.issues = [];
      state.searchBundle = null;
      state.selected = null;
      state.capability = null;
      clearPayload();
      render();
      notify("Connection saved. Run a new search for this environment.");
    } catch (e) {
      notify(e.message);
    }
  });
  $("#guide-search")?.addEventListener("input", (e) => {
    const term = e.target.value;
    if (!term) {
      $("#guide-source").textContent = state.igText;
      return;
    }
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    $("#guide-source").innerHTML = state.igText
      .split(new RegExp("(" + escaped + ")", "gi"))
      .map((t) =>
        t.toLowerCase() === term.toLowerCase()
          ? `<mark>${esc(t)}</mark>`
          : esc(t),
      )
      .join("");
    $("#guide-source mark")?.scrollIntoView({ block: "center" });
  });
  $("#import-file")?.addEventListener("change", (e) =>
    importResource(e.target.files[0]),
  );
  $("#config-file")?.addEventListener("change", async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      const data = JSON.parse(await file.text());
      const allowed = Object.fromEntries(
        Object.entries(data).filter(
          ([key]) => key in defaults && key !== "headers",
        ),
      );
      applySettings(allowed);
      state.documents = [];
      state.selected = null;
      state.issues = [];
      state.searchBundle = null;
      state.capability = null;
      clearPayload();
      render();
      notify("Settings imported.");
    } catch (e) {
      notify(e.message);
    }
  });
}
async function importResource(file) {
  if (!file) return;
  try {
    if (file.size > 10_000_000) throw Error("Import limit is 10 MB.");
    const r = JSON.parse(await file.text());
    if (r.resourceType === "DocumentReference") {
      state.documents = [r];
      if (r.subject?.identifier?.value)
        state.query.patient = r.subject.identifier.value;
      state.searchBundle = null;
      state.issues = [];
      selectDoc(r.id);
    } else if (r.resourceType === "Bundle" && r.type === "searchset") {
      const split = splitSearch(r);
      state.documents = split.documents;
      state.issues = split.issues;
      state.searchBundle = r;
      if (state.documents[0]?.subject?.identifier?.value)
        state.query.patient = state.documents[0].subject.identifier.value;
      selectDoc(state.documents[0]?.id);
    } else if (r.resourceType === "Bundle" && r.type === "document") {
      clearPayload();
      state.payload = r;
      state.documents = [];
      state.issues = [];
      state.searchBundle = null;
      const comp = r.entry?.[0]?.resource;
      state.selected = {
        resourceType: "DocumentReference",
        id: "imported-document",
        description: comp?.title || "Imported document Bundle",
        status: "current",
        _viewerImportedBundle: true,
      };
      state.detailTab = "payload";
    } else
      throw Error(
        "Import a DocumentReference, searchset Bundle, or document Bundle.",
      );
    state.page = "documents";
    render();
    notify("Imported into this session. Nothing was published.");
  } catch (e) {
    notify(e.message);
  }
}
async function loadGuide() {
  const r = await fetch("/ig/" + state.igFile);
  if (!r.ok) throw Error("Guide source could not be loaded.");
  state.igText = await r.text();
}
function preset(p) {
  const c = {
    ...state.console,
    method: "POST",
    contentType: "application/fhir+json",
    accept: "application/fhir+json; fhirVersion=4.0",
  };
  if (p === "metadata") {
    c.method = "GET";
    c.path = "metadata";
    c.body = "";
  } else if (p === "search") {
    c.path = "DocumentReference/_search";
    c.contentType = "application/x-www-form-urlencoded";
    c.body = searchParams(state.query).toString();
  } else {
    c.path = "DocumentReference/$retrieve-document";
    c.body = pretty(
      retrieveBody(
        "DocumentReference/" +
          (p === "withdrawn"
            ? "withdrawn"
            : p === "missing"
              ? "non-existent-document"
              : state.selected?.id || "DocRefLabReportContainedExample"),
      ),
    );
  }
  state.console = c;
  render();
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const a = b.dataset.action,
    v = b.dataset.value;
  if (state.busy && !pages[a] && !["dismiss-error", "log-tab"].includes(a))
    return;
  if (pages[a]) {
    location.hash = a;
    return;
  }
  switch (a) {
    case "theme":
      state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
      persist();
      render();
      break;
    case "dismiss-error":
      state.error = "";
      render();
      break;
    case "select-document":
      selectDoc(b.dataset.id);
      render();
      break;
    case "open-document":
      selectDoc(b.dataset.id);
      location.hash = "documents";
      break;
    case "category":
      state.category = v;
      render();
      break;
    case "list-view":
      state.view = "list";
      render();
      break;
    case "timeline-view":
      state.view = "timeline";
      render();
      break;
    case "detail-tab":
      state.detailTab = v;
      render();
      break;
    case "retrieve":
      run(() => retrieve());
      break;
    case "pdf":
      run(() => retrieve(true));
      break;
    case "download-pdf": {
      const a = document.createElement("a");
      a.href = state.pdf;
      a.download = (state.selected?.id || "document") + ".pdf";
      a.click();
      break;
    }
    case "export-document":
      download(
        (state.selected?.id || "document") + ".json",
        state.payload || state.selected,
      );
      break;
    case "next":
      run(() =>
        search(state.searchBundle.link.find((l) => l.relation === "next").url),
      );
      break;
    case "import":
      $("#import-file").click();
      break;
    case "preset":
      try {
        preset(v);
      } catch (e) {
        notify(e.message);
      }
      break;
    case "select-log":
      state.logIndex = Number(v);
      render();
      break;
    case "log-tab":
      state.logTab = v;
      render();
      break;
    case "clear-logs":
      state.logs = [];
      state.logIndex = 0;
      render();
      break;
    case "copy-curl":
      navigator.clipboard
        .writeText(curlCommand(state.logs[state.logIndex]))
        .then(() => notify("cURL copied; sensitive headers are redacted."))
        .catch(() =>
          notify("Clipboard unavailable. Open the cURL tab to copy manually."),
        );
      break;
    case "export-trace": {
      const l = state.logs[state.logIndex];
      download("interhub-trace.json", {
        ...l,
        data: l.data instanceof Blob ? l.raw : l.data,
      });
      notify("Trace exported; it includes request and response patient data.");
      break;
    }
    case "generate-key":
      run(async () => {
        state.auth.jwk = await generateKey();
        notify(
          "New P-256 signing key generated. Acquire a token bound to this key for DPoP.",
        );
      });
      break;
    case "clear-auth":
      state.auth = {
        token: "",
        proof: "none",
        nonce: "",
        jwk: null,
        keyId: "",
        clientSecret: "",
        assertion: "",
      };
      render();
      notify("Session credentials cleared.");
      break;
    case "capabilities":
      run(async () => {
        state.capability = await request("metadata");
        if (state.capability?.resourceType !== "CapabilityStatement")
          throw Error("Response is not a CapabilityStatement.");
      });
      break;
    case "test-connection":
      run(async () => {
        state.capability = await request("metadata");
        if (state.capability?.resourceType !== "CapabilityStatement")
          throw Error("Response is not a CapabilityStatement.");
        notify("Responder reached · FHIR " + state.capability.fhirVersion);
      });
      break;
    case "guide-file":
      state.igFile = v;
      state.igText = "";
      run(loadGuide);
      break;
    case "export-settings": {
      const { headers, ...settings } = state.settings;
      download("interhub-settings.json", settings);
      break;
    }
    case "import-settings":
      $("#config-file").click();
      break;
    case "reset":
      localStorage.removeItem("interhub-settings");
      location.reload();
      break;
  }
});
window.addEventListener("hashchange", () => {
  state.page = pages[location.hash.slice(1)]
    ? location.hash.slice(1)
    : "documents";
  render();
  if (state.page === "guide" && !state.igText) run(loadGuide);
});
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    location.hash = "documents";
    setTimeout(() => $("#local-filter")?.focus(), 0);
  }
});
state.page = pages[location.hash.slice(1)]
  ? location.hash.slice(1)
  : "documents";
render();
if (state.settings.mode === "demo")
  run(async () => {
    await search();
    if (state.page === "guide") await loadGuide();
  });
else if (state.page === "guide") run(loadGuide);
