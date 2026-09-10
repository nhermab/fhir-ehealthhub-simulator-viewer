// =========================================================================
// Profile: Belgian Interhub Minimal DocumentReference (IHE MHD Minimal)
// =========================================================================
Profile: BeInterhubMinimalDocumentReference
Parent: IHE.MHD.Minimal.DocumentReference
Id: be-interhub-minimal-documentreference
Title: "Belgian Interhub Minimal DocumentReference (IHE MHD Minimal)"
Description: "Lightweight Belgian metadata carrier profile for health document discovery and retrieval based on IHE.MHD.Minimal.DocumentReference. Intended for mobile ingest, edge nodes, simplified publication, or non-clinical document references where mandatory Comprehensive attributes (such as facilityType, practiceSetting, contained sourcePatientInfo snapshot, or mandatory creation timestamp) are not required or not available."

* ^status = #active
* ^version = "0.2.0"

// -------------------------------------------------------------------------
// Belgian National Extensions
// -------------------------------------------------------------------------
* extension contains
    BeExtHomeCommunityId named homeCommunityId 1..1 MS and
    BeExtPatientAccess named patientAccess 0..1 MS and
    BeExtEndToEndEncryption named endToEndEncryption 0..1 MS and
    BeExtRecordDateTime named recordDateTime 0..1 MS

* extension[homeCommunityId] ^short = "Home Community ID (or EHP number) of the regional hub hosting the document"
* extension[patientAccess] ^short = "Belgian patient access and visibility rules"
* extension[endToEndEncryption] ^short = "ETK depot encryption metadata (if payload is encrypted)"
* extension[recordDateTime] ^short = "Timestamp when the document was recorded in the hub source system"

// -------------------------------------------------------------------------
// Identifiers & Status
// -------------------------------------------------------------------------
* masterIdentifier 1..1 MS
* masterIdentifier ^short = "Master globally unique document identifier (RFC 3986 URI, e.g. urn:oid:... or urn:uuid:...)"
* masterIdentifier.system 1..1 MS
* masterIdentifier.value 1..1 MS

* identifier contains
    uniqueId 0..1 MS and
    localId 0..* MS

* identifier[uniqueId] 0..1 MS
* identifier[uniqueId] ^short = "Universal document entry identifier (mirrors masterIdentifier)"

* identifier[entryUUID] 0..1 MS
* identifier[entryUUID] ^short = "Business identifier for the DocumentReference entry itself (urn:uuid:...)"

* identifier[localId] ^short = "Hub source internal identifier (KMEHR transaction/id[@S=LOCAL])"
* identifier[localId].system 1..1 MS
* identifier[localId].value 1..1 MS

* status 1..1 MS
* status from DocumentReferenceStats (required)

// -------------------------------------------------------------------------
// Category & Clinical Type (Optional in Minimal)
// -------------------------------------------------------------------------
* category 0..1 MS
* category from BeVSCDTransaction (extensible)
* category.coding 0..* MS
* category.coding ^slicing.discriminator.type = #value
* category.coding ^slicing.discriminator.path = "system"
* category.coding ^slicing.rules = #open
* category.coding contains cdTransactionCode 0..1 MS
* category.coding[cdTransactionCode].system = "https://www.ehealth.fgov.be/standards/fhir/core/CodeSystem/cd-transaction" (exactly)
* category.coding[cdTransactionCode].code 1..1 MS

* type 0..1 MS
* type.coding 0..* MS
* type.coding.system 0..1 MS
* type.coding.code 0..1 MS

// -------------------------------------------------------------------------
// Subject & Author References
// -------------------------------------------------------------------------
* subject 1..1 MS
* subject only Reference($BePatient)
* subject.identifier 1..1 MS
* subject.identifier.system = $BE-NS-SSIN
* subject.identifier ^short = "Patient SSIN/INSS identifier carried inline"

* author 0..* MS
* author only Reference($BePractitioner or $BePractitionerRole or $BeOrganization or Device or $BePatient or RelatedPerson)
* author.extension contains BeExtHcPartyType named hcPartyType 0..1 MS
* author ^short = "Authoring parties (may be external or contained references)"

* authenticator 0..1 MS
* authenticator only Reference($BePractitioner or $BePractitionerRole or $BeOrganization)
* authenticator.extension contains BeExtHcPartyType named hcPartyType 0..1 MS

* custodian 0..1 MS
* custodian only Reference($BeOrganization)
* custodian.extension contains BeExtHcPartyType named hcPartyType 0..1 MS

// -------------------------------------------------------------------------
// Relationships
// -------------------------------------------------------------------------
* relatesTo 0..* MS
* relatesTo.code 1..1 MS
* relatesTo.target 1..1 MS
* relatesTo.target.identifier 1..1 MS
* relatesTo.target.identifier.system = "urn:ietf:rfc:3986" (exactly)
* relatesTo.target.identifier.value 1..1 MS

// -------------------------------------------------------------------------
// Content & Context (Minimal metadata)
// -------------------------------------------------------------------------
* securityLabel 0..* MS
* securityLabel from http://terminology.hl7.org/ValueSet/v3-Confidentiality (extensible)

* content 1..1 MS
* content.attachment.contentType 1..1 MS
* content.attachment.url 1..1 MS
* content.attachment.language 0..1 MS
* content.attachment.creation 0..1 MS
* content.format 0..1 MS
* content.format from BeVSInterhubFormatCodes (extensible)

* context 0..1 MS
* context.facilityType 0..1 MS
* context.practiceSetting 0..1 MS
* context.period 0..1 MS
* context.sourcePatientInfo 0..1 MS
* context.sourcePatientInfo only Reference($BePatient)
