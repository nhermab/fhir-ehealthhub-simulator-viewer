# Interhub Security & Authentication Architecture

> **Where this page sits in the guide** — *Specification*, page 3 of 4. [Architecture §5](architecture.html#5-trust-model-security-architecture--connection-routes-proposal) introduces the trust model in a few paragraphs as part of the ecosystem overview; **this page is the full specification and takes precedence** over that summary.
>
> * **Owned by this page:** the Interhub trust model, the three authentication routes, DPoP / RFC 9421 tamper-proofing, the initiating/responding responsibility split, and IHE BALP auditing.
> * **Not covered here:** payload (application-layer) encryption, which is a separate and non-normative discussion → [End-to-End Encryption](end-to-end-encryption.html); the transactions being secured → [Transactions](transactions.html); the patient-access metadata the initiating hub enforces → [Envelope & Metadata](envelope-and-metadata.html#32-belgian-patient-access-metadata-beextpatientaccess).
> * **Previous:** [Transactions](transactions.html) · **Next:** [End-to-End Encryption](end-to-end-encryption.html)

## 1. Security Overview & Trust Model

This page specifies security for **Interhub connections only**: the hub-to-hub channel between an **initiating hub** and a **responding hub**. It does not specify how a hub decides whether a given practitioner may see a given patient's records — that decision belongs entirely to the initiating hub (see §1.1).

Moving from SOAP with WS-Security to RESTful HL7® FHIR® replaces the mechanisms but not the obligations. Belgian health privacy law, the GDPR and medical confidentiality apply exactly as before; only the way they are enforced on the wire changes.

The security architecture of the Belgian Interhub FHIR ecosystem is based on four foundational pillars:
1. **Transport Layer Security**: Mandatory **TLS 1.3** (or TLS 1.2 with strict cipher suites) with mutual certificate authentication (**mTLS**) using official Belgian eHealth organization certificates.
2. **Three Hub Authentication Routes (Proposal)**: Flexible connection models evaluating direct Hub-to-Hub federation, the national eHealth IAM infrastructure, and a bridge for legacy systems via Security Token Service (STS) token exchange. These routes establish **which hub is calling**, nothing more.
3. **Replay & Query Tamper-Proofing**: Application-layer cryptographic request binding via **DPoP (RFC 9449)** or **RFC 9421 (HTTP Message Signatures)**, replacing legacy SOAP SAML signatures to prevent query tampering and replay attacks.
4. **Auditability & Traceability**: Audit logging conforming to **IHE BALP (Basic Audit Logging Pattern)** and **IHE ATNA (Audit Trail and Node Authentication)**, which carries the legal obligations previously discharged by the `getTransactionAccessList` service.

Payload (application-layer) encryption is deliberately **not** one of these pillars. Whether Belgium should keep KMEHR-style end-to-end encryption in FHIR is an open architectural question, analysed separately in [End-to-End Encryption](end-to-end-encryption.html#4-architectural-analysis-should-belgium-continue-e2ee-in-fhir).

### 1.1 Trust Model: Access Control Is the Initiating Hub's Responsibility

Interhub is a **trusted federation of hubs**. Once a responding hub has authenticated the calling hub — mTLS plus one of the three routes below — it **trusts that hub** and answers the request. It does **not** re-open the question of whether the end user behind the request is entitled to the patient's data. That question was settled before the request was ever sent.

* **The initiating hub performs all access control**, before it issues any Interhub call. How it does so is a local matter and outside the scope of this specification. For example, a hub may query the **Metahub** to confirm that an informed consent (IC) and/or a therapeutic link exists for the patient/practitioner pair, or it may resolve the same facts from its own local database and local patient/practitioner administration.
* **The responding hub performs technical validation only**: transport and hub authentication, request freshness and tamper-proofing, syntactic validity of the query, and audit logging. It does not verify informed consent, therapeutic links, practitioner entitlement, or end-user roles, and it does not issue access decisions on the initiating hub's behalf.
* **The initiating hub is accountable** for the lawfulness of every Interhub request it emits, and its audit trail is the record of the access decision that justified it.

The Metahub and the federation of hubs referred to here are described in [Architecture §1](architecture.html#1-the-belgian-federated-health-ecosystem); the same trust model appears in summary form in [Architecture §5.1](architecture.html#51-trust-model-the-initiating-hub-owns-access-control). The document-level access rules an initiating hub applies (`access`, `accessDate`, `deniedReason`) are carried in the metadata envelope specified in [Envelope & Metadata §3.2](envelope-and-metadata.html#32-belgian-patient-access-metadata-beextpatientaccess).

```mermaid
flowchart LR
    subgraph OutOfScope["<b>Local Clinical Domain (OUT OF SCOPE)</b>"]
        User["<b>End User / Clinical App</b><br/>(Practitioner, EHR, Portal)"]
    end

    subgraph Init["<b>INITIATING eHEALTH HUB</b>"]
        AC["<b>Access Control (local responsibility)</b><br/>• e.g. Metahub query: does an IC exist?<br/>• e.g. local database: therapeutic link,<br/>&nbsp;&nbsp;patient administration, local rules<br/>• Decision recorded in local audit trail"]
    end

    subgraph Resp["<b>RESPONDING eHEALTH HUB</b>"]
        Tech["<b>Technical validation only</b><br/>• mTLS + calling hub authentication<br/>• Replay / tamper-proofing (DPoP or RFC 9421)<br/>• Query syntax<br/>• AuditEvent logging"]
    end

    User -->|"Intrahub Request<br/>(local protocol)"| AC
    AC -->|"Interhub request (IN SCOPE)<br/>(only if local check passed)"| Tech
    Tech -->|"Trusted response"| AC
    AC -->|"Intrahub Response"| User
```

---

## 2. The Three Authentication & Connection Routes (Proposal)

Hub operating environments differ across the federated network. The Belgian Interhub specification therefore evaluates **three distinct authentication routes** for Hub-to-Hub communication. All three answer one question, *which hub is calling, and is the request untampered?*, and none of them carries an access decision about the patient's records.

> **Important Architectural Note**: Presenting three connection models is **an architectural proposal**. For the final normative standard, the Belgian healthcare ecosystem **must pick one of these three methods** as the unified national authentication framework.

```mermaid
flowchart TD
    subgraph Routes["<b>Three Interhub Authentication Routes (Proposal Under Evaluation)</b>"]
        direction LR
        subgraph Route1["<b>Proposal 1: Hub/Enterprise JWT</b>"]
            R1["<b>Direct Hub Federation</b><br/>• Asymmetric signed JWTs<br/>• Validated via Hub JWKS"]
        end
        subgraph Route2["<b>Proposal 2: eHealth IAM (M2M)</b>"]
            R2["<b>National AS, machine-to-machine</b><br/>• Client credentials, no interactive user<br/>• eHealth enterprise certificate (CBE)<br/>• No eID / itsme® in the Interhub call"]
        end
        subgraph Route3["<b>Proposal 3: STS Bridge</b>"]
            R3["<b>Legacy SAML Exchange</b><br/>• eHealth SOAP STS assertions<br/>• RFC 8693 Token Exchange"]
        end
    end

    Responder["<b>BELGIAN INTERHUB FHIR RESPONDER</b><br/>(Authenticates the calling hub: signature via JWKS;<br/>records SSIN, NIHDI, CBE claims for audit)"]

    Route1 -->|"Bearer JWT<br/>(Hub Private Key)"| Responder
    Route2 -->|"Bearer JWT<br/>(eHealth IAM, client credentials)"| Responder
    Route3 -->|"1. SAML 2.0 Assertion"| TokenGateway["<b>Token Exchange Gateway</b><br/>(RFC 8693 SAML2 to JWT)"]
    TokenGateway -->|"2. Short-lived Bearer JWT"| Responder
```

---

### 2.1 Route 1: Hub/Enterprise-Issued JWT Bearer Tokens (Federated Trust)

Here the eHealth hubs themselves — CoZo, RSW, Abrumet+, Zodap — or major healthcare enterprises operate their own **OAuth 2.0 token issuers**. Trust between them is established bilaterally, or through a national hub federation trust registry. The token asserts the identity of the calling hub and carries the contextual claims needed for the responding hub's audit trail; it does not convey an access decision, which the initiating hub has already made locally.

#### Mechanics & Workflow:
1. The initiating client authenticates against its local Hub Authorization Server using the **OAuth 2.0 Client Credentials Flow** with asymmetric private key JWT authentication (`private_key_jwt`).
2. The local Hub AS issues a signed JSON Web Token (JWT) using its private RSA/ECDSA key.
3. The client presents the JWT in the HTTP `Authorization: Bearer <jwt>` header when calling the target hub's FHIR endpoints.
4. The responding hub validates the token signature using the issuer's public keys published at its **JSON Web Key Set (JWKS)** endpoint (`/.well-known/jwks.json`), confirms the issuer is a trusted hub, and records the asserted claims in its audit trail.

#### Sample Interhub JWT Claims Payload:
```json
{
  "iss": "https://auth.cozo.be",
  "sub": "client-source-uzl",
  "aud": "https://hub.abrumet.be/fhir",
  "exp": 1773766800,
  "nbf": 1773763200,
  "iat": 1773763200,
  "jti": "b3e94a8c-9c71-4e78-9e51-12f8e12a4b89",
  "be:hub_origin": "urn:oid:1.3.6.1.4.1.21297.1.3",
  "be:practitioner": {
    "nihdi": "19876543201",
    "ssin": "65031212345",
    "name": "Dr. Jean Depondt",
    "role": "persphysician"
  },
  "be:organization": {
    "nihdi": "71000012",
    "cbe": "0419052173",
    "name": "UZ Leuven"
  },
  "be:patient_context": {
    "ssin": "79080412345"
  }
}
```

> The `be:practitioner`, `be:organization`, and `be:patient_context` claims exist so that the responding hub can write a complete, legally usable `AuditEvent`. They are **not** inputs to an access decision at the responding hub: the initiating hub has already established the practitioner's entitlement before emitting the call.

---

### 2.2 Route 2: eHealth Platform IAM (National Authorization Server, Machine-to-Machine)

In this route, authentication of the calling hub is centralized through the **Belgian eHealth Platform IAM** infrastructure. 

> **Interhub uses IAM machine-to-machine (M2M) only.** An Interhub call is a hub-to-hub system call with **no interactive user at the connection level**: it is authenticated with the calling hub's **eHealth enterprise certificate**, and **not** with eID, itsme® or any other citizen/practitioner authentication means. Those means may well be used by a hub to authenticate its *own* users locally, but that happens entirely inside the initiating hub and is never part of the Interhub authentication (see §1.1).

#### Mechanics & Workflow:
1. **Client Authentication (M2M)**:
   * The initiating hub authenticates to eHealth IAM with the **OAuth 2.0 Client Credentials grant** (RFC 6749 §4.4) — there is no authorization-code flow, no user consent screen, and no OIDC ID Token.
   * The client credential is the hub's **eHealth enterprise certificate**, presented either as **mutual-TLS client authentication** (RFC 8705, `tls_client_auth`) or as a signed **`private_key_jwt` client assertion** (RFC 7523) whose key is bound to that certificate.
2. **Identity Resolution**:
   * eHealth IAM resolves the enterprise certificate to the legal entity behind the calling hub — its **CBE / KBO** enterprise number, and where applicable the institution **NIHDI** number — against the federal authoritative sources (**CBE**, **CoBRHA**).
   * The subject of the resulting token is therefore an **organisation, not a person**.
3. **Token Issuance**:
   * eHealth IAM issues a short-lived signed OAuth 2.0 **access token** naming the calling hub (`sub` / `client_id`, CBE, **eHealth Platform (EHP) number**, hub Home Community OID), the audience, and the granted scopes. The token is sender-constrained with **DPoP** as described in §3.
   * **The token must carry the two facts the legacy security token already carried.** The eHealth STS assertion used by hub connectors today asserts the calling organisation's **EHP number** (`urn:be:fgov:ehealth:1.0:hub:ehp-number`, alongside `urn:be:fgov:ehealth:1.0:certificateholder:organization:ehp-number`) and a boolean stating that this organisation **is a recognised hub** (`urn:be:fgov:ehealth:1.0:certificateholder:organization:ehp-number:recognisedhub:boolean`). Both are load-bearing: the EHP number is how every hub routing table and the Metahub patient-link register name a hub, and the recognised-hub flag is the federation membership assertion that makes the trust model of §1.1 defensible. An access token that omits them is strictly weaker than the SAML assertion it replaces, and the responding hub would have to take federation membership on faith.
4. **Consumption**:
   * The responding hub verifies the token against the official eHealth JWKS endpoint (`https://iam.ehealth.fgov.be/.well-known/jwks.json`), checks `aud`, `scope` and the DPoP binding, and logs the identity of the calling hub in its `AuditEvent`.

```http
POST /oauth2/token HTTP/1.1
Host: iam.ehealth.fgov.be
Content-Type: application/x-www-form-urlencoded
DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2Iiwiandr...

grant_type=client_credentials
&scope=interhub:documentreference.read interhub:document.read
&client_assertion_type=urn%3Aietf%3Aparams%3Aoauth%3Aclient-assertion-type%3Ajwt-bearer
&client_assertion=eyJhbGciOiJSUzI1NiIsIng1dCI6...
```

```json
{
  "iss": "https://iam.ehealth.fgov.be",
  "sub": "urn:oid:1.3.6.1.4.1.21297.1.3",
  "client_id": "hub-cozo-interhub",
  "aud": "https://hub.rsw.be/fhir",
  "scope": "interhub:documentreference.read interhub:document.read",
  "cnf": { "jkt": "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I" },
  "be:organization": {
    "cbe": "0419052173",
    "nihdi": "71000012",
    "ehp_number": "1990000827",
    "home_community_id": "urn:oid:1.3.6.1.4.1.21297.1.3"
  },
  "be:recognised_hub": true,
  "iat": 1773050400,
  "exp": 1773051000
}
```

> The end user behind the request never appears in this token as an *authenticated* identity. Where the responding hub needs end-user information for its audit trail, the initiating hub supplies it as descriptive claims (as in Route 1), on its own responsibility — the responding hub records them, it does not verify them.

---

### 2.3 Route 3: Derived System Based on STS (SAML 2.0 to OAuth 2.0 Bridge)

Many Belgian regional hubs and hub connector nodes already integrate with the **eHealth Security Token Service (STS)** over SOAP WS-Trust, presenting SAML 2.0 tokens signed with eHealth X.509 enterprise keystores. Rewriting that authentication stack is neither quick nor cheap.

An **STS Token Exchange Gateway** enables an initiating hub running legacy STS-based infrastructure to bridge to RESTful OAuth 2.0 Bearer JWTs without an immediate architectural rewrite:

```mermaid
sequenceDiagram
    autonumber
    participant InitHub as Initiating eHealth Hub (Connector / Bridge)
    participant STS as eHealth Platform STS (WS-Trust)
    participant Bridge as Interhub Token Exchange Service (RFC 8693)
    participant Responder as Responding Belgian Interhub FHIR Responder

    InitHub->>STS: 1. Request SAML 2.0 Token (SOAP WS-Trust with Keystore)
    STS-->>InitHub: 2. Return Signed SAML 2.0 Assertion
    InitHub->>Bridge: 3. POST /oauth/token<br/>(grant_type=token-exchange, subject_token=SAML2, audience=hub)
    Note over Bridge: • Validates SAML signature against eHealth Trust Chain<br/>• Extracts NIHDI, CBE, SSIN, and Role assertions (for audit)<br/>• Verifies validity window
    Bridge-->>InitHub: 4. Return short-lived OAuth 2.0 JWT Access Token
    InitHub->>Responder: 5. Interhub POST /DocumentReference/_search (Authorization: Bearer JWT)
    Responder-->>InitHub: 6. HTTP 200 OK (FHIR Response)
```

#### RFC 8693 Token Exchange Request Example:
```http
POST /oauth/token HTTP/1.1
Host: auth-gateway.ehealth.fgov.be
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&client_id=initiating-hub-cozo
&subject_token=PHNhbWwycDpBc3NlcnRpb24geG1sbnM6c2FtbDJwPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6YXNzZXJ0aW9uIi...
&subject_token_type=urn:ietf:params:oauth:token-type:saml2
&audience=https://hub.abrumet.be/fhir
```

#### Response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

### 2.4 Carrying the End-User Chain (the KMEHR `request/author` equivalent)

Authenticating the calling hub answers *which hub is asking*. It does not answer *on whose behalf* — and the legacy protocol has always answered both.

Every KMEHR hub request carries a `request/author` element listing the parties behind the call as `hcparty` elements: the hub itself (`cd = hub`, identified by its EHP number), the practitioner (NIHDI + SSIN + name, `cd = persphysician` or another `pers…` type), the organisation, the patient when the patient is the one asking, and the end-user software (`cd = application`). This is not decoration: it is what the responding hub writes into its audit trail, and in the KMEHR world it is mandatory.

The FHIR model must not lose it. This IG therefore requires that every Interhub request carry the same chain, as claims in the access token (Route 1 and Route 3) or as claims supplied by the initiating hub on its own responsibility (Route 2, where the token subject is the organisation):

| KMEHR `request/author/hcparty` | Carried as | Requirement |
| :--- | :--- | :--- |
| `cd = hub`, `id[@S="ID-HCPARTY"]` = hub EHP number | `be:organization.ehp_number` / token `sub` | **SHALL** — established by hub authentication itself. |
| `cd = pers…` (practitioner), `id[@S="ID-HCPARTY"]` (NIHDI), `id[@S="INSS"]`, name | `be:practitioner.{nihdi, ssin, name, role}` where `role` is the `CD-HCPARTY` code | **SHALL** when a human practitioner is behind the request. |
| `cd = org…` (the practitioner's organisation) | `be:organization.{nihdi, cbe, name}` | **SHOULD**. |
| `cd = patient` — the patient acting for themselves through a portal | `be:patient_context.ssin` **plus** an explicit indication that the requester *is* the patient | **SHALL** when the end user is the patient. The responding hub cannot otherwise distinguish a clinician looking at a patient's file from the patient looking at their own, and the two are audited differently. |
| `cd = application` — end-user software, identified locally (`id[@S="LOCAL" @SL="endusersoftwareinfo"]`) | `be:software.{id, name, version}` | **SHOULD**. Identifies the product behind an automated call, which is what makes a misbehaving client traceable. |

Two properties of the legacy model carry over unchanged, and one is new:

* **The responding hub records, it does not verify.** These claims describe the end user; they are not an access decision, and the responding hub does not re-derive entitlement from them (§1.1).
* **The party type travels with the party.** Each entry carries its `CD-HCPARTY` code, exactly as `hcparty/cd` does today and as [`extension[hcPartyType]`](envelope-and-metadata.html#35-healthcare-party-type-beexthcpartytype) does in the response.
* **Unlike SOAP, the chain is now inside a signed token.** In KMEHR the author chain sat in the message body, signed as part of the envelope. In the RESTful model it belongs in the token or in a signed request component, never in an unauthenticated custom header — otherwise the audit trail records whatever the client felt like typing.

---

## 3. Replay Attack Prevention & Query Tamper-Proofing: DPoP (RFC 9449) & RFC 9421

### 3.1 The Challenge: Replacing Legacy SOAP SAML Request Signatures

In the legacy KMEHR SOAP ecosystem, every outbound transaction was protected by **WS-Security** and **SAML 2.0 XML-DSig**. The calling client signed the complete SOAP envelope (including `<wsu:Timestamp>`, `<wsse:Nonce>`, and the entire request body/query parameters) using its physical eHealth certificate. This guaranteed two essential security properties:
1. **Anti-Replay**: An eavesdropper or malicious actor could not capture an authorization token or query and re-execute it later.
2. **Query Tamper-Proofing**: A compromised proxy or rogue intermediary could not modify the query parameters (e.g. altering the patient SSIN or manipulating clinical category filters in transit).

A bare bearer token (`Authorization: Bearer <token>`) offers neither property. Intercept one and it can be replayed until it expires, or reused against a different set of URL parameters entirely. Two standardized HTTP-level mechanisms restore what the SOAP signature provided, and the Belgian Interhub specification evaluates both:

```mermaid
flowchart TD
    subgraph Request["<b>Initiating Client / Hub Request</b>"]
        URI["<b>HTTP Target Endpoint</b><br/>POST /DocumentReference/_search<br/>(Body: patient.identifier=ssin|...&category=...)"]
        Key["<b>Sender Private Key</b><br/>(DPoP Key or eHealth Enterprise Key)"]
    end

    subgraph SecurityHeaders["<b>Cryptographic Proof Headers</b>"]
        direction TB
        DPoP["<b>Option A: DPoP Proof (RFC 9449)</b><br/>• htu: https://hub.cozo.be/fhir/DocumentReference/_search<br/>• htm: POST<br/>• jti: unique-nonce-uuid<br/>• iat: current-timestamp"]
        HTTPsig["<b>Option B: HTTP Message Signature (RFC 9421)</b><br/>• @method: POST<br/>• @target-uri: https://hub.cozo.be/fhir/DocumentReference/_search<br/>• content-digest: sha-256=:...:<br/>• Signature-Input: keyid, created, nonce"]
    end

    subgraph TargetHub["<b>Responding eHealth Hub (Verification)</b>"]
        direction TB
        V1["1. Validate Bearer Token & Issuer Signature"]
        V2["2. Verify Proof Signature against Sender Key"]
        V3["3. Match Target URI / Query & Content Digest against Signed Proof"]
        V4["4. Check Freshness Window (30-60s) & Nonce Cache"]
    end

    URI --> SecurityHeaders
    Key --> SecurityHeaders
    SecurityHeaders -->|"HTTP Request + Proof Headers"| TargetHub
```

---

### 3.2 Option A: Demonstrating Proof-of-Possession (DPoP - RFC 9449)

**DPoP (RFC 9449)** is the IETF and SMART on FHIR approach to sender-constraining OAuth 2.0 access tokens: each REST call is bound to an asymmetric key pair that only the client holds.

#### Mechanics & Workflow:
1. The calling hub generates an asymmetric key-pair (RSA or ECDSA) and creates a signed **DPoP Proof JWT** for every outbound HTTP request.
2. The DPoP header binds the exact HTTP method (`htm`), target HTTP URI (`htu`), timestamp (`iat`), unique identifier (`jti`), and an optional server-provided `nonce`.
3. The responding hub:
   * Validates that the access token is thumbprint-bound (`cnf.jkt`) to the public key in the DPoP header.
   * Confirms that `htu` and `htm` match the incoming request.
   * Verifies that the `iat` timestamp is within the acceptable freshness window (**30 to 60 seconds**) and checks `jti` against a replay cache.
   * Rejects any request where query parameters, URIs, or bodies were manipulated in transit.

#### Sample DPoP HTTP Request:
```http
POST /fhir/DocumentReference/_search HTTP/1.1
Host: hub.cozo.be
Content-Type: application/x-www-form-urlencoded
Authorization: DPoP eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCIsImN0eSI6IkpXVCJ9...
DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7Imt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiZ...

patient.identifier=https%3A%2F%2Fwww.ehealth.fgov.be%2Fstandards%2Ffhir%2Fcore%2FNamingSystem%2Fssin%7C79080412345&category=https%3A%2F%2Fwww.ehealth.fgov.be%2Fstandards%2Ffhir%2Fcore%2FCodeSystem%2Fcd-transaction%7Clabresult
```

#### Decoded DPoP Proof Header (`DPoP` JWT):
```json
{
  "header": {
    "typ": "dpop+jwt",
    "alg": "ES256",
    "jwk": {
      "kty": "EC",
      "crv": "P-256",
      "x": "f83OJ3D2xFmT4v7...",
      "y": "x_da7WjWiqOW0C6..."
    }
  },
  "payload": {
    "jti": "b59a86a6-9907-4279-8b6a-939e4a3b1a8d",
    "htm": "POST",
    "htu": "https://hub.cozo.be/fhir/DocumentReference/_search",
    "iat": 1773763200,
    "nonce": "k3L90xPz-1m9"
  }
}
```

---

### 3.3 Option B: HTTP Message Signatures (RFC 9421)

Belgian regulation may yet require that the audit trail be signed with the institution's official **eHealth Enterprise Certificate (X.509)** rather than an ephemeral OAuth client key. **RFC 9421 (HTTP Message Signatures)** covers that case, signing the HTTP message itself.

#### Mechanics & Workflow:
1. The calling system signs the HTTP request components (`@method`, `@target-uri`, `content-type`, `content-digest`, and `authorization`) using its official Belgian eHealth private key.
2. The request carries standard `Signature-Input`, `Signature`, and `Content-Digest` headers.
3. The responding hub validates the signature against the eHealth certificate trust chain, verifying that no payload parameters (including `patient.identifier` and `category`) were altered.

#### Sample RFC 9421 HTTP Request:
```http
POST /fhir/DocumentReference/_search HTTP/1.1
Host: hub.cozo.be
Content-Type: application/x-www-form-urlencoded
Content-Digest: sha-256=:X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7k8BiMH0A=:
Authorization: Bearer eyJhbGciOiJSUzI1Ni...
Signature-Input: sig1=("@method" "@target-uri" "content-type" "content-digest" "authorization");created=1773763200;keyid="ehealth:cbe:0419052173";nonce="8f2a9e3d";alg="rsa-v1_5-sha256"
Signature: sig1=:MEUCIQDxZ8Y7j...kL9A1wP==:

patient.identifier=https%3A%2F%2Fwww.ehealth.fgov.be%2Fstandards%2Ffhir%2Fcore%2FNamingSystem%2Fssin%7C79080412345&category=https%3A%2F%2Fwww.ehealth.fgov.be%2Fstandards%2Ffhir%2Fcore%2FCodeSystem%2Fcd-transaction%7Clabresult
```

---

### 3.4 Alignment with the Three Proposed Authentication Routes

How tamper-proofing attaches to each of the three proposed routes:

| Security Dimension | Proposal 1: Hub-Issued JWTs (Direct Federation) | Proposal 2: eHealth Platform IAM (National AS, M2M) | Proposal 3: STS Token Exchange Bridge (RFC 8693) |
| :--- | :--- | :--- | :--- |
| **Tamper-Proofing Standard** | **DPoP (RFC 9449)** or **RFC 9421** | **DPoP (RFC 9449)** with eHealth IAM AS | **RFC 9421** / Gateway-enforced DPoP |
| **Signing Key** | Hub private key (published via JWKS) | Client DPoP key or eHealth Enterprise Cert | Legacy X.509 Keystore / STS Gateway Key |
| **Signed Elements** | `htm`, `htu` (Target URI), `jti`, `iat`, `nonce` | `htm`, `htu`, `jti`, `iat`, IAM Nonce | `@method`, `@target-uri`, SAML assertions |
| **Freshness Window** | 30–60 seconds | 30–60 seconds | Enforced by STS token exchange TTL |
| **SOAP Equivalence** | Equivalent to SAML XML-DSig | Equivalent to SAML XML-DSig | Translates SAML XML-DSig directly |

---

## 4. Division of Responsibility Between Initiating and Responding Hub

The table below restates the trust model of §1.1 as a checklist for implementers:

| Concern | Initiating Hub | Responding Hub |
| :--- | :--- | :--- |
| **Identifying and authenticating the end user** (practitioner, application, patient portal) | Yes — locally, before any Interhub call | No |
| **Establishing informed consent (IC) and therapeutic links** | Yes — e.g. by querying the Metahub, or from its own local database | No |
| **Applying local rules on confidentiality and patient access metadata** | Yes | No |
| **Deciding that an Interhub request is lawful** | Yes | No — it trusts the calling hub |
| **mTLS and calling-hub authentication** | Presents its credentials | Yes |
| **Replay / tamper-proofing (DPoP or RFC 9421)** | Signs the request | Verifies the proof |
| **Query syntax and profile conformance** | Builds a valid query | Yes |
| **Audit logging (IHE BALP `AuditEvent`)** | Yes — including the access decision | Yes — including the identity of the calling hub |

Consequently, a responding hub **MUST NOT** answer an Interhub query with an access-related refusal such as *"no therapeutic link"* or *"no informed consent"*: it has neither the information nor the mandate to make that determination. Requests that fail hub authentication or tamper-proofing are of course rejected on technical grounds (`401` / `403`), and a hub may still refuse a syntactically invalid or unsupported query.

---

## 5. Audit Trail & Traceability (from `getTransactionAccessList` to IHE BALP)

Under the Patient Rights Act and the eHealth Platform Law, every access, search and retrieval of a medical record must be recorded immutably. The legacy KMEHR world discharged this through the `getTransactionAccessList` SOAP service, which exposed the access logs on request.

Because the responding hub trusts the calling hub, the audit trail on both sides is what makes an Interhub exchange reconstructable after the fact: the initiating hub logs the access decision it made and the identity of the end user it made it for, and the responding hub logs which hub asked for what.

In the FHIR Interhub standard, auditing is standardized using **IHE BALP (Basic Audit Logging Pattern)** and **IHE ATNA** generating FHIR **`AuditEvent`** resources. The `subtype` values below (`ITI-67`, `ITI-68`, and `PCC-44` for the laboratory observation search, which is based on IHE QEDm) refer to the three transactions specified in [Transactions](transactions.html). The query parameters of a `PCC-44` search (patient SSIN and LOINC codes) are recorded in the query entity exactly as for `ITI-67`, and the document identifiers logged as entities come from the envelope specified in [Envelope & Metadata](envelope-and-metadata.html):

```mermaid
classDiagram
    class AuditEvent {
        +type: DCM #110112 ("Query") / #110106 ("Export")
        +subtype: ITI-67 ("FindDocumentReferences") / ITI-68 ("RetrieveDocument") / PCC-44 ("MobileQueryExistingData")
        +action: "E" (Execute) / "R" (Read)
        +recorded: 2026-03-15T10:30:05Z (instant)
        +outcome: "0" (Success) / "4" (Minor failure)
    }
    class AgentPractitioner {
        +type: Practitioner (Requestor)
        +identifier: NIHDI 19876543201 / SSIN 65031212345
        +name: Dr. Jean Depondt
    }
    class AgentOrganization {
        +type: Healthcare Organization
        +identifier: NIHDI 71000012 / CBE 0419052173
        +name: UZ Leuven
    }
    class AgentHub {
        +type: Regional Hub Gateway
        +identifier: urn:oid:1.3.6.1.4.1.21297.1.3 (CoZo)
    }
    class EntityPatient {
        +type: Patient (Subject)
        +identifier: SSIN 79080412345
    }
    class EntityDocument {
        +type: DocumentReference / Bundle
        +what: urn:oid:1.3.6.1.4.1.21297.100.2.1.815933567
    }

    AuditEvent --> AgentPractitioner : agent[0]
    AuditEvent --> AgentOrganization : agent[1]
    AuditEvent --> AgentHub : agent[2]
    AuditEvent --> EntityPatient : entity[0]
    AuditEvent --> EntityDocument : entity[1]
```

The `agent` entries above are exactly the parties named in the request author chain of [§2.4](#24-carrying-the-end-user-chain-the-kmehr-requestauthor-equivalent) — that chain exists so that this `AuditEvent` can be written. Where the end user is the patient rather than a clinician, that fact must be visible in the audit record.

These `AuditEvent` records are retained by the answering hubs for the legally mandated period (minimum 10 years in Belgium) and made accessible to patients via national transparency portals.

> **The legacy audit-trail *query* has no FHIR counterpart in this IG yet.** KMEHR hubs and the Metahub expose the recorded accesses through `getPatientAuditTrail` — a filtered query over the audit log by patient, date range, accessing party and operation, returned to the patient or to the hub acting for them. Standardising `AuditEvent` writing without also standardising how those records are read back leaves the Patient Rights Act obligation only half discharged. The FHIR shape is not in doubt (a constrained `AuditEvent` search: `AuditEvent?patient=…&date=ge…&agent=…&_count=…`); what is missing is the profile, the search-parameter set and the statement of who may call it. Tracked in the project TODO.

---

## Continue reading

* **Previous:** [Transactions](transactions.html) — the ITI-67 / ITI-68 calls secured by this page.
* **Next:** [End-to-End Encryption](end-to-end-encryption.html) — the separate, non-normative question of encrypting the payload itself on top of the transport security specified here.
* **Related:** [Architecture §5](architecture.html#5-trust-model-security-architecture--connection-routes-proposal) for the same trust model in summary form; [Envelope & Metadata §3.2](envelope-and-metadata.html#32-belgian-patient-access-metadata-beextpatientaccess) for the patient-access metadata an initiating hub enforces.
