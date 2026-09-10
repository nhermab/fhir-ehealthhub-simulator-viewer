// =========================================================================
// Profile: Belgian Interhub DocumentReference (IHE MHD Comprehensive)
// =========================================================================
Profile: BeInterhubDocumentReference
Parent: IHE.MHD.Comprehensive.DocumentReference
Id: be-interhub-documentreference
Title: "Belgian Interhub DocumentReference (IHE MHD Comprehensive)"
Description: "Belgian metadata carrier profile for health document discovery (MHD ITI-67 / getTransactionList) and document retrieval (MHD ITI-68 / getTransaction). Conforms strictly to IHE MHD Comprehensive DocumentReference with Contained References, embedding national Belgian core profiles (BePatient, BePractitioner, BeOrganization) to convey multi-author attribution and patient demographics without cross-hub dereferencing."

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
// Category & Clinical Type
// -------------------------------------------------------------------------
* category 1..1 MS
* category from BeVSCDTransaction (extensible)
* category.coding 1..* MS
* category.coding ^slicing.discriminator.type = #value
* category.coding ^slicing.discriminator.path = "system"
* category.coding ^slicing.rules = #open
* category.coding contains cdTransactionCode 1..1 MS
* category.coding[cdTransactionCode].system = "https://www.ehealth.fgov.be/standards/fhir/core/CodeSystem/cd-transaction" (exactly)
* category.coding[cdTransactionCode].code 1..1 MS

* type 1..1 MS
* type.coding 1..* MS
* type.coding.system 1..1 MS
* type.coding.code 1..1 MS

// -------------------------------------------------------------------------
// Subject & Contained SourcePatientInfo
// -------------------------------------------------------------------------
* subject 1..1 MS
* subject only Reference($BePatient)
* subject.identifier 1..1 MS
* subject.identifier.system = $BE-NS-SSIN
* subject.identifier ^short = "Patient SSIN/INSS identifier carried inline"

* context 1..1 MS
* context.sourcePatientInfo 1..1 MS
* context.sourcePatientInfo only Reference($BePatient)
* context.sourcePatientInfo ^type.aggregation = #contained
* context.sourcePatientInfo ^short = "Contained BePatient resource providing snapshot demographic data"

// -------------------------------------------------------------------------
// Contained Authors, Authenticator, Custodian
// -------------------------------------------------------------------------
* author 1..* MS
* author only Reference($BePractitioner or $BePractitionerRole or $BeOrganization or Device or $BePatient or RelatedPerson)
* author ^type.aggregation = #contained
* author.extension contains BeExtHcPartyType named hcPartyType 0..1 MS
* author ^short = "Contained authoring parties (Answering Hub, Hospital/Lab Organisation, Practitioner, Software)"

* authenticator 0..1 MS
* authenticator only Reference($BePractitioner or $BePractitionerRole or $BeOrganization)
* authenticator ^type.aggregation = #contained
* authenticator.extension contains BeExtHcPartyType named hcPartyType 0..1 MS
* authenticator ^short = "Contained legal validating party"

* custodian 0..1 MS
* custodian only Reference($BeOrganization)
* custodian.extension contains BeExtHcPartyType named hcPartyType 0..1 MS

// -------------------------------------------------------------------------
// Relationships (Logical Business Identifier Target)
// -------------------------------------------------------------------------
* relatesTo 0..* MS
* relatesTo.code 1..1 MS
* relatesTo.target 1..1 MS
* relatesTo.target.identifier 1..1 MS
* relatesTo.target.identifier.system = "urn:ietf:rfc:3986" (exactly)
* relatesTo.target.identifier.value 1..1 MS
* relatesTo.target.identifier ^short = "uniqueId of the related document (RFC 3986 URI)"

// -------------------------------------------------------------------------
// Mandatory MHD Comprehensive Content & Context Fields
// -------------------------------------------------------------------------
* securityLabel 1..* MS
* securityLabel from http://terminology.hl7.org/ValueSet/v3-Confidentiality (extensible)

* content 1..1 MS
* content.attachment.contentType 1..1 MS
* content.attachment.language 1..1 MS
* content.attachment.url 1..1 MS
* content.attachment.creation 1..1 MS
* content.format 1..1 MS
* content.format from BeVSInterhubFormatCodes (extensible)

* context.facilityType 1..1 MS
* context.practiceSetting 1..1 MS
* context.period 0..1 MS
