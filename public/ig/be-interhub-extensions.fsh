// -------------------------------------------------------------------------
// Belgian Patient Access Extension
// -------------------------------------------------------------------------
Extension: BeExtPatientAccess
Id: be-ext-patient-access
Title: "Belgian Patient Access Metadata"
Description: "Carries patient visibility and accessibility rules for a document in the Belgian federated hub ecosystem (replaces KMEHR PatientAccess schemes)."
* ^status = #active
* ^context[0].type = #element
* ^context[0].expression = "DocumentReference"
* ^context[1].type = #element
* ^context[1].expression = "Composition"

* extension contains
    access 1..1 and
    accessDate 0..1 and
    deniedReason 0..1

* extension[access] ^short = "Patient access permission (yes | no | never)"
* extension[access].value[x] only code
* extension[access].valueCode from BeVSPatientAccess (required)

* extension[accessDate] ^short = "Date from which the document is available to the patient (only valid if access is 'yes')"
* extension[accessDate].value[x] only date

* extension[deniedReason] ^short = "Reason explaining why the document is withheld from the patient (applicable when access is 'no' or 'never')"
* extension[deniedReason].value[x] only string

// -------------------------------------------------------------------------
// Home Community ID Extension
// -------------------------------------------------------------------------
Extension: BeExtHomeCommunityId
Id: be-ext-home-community-id
Title: "Belgian Hub Home Community ID"
Description: "Specifies the Home Community ID (as an OID URN, e.g. urn:oid:1.3.6.1.4.1.21297.1.X) of the regional hub hosting the document repository. Essential for federated cross-hub routing."
* ^status = #active
* ^context[0].type = #element
* ^context[0].expression = "DocumentReference"
* ^context[1].type = #element
* ^context[1].expression = "Bundle"
* value[x] only uri or Identifier
* value[x] 1..1

// -------------------------------------------------------------------------
// Belgian End-to-End Encryption (ETEE / ETK) Extension
// -------------------------------------------------------------------------
Extension: BeExtEndToEndEncryption
Id: be-ext-end-to-end-encryption
Title: "Belgian End-to-End Encryption Metadata (ETK Depot)"
Description: "Metadata required for retrieving the recipient's encryption token key (ETK) from the Belgian eHealth ETK depot for end-to-end encrypted Interhub transactions."
* ^status = #active
* ^context[0].type = #element
* ^context[0].expression = "DocumentReference"
* ^context[1].type = #element
* ^context[1].expression = "Bundle"

* extension contains
    actorId 1..1 and
    actorType 1..1 and
    applicationId 0..1 and
    keyId 0..1

* extension[actorId] ^short = "Encryption actor identifier (e.g. NIHDI, CBE, SSIN)"
* extension[actorId].value[x] only string

* extension[actorType] ^short = "Type of encryption actor within the ETK depot"
* extension[actorType].value[x] only code
* extension[actorType].valueCode from BeVSETKEncryptionActor (required)

* extension[applicationId] ^short = "Application / system ID in the ETK depot"
* extension[applicationId].value[x] only string

* extension[keyId] ^short = "Encryption Token Key (ETK) identifier"
* extension[keyId].value[x] only string

// -------------------------------------------------------------------------
// Source Record Date-Time Extension
// -------------------------------------------------------------------------
Extension: BeExtRecordDateTime
Id: be-ext-record-datetime
Title: "Source System Recording Timestamp"
Description: "The exact date and time when the transaction was recorded in the originating hub source system (corresponds to KMEHR recorddatetime)."
* ^status = #active
* ^context[0].type = #element
* ^context[0].expression = "DocumentReference"
* ^context[1].type = #element
* ^context[1].expression = "Composition"
* value[x] only instant
* value[x] 1..1

// -------------------------------------------------------------------------
// Belgian Healthcare Party Type Extension (KMEHR CD-HCPARTY)
// -------------------------------------------------------------------------
Extension: BeExtHcPartyType
Id: be-ext-hcparty-type
Title: "Belgian Healthcare Party Type (CD-HCPARTY)"
Description: "Declares the KMEHR CD-HCPARTY type of a party referenced from the metadata envelope (author, authenticator, custodian). It carries the party type inline, next to the reference, so that a consumer can render and filter a search result without resolving the referenced Practitioner / Organization resource. Covers the full CD-HCPARTY table: person types (persphysician, persnurse, ...), organisation types (orghospital, orglaboratory, orgpharmacy, orgretirementhome, ...), department and specialty types (dept...), and application / software parties."
* ^status = #active
* ^context[0].type = #element
* ^context[0].expression = "DocumentReference.author"
* ^context[1].type = #element
* ^context[1].expression = "DocumentReference.authenticator"
* ^context[2].type = #element
* ^context[2].expression = "DocumentReference.custodian"
* ^context[3].type = #element
* ^context[3].expression = "Composition.author"
* ^context[4].type = #element
* ^context[4].expression = "Composition.attester.party"
* ^context[5].type = #element
* ^context[5].expression = "Composition.custodian"
* value[x] only Coding
* value[x] 1..1
* valueCoding from $BE-VS-CD-HCPARTY (extensible)
* valueCoding ^short = "KMEHR CD-HCPARTY code of the referenced party (e.g. persphysician, orghospital, orglaboratory, application)"
