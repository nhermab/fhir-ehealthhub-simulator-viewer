/**
 * Turn a captured request/response trace into something you can paste
 * somewhere else: a runnable snippet in five languages, or a HAR file for
 * a browser devtools / Postman import.
 *
 * Everything here reads the *redacted* headers already stored on the log
 * entry, so exporting a trace never leaks a bearer token or a DPoP proof.
 */
import { redactHeaders, curlCommand } from "./fhir.js";

const q = (s) => JSON.stringify(String(s ?? ""));
const headersOf = (log) => redactHeaders(log.headers || {});

/** Node / browser `fetch`. */
export function asFetch(log) {
  const headers = Object.entries(headersOf(log))
    .map(([k, v]) => `    ${q(k)}: ${q(v)},`)
    .join("\n");
  return `const response = await fetch(${q(log.url)}, {
  method: ${q(log.method)},
  headers: {
${headers}
  },${log.body ? `\n  body: ${q(log.body)},` : ""}
});
console.log(response.status, await response.text());`;
}

/** Python, standard library only. */
export function asPython(log) {
  const headers = Object.entries(headersOf(log))
    .map(([k, v]) => `    ${q(k)}: ${q(v)},`)
    .join("\n");
  return `import json
import urllib.request

request = urllib.request.Request(
    ${q(log.url)},
    method=${q(log.method)},
    headers={
${headers}
    },${log.body ? `\n    data=${q(log.body)}.encode("utf-8"),` : ""}
)
with urllib.request.urlopen(request) as response:
    print(response.status)
    print(json.dumps(json.loads(response.read()), indent=2))`;
}

/** Java 11+ HttpClient. */
export function asJava(log) {
  const headers = Object.entries(headersOf(log))
    .map(([k, v]) => `    .header(${q(k)}, ${q(v)})`)
    .join("\n");
  return `HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(${q(log.url)}))
${headers}
    .method(${q(log.method)}, ${
      log.body
        ? `HttpRequest.BodyPublishers.ofString(${q(log.body)})`
        : "HttpRequest.BodyPublishers.noBody()"
    })
    .build();

HttpResponse<String> response = HttpClient.newHttpClient()
    .send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.statusCode());
System.out.println(response.body());`;
}

/** C# HttpClient. */
export function asCsharp(log) {
  const headers = Object.entries(headersOf(log))
    .filter(([k]) => !/^content-/i.test(k))
    .map(
      ([k, v]) => `request.Headers.TryAddWithoutValidation(${q(k)}, ${q(v)});`,
    )
    .join("\n");
  const contentType = Object.entries(headersOf(log)).find(([k]) =>
    /^content-type$/i.test(k),
  )?.[1];
  return `using var client = new HttpClient();
var request = new HttpRequestMessage(new HttpMethod(${q(log.method)}), ${q(log.url)});
${headers}${
    log.body
      ? `\nrequest.Content = new StringContent(${q(log.body)}, System.Text.Encoding.UTF8, ${q((contentType || "application/fhir+json").split(";")[0])});`
      : ""
  }

var response = await client.SendAsync(request);
Console.WriteLine((int)response.StatusCode);
Console.WriteLine(await response.Content.ReadAsStringAsync());`;
}

export const generators = {
  curl: { label: "cURL", lang: "bash", build: curlCommand },
  fetch: { label: "JavaScript fetch", lang: "javascript", build: asFetch },
  python: { label: "Python", lang: "python", build: asPython },
  java: { label: "Java", lang: "java", build: asJava },
  csharp: { label: "C#", lang: "csharp", build: asCsharp },
};

/** Build a snippet by generator id, falling back to cURL. */
export function snippet(log, kind = "curl") {
  if (!log) return "";
  return (generators[kind] || generators.curl).build(log);
}

/**
 * HAR 1.2 archive of the session traffic.
 * Response bodies are included; binary payloads are recorded by size only.
 */
export function toHar(logs, creator = "Interhub workspace") {
  const entry = (log) => {
    const url = new URL(log.url);
    const bodyText =
      typeof log.data === "string"
        ? log.data
        : log.data && !(typeof Blob !== "undefined" && log.data instanceof Blob)
          ? JSON.stringify(log.data)
          : log.raw || "";
    return {
      startedDateTime: log.time,
      time: log.ms ?? 0,
      request: {
        method: log.method,
        url: log.url,
        httpVersion: "HTTP/1.1",
        cookies: [],
        headers: Object.entries(redactHeaders(log.headers || {})).map(
          ([name, value]) => ({ name, value: String(value) }),
        ),
        queryString: [...url.searchParams].map(([name, value]) => ({
          name,
          value,
        })),
        headersSize: -1,
        bodySize: log.body ? new TextEncoder().encode(log.body).length : 0,
        ...(log.body
          ? {
              postData: {
                mimeType:
                  log.headers?.["Content-Type"] || "application/fhir+json",
                text: log.body,
              },
            }
          : {}),
      },
      response: {
        status: log.status || 0,
        statusText: log.status ? "" : "Network error",
        httpVersion: "HTTP/1.1",
        cookies: [],
        headers: Object.entries(log.responseHeaders || {}).map(
          ([name, value]) => ({ name, value: String(value) }),
        ),
        content: {
          size: new TextEncoder().encode(bodyText).length,
          mimeType:
            log.responseHeaders?.["content-type"] || "application/fhir+json",
          text: bodyText,
        },
        redirectURL: "",
        headersSize: -1,
        bodySize: -1,
      },
      cache: {},
      timings: { send: 0, wait: log.ms ?? 0, receive: 0 },
      comment: log.demo ? "Offline demo transport" : "Live transport",
    };
  };
  return {
    log: {
      version: "1.2",
      creator: { name: creator, version: "1.0.0" },
      entries: [...logs].reverse().map(entry),
    },
  };
}
