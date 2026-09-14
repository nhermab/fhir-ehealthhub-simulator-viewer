# Interhub · Belgian MHD workspace

A separate, fully functional web client for the Belgian eHealth Interhub simulator. Includes an offline fixture transport, live FHIR connections, clinical document inspection, and developer authentication tools. The sibling `hubsharing/` project is the specification source.

## Run

Requires Node.js 22 or newer. No runtime dependencies or installation are needed:

```bash
cd fhir-ehealthhub-simulator-viewer
npm start
```

Open **http://localhost:4173**. New installations use Live mode and direct browser requests to **https://dev-api.ehealthhub.be**. The hosted frontend is **https://dev.ehealthhub.be/**; static builds use the same defaults. Saved connection preferences take precedence.

Select **Offline demo** in Connections to work without a backend. The initial demo search uses synthetic SSIN `79080412345` and four copied DocumentReference fixtures. Demo mode works without Java or network access, and mirrors the simulator wire-for-wire: the same three transactions, the same 400/404/406/410 responses, the same opaque paging, and the same `not-supported` refusal for any other path. The bundled Minimal reference intentionally has no retrievable payload (404) and no hub PDF rendering (406).

To use the Java app, start it separately, open **Connections**, select **Live**, use `http://localhost:8080/fhir`, keep **Local proxy**, and save. Then run a document search. **Test connection** uses the saved settings.

For additional FHIR or authorization servers:

```bash
PROXY_ALLOWED_ORIGINS=http://localhost:8080,https://hub.example,https://iam.example npm start
```

Origins are an exact server-side allowlist. The client can configure endpoints within it. Direct transport is also available for servers that permit browser CORS. The proxy binds to loopback by default; it is a development transport, not an internet-facing gateway. It does not follow redirects or forward cookies. `PORT` defaults to 4173; `HOST` defaults to 127.0.0.1.

## Workspace

- Document discovery via ITI-67 POST form search; canonical and OID SSIN systems; optional modulo-97 validation; category/type tokens, repeated date bounds, authors, status, IDs, identifiers, local/federated scope, ordering and count.
- Laboratory observation search via Transaction 3 (DIGIRELAB / IHE QEDm PCC-44): POST form query to `[base]/Observation/_search` by patient SSIN and LOINC analyte codes (e.g. Fasting Glucose `1558-6`, Serum Creatinine `2160-0`). Displays discrete quantitative values with UCUM units, reference ranges, performing laboratory, and inline traceability (`derivedFrom`) linking directly to `$retrieve-document` on the legal source report.
- Searchset pagination using next-link query parameters in a new POST to `_search`. The simulator issues an **opaque `_continuation` token** in `Bundle.link[relation=next]`, so the search criteria never travel in a URL; the viewer simply replays whatever parameters that link carries, which also works with other servers' opaque continuation schemes.
- Separate partial-failure OperationOutcome notices preserve successful documents. Details retain Belgian error codings in the inspector and traffic trace.
- Minimal and Comprehensive metadata: contained patient/parties, CD-HCPARTY roles, confidentiality, patient access, home community, source record time, ETK metadata, identifiers and replacement relationships.
- ITI-68 POST `$retrieve-document`, FHIR document Bundles and negotiated PDF. Console supports both literal references and business-identifier Parameters. HTTP errors including withdrawn 410 remain visible.
- Composition narratives (rendered as safe text), nested sections, discrete observations, and expandable resources for lab and telemonitoring documents. PDF preview and download; FHIR JSON import/export; patient timeline; local list filtering.
- Request builder, operation/error presets, bounded session traffic, response bodies and headers, timing, redacted cURL and trace export. Binary responses are represented by size/type in traces.
- CapabilityStatement discovery, selected FSH-derived structural checks, document reference-closure checks, and a searchable source browser containing all supplied pagecontent and FSH files.
- Dedicated language starter pages for **Python**, **JavaScript / Node.js**, **Java**, **C# (.NET)**, and **cURL / CLI**, populated dynamically with the active backend endpoint and patient SSIN for fast copy-paste integration.
- Responsive desktop/mobile layouts, light/dark themes, keyboard-accessible forms, reduced-motion support, and Ctrl/Cmd+K to focus filtering.

## Authentication

**Apply authentication** loads a pasted bearer/DPoP token and optional private JWK into memory. Generate a P-256 test key or import a private P-256/RSA JWK. Production hub credentials must come from your registered institution.

Token acquisition supports client credentials with client secret or `private_key_jwt`, and RFC 8693 SAML2 subject-token exchange. The SAML2 field accepts the encoded subject token expected by the gateway; it does not acquire an STS assertion. Token acquisition calls the configured endpoint even while FHIR demo mode is active. Token endpoints need CORS or a proxy allowlist entry. No token endpoint response is written to the traffic log.

DPoP proofs include fresh `jti`/`iat`, method/URI binding, `ath`, public JWK, and optional nonce. The current key is used in token requests. A decoded token's `cnf.jkt` mismatch is rejected. Returned DPoP nonces are captured; retry the request after a nonce challenge. JWT claims are decoded for inspection, **not verified**. Opaque tokens work as well.

HTTP Message Signatures sign method, target URI, content type, SHA-256 content digest, and authorization with creation time, key ID and nonce. ES256 uses the fixed-length P-256 signature encoding; RSA uses PKCS#1 v1.5 SHA-256. Key registration, certificate binding, token validation, nonce/replay enforcement and trust remain the receiving server's responsibility.

DPoP does not provide body integrity on its own: use HTTP Message Signatures for that property. See [RFC 9449](https://www.rfc-editor.org/rfc/rfc9449.html) and [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html). Browser connections cannot programmatically configure mTLS client certificates. Put institutional certificate handling in a trusted gateway. The Java simulator currently does not enforce authentication.

## Scope and data handling

This is a developer viewer, not a complete production Belgian hub or a clinical decision system. Local validation checks selected explicit FSH rules; it does not execute the full inherited IHE/Belgian core profiles, terminology expansion, FHIRPath invariants or national certification. The coverage panel distinguishes implemented client tools, partial validation and external infrastructure. Consent, therapeutic links, metahub routing, ETK lookup/decryption, institutional mTLS and durable audit are external. Patient-access rules are displayed as metadata; this developer viewer is not a patient portal and does not enforce authorization.

Tokens, private keys, client secrets, SAML assertions, custom headers, documents, SSIN searches and traffic remain in tab memory. Only non-secret connection preferences persist in localStorage. Settings export excludes custom headers and credentials. Known sensitive header names are redacted from traffic/cURL; request and response bodies may contain patient data and are deliberately visible. Trace and document exports include those bodies. Custom secrets should use the authentication controls or conventional secret header names. The proxy has no request logging, but upstream hub logging is controlled by that hub. Do not use a publicly shared deployment for real patient information.

FHIR narrative HTML is reduced to text; it cannot run scripts, load remote images, or inject markup. PDF preview uses the browser's PDF renderer. Imported JSON is limited to 10 MB. Request history is bounded to 60 entries and cleared on reload. An opaque/encrypted payload is not decrypted. All fixtures and IG sources are snapshots copied from the provided local projects, not fetched from production.

## Verification and build

```bash
npm run check
npm test
npm install
npx playwright install chromium
# Linux may need: npx playwright install-deps chromium
npm run test:browser
npm run build
```

`npm test` covers wire contracts, SSIN rules, filtering, structural checks, reference closure, request isolation, header redaction, cryptographic proof verification, token request construction, and multi-language code generation. Browser tests cover desktop/mobile discovery, clinical/PDF retrieval, partial outcomes, error responses, key generation, secret persistence, source browsing, filtering and pagination.

With the viewer and Java simulator running, `node tests/live-integration.mjs` checks live proxy interoperability, origin guards, opaque POST pagination, and that the Java server refuses everything outside the two transactions exactly as demo mode does. The integration test sends only search/retrieve requests, using fixture patient data.

`npm run build` produces `dist/` for static hosting. Static hosting supports demo and direct CORS connections. Use `npm start` for the local proxy. Runtime code uses native ES modules, Fetch and Web Crypto; Playwright is a development-only dependency.

## Project layout

- `src/app.js`: workspace UI, forms, routing, and session state
- `src/code-examples.js`: language starter pages (Python, JS/Node, Java, C#, cURL)
- `src/styles.css`: responsive theme and component styling
- `src/fhir.js`: FHIR/Belgian mappings, requests and structural checks
- `src/client.js`: live and offline FHIR transports
- `src/auth.js`: Web Crypto signing and token request construction
- `server.mjs`: static server and restricted local proxy
- `public/fixtures/`: copied simulator data
- `public/ig/`: copied IG Markdown and FSH sources
- `tests/`: unit, cryptographic, code starter, browser and live integration checks
