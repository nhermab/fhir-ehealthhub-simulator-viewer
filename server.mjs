import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const allowed = new Set(
  (
    process.env.PROXY_ALLOWED_ORIGINS ||
    "http://localhost:8080,http://127.0.0.1:8080"
  )
    .split(",")
    .map((x) => new URL(x.trim()).origin),
);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".md": "text/plain; charset=utf-8",
  ".fsh": "text/plain; charset=utf-8",
};
const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === "/api/proxy") {
      if (req.method !== "POST") {
        res.writeHead(405).end();
        return;
      }
      if (
        !["localhost", "127.0.0.1", "[::1]", process.env.HOST].includes(
          url.hostname,
        )
      ) {
        res.writeHead(403).end("Local host required");
        return;
      }
      const origin = req.headers.origin;
      if (
        (origin && origin !== `http://${req.headers.host}`) ||
        req.headers["sec-fetch-site"] === "cross-site" ||
        !req.headers["content-type"]?.startsWith("application/json")
      ) {
        res.writeHead(403).end("Same-origin JSON requests required");
        return;
      }
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 2_000_000) {
          res.writeHead(413).end();
          return;
        }
      }
      const request = JSON.parse(body),
        target = new URL(request.url);
      if (!allowed.has(target.origin) || target.username || target.password) {
        res
          .writeHead(403, { "Content-Type": "application/json" })
          .end(
            JSON.stringify({
              error:
                "Origin not allowed. Add this exact origin to PROXY_ALLOWED_ORIGINS and restart, or use direct browser mode.",
            }),
          );
        return;
      }
      if (!["GET", "POST"].includes(request.method)) {
        res.writeHead(405).end();
        return;
      }
      const headers = new Headers(request.headers);
      for (const key of [...headers.keys()])
        if (/^(host|cookie|connection|content-length|proxy-|sec-)/i.test(key))
          headers.delete(key);
      const upstream = await fetch(target, {
        method: request.method,
        headers,
        body: request.method === "POST" ? request.body : undefined,
        redirect: "manual",
        signal: AbortSignal.timeout(30000),
      });
      res.statusCode = upstream.status;
      for (const name of [
        "content-type",
        "www-authenticate",
        "dpop-nonce",
        "retry-after",
        "etag",
        "last-modified",
        "location",
      ])
        if (upstream.headers.has(name))
          res.setHeader(name, upstream.headers.get(name));
      res.end(Buffer.from(await upstream.arrayBuffer()));
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405).end();
      return;
    }
    const path = decodeURIComponent(url.pathname);
    const permitted =
      path === "/" ||
      path === "/index.html" ||
      path.startsWith("/src/") ||
      path.startsWith("/fixtures/") ||
      path.startsWith("/ig/") ||
      path === "/favicon.svg";
    if (!permitted || path.split("/").includes("..")) {
      res.writeHead(404).end("Not found");
      return;
    }
    const file = resolve(
      root,
      path === "/"
        ? "index.html"
        : path.startsWith("/src/") || path === "/index.html"
          ? "." + path
          : "./public" + path,
    );
    if (!file.startsWith(root + "/")) {
      res.writeHead(403).end();
      return;
    }
    const data = await readFile(file);
    res.setHeader(
      "Content-Type",
      types[extname(file)] || "application/octet-stream",
    );
    res.end(req.method === "HEAD" ? undefined : data);
  } catch (error) {
    res
      .writeHead(error.code === "ENOENT" ? 404 : 502, {
        "Content-Type": "application/json",
      })
      .end(
        JSON.stringify({
          error: error.code === "ENOENT" ? "Not found" : error.message,
        }),
      );
  }
});
server.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(
    `Interhub workspace: http://localhost:${port}\nProxy origins: ${[...allowed].join(", ")}`,
  ),
);
