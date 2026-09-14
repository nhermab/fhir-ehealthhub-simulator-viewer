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
  observationSearchParams,
  retrieveBody,
  splitSearch,
  validateResource,
  curlCommand,
  validateSsin,
} from "./fhir.js";
import { defaults, requestFHIR, transport } from "./client.js";
import { generateKey, thumbprint, decodeJwt, tokenRequest } from "./auth.js";
import {
  codePythonPage,
  codeJavascriptPage,
  codeJavaPage,
  codeCsharpPage,
  codeCurlPage,
} from "./code-examples.js";
import {
  highlight,
  codeBlock,
  jsonTree,
  detectLanguage,
  countNodes,
} from "./highlight.js";
import { renderMarkdown, tableOfContents } from "./markdown.js";
import { diffHtml, jsonDiffHtml } from "./diff.js";
import { snippet, generators, toHar } from "./snippets.js";
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
  terminal: "m4 17 6-6-6-6m8 14h8",
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
  moon: "M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z",
  play: "M6 3l14 9-14 9z",
  diff: "M9 3v14M9 3 5 7m4-4 4 4M15 21V7m0 14 4-4m-4 4-4-4",
  keyboard: "M2 6h20v12H2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12",
  layers: "m12 2 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
  trash: "M4 6h16M9 6V4h6v2M6 6l1 15h10l1-15M10 11v6M14 11v6",
  filter: "M3 4h18l-7 8v7l-4 2v-9z",
  bolt: "m13 2-9 12h7l-1 8 9-12h-7z",
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
const jsonText = (x) => (typeof x === "string" ? x : pretty(x));
/** Compact, syntax-highlighted block. Pass an id for the full JSON viewer. */
const json = (x, id, options) =>
  id
    ? jsonView(x, id, options)
    : `<div class="json">${codeBlock(jsonText(x), typeof x === "string" ? detectLanguage(x) : "json")}</div>`;
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
  observationQuery: {
    patient: "79080412345",
    system: SSIN,
    code: "1558-6",
    category: "",
    from: "",
    to: "",
    searchtype: "federated",
    _sort: "-date",
    _count: "20",
  },
  observations: [],
  observationIssues: [],
  observationBundle: null,
  selectedObservation: null,
  observationDetailTab: "overview",
  observationLocalFilter: "",
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
  // JSON viewer state, keyed by viewer id, so re-renders keep their shape.
  jsonViews: {},
  jsonCollapsed: {},
  sort: "-date",
  group: "none",
  compare: [],
  snippetKind: "curl",
  logFilter: "",
  guideMode: "rendered",
  guideQuery: "",
  palette: { open: false, query: "", index: 0 },
  overlay: "",
  lastLatency: null,
};
state.console.body = searchParams(state.query).toString();
const pages = {
  documents: [
    "Document workspace",
    "Discover, inspect, and retrieve across the Belgian hub network.",
  ],
  observations: [
    "Laboratory observations",
    "Query discrete analyte time series (DIGIRELAB) across Belgian regional hubs.",
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
  "code-python": [
    "Python Quickstart & Code Examples",
    "Connect, discover, and retrieve Belgian FHIR documents using Python.",
  ],
  "code-javascript": [
    "JavaScript & Node.js Quickstart",
    "Connect, discover, and retrieve Belgian FHIR documents using JavaScript and Node.js.",
  ],
  "code-java": [
    "Java Quickstart & Code Examples",
    "Connect, discover, and retrieve Belgian FHIR documents using Java (HttpClient / HAPI FHIR).",
  ],
  "code-csharp": [
    "C# (.NET) Quickstart & Code Examples",
    "Connect, discover, and retrieve Belgian FHIR documents using C# and .NET HttpClient.",
  ],
  "code-curl": [
    "cURL & CLI Quickstart",
    "Raw HTTP requests for testing the Belgian Interhub backend from the command line.",
  ],
};
const media =
  typeof matchMedia === "function"
    ? matchMedia("(prefers-color-scheme: light)")
    : null;
/** The theme actually painted: "system" follows the operating system. */
function effectiveTheme() {
  const choice = state.settings.theme;
  if (choice === "light" || choice === "dark") return choice;
  return media?.matches ? "light" : "dark";
}
media?.addEventListener?.("change", () => {
  if (state.settings.theme === "system") render();
});

/** Raw text behind each rendered JSON viewer, for copy / download actions. */
const jsonSources = new Map();

function notify(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => $("#toast").classList.remove("show"), 3500);
}

/* ------------------------------------------------------------------ *
 * JSON viewer
 * ------------------------------------------------------------------ */

const tryParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};
const bytesLabel = (n) =>
  n < 1024
    ? `${n} B`
    : n < 1048576
      ? `${(n / 1024).toFixed(1)} kB`
      : `${(n / 1048576).toFixed(2)} MB`;

/**
 * A JSON payload with a collapsible tree, a highlighted raw view, in-place
 * filtering, path copying, and copy / download. `id` scopes the view state so
 * a full re-render keeps the mode, wrapping, and which nodes were collapsed.
 */
function jsonView(value, id, options = {}) {
  const view = (state.jsonViews[id] ||= { mode: "tree", wrap: false });
  const text = jsonText(value);
  const parsed = typeof value === "string" ? tryParse(text) : value;
  const treeable = parsed !== null && typeof parsed === "object";
  const lang =
    typeof value === "string"
      ? detectLanguage(text, options.contentType)
      : "json";
  const mode = treeable ? view.mode : "raw";
  jsonSources.set(id, text);
  const lines = text.split("\n").length;
  const nodes = treeable ? countNodes(parsed) : 0;
  const tool = (label, action, active, title) =>
    `<button type="button" class="jv-btn ${active ? "on" : ""}" data-action="${action}" data-value="${esc(id)}" title="${esc(title || label)}">${label}</button>`;
  return `<div class="jsonview" data-json-id="${esc(id)}">
    <div class="jv-bar">
      <div class="jv-modes">${treeable ? tool("Tree", "json-tree", mode === "tree", "Collapsible tree") + tool("Raw", "json-raw", mode === "raw", "Highlighted source") : `<span class="jv-static">${esc(lang)}</span>`}</div>
      ${treeable && mode === "tree" ? `<div class="jv-modes">${tool(icon("down") + " Expand", "json-expand", false, "Expand every node")}${tool(icon("chevron") + " Collapse", "json-collapse", false, "Collapse to the top level")}</div>` : ""}
      ${mode === "raw" ? `<div class="jv-modes">${tool("Wrap", "json-wrap", view.wrap, "Toggle line wrapping")}</div>` : ""}
      <div class="jv-filter">${icon("search")}<input data-json-filter="${esc(id)}" placeholder="Filter keys & values…" aria-label="Filter JSON" spellcheck="false"></div>
      <span class="jv-meta">${treeable ? `${nodes.toLocaleString()} nodes · ` : ""}${lines.toLocaleString()} lines · ${bytesLabel(new TextEncoder().encode(text).length)}</span>
      <div class="jv-modes">${tool(icon("copy"), "json-copy", false, "Copy to clipboard")}${tool(icon("down"), "json-download", false, "Download")}</div>
    </div>
    <div class="jv-body ${mode}">${
      mode === "tree"
        ? jsonTree(parsed, {
            collapsed: state.jsonCollapsed[id] || [],
            openDepth: options.openDepth ?? 2,
            root: options.root || "",
          })
        : codeBlock(text, lang, { lineNumbers: !view.wrap, wrap: view.wrap })
    }</div>
    <div class="jv-empty" hidden>No node matches this filter.</div>
  </div>`;
}

/** Hide tree nodes that do not match `term`, keeping ancestors visible. */
function filterJsonTree(host, term) {
  const needle = term.trim().toLowerCase();
  const nodes = [...host.querySelectorAll(".j-row, .j-node")];
  const empty = host.querySelector(".jv-empty");
  if (!needle) {
    nodes.forEach((n) => (n.hidden = false));
    if (empty) empty.hidden = true;
    return;
  }
  nodes.forEach((n) => (n.hidden = true));
  const matches = nodes.filter(
    (n) =>
      (n.dataset.text || "").includes(needle) ||
      (n.dataset.path || "").toLowerCase().includes(needle) ||
      (n.classList.contains("j-row") &&
        n.textContent.toLowerCase().includes(needle)),
  );
  for (const match of matches) {
    match.hidden = false;
    match
      .querySelectorAll?.(".j-row, .j-node")
      .forEach((c) => (c.hidden = false));
    let parent = match.parentElement?.closest(".j-node");
    while (parent) {
      parent.hidden = false;
      parent.open = true;
      parent = parent.parentElement?.closest(".j-node");
    }
  }
  if (empty) empty.hidden = matches.length > 0;
}

/** Textarea with a highlighted layer behind it and a line-number gutter. */
function codeEditor(name, value, lang, options = {}) {
  const { rows = 10, id = "editor-" + name, label = "" } = options;
  const lines = String(value ?? "").split("\n").length;
  return `${label ? `<div class="section-label">${esc(label)}</div>` : ""}<div class="editor" data-editor="${esc(id)}" data-lang="${esc(lang)}" style="--rows:${rows}">
    <div class="editor-gutter" aria-hidden="true">${Array.from({ length: lines }, (_, i) => i + 1).join("\n")}</div>
    <div class="editor-stack">
      <pre class="editor-view" aria-hidden="true"><code>${highlight(String(value ?? ""), lang)}</code></pre>
      <textarea class="editor-input" name="${esc(name)}" id="${esc(id)}" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off" aria-label="${esc(label || name)}">${esc(value)}</textarea>
    </div>
  </div>`;
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
      state.lastLatency = log.ms;
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
async function searchObservations(next) {
  const params = next
    ? new URL(next).searchParams
    : observationSearchParams(state.observationQuery, state.settings.strictSsin);
  const bundle = await request("Observation/_search", {
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    body: params.toString(),
  });
  const result = splitSearch(bundle);
  state.observations = result.observations;
  state.observationIssues = result.issues;
  state.observationBundle = bundle;
  state.selectedObservation = result.observations[0] || null;
}

/* ------------------------------------------------------------------ *
 * Command palette & shortcut help
 * ------------------------------------------------------------------ */

/** Everything the palette can run, grouped for display. */
function commands() {
  const list = Object.entries(pages).map(([id, [label, hint]]) => ({
    group: "Navigate",
    label,
    hint,
    action: id,
  }));
  list.push(
    {
      group: "Action",
      label: "Run document search",
      hint: "ITI-67 discovery on the current criteria",
      action: "run-search",
    },
    {
      group: "Action",
      label: "Retrieve selected document",
      hint: "$retrieve-document as a FHIR Bundle",
      action: "retrieve",
    },
    {
      group: "Action",
      label: "Retrieve selected document as PDF",
      hint: "Accept: application/pdf",
      action: "pdf",
    },
    {
      group: "Action",
      label: "Next result page",
      hint: "Replay the opaque _continuation token",
      action: "next",
    },
    {
      group: "Action",
      label: "Fetch responder capabilities",
      hint: "GET /metadata",
      action: "capabilities",
    },
    {
      group: "Action",
      label: "Import a FHIR resource",
      hint: "DocumentReference, searchset, or document Bundle",
      action: "import",
    },
    {
      group: "Action",
      label: "Compare the two pinned documents",
      hint: "Structural and line diff",
      action: "compare-open",
    },
    {
      group: "Console",
      label: "Console preset · ITI-67 search",
      action: "preset",
      value: "search",
    },
    {
      group: "Console",
      label: "Console preset · ITI-68 retrieve",
      action: "preset",
      value: "retrieve",
    },
    {
      group: "Console",
      label: "Console preset · capabilities",
      action: "preset",
      value: "metadata",
    },
    {
      group: "Console",
      label: "Console preset · 410 Gone",
      action: "preset",
      value: "withdrawn",
    },
    {
      group: "Console",
      label: "Console preset · 404 Not found",
      action: "preset",
      value: "missing",
    },
    {
      group: "Console",
      label: "Export session traffic as HAR",
      hint: "Open in browser devtools or Postman",
      action: "export-har",
    },
    { group: "Console", label: "Clear session traffic", action: "clear-logs" },
    {
      group: "Theme",
      label: "Use the dark theme",
      action: "theme-set",
      value: "dark",
    },
    {
      group: "Theme",
      label: "Use the light theme",
      action: "theme-set",
      value: "light",
    },
    {
      group: "Theme",
      label: "Follow the system theme",
      action: "theme-set",
      value: "system",
    },
    {
      group: "Session",
      label: "Generate a P-256 signing key",
      action: "generate-key",
    },
    {
      group: "Session",
      label: "Clear session credentials",
      action: "clear-auth",
    },
    { group: "Session", label: "Export settings", action: "export-settings" },
    { group: "Session", label: "Keyboard shortcuts", action: "shortcuts" },
    { group: "Session", label: "Reset the workspace", action: "reset" },
  );
  for (const [file, label] of guides)
    list.push({
      group: "Guide",
      label,
      hint: file,
      action: "guide-file",
      value: file,
    });
  for (const d of state.documents)
    list.push({
      group: "Document",
      label: title(d),
      hint: `${d.id} · ${date(d.date)}`,
      action: "open-document",
      id: d.id,
    });
  return list;
}

/** Subsequence match with a light bias towards prefix and word starts. */
function score(label, query) {
  if (!query) return 1;
  const haystack = label.toLowerCase();
  const needle = query.toLowerCase();
  if (haystack.includes(needle)) return 1000 - haystack.indexOf(needle);
  let index = -1,
    points = 0;
  for (const char of needle) {
    index = haystack.indexOf(char, index + 1);
    if (index === -1) return 0;
    points += index === 0 || haystack[index - 1] === " " ? 3 : 1;
  }
  return points;
}

let paletteMatches = [];
function paletteItems(query) {
  const ranked = commands()
    .map((c) => ({ ...c, score: score(`${c.label} ${c.hint || ""}`, query) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 40);
  // Keep each group together, ordered by its best-scoring member.
  const order = [...new Set(ranked.map((c) => c.group))];
  paletteMatches = ranked.sort(
    (a, b) =>
      order.indexOf(a.group) - order.indexOf(b.group) || b.score - a.score,
  );
  if (state.palette.index >= paletteMatches.length) state.palette.index = 0;
  if (!paletteMatches.length)
    return '<div class="palette-empty">Nothing matches that.</div>';
  let group = "";
  return paletteMatches
    .map((c, i) => {
      const heading =
        c.group !== group
          ? `<div class="palette-group">${esc((group = c.group))}</div>`
          : "";
      return `${heading}<button type="button" class="palette-item ${i === state.palette.index ? "active" : ""}" data-action="palette-run" data-value="${i}"><span class="palette-label">${esc(c.label)}</span>${c.hint ? `<span class="palette-hint">${esc(c.hint)}</span>` : ""}</button>`;
    })
    .join("");
}

function paletteOverlay() {
  if (!state.palette.open) return "";
  return `<div class="overlay" data-action="close-overlay"><div class="palette" role="dialog" aria-modal="true" aria-label="Command palette" data-stop><div class="palette-input">${icon("search")}<input id="palette-input" placeholder="Jump to a page, run a transaction, open a guide…" aria-label="Command palette search" autocomplete="off" spellcheck="false" value="${esc(state.palette.query)}"><kbd>esc</kbd></div><div class="palette-list" id="palette-list">${paletteItems(state.palette.query)}</div><div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> run</span><span><kbd>?</kbd> shortcuts</span></div></div></div>`;
}

const shortcuts = [
  ["Ctrl / ⌘ K", "Open the command palette"],
  ["/", "Filter the returned documents"],
  ["?", "This shortcut list"],
  ["g then d", "Documents"],
  ["g then c", "FHIR console"],
  ["g then i", "Implementation guide"],
  ["j / k", "Select the next / previous document"],
  ["Enter", "Retrieve the selected document"],
  ["Ctrl / ⌘ ↵", "Send the console request"],
  ["Ctrl / ⌘ S", "Format the console request body"],
  ["t", "Cycle dark, light, and system themes"],
  ["Esc", "Close the palette or this overlay"],
];

function shortcutsOverlay() {
  if (state.overlay !== "shortcuts") return "";
  return `<div class="overlay" data-action="close-overlay"><div class="palette shortcut-card" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" data-stop><div class="panel-heading"><h2>${icon("keyboard")} Keyboard shortcuts</h2>${btn(icon("close"), "close-overlay", "icon-btn", 'aria-label="Close"')}</div><dl class="shortcut-grid">${shortcuts
    .map(
      ([keys, what]) =>
        `<div><dt>${keys
          .split(" ")
          .map((k) =>
            ["then", "/"].includes(k)
              ? `<span>${esc(k)}</span>`
              : `<kbd>${esc(k)}</kbd>`,
          )
          .join(" ")}</dt><dd>${esc(what)}</dd></div>`,
    )
    .join(
      "",
    )}</dl><p class="muted">Shortcuts are ignored while you are typing in a field.</p></div></div>`;
}

function render() {
  const theme = effectiveTheme();
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#0b1412" : "#102b29");
  document.title = `${pages[state.page][0]} · Interhub`;
  $("#app").innerHTML =
    `<aside class="sidebar"><a class="brand" href="#documents"><span class="brandmark">${icon("grid")}</span><span>interhub<span class="brand-sub">BELGIAN eHEALTH</span></span></a><div class="workspace-label">WORKSPACE</div><nav aria-label="Main navigation">${[
      ["documents", "file", "Documents"],
      ["observations", "lab", "Observations"],
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
      .join("")}<div class="workspace-label secondary">CODE STARTERS</div>${[
      ["code-python", "code", "Python"],
      ["code-javascript", "code", "JavaScript / Node"],
      ["code-java", "code", "Java"],
      ["code-csharp", "code", "C# (.NET)"],
      ["code-curl", "terminal", "cURL / CLI"],
    ]
      .map(([id, i, t]) => nav(id, i, t))
      .join(
        "",
      )}</nav><div class="sidebar-bottom"><div class="network-tile"><span class="status-dot"></span><b>${state.settings.mode === "demo" ? "Offline demo" : "Live connection"}</b><p>${state.settings.mode === "demo" ? "Belgian IG sample fixtures" : esc(new URL(state.settings.base).host)}</p>${badge("FHIR R4", "dark-badge")}${badge("MHD", "dark-badge")}</div><div class="user"><span class="avatar">DE</span><div><b>Developer workspace</b><small>Local session · ${state.auth.token ? "Token loaded" : "No token"}</small></div></div></div></aside><div class="shell"><header class="topbar"><div class="breadcrumb">Workspace ${icon("chevron")} <b>${pages[state.page][0]}</b></div><div class="top-actions">${btn(`${icon("search")}<span>Search or jump to…</span><kbd aria-hidden="true">${navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"} K</kbd>`, "palette", "palette-trigger", 'aria-label="Search or jump to"')}${badge("IG 0.2.0", "neutral")}${btn(icon(state.settings.theme === "system" ? "globe" : state.settings.theme === "dark" ? "moon" : "sun"), "theme", "icon-btn", `aria-label="Colour theme: ${state.settings.theme}. Click to change." title="Theme: ${state.settings.theme}"`)}${btn(icon("keyboard"), "shortcuts", "icon-btn", 'aria-label="Keyboard shortcuts" title="Keyboard shortcuts"')}<span class="env"><span class="status-dot"></span>${state.settings.mode === "demo" ? "Demo environment" : "Live environment"}</span>${btn(icon("settings"), "settings", "icon-btn", 'aria-label="Connection settings"')}</div></header><main id="main" tabindex="-1"><div class="page-head"><div><div class="eyebrow">BELGIAN FEDERATED HEALTH NETWORK</div><h1>${pages[state.page][0]}</h1><p>${pages[state.page][1]}</p></div><div class="head-actions">${state.page === "documents" ? btn(icon("upload") + " Import FHIR", "import") + btn(icon("globe") + " Connection", "settings", "primary") : badge(state.settings.mode === "demo" ? "SYNTHETIC DATA" : "LIVE DATA", state.settings.mode === "demo" ? "neutral" : "warning")}</div></div>${state.error ? `<div class="notice error" role="alert">${icon("alert")}<span>${esc(state.error)}</span>${btn(icon("close"), "dismiss-error", "icon-btn", 'aria-label="Dismiss error"')}</div>` : ""}${state.busy ? '<div class="loading-line" role="status" aria-label="Working"></div>' : ""}${{
      documents: documentsPage,
      observations: observationsPage,
      timeline: timelinePage,
      console: consolePage,
      auth: authPage,
      conformance: conformancePage,
      guide: guidePage,
      settings: settingsPage,
      "code-python": () => codePythonPage(state),
      "code-javascript": () => codeJavascriptPage(state),
      "code-java": () => codeJavaPage(state),
      "code-csharp": () => codeCsharpPage(state),
      "code-curl": () => codeCurlPage(state),
    }[
      state.page
    ]()}</main><footer><span><span class="status-dot"></span> ${state.settings.mode === "demo" ? "Fixture transport · no backend required" : "Live transport · " + esc(state.settings.transport)}${state.lastLatency != null ? ` <span class="footer-sep">/</span> last response ${state.lastLatency} ms` : ""}</span><span>Belgian Interhub <span class="footer-sep">/</span> IHE MHD <span class="footer-sep">/</span> HL7 FHIR R4</span></footer></div><input type="file" id="import-file" accept="application/json,.json" hidden><input type="file" id="config-file" accept="application/json,.json" hidden>${paletteOverlay()}${shortcutsOverlay()}`;
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
  )}${field("Results per page", "_count", state.query._count, "number", 'min="1" max="100"')}</div></details></form></section>${state.issues.length ? `<div class="notice warning">${icon("alert")}<div><b>Some sources could not be reached</b><p>These results are incomplete. Available documents remain accessible.</p>${state.issues.map((i) => `<small>${esc(i.details?.coding?.map((c) => c.code).join(", "))} ${esc(i.diagnostics || i.details?.text || i.code)}</small>`).join("")}</div></div>` : ""}<div class="documents-layout"><section class="document-list panel"><div class="panel-heading"><h2>Documents <span class="count">${count}</span></h2><div class="segmented">${btn(icon("file"), "list-view", state.view === "list" ? "selected" : "", 'aria-label="List view"')}${btn(icon("clock"), "timeline-view", state.view === "timeline" ? "selected" : "", 'aria-label="Timeline view"')}</div></div><div class="list-controls"><div class="filter-search">${icon("search")}<input id="local-filter" aria-label="Filter returned documents" placeholder="Filter these documents…" value="${esc(state.localFilter)}"></div>${facetChips()}</div><div class="list-controls arrange">${miniSelect(
    "Sort",
    "sort",
    [
      ["-date", "Newest first"],
      ["date", "Oldest first"],
      ["title", "Title A–Z"],
      ["type", "Clinical type"],
      ["status", "Status"],
    ],
    state.sort,
  )}${miniSelect(
    "Group",
    "group",
    [
      ["none", "No grouping"],
      ["category", "Category"],
      ["home", "Home community"],
      ["custodian", "Custodian"],
      ["status", "Status"],
      ["year", "Year"],
    ],
    state.group,
  )}${state.compare.length ? `<span class="compare-pins">${icon("diff")} ${state.compare.length}/2 pinned ${btn("Compare", "compare-open", "chip active", state.compare.length === 2 ? "" : "disabled")}${btn(icon("close"), "compare-clear", "icon-btn", 'aria-label="Clear pinned documents"')}</span>` : `<span class="muted small">Pin two documents to diff them</span>`}</div><div id="document-rows">${documentRows()}</div><div class="list-footer"><span>${count} on this page ${state.searchBundle?.total != null ? "· " + state.searchBundle.total + " total matches" : ""}</span>${state.searchBundle?.link?.some((l) => l.relation === "next") ? btn("Next page " + icon("arrow"), "next") : badge("POST · ITI-67", "neutral")}</div></section><section class="detail-panel panel">${detailPanel()}</section></div>`;
}
function stat(i, label, note, sub, cls) {
  return `<div class="stat"><div class="stat-top"><span>${label}</span><span class="stat-icon ${cls}">${icon(i)}</span></div><strong>${note}</strong><small>${sub}</small></div>`;
}
/** Small inline label + select used by the list arrangement controls. */
function miniSelect(label, action, options, current) {
  return `<label class="mini-select"><span>${esc(label)}</span><select data-select="${action}">${options
    .map(
      ([v, t]) =>
        `<option value="${esc(v)}" ${v === current ? "selected" : ""}>${esc(t)}</option>`,
    )
    .join("")}</select></label>`;
}

/** Display names for the national CD-TRANSACTION document categories. */
const CATEGORY_LABELS = {
  sumehr: "Summary (Sumehr)",
  labresult: "Laboratory",
  discharge: "Discharge report",
  telemonitoring: "Telemonitoring",
  note: "Clinical note",
  referral: "Referral letter",
  prescription: "Prescription",
  radiology: "Radiology",
  vaccination: "Vaccination",
  dietetics: "Dietetics",
  paramedical: "Paramedical",
  nursing: "Nursing report",
};

/** Category chips with live counts, derived from the returned documents. */
function facetChips() {
  const counts = new Map();
  for (const d of state.documents)
    for (const category of d.category || [])
      for (const coding of category.coding || [])
        if (coding.code)
          counts.set(coding.code, (counts.get(coding.code) || 0) + 1);
  const minimal = state.documents.filter(isMinimal).length;
  const facets = [["", "All documents", state.documents.length]];
  for (const [code, n] of [...counts].sort((a, b) => b[1] - a[1]))
    facets.push([code, CATEGORY_LABELS[code] || code, n]);
  if (minimal) facets.push(["minimal", "Minimal profile", minimal]);
  return `<div class="chips">${facets
    .map(([k, label, n]) =>
      btn(
        `${esc(label)}<span class="chip-count">${n}</span>`,
        "category",
        state.category === k ? "chip active" : "chip",
        `data-value="${esc(k)}"`,
      ),
    )
    .join("")}</div>`;
}

const sortKey = (d, key) =>
  key === "title"
    ? title(d)
    : key === "status"
      ? d.status || ""
      : key === "type"
        ? codeText(d.type)
        : d.date || "";

/** Documents after the category facet, the text filter, and the sort order. */
function visibleDocuments() {
  const term = state.localFilter.toLowerCase();
  const list = state.documents.filter(
    (d) =>
      (!state.category ||
        (state.category === "minimal"
          ? isMinimal(d)
          : d.category?.some((c) =>
              c.coding?.some((coding) => coding.code === state.category),
            ))) &&
      (!term || pretty(d).toLowerCase().includes(term)),
  );
  const descending = state.sort.startsWith("-");
  const key = descending ? state.sort.slice(1) : state.sort;
  return list.sort(
    (a, b) =>
      (descending ? -1 : 1) *
      String(sortKey(a, key)).localeCompare(String(sortKey(b, key)), "en", {
        numeric: true,
      }),
  );
}

function groupLabel(d) {
  switch (state.group) {
    case "category":
      return (
        d.category?.map(codeText).filter(Boolean).join(", ") || "Uncategorised"
      );
    case "home": {
      const home = value(extension(d, "home-community-id"));
      return (
        (typeof home === "object" ? home?.value || home?.system : home) ||
        "No home community"
      );
    }
    case "custodian":
      return referenceText(d.custodian, d) || "Unknown custodian";
    case "status":
      return d.status || "unknown";
    case "year":
      return (d.date || "").slice(0, 4) || "Undated";
    default:
      return "";
  }
}

function documentRow(d) {
  const tele = d.category?.some((c) =>
    c.coding?.some((x) => x.code === "telemonitoring"),
  );
  const active = d.id === state.selected?.id;
  const pinned = state.compare.includes(d.id);
  return `<div class="doc-row-wrap ${pinned ? "pinned" : ""}"><button class="doc-row ${active ? "selected" : ""} ${state.view === "timeline" ? "timeline-row" : ""}" data-action="select-document" data-id="${esc(d.id)}"><span class="doc-icon ${tele ? "purple" : "mint"}">${icon(tele ? "heart" : isMinimal(d) ? "file" : "lab")}</span><span class="doc-body"><span class="doc-title">${esc(title(d))}</span><span class="doc-description">${esc(codeText(d.type))}</span><span class="doc-meta">${esc(referenceText(d.custodian, d))} <span>·</span> ${date(d.date)}</span><span class="doc-badges">${badge(d.status)}${badge(isMinimal(d) ? "Minimal" : "Comprehensive", "neutral")}${badge(d.content?.[0]?.attachment?.language || "No language", "neutral")}${d.relatesTo?.length ? badge(d.relatesTo.map((r) => r.code).join(", "), "warning") : ""}</span></span>${icon("chevron")}</button><button type="button" class="doc-pin ${pinned ? "on" : ""}" data-action="compare-toggle" data-id="${esc(d.id)}" title="${pinned ? "Unpin from compare" : "Pin for compare"}" aria-label="${pinned ? "Unpin from compare" : "Pin for compare"}" aria-pressed="${pinned}">${icon("diff")}</button></div>`;
}

function documentRows() {
  const list = visibleDocuments();
  if (!list.length)
    return `<div class="empty">${icon("search")}<h3>No documents to show</h3><p>${state.documents.length ? "Try another filter." : "Enter a patient SSIN and run a search."}</p></div>`;
  if (state.group === "none") return list.map(documentRow).join("");
  const groups = new Map();
  for (const d of list) {
    const label = groupLabel(d);
    groups.set(label, [...(groups.get(label) || []), d]);
  }
  return [...groups]
    .map(
      ([label, docs]) =>
        `<div class="doc-group"><div class="doc-group-head">${icon("layers")}<b>${esc(label)}</b><span class="count">${docs.length}</span></div>${docs.map(documentRow).join("")}</div>`,
    )
    .join("");
}
function detailPanel() {
  const d = state.selected;
  if (!d)
    return `<div class="empty">${icon("file")}<h3>A closer look</h3><p>Select a document to inspect its Belgian metadata and retrieve the clinical payload.</p></div>`;
  const tabs = [
    ["overview", "Overview"],
    ["payload", "Clinical"],
    ["metadata", "Metadata"],
    ["json", "JSON"],
    ["validation", "Checks"],
  ];
  if (state.compare.length === 2) tabs.push(["compare", "Compare"]);
  const tab = tabs.some(([k]) => k === state.detailTab)
    ? state.detailTab
    : "overview";
  const views = {
    overview,
    metadata,
    payload: clinical,
    json: () =>
      `${state.payload ? `<div class="section-label">RETRIEVED PAYLOAD</div>${json(state.payload, "payload-" + d.id)}<div class="section-label">DOCUMENT REFERENCE</div>` : ""}${json(d, "docref-" + d.id)}`,
    validation: () => checksView(state.payload || d),
    compare: comparePanel,
  };
  return `<div class="detail-heading"><span class="overline">DOCUMENT INSPECTOR</span><div>${btn(icon("code"), "console-document", "icon-btn", 'aria-label="Open this retrieval in the FHIR console" title="Open in the FHIR console"')}${btn(icon("diff"), "compare-toggle", `icon-btn ${state.compare.includes(d.id) ? "on" : ""}`, `data-id="${esc(d.id)}" aria-label="Pin for compare" title="Pin for compare"`)}${btn(icon("down"), "export-document", "icon-btn", 'aria-label="Export selected document JSON"')}</div></div><div class="detail-title"><h2>${esc(title(d))}</h2><p>${esc(d.id)}</p>${badge(isMinimal(d) ? "MHD Minimal" : "MHD Comprehensive")}${badge("FHIR R4", "neutral")}</div><div class="tabs" role="tablist">${tabs
    .map(
      ([k, v]) =>
        `<button role="tab" aria-selected="${tab === k}" data-action="detail-tab" data-value="${k}" class="${tab === k ? "active" : ""}">${v}</button>`,
    )
    .join(
      "",
    )}</div><div class="detail-content">${views[tab](d)}</div><div class="retrieve-bar">${d._viewerImportedBundle ? '<span class="muted">Imported document Bundle · use the export button to save</span>' : btn(icon("down") + " Retrieve FHIR", "retrieve", "primary", state.busy ? "disabled" : "")}${d._viewerImportedBundle ? "" : btn("View PDF", "pdf", "", state.busy ? "disabled" : "")}</div>`;
}

/** Side-by-side comparison of the two pinned documents. */
function comparePanel() {
  const [left, right] = state.compare.map((id) =>
    state.documents.find((d) => d.id === id),
  );
  if (!left || !right)
    return `<div class="empty">${icon("diff")}<h3>Pin two documents</h3><p>Use the compare pin on two rows to diff their metadata.</p></div>`;
  return `<div class="compare-head"><div><span class="overline">LEFT</span><b>${esc(title(left))}</b><small>${esc(left.id)}</small></div>${icon("arrow")}<div><span class="overline">RIGHT</span><b>${esc(title(right))}</b><small>${esc(right.id)}</small></div></div><div class="section-label">STRUCTURAL DIFFERENCES</div>${jsonDiffHtml(left, right)}<div class="section-label">SOURCE DIFF</div>${diffHtml(pretty(left), pretty(right), "json")}`;
}
function overview(d) {
  const access = extension(d, "patient-access"),
    permission = value(access?.extension?.find((e) => e.url === "access")),
    home = value(extension(d, "home-community-id"));
  return `<div class="section-label">CLINICAL CONTEXT</div><dl class="kv-grid">${kv("Document type", codeText(d.type))}${kv("Category", d.category?.map(codeText).join(", "))}${kv("Created", date(d.content?.[0]?.attachment?.creation))}${kv("Clinical status", d.docStatus || d.status)}${kv("Practice setting", codeText(d.context?.practiceSetting))}${kv("Confidentiality", d.securityLabel?.map(codeText).join(", "))}</dl><div class="section-label">AUTHORING PARTIES</div><div class="parties">${(d.author || []).map((a) => `<div class="party"><span class="party-icon">${icon("file")}</span><div><b>${esc(referenceText(a, d))}</b><small>${esc(value(extension(a, "hcparty-type"))?.display || value(extension(a, "hcparty-type"))?.code || "Author")}</small></div></div>`).join("") || '<p class="muted">Authors are optional in the Minimal profile.</p>'}</div><div class="access-card">${icon("shield")}<div><b>Patient access: ${esc(permission || "not specified")}</b><p>${esc(access?.extension?.map((e) => e.url + ": " + value(e)).join(" · ") || "No patient access extension was supplied.")}</p></div></div>${extension(d, "end-to-end-encryption") ? '<div class="notice warning">Encrypted payload · ETK decryption requires an external recipient integration.</div>' : ""}<div class="section-label">HOME COMMUNITY</div><code class="wrap-code">${esc(typeof home === "object" ? pretty(home) : home || "Not supplied")}</code>${d.relatesTo?.length ? `<div class="section-label">DOCUMENT RELATIONSHIPS</div>${d.relatesTo.map((r) => `<div class="relation">${badge(r.code, "neutral")}<p>${esc(r.target?.display || r.target?.identifier?.value || r.target?.reference)}</p></div>`).join("")}` : ""}`;
}
function metadata(d) {
  return `<div class="section-label">BUSINESS IDENTIFIERS</div><dl>${kv("Master identifier", d.masterIdentifier?.value)}${kv("Identifier system", d.masterIdentifier?.system)}${(d.identifier || []).map((i) => kv(i.system, i.value)).join("")}</dl><div class="section-label">ATTACHMENT & CONTEXT</div>${json({ content: d.content, context: d.context }, "meta-content-" + d.id)}<div class="section-label">BELGIAN EXTENSIONS</div>${json(d.extension || [], "meta-ext-" + d.id)}<div class="section-label">CONTAINED RESOURCES</div>${(d.contained || []).map((r) => `<details class="resource"><summary>${esc(r.resourceType)} · ${esc(humanName(r))}</summary>${json(r)}</details>`).join("") || '<p class="muted">No contained resources.</p>'}<div class="section-label">ATTESTATION</div>${json({ authenticator: d.authenticator, custodian: d.custodian, relatesTo: d.relatesTo })}`;
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
function observationsPage() {
  const count = state.observations.length;
  return `<section class="patient-card"><div class="patient-avatar">${icon("lab")}</div><div class="patient-info"><div class="overline">PATIENT CONTEXT ${badge(state.settings.mode === "demo" ? "SYNTHETIC" : "SEARCH", "neutral")}</div><h2>Jan Peeters</h2><span>male · 04 Aug 1979 · SSIN 79080412345</span></div><div class="patient-id"><span>SSIN / INSS</span><code>${esc(state.observationQuery.patient)}</code></div><div class="patient-id"><span>LOINC analyte</span><code>${esc(state.observationQuery.code)}</code></div><div class="patient-id last"><span>Search scope</span><b>${state.observationQuery.searchtype === "local" ? "Local hub" : "Federated network"}</b></div></section><section class="stats-grid">${stat("lab", "Observations", count, "Matching analyte results", "mint")}${stat("shield", "Profile", "BeInterhubLabObservation", "Belgian DIGIRELAB Profile", "blue")}${stat("network", "Scope", state.observationQuery.searchtype === "local" ? "Local Hub" : "Federated", "Cross-hub discovery", "purple")}${stat("pulse", "Response status", state.observationIssues.length ? "Partial failure" : state.observationBundle ? "200 OK" : "Ready", state.observationIssues.length ? `${state.observationIssues.length} downstream issue(s)` : "Transaction 3 · QEDm PCC-44", state.observationIssues.length ? "amber" : "mint")}</section><section class="search-panel"><form id="observation-search-form"><div class="search-primary">${field("Patient identifier", "patient", state.observationQuery.patient, "text", 'required inputmode="numeric" autocomplete="off"')}${field("LOINC Analyte Code", "code", state.observationQuery.code, "text", 'required placeholder="e.g. 1558-6 or http://loinc.org|1558-6"')}${select("Scope", "searchtype", [["federated", "Federated network (all regional hubs)"], ["local", "Local hub only (this hub)"]], state.observationQuery.searchtype)}<button class="btn primary search-submit" ${state.busy ? "disabled" : ""}>${icon("search")} Search observations</button></div><div class="preset-row" style="margin-top: 10px; gap: 8px;"><span style="font-size: 12px; color: var(--muted); align-self: center;">Quick Analytes:</span>${btn("Fasting Glucose (1558-6)", "set-analyte", "chip", 'data-code="1558-6"')}${btn("Serum Creatinine (2160-0)", "set-analyte", "chip", 'data-code="2160-0"')}${btn("Glucose + Creatinine", "set-analyte", "chip", 'data-code="1558-6,2160-0"')}${btn("HbA1c (4548-4)", "set-analyte", "chip", 'data-code="4548-4"')}</div><details class="advanced-search"><summary><span>Parameters & options</span></summary><div class="form-grid">${field("Date from", "from", state.observationQuery.from, "date")}${field("Date to", "to", state.observationQuery.to, "date")}${select("Category", "category", [["", "Any category (default laboratory)"], ["laboratory", "laboratory (HL7 category)"]], state.observationQuery.category)}${select("Sort order", "_sort", [["-date", "Most recent first (-date)"], ["date", "Oldest first (date)"]], state.observationQuery._sort)}${field("Results per page", "_count", state.observationQuery._count, "number", 'min="1" max="100"')}</div></details></form></section>${state.observationIssues.length ? `<div class="notice warning">${icon("alert")}<div><b>Some downstream sources could not be reached</b><p>These observations are incomplete. Available results remain visible.</p>${state.observationIssues.map((i) => `<small>${esc(i.diagnostics || i.details?.text || i.code)}</small>`).join("")}</div></div>` : ""}<div class="documents-layout"><section class="document-list panel"><div class="panel-heading"><h2>Observations <span class="count">${count}</span></h2></div><div class="list-controls"><div class="filter-search">${icon("search")}<input id="obs-local-filter" aria-label="Filter returned observations" placeholder="Filter these results…" value="${esc(state.observationLocalFilter || "")}"></div></div><div id="observation-rows">${observationRows()}</div></section><section class="document-detail panel">${observationDetail()}</section></div>`;
}
function observationRows() {
  let list = state.observations;
  if (state.observationLocalFilter) {
    const q = state.observationLocalFilter.toLowerCase();
    list = list.filter((o) =>
      codeText(o.code).toLowerCase().includes(q) ||
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.valueQuantity && String(o.valueQuantity.value).includes(q)),
    );
  }
  if (!list.length) {
    return `<div class="empty">${icon("lab")}<p>No laboratory observations found. Run a search or pick an analyte preset above.</p></div>`;
  }
  return list.map((obs) => {
    const active = state.selectedObservation?.id === obs.id;
    const testName = obs.code?.coding?.[0]?.display || obs.code?.text || codeText(obs.code);
    const codeVal = obs.code?.coding?.[0]?.code || "Observation";
    const valText = obs.valueQuantity
      ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit || obs.valueQuantity.code || ""}`
      : obs.valueString || "No quantitative value";
    const low = obs.referenceRange?.[0]?.low?.value;
    const high = obs.referenceRange?.[0]?.high?.value;
    const rangeText = low !== undefined && high !== undefined ? `${low} – ${high} ${obs.referenceRange[0].low.unit || ""}` : "";
    const labName = obs.performer?.[0]?.display || obs.performer?.[0]?.identifier?.value || "Laboratory";

    return `<div class="doc-row-wrap"><button class="doc-row ${active ? "selected" : ""}" data-action="select-observation" data-id="${esc(obs.id)}"><span class="doc-icon mint">${icon("lab")}</span><span class="doc-body"><span class="doc-title">${esc(testName)}</span><span class="doc-description"><b>${esc(valText)}</b> ${rangeText ? `(Ref: ${esc(rangeText)})` : ""}</span><span class="doc-meta">${esc(labName)} <span>·</span> ${date(obs.effectiveDateTime)}</span><span class="doc-badges">${badge(obs.status || "final")}${badge("LOINC " + codeVal, "blue")}${badge(obs.extension?.find((e) => e.url.endsWith("home-community-id"))?.valueUri ? "Federated" : "Local", "neutral")}</span></span>${icon("chevron")}</button></div>`;
  }).join("");
}
function observationDetail() {
  const obs = state.selectedObservation;
  if (!obs) {
    return `<div class="empty large">${icon("lab")}<h2>Select an observation</h2><p>Choose an analyte result from the list to inspect its discrete data, validation, and source report.</p></div>`;
  }
  const testName = obs.code?.coding?.[0]?.display || obs.code?.text || codeText(obs.code);
  const codeVal = obs.code?.coding?.[0]?.code || "";
  const valText = obs.valueQuantity
    ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit || obs.valueQuantity.code || ""}`
    : obs.valueString || "No quantitative value";
  const low = obs.referenceRange?.[0]?.low?.value;
  const high = obs.referenceRange?.[0]?.high?.value;
  const rangeText = low !== undefined && high !== undefined ? `${low} – ${high} ${obs.referenceRange[0].low.unit || ""}` : "Not defined";
  const labName = obs.performer?.[0]?.display || obs.performer?.[0]?.identifier?.value || "Laboratory";
  const labId = obs.performer?.[0]?.identifier?.value || "Not supplied";
  const homeCommunity = extension(obs, "home-community-id")?.valueUri || "Not supplied";
  const derivedUniqueId = obs.derivedFrom?.[0]?.identifier?.value || "";
  const derivedTitle = obs.derivedFrom?.[0]?.display || "Biochemistry & Hematology Laboratory Report";
  const checks = validateResource(obs);
  const passCount = checks.filter((c) => c.pass).length;
  const tab = state.observationDetailTab || "overview";

  return `<header class="detail-header"><div><div class="overline">BELGIAN INTERHUB LABORATORY OBSERVATION</div><h1>${esc(testName)}</h1><div class="detail-meta"><span>LOINC: <code>${esc(codeVal)}</code></span> <span>·</span><span>Effective: ${date(obs.effectiveDateTime)}</span> <span>·</span><span>Performer: ${esc(labName)}</span></div></div><div class="detail-actions">${derivedUniqueId ? btn(icon("file") + " Retrieve source document", "retrieve-derived", "primary", `data-id="${esc(derivedUniqueId)}"`) : ""}</div></header><div class="tabs" role="tablist">${[["overview", "Overview & Value"], ["provenance", "Provenance & Source Report"], ["checks", `Structural checks (${passCount}/${checks.length})`], ["json", "FHIR JSON"]].map(([k, v]) => `<button role="tab" aria-selected="${tab === k}" data-action="obs-detail-tab" data-value="${k}" class="${tab === k ? "active" : ""}">${v}</button>`).join("")}</div><div class="tab-content">${tab === "overview" ? `<div class="overview-grid"><section class="card"><h3>Laboratory Result</h3><div class="result-display" style="padding: 16px 0;"><div style="font-size: 32px; font-weight: 700; color: var(--accent);">${esc(valText)}</div><div style="color: var(--muted); margin-top: 4px;">Reference range: <b>${esc(rangeText)}</b></div></div><dl class="kv-grid">${kv("Status", obs.status)}${kv("Effective time", obs.effectiveDateTime)}${kv("Analyte code", codeVal)}${kv("Code system", obs.code?.coding?.[0]?.system || "http://loinc.org")}</dl></section><section class="card"><h3>Performing Facility & Routing</h3><dl class="kv-grid">${kv("Performing laboratory", labName)}${kv("Laboratory NIHDI / CBE", labId)}${kv("Home Community ID", homeCommunity)}${kv("Patient SSIN", obs.subject?.identifier?.value)}</dl></section></div>` : tab === "provenance" ? `<section class="card"><h3>IHE mXDE & DIGIRELAB Provenance</h3><p class="muted" style="margin-bottom: 16px;">Every <code>BeInterhubLabObservation</code> carries inline traceability to the legal laboratory report it was extracted from, eliminating the need for separate Provenance endpoints.</p><dl class="kv-grid">${kv("Source report title", derivedTitle)}${kv("Source document uniqueId (masterIdentifier)", derivedUniqueId)}${kv("Target hub for $retrieve-document", homeCommunity)}</dl><div style="margin-top: 20px;">${btn(icon("file") + " Retrieve complete legal document ($retrieve-document)", "retrieve-derived", "primary", `data-id="${esc(derivedUniqueId)}" title="Execute POST [base]/DocumentReference/$retrieve-document"`)}</div></section>` : tab === "checks" ? `<section class="card"><h3>BeInterhubLabObservation Structural Conformance</h3><p class="muted" style="margin-bottom: 16px;">Verified against the normative profile constraints in <code>be-interhub-observation.fsh</code>.</p><table class="checks-table"><thead><tr><th>Element</th><th>Status</th><th>Requirement</th></tr></thead><tbody>${checks.map((c) => `<tr class="${c.pass ? "pass" : "fail"}"><td><code>${esc(c.path)}</code></td><td>${badge(c.pass ? "PASS" : "FAIL", c.pass ? "mint" : "warning")}</td><td>${esc(c.requirement)}</td></tr>`).join("")}</tbody></table></section>` : `<div class="editor-toolbar"><span class="section-label">FHIR R4 JSON</span>${btn(icon("copy") + " Copy JSON", "copy-text", "chip", `data-text="${esc(pretty(obs))}"`)}</div>${codeBlock(pretty(obs), "json")}`}</div>`;
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
const STATUS_TEXT = {
  200: "OK",
  400: "Bad request · check the parameters",
  401: "Unauthorized · token missing or rejected",
  403: "Forbidden",
  404: "Not found · unknown document",
  405: "Method not allowed",
  406: "Not acceptable · no rendering in that format",
  410: "Gone · the document was withdrawn",
  422: "Unprocessable entity",
  500: "Server error",
};

function trafficRows() {
  const term = state.logFilter.toLowerCase();
  const rows = state.logs
    .map((log, index) => ({ log, index }))
    .filter(
      ({ log }) =>
        !term ||
        log.url.toLowerCase().includes(term) ||
        String(log.status).includes(term) ||
        String(log.body || "")
          .toLowerCase()
          .includes(term) ||
        log.method.toLowerCase().includes(term),
    );
  if (!rows.length)
    return `<div class="empty"><p>${state.logs.length ? "No request matches this filter." : "Send a request to start tracing."}</p></div>`;
  return rows
    .map(
      ({ log, index }) =>
        `<div class="traffic-wrap"><button class="traffic-row ${index === state.logIndex ? "active" : ""}" data-action="select-log" data-value="${index}"><span class="method m-${esc(log.method.toLowerCase())}">${log.method}</span><span class="traffic-path">${esc(new URL(log.url).pathname)}<small>${new Date(log.time).toLocaleTimeString()} · ${log.ms} ms ${log.demo ? "· Demo" : ""}</small></span>${badge(log.status || "ERR", log.status >= 400 || !log.status ? "warning" : "")}</button><button type="button" class="traffic-replay" data-action="replay" data-value="${index}" title="Load into the request builder" aria-label="Replay request">${icon("play")}</button></div>`,
    )
    .join("");
}

function responseBody(log) {
  if (!log)
    return `<div class="empty"><h3>Your responses will appear here</h3><p>Inspect JSON, OperationOutcome issues, HTTP headers, and reproducible snippets in five languages.</p></div>`;
  const id = `log-${state.logIndex}-${state.logTab}`;
  switch (state.logTab) {
    case "headers":
      return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Response header</th><th>Value</th></tr></thead><tbody>${
        Object.entries(log.responseHeaders || {})
          .map(
            ([k, v]) =>
              `<tr><td><code>${esc(k)}</code></td><td>${esc(v)}</td></tr>`,
          )
          .join("") ||
        '<tr><td colspan="2">No response headers were exposed.</td></tr>'
      }</tbody></table></div><div class="section-label">REQUEST HEADERS</div><div class="table-wrap"><table class="data-table"><thead><tr><th>Request header</th><th>Value</th></tr></thead><tbody>${Object.entries(
        log.headers || {},
      )
        .map(
          ([k, v]) =>
            `<tr><td><code>${esc(k)}</code></td><td>${esc(v)}</td></tr>`,
        )
        .join("")}</tbody></table></div>`;
    case "request":
      return `${json({ url: log.url, method: log.method, headers: log.headers }, id)}${log.body ? `<div class="section-label">REQUEST BODY</div>${codeBlock(log.body, detectLanguage(log.body, log.headers?.["Content-Type"]), { lineNumbers: true })}` : ""}`;
    case "snippet":
      return `<div class="chips snippet-kinds">${Object.entries(generators)
        .map(([kind, g]) =>
          btn(
            esc(g.label),
            "snippet-kind",
            state.snippetKind === kind ? "chip active" : "chip",
            `data-value="${kind}"`,
          ),
        )
        .join(
          "",
        )}${btn(icon("copy") + " Copy", "copy-snippet", "chip")}</div>${codeBlock(
        snippet(log, state.snippetKind),
        generators[state.snippetKind]?.lang || "bash",
        { lineNumbers: true },
      )}<p class="muted">Authorization, DPoP, and signature headers are redacted before a snippet is produced.</p>`;
    default: {
      const payload = log.data instanceof Blob ? log.raw : log.data;
      return json(payload, id, {
        contentType: log.responseHeaders?.["content-type"],
      });
    }
  }
}

/** Decoded view of an x-www-form-urlencoded body, the ITI-67 wire format. */
function formTable(body) {
  const pairs = [...new URLSearchParams(body || "")];
  if (!pairs.length) return "";
  return `<details class="resource decoded-form" open><summary>Decoded parameters <span class="count">${pairs.length}</span></summary><div class="table-wrap"><table class="data-table"><tbody>${pairs
    .map(
      ([k, v]) => `<tr><td><code>${esc(k)}</code></td><td>${esc(v)}</td></tr>`,
    )
    .join("")}</tbody></table></div></details>`;
}

function consolePage() {
  const c = state.console,
    log = state.logs[state.logIndex];
  const bodyLang = detectLanguage(c.body, c.contentType);
  const size = log ? new TextEncoder().encode(log.raw || "").length : 0;
  return `<div class="console-layout"><section class="panel request-builder"><div class="panel-heading"><h2>Request builder</h2>${badge(state.settings.mode === "demo" ? "FIXTURE TRANSPORT" : "LIVE TRANSPORT", "neutral")}</div><div class="preset-row">${[
    ["search", "ITI-67 Search"],
    ["retrieve", "ITI-68 Retrieve"],
    ["lab-glucose", "Transaction 3 (Glucose)"],
    ["lab-creatinine", "Transaction 3 (Creatinine)"],
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
  )}${field("Path relative to FHIR base", "path", c.path, "text", "required")}<button class="btn primary" ${state.busy ? "disabled" : ""}>${icon("arrow")} Send <kbd aria-hidden="true">⌘↵</kbd></button></div><p class="base-hint">${esc(state.settings.base)}</p><div class="form-grid two">${field("Content-Type", "contentType", c.contentType)}${field("Accept", "accept", c.accept)}</div><div class="editor-toolbar"><span class="section-label">REQUEST BODY</span><span class="editor-lang">${esc(bodyLang)}</span>${btn("Format", "format-body", "chip")}${btn("Minify", "minify-body", "chip")}${btn(icon("copy"), "copy-body", "chip", 'aria-label="Copy request body"')}</div>${codeEditor("body", c.body, bodyLang, { rows: 12, id: "console-body", label: "" })}${bodyLang === "form" ? formTable(c.body) : ""}<p class="muted">Authentication and custom connection headers are applied automatically. Responses stay in memory.</p></form></section><section class="panel request-history"><div class="panel-heading"><h2>Session traffic <span class="count">${state.logs.length}</span></h2><div class="row-actions">${btn(icon("down") + " HAR", "export-har", "text-btn")}${btn("Clear", "clear-logs", "text-btn")}</div></div><div class="filter-search compact">${icon("filter")}<input id="log-filter" aria-label="Filter session traffic" placeholder="Filter by path, method, status…" value="${esc(state.logFilter)}"></div><div class="history-list">${trafficRows()}</div></section></div><section class="panel response-panel"><div class="panel-heading"><h2>HTTP inspector ${log ? badge(log.status || "Network error", log.status >= 400 ? "warning" : "") : ""}</h2><div class="row-actions">${log ? btn(icon("copy") + " Copy " + (generators[state.snippetKind]?.label || "cURL"), "copy-snippet") + btn(icon("down") + " Export trace", "export-trace") : ""}</div></div>${
    log
      ? `<div class="response-summary"><span class="rs ${log.status >= 400 || !log.status ? "bad" : "good"}"><b>${log.status || "ERR"}</b> ${esc(STATUS_TEXT[log.status] || "")}</span><span>${log.ms} ms</span><span>${size.toLocaleString()} bytes</span><span>${esc(log.responseHeaders?.["content-type"] || "no content-type")}</span><span>${log.demo ? "Offline fixture" : "Live transport"}</span></div>`
      : ""
  }<div class="tabs">${[
    ["response", "Response body"],
    ["request", "Request"],
    ["headers", "Headers"],
    ["snippet", "Code snippet"],
  ]
    .map(([k, v]) =>
      btn(
        v,
        "log-tab",
        state.logTab === k ? "active" : "",
        `data-value="${k}"`,
      ),
    )
    .join("")}</div>${responseBody(log)}</section>`;
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
  )}${field("Token endpoint URL", "tokenEndpoint", s.tokenEndpoint, "url", 'placeholder="https://authorization.example/token" required')}${field("OAuth client ID", "clientId", s.clientId, "text", "required")}<div class="form-grid two">${field("Scopes", "scope", s.scope)}${field("Audience (optional)", "audience", s.audience)}</div>${field("Client secret (optional; otherwise private_key_jwt)", "clientSecret", a.clientSecret, "password", 'autocomplete="off"')}${area("SAML2 subject token (base64url, exchange route only)", "assertion", a.assertion, 'rows="3" autocomplete="off"')}<button class="btn primary" ${state.busy ? "disabled" : ""}>${icon("key")} Request access token</button><p class="muted">Uses the selected direct/proxy transport, even in demo mode. Configure an allowed proxy origin for your authorization server. DPoP token requests use the current key.</p></form></section></div><section class="panel padded"><div class="panel-heading"><h2>JWT claims inspector</h2>${badge("DECODED · NOT VERIFIED", "warning")}</div>${claims ? `${claims.exp ? `<div class="notice ${claims.exp * 1000 < Date.now() ? "warning" : "subtle"}">Token ${claims.exp * 1000 < Date.now() ? "expired" : "expires"} ${esc(new Date(claims.exp * 1000).toLocaleString())}</div>` : ""}${json(claims, "jwt-claims")}` : '<p class="muted">Load a JWT to inspect its issuer, audience, lifetime, Belgian requester context, and cnf key binding. Opaque access tokens are also supported.</p>'}</section><div class="notice subtle">${icon("book")}<p>DPoP constrains token use; it does not sign the request body. Use HTTP Message Signatures for body integrity. mTLS certificates, IAM registration, consent, therapeutic links, institutional trust, and ETK decryption are supplied by your hub infrastructure. <a href="https://www.rfc-editor.org/rfc/rfc9449.html" target="_blank" rel="noreferrer">RFC 9449</a> · <a href="https://www.rfc-editor.org/rfc/rfc9421.html" target="_blank" rel="noreferrer">RFC 9421</a></p></div>`;
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
          )}<details class="resource"><summary>Raw CapabilityStatement</summary>${json(cap, "capability")}</details>`
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
      "Transaction 3 (DIGIRELAB)",
      "POST Observation/_search, LOINC analyte codes, time-series query, inline traceability via derivedFrom to source report.",
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
  ["be-interhub-observation.fsh", "FSH · Lab observation"],
  ["be-interhub-extensions.fsh", "FSH · Belgian extensions"],
  ["be-interhub-capabilities.fsh", "FSH · Capabilities"],
  ["be-interhub-codesystems.fsh", "FSH · Terminology"],
  ["telemonitoring-diagnosticreport.fsh", "FSH · Telemonitoring"],
  ["telemonitoring-mapping-example.fsh", "FSH · Telemonitoring example"],
  ["be-interhub-examples.fsh", "FSH · Examples"],
  ["aliases.fsh", "FSH · Aliases"],
];
function guidePage() {
  const current = guides.find((x) => x[0] === state.igFile);
  const isFsh = state.igFile.endsWith(".fsh");
  const mode = isFsh ? "source" : state.guideMode;
  const doc = mode === "rendered" ? renderMarkdown(state.igText) : null;
  const groups = [
    ["SPECIFICATION", guides.filter(([f]) => f.endsWith(".md"))],
    ["FSH SOURCE", guides.filter(([f]) => f.endsWith(".fsh"))],
  ];
  return `<div class="guide-layout"><section class="panel guide-nav">${groups
    .map(
      ([label, items]) =>
        `<div class="workspace-label guide-group">${label}</div>${items
          .map(([f, t]) =>
            btn(
              t,
              "guide-file",
              state.igFile === f ? "active" : "",
              `data-value="${esc(f)}"`,
            ),
          )
          .join("")}`,
    )
    .join(
      "",
    )}</section><section class="panel guide-reader"><div class="panel-heading"><h2>${esc(current?.[1] || state.igFile)}</h2><div class="row-actions">${
    isFsh
      ? ""
      : `<div class="segmented">${btn("Rendered", "guide-mode", state.guideMode === "rendered" ? "selected" : "", 'data-value="rendered"')}${btn("Source", "guide-mode", state.guideMode === "source" ? "selected" : "", 'data-value="source"')}</div>`
  }<a class="btn" href="/ig/${esc(state.igFile)}" target="_blank" rel="noreferrer">Open source ${icon("arrow")}</a></div></div><p class="source-note">Read-only snapshot of the supplied specification · ${esc(state.igFile)}</p><div class="filter-search compact"><input id="guide-search" placeholder="Find in this page…" aria-label="Find in guide source" value="${esc(state.guideQuery)}"><span id="guide-hits" class="muted small"></span></div>${
    state.igText
      ? mode === "rendered"
        ? `${tableOfContents(doc.headings)}<article id="guide-body" class="markdown">${doc.html}</article>`
        : `<div id="guide-body">${codeBlock(state.igText, isFsh ? "fsh" : "markdown", { lineNumbers: true })}</div>`
      : `<div class="empty" id="guide-body">${icon("book")}<h3>Loading source…</h3></div>`
  }</section></div>`;
}

/** Wrap every occurrence of `term` in <mark>, walking text nodes only. */
function markMatches(container, term) {
  container.querySelectorAll("mark").forEach((mark) => {
    mark.replaceWith(document.createTextNode(mark.textContent));
  });
  container.normalize();
  if (!term || term.length < 2) return 0;
  const needle = term.toLowerCase();
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const targets = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode())
    if (node.nodeValue.toLowerCase().includes(needle)) targets.push(node);
  let hits = 0;
  for (const node of targets) {
    const parts = node.nodeValue.split(
      new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
    );
    const fragment = document.createDocumentFragment();
    for (const part of parts) {
      if (part.toLowerCase() === needle) {
        const mark = document.createElement("mark");
        mark.textContent = part;
        fragment.append(mark);
        hits += 1;
      } else if (part) fragment.append(document.createTextNode(part));
    }
    node.replaceWith(fragment);
  }
  return hits;
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
      ["dark", "Dark"],
      ["light", "Light"],
      ["system", "Follow the system setting"],
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
    !["light", "dark", "system"].includes(s.theme)
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
/** Keep a code editor's highlight layer, gutter, and scroll in sync. */
function wireEditor(root) {
  const input = root.querySelector(".editor-input");
  const view = root.querySelector(".editor-view code");
  const gutter = root.querySelector(".editor-gutter");
  if (!input || !view) return;
  const paint = () => {
    const lang = root.dataset.lang || "plain";
    view.innerHTML = highlight(input.value, lang);
    if (gutter) {
      const lines = input.value.split("\n").length;
      gutter.textContent = Array.from({ length: lines }, (_, i) => i + 1).join(
        "\n",
      );
    }
  };
  input.addEventListener("input", paint);
  input.addEventListener("scroll", () => {
    view.parentElement.scrollTop = input.scrollTop;
    view.parentElement.scrollLeft = input.scrollLeft;
    if (gutter) gutter.scrollTop = input.scrollTop;
  });
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    const { selectionStart: from, selectionEnd: to, value } = input;
    input.value = value.slice(0, from) + "  " + value.slice(to);
    input.selectionStart = input.selectionEnd = from + 2;
    paint();
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  paint();
}

function wireForms() {
  document.querySelectorAll("[data-editor]").forEach(wireEditor);
  document
    .querySelectorAll("[data-select]")
    .forEach((el) =>
      el.addEventListener("change", (e) =>
        handleAction(el.dataset.select, e.target.value, el),
      ),
    );
  document
    .querySelectorAll("[data-json-filter]")
    .forEach((el) =>
      el.addEventListener("input", (e) =>
        filterJsonTree(el.closest(".jsonview"), e.target.value),
      ),
    );
  $("#console-form")?.addEventListener("input", (e) => {
    if (e.target.name)
      state.console = {
        ...state.console,
        ...Object.fromEntries(new FormData(e.currentTarget)),
      };
  });
  $("#log-filter")?.addEventListener("input", (e) => {
    state.logFilter = e.target.value;
    const list = document.querySelector(".history-list");
    if (list) list.innerHTML = trafficRows();
  });
  const palette = $("#palette-input");
  if (palette) {
    palette.focus();
    palette.setSelectionRange(palette.value.length, palette.value.length);
    palette.addEventListener("input", (e) => {
      state.palette.query = e.target.value;
      state.palette.index = 0;
      $("#palette-list").innerHTML = paletteItems(state.palette.query);
    });
  }
  $("#search-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    state.query = Object.fromEntries(new FormData(e.target));
    run(() => search());
  });
  $("#local-filter")?.addEventListener("input", (e) => {
    state.localFilter = e.target.value;
    $("#document-rows").innerHTML = documentRows();
  });
  $("#observation-search-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    state.observationQuery = {
      ...state.observationQuery,
      ...Object.fromEntries(new FormData(e.target)),
    };
    run(() => searchObservations());
  });
  $("#obs-local-filter")?.addEventListener("input", (e) => {
    state.observationLocalFilter = e.target.value;
    const rowsEl = $("#observation-rows");
    if (rowsEl) rowsEl.innerHTML = observationRows();
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
    state.guideQuery = e.target.value;
    const body = $("#guide-body");
    if (!body) return;
    const hits = markMatches(body, state.guideQuery);
    $("#guide-hits").textContent = state.guideQuery
      ? `${hits} match${hits === 1 ? "" : "es"}`
      : "";
    body.querySelector("mark")?.scrollIntoView({ block: "center" });
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
  } else if (p === "lab-glucose") {
    c.path = "Observation/_search";
    c.contentType = "application/x-www-form-urlencoded";
    c.body = new URLSearchParams({
      "patient.identifier": `${SSIN}|79080412345`,
      code: "http://loinc.org|1558-6",
      _sort: "-date",
    }).toString();
  } else if (p === "lab-creatinine") {
    c.path = "Observation/_search";
    c.contentType = "application/x-www-form-urlencoded";
    c.body = new URLSearchParams({
      "patient.identifier": `${SSIN}|79080412345`,
      code: "http://loinc.org|2160-0",
      _sort: "-date",
    }).toString();
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
  // A click inside a dialog must not fall through to the backdrop's close.
  if (
    b.dataset.action === "close-overlay" &&
    e.target.closest("[data-stop]") &&
    !e.target.closest('button[data-action="close-overlay"]')
  )
    return;
  handleAction(b.dataset.action, b.dataset.value, b);
});

/**
 * Every user action funnels through here so the command palette, keyboard
 * shortcuts, and ordinary clicks all take exactly the same path.
 */
function handleAction(a, v, b = { dataset: {} }) {
  if (
    state.busy &&
    !pages[a] &&
    ![
      "dismiss-error",
      "log-tab",
      "close-overlay",
      "palette",
      "shortcuts",
    ].includes(a)
  )
    return;
  if (pages[a]) {
    closeOverlays();
    location.hash = a;
    return;
  }
  switch (a) {
    case "theme": {
      const order = ["dark", "light", "system"];
      state.settings.theme =
        order[(order.indexOf(state.settings.theme) + 1) % order.length];
      persist();
      render();
      notify(`Theme: ${state.settings.theme}`);
      break;
    }
    case "dismiss-error":
      state.error = "";
      render();
      break;
    case "select-document":
      selectDoc(b.dataset.id);
      render();
      break;
    case "select-observation":
      state.selectedObservation =
        state.observations.find((o) => o.id === b.dataset.id) || null;
      render();
      break;
    case "obs-detail-tab":
      state.observationDetailTab = v;
      render();
      break;
    case "set-analyte":
      state.observationQuery.code = b.dataset.code;
      render();
      run(() => searchObservations());
      break;
    case "run-observation-search":
      closeOverlays();
      if (state.page !== "observations") location.hash = "observations";
      run(() => searchObservations());
      break;
    case "retrieve-derived": {
      const docId = b.dataset.id;
      if (docId) {
        run(async () => {
          location.hash = "documents";
          const ref = docId.includes("/")
            ? docId
            : { system: "urn:ietf:rfc:3986", value: docId };
          const bundle = await request("DocumentReference/$retrieve-document", {
            method: "POST",
            body: retrieveBody(ref),
          });
          state.payload = bundle;
          state.detailTab = "payload";
          const matchDoc = state.documents.find(
            (d) =>
              d.masterIdentifier?.value === docId ||
              d.id === docId.split("/").at(-1),
          );
          if (matchDoc) {
            state.selected = matchDoc;
          }
          render();
        });
      }
      break;
    }
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
      if (!state.selected) {
        notify("Select a document first.");
        break;
      }
      run(() => retrieve());
      break;
    case "pdf":
      if (!state.selected) {
        notify("Select a document first.");
        break;
      }
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
    case "next": {
      const next = state.searchBundle?.link?.find((l) => l.relation === "next");
      if (!next) {
        notify("There is no next page for this search.");
        break;
      }
      run(() => search(next.url));
      break;
    }
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
      copyText(
        curlCommand(state.logs[state.logIndex]),
        "cURL copied; sensitive headers are redacted.",
      );
      break;
    case "copy-code": {
      const targetId = b.dataset.target;
      const codeEl = document.getElementById(targetId);
      const textToCopy = codeEl ? codeEl.textContent : b.dataset.code;
      if (textToCopy) {
        const copyPromise = navigator.clipboard
          ? navigator.clipboard.writeText(textToCopy)
          : Promise.reject();
        copyPromise
          .then(() => {
            notify("Code copied to clipboard!");
            const orig = b.innerHTML;
            b.innerHTML = icon("check") + " <span>Copied!</span>";
            b.classList.add("copied");
            setTimeout(() => {
              b.innerHTML = orig;
              b.classList.remove("copied");
            }, 2000);
          })
          .catch(() => {
            const ta = document.createElement("textarea");
            ta.value = textToCopy;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            try {
              document.execCommand("copy");
              notify("Code copied to clipboard!");
              const orig = b.innerHTML;
              b.innerHTML = icon("check") + " <span>Copied!</span>";
              b.classList.add("copied");
              setTimeout(() => {
                b.innerHTML = orig;
                b.classList.remove("copied");
              }, 2000);
            } catch {
              notify("Clipboard unavailable. Select text manually to copy.");
            }
            document.body.removeChild(ta);
          });
      }
      break;
    }
    case "copy-text": {
      const text = b.dataset.text;
      if (text) {
        navigator.clipboard
          ?.writeText(text)
          .then(() => notify(`Copied "${text}" to clipboard!`))
          .catch(() => notify(`Copied: ${text}`));
      }
      break;
    }
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
    /* ---- theme ---- */
    case "theme-set":
      state.settings.theme = ["light", "dark", "system"].includes(v)
        ? v
        : "dark";
      persist();
      closeOverlays();
      render();
      break;
    /* ---- overlays ---- */
    case "palette":
      state.palette = { open: true, query: "", index: 0 };
      state.overlay = "";
      render();
      $("#palette-input")?.focus();
      break;
    case "shortcuts":
      state.overlay = state.overlay === "shortcuts" ? "" : "shortcuts";
      state.palette.open = false;
      render();
      break;
    case "close-overlay":
      closeOverlays();
      render();
      break;
    case "palette-run": {
      const command = paletteMatches[Number(v)];
      if (!command) break;
      closeOverlays();
      render();
      handleAction(command.action, command.value, {
        dataset: { id: command.id },
      });
      break;
    }
    /* ---- JSON viewer ---- */
    case "json-tree":
    case "json-raw":
      (state.jsonViews[v] ||= {}).mode = a === "json-tree" ? "tree" : "raw";
      render();
      break;
    case "json-wrap":
      (state.jsonViews[v] ||= {}).wrap = !state.jsonViews[v].wrap;
      render();
      break;
    case "json-expand":
    case "json-collapse": {
      const host = document.querySelector(`[data-json-id="${CSS.escape(v)}"]`);
      const open = a === "json-expand";
      const nodes = [...(host?.querySelectorAll("details.j-node") || [])];
      nodes.forEach(
        (n, i) => (n.open = open && (i < 3000 || n.dataset.path === "")),
      );
      state.jsonCollapsed[v] = open
        ? []
        : nodes.map((n) => n.dataset.path).filter((path) => path !== "");
      if (!open && host) {
        const root = host.querySelector("details.j-node");
        if (root) root.open = true;
      }
      break;
    }
    case "json-copy":
      copyText(jsonSources.get(v) || "", "Copied to clipboard.");
      break;
    case "json-download":
      download(
        `${v.replace(/[^a-z0-9_-]+/gi, "-")}.json`,
        jsonSources.get(v) || "",
      );
      break;
    case "json-copy-path":
      copyText(v, `Copied path ${v}`);
      break;
    /* ---- documents ---- */
    case "sort":
      state.sort = v;
      render();
      break;
    case "group":
      state.group = v;
      render();
      break;
    case "compare-toggle": {
      const id = b.dataset.id;
      state.compare = state.compare.includes(id)
        ? state.compare.filter((x) => x !== id)
        : [...state.compare, id].slice(-2);
      render();
      break;
    }
    case "compare-clear":
      state.compare = [];
      render();
      break;
    case "compare-open":
      if (state.compare.length !== 2) {
        notify("Pin two documents with the compare button first.");
        break;
      }
      state.detailTab = "compare";
      selectDoc(state.compare[0]);
      state.detailTab = "compare";
      location.hash = "documents";
      render();
      break;
    case "run-search":
      run(() => search());
      break;
    case "console-document":
      preset("retrieve");
      location.hash = "console";
      break;
    /* ---- console ---- */
    case "snippet-kind":
      state.snippetKind = v;
      render();
      break;
    case "copy-snippet":
      copyText(
        snippet(state.logs[state.logIndex], state.snippetKind),
        `${generators[state.snippetKind]?.label || "Snippet"} copied; sensitive headers are redacted.`,
      );
      break;
    case "replay": {
      const log = state.logs[Number(v)];
      if (!log) break;
      const url = new URL(log.url);
      const base = new URL(state.settings.base.replace(/\/$/, "") + "/");
      state.console = {
        ...state.console,
        method: log.method,
        path: url.href.startsWith(base.href)
          ? url.href.slice(base.href.length)
          : url.pathname.replace(/^\//, ""),
        contentType: log.headers?.["Content-Type"] || state.console.contentType,
        accept: log.headers?.Accept || state.console.accept,
        body: log.body || "",
      };
      location.hash = "console";
      render();
      notify("Loaded into the request builder. Review and send.");
      break;
    }
    case "export-har":
      if (!state.logs.length) {
        notify("No traffic to export yet.");
        break;
      }
      download("interhub-session.har", toHar(state.logs));
      notify("HAR exported; it includes request and response patient data.");
      break;
    case "format-body":
    case "minify-body": {
      const input = $("#console-body");
      if (!input) break;
      const text = input.value;
      try {
        if (/^\s*[{[]/.test(text)) {
          const parsed = JSON.parse(text);
          state.console.body =
            a === "format-body" ? pretty(parsed) : JSON.stringify(parsed);
        } else {
          const params = new URLSearchParams(text);
          state.console.body = params.toString();
        }
        render();
        notify(a === "format-body" ? "Body formatted." : "Body minified.");
      } catch (error) {
        notify("Body is not valid JSON: " + error.message);
      }
      break;
    }
    case "copy-body":
      copyText(
        $("#console-body")?.value || state.console.body,
        "Request body copied.",
      );
      break;
    case "log-filter-clear":
      state.logFilter = "";
      render();
      break;
    /* ---- guide ---- */
    case "guide-mode":
      state.guideMode = v;
      render();
      break;
    case "copy-text-block": {
      const pre = b.closest?.(".md-code")?.querySelector("pre");
      copyText(pre?.textContent || "", "Snippet copied.");
      break;
    }
  }
}

function closeOverlays() {
  state.palette = { open: false, query: "", index: 0 };
  state.overlay = "";
}

/** Clipboard write with a graceful fallback for insecure contexts. */
function copyText(text, message) {
  if (!text) return;
  const fallback = () => {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      notify(message);
    } catch {
      notify("Clipboard unavailable. Select the text manually to copy.");
    }
    document.body.removeChild(area);
  };
  if (!navigator.clipboard) return fallback();
  navigator.clipboard.writeText(text).then(() => notify(message), fallback);
}
// `toggle` does not bubble, so this listener runs in the capture phase.
document.addEventListener(
  "toggle",
  (e) => {
    const node = e.target;
    if (!node.matches?.("details.j-node")) return;
    const host = node.closest("[data-json-id]");
    if (!host) return;
    const id = host.dataset.jsonId;
    const collapsed = new Set(state.jsonCollapsed[id] || []);
    if (node.open) collapsed.delete(node.dataset.path);
    else collapsed.add(node.dataset.path);
    state.jsonCollapsed[id] = [...collapsed];
  },
  true,
);

window.addEventListener("hashchange", () => {
  state.page = pages[location.hash.slice(1)]
    ? location.hash.slice(1)
    : "documents";
  render();
  if (state.page === "guide" && !state.igText) run(loadGuide);
  if (state.page === "observations" && !state.observations.length)
    run(() => searchObservations());
});
/* ------------------------------------------------------------------ *
 * Keyboard
 * ------------------------------------------------------------------ */

let chord = "";
const typing = (target) =>
  target instanceof HTMLElement &&
  (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
    target.isContentEditable);

function movePalette(step) {
  const items = $("#palette-list")?.querySelectorAll(".palette-item") || [];
  if (!items.length) return;
  state.palette.index =
    (state.palette.index + step + items.length) % items.length;
  items.forEach((item, i) =>
    item.classList.toggle("active", i === state.palette.index),
  );
  items[state.palette.index]?.scrollIntoView({ block: "nearest" });
}

function moveSelection(step) {
  const list = visibleDocuments();
  if (!list.length) return;
  const at = list.findIndex((d) => d.id === state.selected?.id);
  selectDoc(list[Math.min(Math.max(at + step, 0), list.length - 1)].id);
  render();
  document
    .querySelector(".doc-row.selected")
    ?.scrollIntoView({ block: "nearest" });
}

window.addEventListener("keydown", (e) => {
  const inField = typing(e.target);
  const meta = e.ctrlKey || e.metaKey;

  if (meta && e.key.toLowerCase() === "k") {
    e.preventDefault();
    handleAction(state.palette.open ? "close-overlay" : "palette");
    return;
  }
  if (e.key === "Escape" && (state.palette.open || state.overlay)) {
    e.preventDefault();
    handleAction("close-overlay");
    return;
  }
  if (state.palette.open) {
    if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      movePalette(1);
    } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
      e.preventDefault();
      movePalette(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleAction("palette-run", String(state.palette.index));
    }
    return;
  }
  if (meta && e.key === "Enter" && state.page === "console") {
    e.preventDefault();
    $("#console-form")?.requestSubmit();
    return;
  }
  if (meta && e.key.toLowerCase() === "s" && state.page === "console") {
    e.preventDefault();
    handleAction("format-body");
    return;
  }
  if (inField || e.altKey || meta) return;

  if (chord === "g") {
    const target = {
      d: "documents",
      c: "console",
      i: "guide",
      a: "auth",
      s: "settings",
      t: "timeline",
      w: "conformance",
    }[e.key];
    chord = "";
    if (target) {
      e.preventDefault();
      location.hash = target;
    }
    return;
  }
  switch (e.key) {
    case "g":
      chord = "g";
      setTimeout(() => (chord = ""), 1200);
      break;
    case "?":
      e.preventDefault();
      handleAction("shortcuts");
      break;
    case "/":
      if (state.page !== "documents") location.hash = "documents";
      e.preventDefault();
      setTimeout(() => $("#local-filter")?.focus(), 0);
      break;
    case "t":
      handleAction("theme");
      break;
    case "j":
      if (state.page === "documents") moveSelection(1);
      break;
    case "k":
      if (state.page === "documents") moveSelection(-1);
      break;
    case "Enter":
      if (state.page === "documents" && state.selected)
        handleAction("retrieve");
      break;
  }
});
state.page = pages[location.hash.slice(1)]
  ? location.hash.slice(1)
  : "documents";
render();
if (state.settings.mode === "demo")
  run(async () => {
    await search();
    await searchObservations();
    if (state.page === "guide") await loadGuide();
  });
else if (state.page === "guide") run(loadGuide);
else if (state.page === "observations") run(() => searchObservations());
