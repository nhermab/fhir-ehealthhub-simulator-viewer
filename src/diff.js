/**
 * Comparison helpers for the document compare view.
 *
 * `diffLines` is a classic LCS line diff over pretty-printed text; `jsonDiff`
 * walks two parsed values and reports the FHIR-style paths that differ, which
 * is usually what you want when comparing two DocumentReferences (a replaced
 * document against the one it replaces, minimal against comprehensive, ...).
 */
import { esc, highlight } from "./highlight.js";

/** Longest-common-subsequence table, capped so pathological inputs stay fast. */
function lcs(a, b) {
  const rows = a.length + 1,
    cols = b.length + 1;
  const table = new Uint32Array(rows * cols);
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      table[i * cols + j] =
        a[i] === b[j]
          ? table[(i + 1) * cols + j + 1] + 1
          : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
  return table;
}

/**
 * Line diff. Returns entries of `{ type, text, left, right }` where type is
 * "same" | "add" | "del" and left/right are 1-based line numbers (or null).
 */
export function diffLines(leftText, rightText, limit = 6000) {
  const a = String(leftText ?? "").split("\n");
  const b = String(rightText ?? "").split("\n");
  if (a.length > limit || b.length > limit)
    return [
      { type: "del", text: `${a.length} lines`, left: 1, right: null },
      { type: "add", text: `${b.length} lines`, left: null, right: 1 },
    ];
  const cols = b.length + 1;
  const table = lcs(a, b);
  const out = [];
  let i = 0,
    j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: "same", text: a[i], left: i + 1, right: j + 1 });
      i += 1;
      j += 1;
    } else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) {
      out.push({ type: "del", text: a[i], left: i + 1, right: null });
      i += 1;
    } else {
      out.push({ type: "add", text: b[j], left: null, right: j + 1 });
      j += 1;
    }
  }
  while (i < a.length)
    out.push({ type: "del", text: a[i], left: ++i, right: null });
  while (j < b.length)
    out.push({ type: "add", text: b[j], left: null, right: ++j });
  return out;
}

/** Drop long runs of unchanged lines, keeping `context` lines around changes. */
export function collapseContext(rows, context = 3) {
  const keep = new Set();
  rows.forEach((row, index) => {
    if (row.type === "same") return;
    for (let k = index - context; k <= index + context; k++)
      if (k >= 0 && k < rows.length) keep.add(k);
  });
  const out = [];
  let skipped = 0;
  rows.forEach((row, index) => {
    if (keep.has(index)) {
      if (skipped) {
        out.push({
          type: "skip",
          text: `${skipped} unchanged lines`,
          left: null,
          right: null,
        });
        skipped = 0;
      }
      out.push(row);
    } else skipped += 1;
  });
  if (skipped)
    out.push({
      type: "skip",
      text: `${skipped} unchanged lines`,
      left: null,
      right: null,
    });
  return out;
}

/** Unified diff markup with syntax highlighting on each retained line. */
export function diffHtml(leftText, rightText, lang = "json", context = 3) {
  const rows = collapseContext(diffLines(leftText, rightText), context);
  const changes = rows.filter(
    (r) => r.type === "add" || r.type === "del",
  ).length;
  if (!changes)
    return `<p class="muted">The two documents are byte-identical once pretty-printed.</p>`;
  return `<div class="diff">${rows
    .map((row) => {
      if (row.type === "skip")
        return `<div class="diff-row skip"><span class="diff-gutter"></span><span class="diff-text">⋯ ${esc(row.text)}</span></div>`;
      const sign = row.type === "add" ? "+" : row.type === "del" ? "-" : " ";
      return `<div class="diff-row ${row.type}"><span class="diff-gutter">${row.left ?? ""}</span><span class="diff-gutter">${row.right ?? ""}</span><span class="diff-sign">${sign}</span><span class="diff-text">${highlight(row.text, lang)}</span></div>`;
    })
    .join("")}</div>`;
}

const isObject = (v) => v !== null && typeof v === "object";

/**
 * Structural comparison of two parsed values.
 * Returns `{ path, change, left, right }` with change in
 * "added" | "removed" | "changed".
 */
export function jsonDiff(left, right, path = "", out = []) {
  if (Object.is(left, right)) return out;
  if (!isObject(left) || !isObject(right)) {
    if (JSON.stringify(left) !== JSON.stringify(right))
      out.push({
        path: path || "(root)",
        change:
          left === undefined
            ? "added"
            : right === undefined
              ? "removed"
              : "changed",
        left,
        right,
      });
    return out;
  }
  if (Array.isArray(left) !== Array.isArray(right)) {
    out.push({ path: path || "(root)", change: "changed", left, right });
    return out;
  }
  const keys = Array.isArray(left)
    ? [...Array(Math.max(left.length, right.length)).keys()].map(String)
    : [...new Set([...Object.keys(left), ...Object.keys(right)])];
  for (const key of keys) {
    const next = Array.isArray(left)
      ? `${path}[${key}]`
      : path
        ? `${path}.${key}`
        : key;
    jsonDiff(left[key], right[key], next, out);
  }
  return out;
}

/** Table markup for `jsonDiff` output. */
export function jsonDiffHtml(left, right) {
  const rows = jsonDiff(left, right);
  if (!rows.length)
    return `<p class="muted">No structural differences between the two resources.</p>`;
  const cell = (v) =>
    v === undefined
      ? '<span class="muted">absent</span>'
      : isObject(v)
        ? `<code>${esc(JSON.stringify(v).slice(0, 160))}</code>`
        : `<code>${esc(JSON.stringify(v))}</code>`;
  return `<div class="diff-summary">${rows.length} difference${rows.length === 1 ? "" : "s"}</div><div class="table-wrap"><table class="data-table"><thead><tr><th>Path</th><th>Change</th><th>Left</th><th>Right</th></tr></thead><tbody>${rows
    .slice(0, 400)
    .map(
      (r) =>
        `<tr class="diff-${r.change}"><td><code>${esc(r.path)}</code></td><td class="nowrap">${r.change}</td><td>${cell(r.left)}</td><td>${cell(r.right)}</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table></div>${rows.length > 400 ? `<p class="muted">Showing the first 400 of ${rows.length} differences.</p>` : ""}`;
}
