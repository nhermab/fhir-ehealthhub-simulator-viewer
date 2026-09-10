const encoder = new TextEncoder();
export const b64 = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)));
export const b64url = (bytes) =>
  b64(bytes).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
const encode = (x) => b64url(encoder.encode(JSON.stringify(x)));
export function decodeJwt(token) {
  try {
    return JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(
          atob(token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/")),
          (c) => c.charCodeAt(0),
        ),
      ),
    );
  } catch {
    return null;
  }
}
export const digest = async (text) =>
  crypto.subtle.digest("SHA-256", encoder.encode(text));
export async function generateKey() {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  return crypto.subtle.exportKey("jwk", pair.privateKey);
}
export function publicJwk(jwk) {
  return jwk.kty === "EC"
    ? { kty: "EC", crv: jwk.crv, x: jwk.x, y: jwk.y }
    : { kty: "RSA", n: jwk.n, e: jwk.e };
}
export async function thumbprint(jwk) {
  const p = publicJwk(jwk);
  const canonical = Object.fromEntries(
    Object.keys(p)
      .sort()
      .map((k) => [k, p[k]]),
  );
  return b64url(await digest(JSON.stringify(canonical)));
}
export async function signBytes(text, jwk) {
  const ec = jwk.kty === "EC";
  const algorithm = ec
    ? { name: "ECDSA", namedCurve: "P-256" }
    : { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
  const key = await crypto.subtle.importKey("jwk", jwk, algorithm, false, [
    "sign",
  ]);
  return crypto.subtle.sign(
    ec ? { name: "ECDSA", hash: "SHA-256" } : algorithm,
    key,
    encoder.encode(text),
  );
}
export async function signJwt(claims, jwk, header = {}) {
  const input =
    encode({
      alg: jwk.kty === "EC" ? "ES256" : "RS256",
      typ: "JWT",
      ...header,
    }) +
    "." +
    encode(claims);
  return input + "." + b64url(await signBytes(input, jwk));
}
export async function dpopProof(url, method, token, jwk, nonce = "") {
  const target = new URL(url);
  target.search = "";
  target.hash = "";
  return signJwt(
    {
      jti: crypto.randomUUID(),
      htm: method.toUpperCase(),
      htu: target.href,
      iat: Math.floor(Date.now() / 1000),
      ...(token ? { ath: b64url(await digest(token)) } : {}),
      ...(nonce ? { nonce } : {}),
    },
    jwk,
    { typ: "dpop+jwt", jwk: publicJwk(jwk) },
  );
}
export async function secureHeaders(request, auth) {
  const headers = { ...request.headers };
  if (auth.token)
    headers.Authorization =
      (auth.proof === "dpop" ? "DPoP " : "Bearer ") + auth.token;
  if (auth.proof === "dpop") {
    if (!auth.jwk)
      throw Error("Generate or import a signing key in Authentication.");
    const claims = decodeJwt(auth.token);
    if (claims?.cnf?.jkt && claims.cnf.jkt !== (await thumbprint(auth.jwk)))
      throw Error("Access token cnf.jkt does not match the DPoP key.");
    headers.DPoP = await dpopProof(
      request.url,
      request.method,
      auth.token,
      auth.jwk,
      auth.nonce,
    );
  }
  if (auth.proof === "signature") {
    if (!auth.jwk) throw Error("Import a signing key in Authentication.");
    if (!headers.Authorization)
      throw Error("HTTP message signatures require a bearer token.");
    headers["Content-Digest"] =
      "sha-256=:" + b64(await digest(request.body || "")) + ":";
    const params =
      '("@method" "@target-uri" "content-type" "content-digest" "authorization");created=' +
      Math.floor(Date.now() / 1000) +
      ";keyid=" +
      JSON.stringify(auth.keyId || "developer-key") +
      ';nonce="' +
      crypto.randomUUID() +
      '";alg="' +
      (auth.jwk.kty === "EC" ? "ecdsa-p256-sha256" : "rsa-v1_5-sha256") +
      '"';
    const base =
      '"@method": ' +
      request.method +
      '\n"@target-uri": ' +
      request.url +
      '\n"content-type": ' +
      headers["Content-Type"] +
      '\n"content-digest": ' +
      headers["Content-Digest"] +
      '\n"authorization": ' +
      headers.Authorization +
      '\n"@signature-params": ' +
      params;
    headers["Signature-Input"] = "sig1=" + params;
    headers.Signature = "sig1=:" + b64(await signBytes(base, auth.jwk)) + ":";
  }
  return headers;
}
export async function tokenRequest(settings, credentials) {
  const p = new URLSearchParams();
  if (settings.grant === "exchange") {
    p.set("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange");
    p.set("subject_token_type", "urn:ietf:params:oauth:token-type:saml2");
    p.set("subject_token", credentials.assertion || "");
    p.set(
      "requested_token_type",
      "urn:ietf:params:oauth:token-type:access_token",
    );
  } else p.set("grant_type", "client_credentials");
  p.set("client_id", settings.clientId);
  if (settings.scope) p.set("scope", settings.scope);
  if (settings.audience) p.set("audience", settings.audience);
  if (credentials.clientSecret)
    p.set("client_secret", credentials.clientSecret);
  else if (credentials.jwk) {
    const now = Math.floor(Date.now() / 1000);
    p.set(
      "client_assertion_type",
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    );
    p.set(
      "client_assertion",
      await signJwt(
        {
          iss: settings.clientId,
          sub: settings.clientId,
          aud: settings.tokenEndpoint,
          iat: now,
          exp: now + 60,
          jti: crypto.randomUUID(),
        },
        credentials.jwk,
        credentials.keyId ? { kid: credentials.keyId } : {},
      ),
    );
  }
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };
  if (credentials.proof === "dpop") {
    if (!credentials.jwk) throw Error("Generate or import a DPoP key first.");
    headers.DPoP = await dpopProof(
      settings.tokenEndpoint,
      "POST",
      "",
      credentials.jwk,
      credentials.nonce,
    );
  }
  return {
    url: settings.tokenEndpoint,
    method: "POST",
    headers,
    body: p.toString(),
  };
}
