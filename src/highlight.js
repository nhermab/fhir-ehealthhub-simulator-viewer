/**
 * Dependency-free syntax highlighting for the workspace.
 *
 * A tokenizer, not a parser: every grammar is a list of (class, pattern) rules
 * compiled into one alternation. Matching happens on the RAW source and each
 * matched slice is HTML-escaped as it is emitted, so highlighted output can
 * never smuggle markup in from a FHIR payload or a guide source file.
 *
 * Rule patterns must not contain capturing groups - use (?:...) - because the
 * engine relies on one capture group per rule to identify the winner.
 */
const escapeHtml = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const esc = escapeHtml;

const STR = String.raw`"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'`;
const NUM = String.raw`\b-?(?:0[xX][\da-fA-F]+|\d+\.?\d*(?:[eE][-+]?\d+)?)\b`;
const words = (list) => String.raw`\b(?:${list.join("|")})\b`;

const JS_KEYWORDS = [
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "of",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "yield",
];
const PY_KEYWORDS = [
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
];
const JAVA_KEYWORDS = [
  "abstract",
  "assert",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extends",
  "final",
  "finally",
  "float",
  "for",
  "if",
  "implements",
  "import",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "package",
  "private",
  "protected",
  "public",
  "record",
  "return",
  "short",
  "static",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "try",
  "var",
  "void",
  "volatile",
  "while",
];
const CS_KEYWORDS = [
  "abstract",
  "as",
  "async",
  "await",
  "base",
  "bool",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "checked",
  "class",
  "const",
  "continue",
  "decimal",
  "default",
  "delegate",
  "do",
  "double",
  "else",
  "enum",
  "event",
  "explicit",
  "extern",
  "finally",
  "fixed",
  "float",
  "for",
  "foreach",
  "get",
  "global",
  "goto",
  "if",
  "implicit",
  "in",
  "int",
  "interface",
  "internal",
  "is",
  "lock",
  "long",
  "namespace",
  "new",
  "object",
  "operator",
  "out",
  "override",
  "params",
  "private",
  "protected",
  "public",
  "readonly",
  "record",
  "ref",
  "return",
  "sbyte",
  "sealed",
  "set",
  "short",
  "sizeof",
  "stackalloc",
  "static",
  "string",
  "struct",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "uint",
  "ulong",
  "unchecked",
  "unsafe",
  "ushort",
  "using",
  "var",
  "virtual",
  "void",
  "volatile",
  "while",
];
const SH_KEYWORDS = [
  "case",
  "do",
  "done",
  "elif",
  "else",
  "esac",
  "exit",
  "export",
  "fi",
  "for",
  "function",
  "if",
  "in",
  "local",
  "read",
  "return",
  "set",
  "then",
  "until",
  "while",
];

/**
 * class name -> pattern. `null` as a class emits the text unwrapped.
 * Order is significant: earlier rules win.
 */
export const grammars = {
  json: [
    ["key", String.raw`"(?:\\.|[^"\\])*"(?=\s*:)`],
    ["str", String.raw`"(?:\\.|[^"\\])*"`],
    ["num", NUM],
    ["bool", String.raw`\b(?:true|false)\b`],
    ["null", String.raw`\bnull\b`],
    ["punc", String.raw`[{}\[\],:]`],
  ],
  form: [
    ["key", String.raw`(?:^|(?<=&))[^=&\n]+(?==)`],
    ["punc", String.raw`[=&]`],
    ["str", String.raw`[^=&\n]+`],
  ],
  http: [
    ["kw", String.raw`^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b`],
    ["meta", String.raw`\bHTTP/\d(?:\.\d)?\b`],
    ["key", String.raw`^[A-Za-z][A-Za-z0-9-]*(?=:)`],
    ["num", String.raw`\b[1-5]\d{2}\b`],
    ["str", String.raw`https?://\S+`],
  ],
  xml: [
    ["comment", String.raw`<!--[\s\S]*?-->`],
    ["meta", String.raw`<[?!][\s\S]*?>`],
    ["tag", String.raw`</?[A-Za-z][\w:.-]*`],
    ["attr", String.raw`\b[A-Za-z][\w:.-]*(?==)`],
    ["str", STR],
    ["punc", String.raw`/?>`],
  ],
  javascript: [
    ["comment", String.raw`//[^\n]*|/\*[\s\S]*?\*/`],
    ["str", String.raw`` + "`(?:\\\\.|[^`\\\\])*`" + String.raw`|${STR}`],
    ["kw", words(JS_KEYWORDS)],
    ["bool", String.raw`\b(?:true|false|null|undefined|NaN)\b`],
    ["fn", String.raw`\b[A-Za-z_$][\w$]*(?=\s*\()`],
    ["cls", String.raw`\b[A-Z][\w$]*\b`],
    ["num", NUM],
    ["punc", String.raw`[{}()\[\];,]`],
  ],
  python: [
    ["comment", String.raw`#[^\n]*`],
    [
      "str",
      String.raw`(?:[rbfu]{0,2})(?:"""[\s\S]*?"""|'''[\s\S]*?'''|${STR})`,
    ],
    ["meta", String.raw`^\s*@[\w.]+`],
    ["kw", words(PY_KEYWORDS)],
    ["bool", String.raw`\b(?:True|False|None)\b`],
    [
      "builtin",
      words([
        "print",
        "len",
        "range",
        "str",
        "int",
        "float",
        "dict",
        "list",
        "set",
        "open",
        "sorted",
        "enumerate",
        "isinstance",
        "getattr",
        "super",
        "self",
      ]),
    ],
    ["fn", String.raw`\b[A-Za-z_]\w*(?=\s*\()`],
    ["cls", String.raw`\b[A-Z]\w*\b`],
    ["num", NUM],
    ["punc", String.raw`[{}()\[\]:,]`],
  ],
  java: [
    ["comment", String.raw`//[^\n]*|/\*[\s\S]*?\*/`],
    ["str", String.raw`"""[\s\S]*?"""|${STR}`],
    ["meta", String.raw`@[A-Za-z]\w*`],
    ["kw", words(JAVA_KEYWORDS)],
    ["bool", String.raw`\b(?:true|false|null)\b`],
    ["fn", String.raw`\b[a-z_]\w*(?=\s*\()`],
    ["cls", String.raw`\b[A-Z]\w*\b`],
    ["num", String.raw`${NUM}[lLfFdD]?`],
    ["punc", String.raw`[{}()\[\];,]`],
  ],
  csharp: [
    ["comment", String.raw`//[^\n]*|/\*[\s\S]*?\*/`],
    ["str", String.raw`\$?@"(?:""|[^"])*"|\$?"(?:\\.|[^"\\])*"|'(?:\\.|[^'])'`],
    ["meta", String.raw`^\s*#\w+[^\n]*|\[[A-Z]\w*(?:\([^)]*\))?\]`],
    ["kw", words(CS_KEYWORDS)],
    ["bool", String.raw`\b(?:true|false|null)\b`],
    ["fn", String.raw`\b[A-Za-z_]\w*(?=\s*[<(])`],
    ["cls", String.raw`\b[A-Z]\w*\b`],
    ["num", String.raw`${NUM}[mMfFdDuUlL]?`],
    ["punc", String.raw`[{}()\[\];,]`],
  ],
  bash: [
    ["comment", String.raw`#[^\n]*`],
    ["str", String.raw`"(?:\\.|[^"\\])*"|'[^']*'`],
    ["var", String.raw`\$\{[^}]*\}|\$[\w@*#?]+`],
    ["kw", words(SH_KEYWORDS)],
    [
      "builtin",
      words([
        "curl",
        "jq",
        "echo",
        "printf",
        "cat",
        "grep",
        "sed",
        "awk",
        "python3",
        "node",
        "java",
        "mvn",
        "npm",
        "base64",
        "xargs",
        "tee",
      ]),
    ],
    ["flag", String.raw`(?<=\s)--?[A-Za-z][\w-]*`],
    ["punc", String.raw`[|&;()<>]`],
  ],
  markdown: [
    [
      "fence",
      String.raw`^ {0,3}` + "```" + String.raw`[\s\S]*?^ {0,3}` + "```",
    ],
    ["heading", String.raw`^#{1,6}[^\n]*`],
    ["quote", String.raw`^>[^\n]*`],
    ["code", "`[^`\\n]+`"],
    ["link", String.raw`!?\[[^\]\n]*\]\([^)\n]*\)`],
    ["bold", String.raw`\*\*[^*\n]+\*\*`],
    ["bullet", String.raw`^\s*(?:[-*+]|\d+\.)\s`],
    ["meta", String.raw`^\|[^\n]*\|`],
  ],
  fsh: [
    ["comment", String.raw`//[^\n]*|/\*[\s\S]*?\*/`],
    ["str", String.raw`"""[\s\S]*?"""|${STR}`],
    [
      "kw",
      String.raw`^\s*(?:Alias|Profile|Extension|Instance|InstanceOf|Invariant|Logical|Mapping|Parent|Id|Title|Description|Usage|ValueSet|CodeSystem|RuleSet|Severity|Expression|XPath|Context|Source|Target|Characteristics)(?=\s*:)`,
    ],
    ["code", String.raw`#[\w.:/-]+`],
    ["url", String.raw`(?:https?|urn|http):(?:\/\/)?[^\s"'()]+`],
    [
      "builtin",
      words([
        "MS",
        "SU",
        "TU",
        "N",
        "D",
        "obeys",
        "only",
        "from",
        "contains",
        "named",
        "insert",
        "include",
        "exclude",
        "codes",
        "where",
        "system",
        "and",
        "or",
      ]),
    ],
    ["num", String.raw`\b\d+\.\.(?:\d+|\*)`],
    ["bullet", String.raw`^\s*\*`],
  ],
  jwt: [
    ["key", String.raw`^[\w-]+`],
    ["punc", String.raw`\.`],
    ["str", String.raw`[\w-]+`],
  ],
  plain: [],
};
grammars.js = grammars.javascript;
grammars.node = grammars.javascript;
grammars.py = grammars.python;
grammars.sh = grammars.bash;
grammars.shell = grammars.bash;
grammars.curl = grammars.bash;
grammars.cs = grammars.csharp;
grammars.md = grammars.markdown;
grammars.html = grammars.xml;
grammars.text = grammars.plain;

const compiled = new Map();
function compile(lang) {
  if (compiled.has(lang)) return compiled.get(lang);
  const rules = grammars[lang] || grammars.plain;
  const entry = rules.length
    ? {
        classes: rules.map(([cls]) => cls),
        re: new RegExp(rules.map(([, re]) => `(${re})`).join("|"), "gm"),
      }
    : null;
  compiled.set(lang, entry);
  return entry;
}

/** Language ids the highlighter knows about (aliases included). */
export const languages = Object.keys(grammars);

/**
 * Highlight `code` as `lang`, returning HTML-escaped markup.
 * Unknown languages fall back to escaped plain text.
 */
export function highlight(code, lang = "plain") {
  const source = typeof code === "string" ? code : String(code ?? "");
  const grammar = compile(lang);
  if (!grammar) return escapeHtml(source);
  const { re, classes } = grammar;
  re.lastIndex = 0;
  let out = "",
    last = 0,
    match;
  while ((match = re.exec(source))) {
    if (!match[0]) {
      re.lastIndex += 1;
      continue;
    }
    if (match.index > last) out += escapeHtml(source.slice(last, match.index));
    const index = match.findIndex((g, i) => i > 0 && g !== undefined) - 1;
    const cls = classes[index];
    out += cls
      ? `<span class="tk-${cls}">${escapeHtml(match[0])}</span>`
      : escapeHtml(match[0]);
    last = match.index + match[0].length;
  }
  return out + escapeHtml(source.slice(last));
}

/** Best-effort language guess, used when a caller has only a payload. */
export function detectLanguage(code, contentType = "") {
  const type = String(contentType).toLowerCase();
  if (type.includes("json")) return "json";
  if (type.includes("x-www-form-urlencoded")) return "form";
  if (type.includes("xml") || type.includes("html")) return "xml";
  const text = String(code ?? "").trim();
  if (!text) return "plain";
  if (/^[{[]/.test(text)) {
    try {
      JSON.parse(text);
      return "json";
    } catch {
      /* not JSON after all */
    }
  }
  if (/^<\??[a-zA-Z]/.test(text)) return "xml";
  if (/^[A-Z]+ \S+ HTTP\/\d/m.test(text)) return "http";
  if (/^[^=&\s]+=[^&\s]*(?:&[^=&\s]+=[^&\s]*)*$/.test(text)) return "form";
  if (/^\s*(?:curl|#!)/.test(text)) return "bash";
  return "plain";
}

/** Highlight a value that may be an object (serialised) or a string. */
export function highlightValue(value, lang) {
  if (typeof value === "string") return highlight(value, lang || "plain");
  return highlight(JSON.stringify(value, null, 2), "json");
}

/**
 * A `<pre class="code-block">` with an optional line-number gutter.
 * Numbers live in their own column, so they are never copied with the code.
 */
export function codeBlock(code, lang = "plain", options = {}) {
  const { lineNumbers = false, wrap = false, id = "", extra = "" } = options;
  const text = typeof code === "string" ? code : JSON.stringify(code, null, 2);
  const lines = text.split("\n").length;
  const gutter =
    lineNumbers && !wrap
      ? `<div class="code-gutter" aria-hidden="true">${Array.from(
          { length: lines },
          (_, i) => i + 1,
        ).join("\n")}</div>`
      : "";
  return `<div class="code-shell ${wrap ? "wrap" : ""}" data-lang="${escapeHtml(lang)}">${gutter}<pre class="code-block" ${id ? `id="${escapeHtml(id)}"` : ""} tabindex="0" ${extra}><code>${highlight(text, lang)}</code></pre></div>`;
}

/* ------------------------------------------------------------------ *
 * Collapsible JSON tree
 * ------------------------------------------------------------------ */

const isPlainObject = (v) => v !== null && typeof v === "object";
const childPath = (path, key, isArray) =>
  isArray ? `${path}[${key}]` : path ? `${path}.${key}` : String(key);

/** Short inline summary shown on a collapsed node. */
function preview(value) {
  if (Array.isArray(value)) {
    if (!value.length) return "empty";
    const kinds = new Set(
      value.map((v) =>
        isPlainObject(v)
          ? v.resourceType || (Array.isArray(v) ? "[]" : "{}")
          : typeof v,
      ),
    );
    return `${value.length} item${value.length === 1 ? "" : "s"} · ${[...kinds].slice(0, 3).join(", ")}`;
  }
  const keys = Object.keys(value);
  const marker =
    value.resourceType ||
    value.url ||
    value.code ||
    value.system ||
    value.name ||
    "";
  const label = typeof marker === "string" && marker ? `${marker} · ` : "";
  return `${label}${keys.length} field${keys.length === 1 ? "" : "s"}`;
}

function leafHtml(value) {
  if (value === null) return `<span class="tk-null">null</span>`;
  switch (typeof value) {
    case "number":
      return `<span class="tk-num">${escapeHtml(value)}</span>`;
    case "boolean":
      return `<span class="tk-bool">${value}</span>`;
    default: {
      const text = String(value);
      const body =
        /^https?:\/\/\S+$/.test(text) && text.length < 400
          ? `<a href="${escapeHtml(text)}" target="_blank" rel="noreferrer">${escapeHtml(text)}</a>`
          : escapeHtml(text);
      return `<span class="tk-str">"${body}"</span>`;
    }
  }
}

function nodeHtml(value, key, path, depth, options) {
  const { openDepth, collapsed, isArrayParent } = options;
  const copy = path
    ? `<button type="button" class="j-copy" data-action="json-copy-path" data-value="${escapeHtml(path)}" title="Copy path ${escapeHtml(path)}" aria-label="Copy path ${escapeHtml(path)}">#</button>`
    : "";
  const label =
    key === null
      ? ""
      : `<span class="j-key">${isArrayParent ? escapeHtml(key) : `"${escapeHtml(key)}"`}</span><span class="j-colon">:</span> `;
  const searchText = escapeHtml(
    `${key ?? ""} ${isPlainObject(value) ? "" : String(value ?? "")}`.toLowerCase(),
  );
  if (!isPlainObject(value))
    return `<div class="j-row" data-path="${escapeHtml(path)}" data-text="${searchText}">${label}${leafHtml(value)}${copy}</div>`;
  const array = Array.isArray(value);
  const entries = array
    ? value.map((v, i) => [String(i), v])
    : Object.entries(value);
  const open =
    !collapsed.includes(path) &&
    entries.length <= 400 &&
    (depth < openDepth || entries.length <= 3);
  return `<details class="j-node" data-path="${escapeHtml(path)}" data-text="${searchText}" ${open ? "open" : ""}><summary>${label}<span class="j-punc">${array ? "[" : "{"}</span><span class="j-preview">${escapeHtml(preview(value))}</span><span class="j-punc">${array ? "]" : "}"}</span>${copy}</summary><div class="j-children">${entries
    .map(([k, v]) =>
      nodeHtml(v, k, childPath(path, k, array), depth + 1, {
        ...options,
        isArrayParent: array,
      }),
    )
    .join("")}</div></details>`;
}

/**
 * Interactive tree for a parsed JSON value.
 * `collapsed` carries paths the user closed so re-renders keep their shape.
 */
export function jsonTree(value, options = {}) {
  const { openDepth = 2, collapsed = [], root = "" } = options;
  return `<div class="j-tree">${nodeHtml(value, null, root, 0, {
    openDepth,
    collapsed,
    isArrayParent: false,
  })}</div>`;
}

/** Count of nodes in a value - used for "expand all" cost warnings. */
export function countNodes(value) {
  if (!isPlainObject(value)) return 1;
  return (
    1 +
    (Array.isArray(value) ? value : Object.values(value)).reduce(
      (n, v) => n + countNodes(v),
      0,
    )
  );
}
