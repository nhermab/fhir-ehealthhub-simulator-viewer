import test from "node:test";
import assert from "node:assert/strict";
import {
  generateKey,
  publicJwk,
  dpopProof,
  decodeJwt,
  thumbprint,
  secureHeaders,
  tokenRequest,
  digest,
  b64,
} from "../src/auth.js";
const decode = (s) => JSON.parse(Buffer.from(s, "base64url").toString());
test("DPoP proof verifies cryptographically and binds method, URL, token, nonce", async () => {
  const jwk = await generateKey();
  const proof = await dpopProof(
    "https://hub.test/fhir/DocumentReference/_search?x=1",
    "POST",
    "token",
    jwk,
    "server-nonce",
  );
  const [h, p, s] = proof.split(".");
  const header = decode(h),
    claims = decode(p);
  assert.equal(header.typ, "dpop+jwt");
  assert.equal(header.jwk.d, undefined);
  assert.equal(claims.htu, "https://hub.test/fhir/DocumentReference/_search");
  assert.equal(claims.htm, "POST");
  assert.equal(claims.nonce, "server-nonce");
  assert.ok(claims.ath);
  assert.notEqual(
    claims.jti,
    decodeJwt(await dpopProof(claims.htu, "POST", "token", jwk)).jti,
  );
  const key = await crypto.subtle.importKey(
    "jwk",
    publicJwk(jwk),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  assert.ok(
    await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      Buffer.from(s, "base64url"),
      new TextEncoder().encode(h + "." + p),
    ),
  );
});
test("DPoP rejects a token bound to a different key", async () => {
  const jwk = await generateKey();
  const token =
    "e30." +
    Buffer.from(JSON.stringify({ cnf: { jkt: "wrong" } })).toString(
      "base64url",
    ) +
    ".sig";
  await assert.rejects(
    () =>
      secureHeaders(
        { url: "https://hub.test/fhir", method: "POST", headers: {} },
        { token, proof: "dpop", jwk },
      ),
    /does not match/,
  );
  assert.equal((await thumbprint(jwk)).length, 43);
});
test("HTTP signature covers exact request body and has verifiable P-256 signature", async () => {
  const jwk = await generateKey(),
    body = "patient.identifier=123";
  const req = {
    url: "https://hub.test/fhir/DocumentReference/_search",
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  };
  const h = await secureHeaders(req, {
    token: "token",
    proof: "signature",
    jwk,
    keyId: "test",
  });
  assert.equal(
    h["Content-Digest"],
    "sha-256=:" + b64(await digest(body)) + ":",
  );
  const params = h["Signature-Input"].slice(5);
  const base =
    '"@method": POST\n"@target-uri": ' +
    req.url +
    '\n"content-type": ' +
    req.headers["Content-Type"] +
    '\n"content-digest": ' +
    h["Content-Digest"] +
    '\n"authorization": Bearer token\n"@signature-params": ' +
    params;
  const key = await crypto.subtle.importKey(
    "jwk",
    publicJwk(jwk),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  assert.ok(
    await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      Buffer.from(h.Signature.slice(6, -1), "base64"),
      new TextEncoder().encode(base),
    ),
  );
});
test("token requests encode private_key_jwt and SAML2 exchange correctly", async () => {
  const settings = {
    clientId: "client",
    tokenEndpoint: "https://as.test/token",
    grant: "credentials",
    scope: "read",
  };
  const jwk = await generateKey();
  const r = await tokenRequest(settings, {
    jwk,
    keyId: "key-1",
    proof: "dpop",
  });
  const p = new URLSearchParams(r.body);
  assert.equal(p.get("grant_type"), "client_credentials");
  assert.equal(
    decodeJwt(p.get("client_assertion")).aud,
    settings.tokenEndpoint,
  );
  assert.ok(r.headers.DPoP);
  const exchange = await tokenRequest(
    { ...settings, grant: "exchange" },
    { assertion: "abc", clientSecret: "xyz" },
  );
  assert.equal(
    new URLSearchParams(exchange.body).get("subject_token_type"),
    "urn:ietf:params:oauth:token-type:saml2",
  );
});
