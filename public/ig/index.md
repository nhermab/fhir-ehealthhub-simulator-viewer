# Belgian Interhub FHIR Document Sharing Implementation Guide

## Executive Summary & Context

During the last 15 years, medical information has been exchanged in the national project of the eHealth hubs and vaults using XML messages according to the Belgian **KMEHR** standard.
KMEHR (Kind Messages for Electronic Healthcare Records) was developed about a decade earlier, before IHE profiles such as XDS and healthcare document formats such as CDA existed.

KMEHR was one enabling factor in the Belgian eHealth system, not because this particular standard was inherently superior to any other one, but because there was at least *a* standard that could evolve to support Belgian projects.
For many of those projects, neighboring countries either had no implementation yet or had implementations that evolved only slowly over many years.

The situation is quite different today:

* For medical content, the relatively recent FHIR standard is internationally embraced, as are the resources it proposes.
  Belgium is using FHIR in its standardization efforts for new applications, although FHIR documents are often wrapped in a KMEHR message for communication over the current systems.
* For the technical aspects of communication, HTTP-style calls between systems are replacing calls that use the more complicated and less universally known SOAP framework, potentially in a RESTful architectural style that enables distributed applications to scale enormously.
* The EHDS (European Health Data Space) is no longer a mere aspiration; it is already shaping our practical efforts.

The time seems right to move to an **HL7® FHIR® Release 4-based** architecture for new applications in the system of the eHealth hubs and vaults, and for a gradual migration of what has already been realized.
More specifically, the **IHE MHD (Mobile access to Health Documents)** family of profiles would be used.

This text proposes an Implementation Guide (IG), a **normative technical specification** for communication in this system that benefits from being standardized and is informally termed **Interhub communication**.
The [Architecture & Federation Model](architecture.html) page provides a more precise definition.
Interhub communication is likely to be extended to communication with the cross-border gateways in the EHDS National Contact Points.

The [How to Read This Guide](#how-to-read-this-guide) section explains how the guide is organised.

---

## Core Architectural Principles

```mermaid
flowchart TD
    subgraph OutOfScope["<b>Local Clinical Domain (OUT OF SCOPE)</b>"]
        direction TB
        Apps["<b>Clinical Applications & Source Systems</b><br/>• Hospital EHR / LIS<br/>• Regional / Patient Portals<br/>• Telemonitoring Platforms / Apps"]
        IntraEP["<b>Local Hub Intrahub Endpoint</b><br/>(KMEHR or internal protocols / standards)"]
        Apps -->|"Intrahub communication<br/>(local protocols)"| IntraEP
    end

    subgraph InScope["<b>Belgian Federated Interhub Network (IN SCOPE)</b>"]
        direction TB
        InitHub["<b>Initiating eHealth Hub</b><br/>• Local Access Control & Consent Check<br/>• Metahub Patient-Link Resolution"]

        subgraph RespondingHub["<b>Responding eHealth Hub(s)</b>"]
            direction TB
            subgraph Discovery["<b>Discovery Layer (getTransactionList / ITI-67)</b>"]
                DocRef["<b>BeInterhubDocumentReference</b><br/>• SSIN, NIHDI, CBE Identifiers<br/>• CD-TRANSACTION & LOINC<br/>• BeExtPatientAccess & HomeCommunityId"]
            end

            subgraph Payload["<b>Payload Layer (getTransaction / ITI-68)</b>"]
                Bundle["<b>BeInterhubDocumentBundle (Bundle.type = #document)</b><br/>• Self-Contained Immutable Snapshot<br/>• Mandatory XHTML Narrative"]
                Lab["<b>Laboratory Reports</b><br/>(BeInterhubLabComposition)"]
                TM["<b>Telemonitoring Sessions</b><br/>(BeTelemonitoringComposition)"]
                Bundle --> Lab
                Bundle --> TM
            end

            Discovery -.->|"content.attachment.url"| Payload
        end

        InitHub -->|"1. Interhub Metadata Discovery (ITI-67)"| Discovery
        InitHub -->|"2. Interhub Payload Retrieval (ITI-68)"| Payload
    end

    subgraph CrossBorder["<b>European Interoperability</b>"]
        EHDS["<b>EHDS / MyHealth@EU</b><br/>(via Belgian NCPeH as initiating/responding Hub)<br/>• DocumentReferenceEu<br/>• Composition-eu-lab / HDR"]
    end

    IntraEP -->|"Initiates cross-hub federation"| InitHub
    InScope <===>|"Interhub Cross-Border Exchange"| CrossBorder
```

1. **Document-Centric Sharing** *(rationale: [Design Rationale](resource-considerations.html))*:
   Except for very particular use cases for which a dedicated API has been agreed, Interhub communication shares **documents**, not individual resources directly.
   Even where it makes sense to communicate individual resources, they are wrapped in a **FHIR Bundle of type `document`** (`Bundle.type = #document`).
   Each document bundle contains a root `Composition` resource providing document metadata, information about the author or authors, and human-readable narrative sections, followed by the individual clinical resources (e.g. `DiagnosticReport`, `Observation`, `Specimen`, `Device`, `CarePlan`, `Patient`, `Practitioner`, or `Organization`).

   The rationale is detailed in [Design Rationale](resource-considerations.html): generic concepts and implementations based on a list of documents allow a user or system to select the documents likely to be relevant for nearly any project.
   Basic or older systems that do not know the specifics of a new project should still be able to present the available information, albeit without leveraging the new possibilities.
   More advanced or more recent systems can exploit the additional granularity by extracting the individual resources from the bundles.
   In addition, the transport mechanism need not directly reflect the most appropriate structure at the Data Source or in the data consumer's system, but should remain stable for a long time.

   **PDF files**, **DICOM objects** and **pre-existing KMEHR documents** remain shareable throughout, so nothing already in circulation has to be re-authored to stay visible.

2. **Decoupled Metadata Discovery Envelope (`DocumentReference`)** *(specified in [Envelope & Metadata](envelope-and-metadata.html))*:
   Document discovery across the federated hubs is powered by the **`BeInterhubDocumentReference`** profile.
   This metadata envelope provides the modern equivalent of the KMEHR `TransactionSummaryType` and the ebXML RIM `XDSDocumentEntry`, carrying essential discovery parameters, Belgian national identifiers (SSIN/INSS, NIHDI, CBE), Belgian patient access rules, and endpoint URIs for retrieving the document payload.

3. **Interhub Transactions & Operations** *(specified in [Transactions](transactions.html); secured as described in [Security & Authentication](security.html))*:
   * **`getTransactionList`** is mapped to **IHE MHD ITI-67 (`Find DocumentReferences`)** via `POST [base]/DocumentReference/_search`, allowing an initiating hub to query for available document metadata summaries matching patient identity and filter criteria across partner hubs using POST request bodies to prevent patient identifier leakage in network access logs.
   * **`getTransaction`** is mapped to the Belgian FHIR **`$retrieve-document`** operation (`POST [base]/DocumentReference/$retrieve-document`), returning the complete immutable FHIR Document Bundle (`type = #document`) or binary/encapsulated document to the initiating hub, with gateway resolution to IHE MHD ITI-68.
   * **Strict Hub-to-Hub Boundary**: Only hubs execute Interhub transactions.
     Clinical clients connect to their local Hub via Intrahub endpoints (out of scope), and the local Hub initiates Interhub requests as required.

4. **EHDS (European Health Data Space) Alignment** *(analysed in [EHDS Alignment](ehds-alignment.html))*:
   The Belgian Interhub profiles are built to align with EHDS cross-border specifications: **EU Laboratory Results**, **EU Hospital Discharge Reports**, **EU Patient Summaries** and **EU Imaging**.
   Belgium provides more functionality than the European baseline asks for — routing across several federated hubs, national consent registers, document-level patient access metadata — but never less, and every shared structure stays readable at both ends.

5. **Fully Developed Proposals for Recent Belgian Projects**:
   * **Laboratory Reports (`labresult`)**: Full specification for laboratory report document bundles conforming to HL7 Belgium `BeLaboratoryReport` and EHDS `Composition-eu-lab` — see [Laboratory Reports](lab-report-sharing.html).
   * **Telemonitoring (`telemonitoring`)**: Specification for remote patient monitoring sessions, holter studies, carepaths, and telemonitoring diagnostic reports — see [Telemonitoring](mapping-telemonitoring-to-hub.html).

---

## How to Read This Guide

The navigation bar groups this specification into five sections, ordered so that each section only depends on the ones to its left.
Within the guide, **every topic is described on a separate page**.
Where a page mentions content described elsewhere, it links to the relevant page at that point.
Every page ends with a *Continue reading* box listing its previous, next and related pages.

```mermaid
flowchart LR
    Home["<b>Home</b><br/>context & principles"]

    subgraph Arch["<b>1. Architecture</b>"]
        direction TB
        A1["Architecture &<br/>Federation Model"]
        A2["Design Rationale<br/><i>(why documents?)</i>"]
        A1 --> A2
    end

    subgraph Spec["<b>2. Specification</b> (normative)"]
        direction TB
        S1["Envelope & Metadata<br/><i>(what a record looks like)</i>"]
        S2["Transactions<br/><i>(how it is fetched)</i>"]
        S3["Security & Authentication<br/><i>(who may fetch it)</i>"]
        S4["End-to-End Encryption<br/><i>(discussion paper)</i>"]
        S1 --> S2 --> S3 --> S4
    end

    subgraph Docs["<b>3. Document Types</b>"]
        direction TB
        D1["Laboratory Reports"]
        D2["Telemonitoring"]
        D1 --- D2
    end

    subgraph Align["<b>4. Migration & Alignment</b>"]
        direction TB
        M1["KMEHR to FHIR Mapping<br/><i>(legacy, inward)</i>"]
        M2["IHE MHD Alignment<br/><i>(profile choices & WG options)</i>"]
        M3["Minimal vs. Comprehensive<br/><i>(technical comparison)</i>"]
        M4["EHDS Alignment<br/><i>(Europe, outward)</i>"]
        M1 --> M2 --> M3 --> M4
    end

    Ref["<b>5. Artifacts</b><br/>profiles, extensions,<br/>examples"]

    Home --> Arch --> Spec --> Docs --> Align --> Ref
```

* **Reading the guide end to end** — follow the navigation bar left to right, in the order shown above.
* **Already familiar with the Belgian hub architecture?**
  Start at [Envelope & Metadata](envelope-and-metadata.html) and [Transactions](transactions.html); they are the normative core.
  [Design Rationale](resource-considerations.html) answers *"why not FHIR messaging or `GET /Observation`?"* if that is your first question.
* **Migrating an existing KMEHR connector?**
  Read [Architecture §4 (dual-stack gateway)](architecture.html#4-dual-stack-gateway-architecture-transition-phase), then [KMEHR to FHIR Mapping](mapping-kmehr-to-hub.html).
* **Implementing one document type?**
  Read [Envelope & Metadata](envelope-and-metadata.html) and [Transactions](transactions.html) once, then only your domain page: [Laboratory Reports](lab-report-sharing.html) or [Telemonitoring](mapping-telemonitoring-to-hub.html).

### Architecture — the ecosystem, and the reasoning behind it

| Page | What it covers | Topics this page owns |
| :--- | :--- | :--- |
| **[Architecture & Federation Model](architecture.html)** | The Belgian Hub/Metahub network, regional eHealth hubs, what counts as a hub source, federated routing, and the dual-stack transition gateway. | Hub / metahub / hub source model · `homeCommunityId` routing · dual-stack gateway. Security and transactions appear here only in summary. |
| **[Design Rationale](resource-considerations.html)** | Why Interhub shares FHIR *documents* discovered through a `DocumentReference` envelope, and why FHIR messaging and granular resource access were rejected. | Carrier-paradigm evaluation · document immutability · rationale for decoupled discovery. |

### Specification — the normative contract

| Page | What it covers | Topics this page owns |
| :--- | :--- | :--- |
| **[Envelope & Metadata](envelope-and-metadata.html)** | `BeInterhubDocumentReference` element by element: national identifiers, Belgian extensions, MIME and language rules, UTC normalization. | **Every metadata field and extension in the guide.** Other pages give values; this page gives definitions. |
| **[Transactions](transactions.html)** | `getTransactionList` (`POST _search`) and `getTransaction` (`POST $retrieve-document`): wire contracts, search parameters, response bundles, partial-failure handling, error crosswalk. | The wire-level contract · `OperationOutcome` on downstream failure · HTTP status codes. |
| **[Security & Authentication](security.html)** | The Interhub trust model (the initiating hub owns access control), the three hub authentication routes, mTLS, DPoP (RFC 9449) / RFC 9421 tamper-proofing, and IHE BALP auditing. | **All security topics.** [Architecture §5](architecture.html#5-trust-model-security-architecture--connection-routes-proposal) is a two-paragraph summary of this page; this page takes precedence. |
| **[End-to-End Encryption](end-to-end-encryption.html)** | *Discussion paper.* KMEHR ETEE versus FHIR E2EE, JWE and CMS payload encryption, zero-knowledge hubs, and the recommended tiered hybrid strategy. | The open question of payload encryption. **Non-normative** — it does not change what [Security & Authentication](security.html) mandates. |

### Document Types — the payloads in practice

| Page | What it covers | Topics this page owns |
| :--- | :--- | :--- |
| **[Laboratory Reports](lab-report-sharing.html)** | End-to-end sharing of laboratory reports as FHIR Document Bundles, with a complete worked JSON example. | `BeInterhubLabComposition` · LOINC section codes per laboratory specialty. |
| **[Telemonitoring](mapping-telemonitoring-to-hub.html)** | End-to-end sharing of telemonitoring and remote patient monitoring sessions, with a complete worked JSON example. | `BeTelemonitoringComposition` · `TelemonitoringDiagnosticReport` · TMP JSON transformation. Its source message is shown in [TMP Base Message](tmp-base-message.html). |

Both pages assume [Envelope & Metadata](envelope-and-metadata.html) and [Transactions](transactions.html); they specify only what is domain-specific.

### Migration & Alignment — legacy KMEHR and Europe

| Page | What it covers | Topics this page owns |
| :--- | :--- | :--- |
| **[KMEHR to FHIR Mapping](mapping-kmehr-to-hub.html)** | Field-by-field crosswalk between KMEHR XML, IHE XDS.b ebXML and FHIR MHD, plus the KMEHR encapsulation strategy for the transition period. | All KMEHR ↔ FHIR field and code-system mappings, referenced from every other page. |
| **[IHE MHD Alignment](ihe-mhd-alignment.html)** | Comparison of MHD Minimal vs Comprehensive vs UnContained vs Contained profiles, N+1 rationale, resolution of federal `author 1..1` cap, and open working group topics. | All IHE MHD profile comparison debates, contained resource rationale, and unresolved working group discussion items. |
| **[Minimal vs. Comprehensive](minimal-vs-comprehensive.html)** | Direct side-by-side element comparison table and use case suitability matrix between `BeInterhubMinimalDocumentReference` and `BeInterhubDocumentReference`. | Technical comparison between Minimal and Comprehensive Belgian DocumentReference profiles. |
| **[EHDS Alignment](ehds-alignment.html)** | Alignment with European Health Data Space profiles and the MyHealth@EU cross-border exchange flow. | Belgian ↔ EU profile matrix · what Belgium adds beyond baseline EHDS · NCPeH translation. |

### Reference

| Page | What it covers |
| :--- | :--- |
| **[Artifacts](artifacts.html)** | Machine-readable directory of all FHIR profiles, extensions, value sets, code systems, capability statements and examples defined by this guide. |

---

## Key Artifacts Overview

* **Profiles**:
  * `BeInterhubDocumentReference`: Metadata discovery envelope for search results (`getTransactionList`), deriving from `IHE.MHD.Comprehensive.DocumentReference` with contained references.
  * `BeInterhubMinimalDocumentReference`: Lightweight metadata discovery envelope deriving from `IHE.MHD.Minimal.DocumentReference` for edge/mobile ingest.
  * `BeInterhubDocumentBundle`: Canonical FHIR Document Bundle (`type = #document`) for document retrieval (`getTransaction`).
  * `BeInterhubLabComposition`: Root Composition for Laboratory Reports.
  * `BeTelemonitoringComposition`: Root Composition for Telemonitoring and remote monitoring sessions.
  * `TelemonitoringDiagnosticReport`: DiagnosticReport profile carrying telemonitoring session parameters and results.
* **Extensions**:
  * `BeExtPatientAccess`: Belgian patient access permissions (`yes`, `no`, `never`), release dates, and withholding reasons.
  * `BeExtHomeCommunityId`: Hub Home Community ID for cross-hub routing.
  * `BeExtEndToEndEncryption`: Belgian eHealth ETK depot encryption metadata for end-to-end secure transmission.
  * `BeExtRecordDateTime`: Source repository recording timestamp.
  * `BeExtHcPartyType`: KMEHR `CD-HCPARTY` type of an author, authenticator or custodian, carried inline in the metadata envelope.
  * `TelemonitoringId`, `Carepath`, `PrescriberApplication`, `SourceTelemonitoringReport`: Telemonitoring metadata extensions.
* **Capability Statements**:
  * `BeInterhubDocumentResponder`: Server requirements for eHealth Hubs and Document Registries/Repositories.
  * `BeInterhubDocumentConsumer`: Client requirements for initiating eHealth hubs and cross-border gateways in Interhub federated communication.

* **National profiles this guide builds on** (not redefined here):
  * [`BePatient`](https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-patient), [`BePractitioner`](https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-practitioner), [`BePractitionerRole`](https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-practitionerrole), [`BeOrganization`](https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-organization) and [`BeAddress`](https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-address) from **`hl7.fhir.be.core`** — embedded as `#contained` resources inside the metadata envelope.
  * [`BeObservation`](https://www.ehealth.fgov.be/standards/fhir/core-clinical/StructureDefinition/be-observation) from **`hl7.fhir.be.core-clinical`**, used for every clinical measurement carried inside a document bundle.
  * Derivation from `IHE.MHD.Comprehensive.DocumentReference` enables `author 1..*` with contained references while maintaining full national identity semantics (see [IHE MHD Alignment](ihe-mhd-alignment.html)).

The full, machine-readable index of every profile, extension, value set and example is on the [Artifacts](artifacts.html) page.
To start reading the specification itself, continue with **[Architecture & Federation Model](architecture.html)**.
