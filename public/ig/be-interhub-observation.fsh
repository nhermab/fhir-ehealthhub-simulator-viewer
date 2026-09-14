// =========================================================================
// RuleSet: Logical Reference (business identifier only, no resolvable URL)
//
// The Interhub server exposes no Patient, Practitioner or Organization
// endpoint. A reference therefore names its target by national business
// identifier (SSIN, NIHDI, CBE, document uniqueId) and never by URL, so a
// consumer can match and display it without dereferencing anything.
// =========================================================================
RuleSet: LogicalReference(element)
* {element}.reference 0..0
* {element}.identifier 1..1 MS
* {element}.identifier.system 1..1 MS
* {element}.identifier.value 1..1 MS
* {element}.display MS


// =========================================================================
// Profile: Belgian Interhub Laboratory Observation (DIGIRELAB)
// =========================================================================
Profile: BeInterhubLabObservation
Parent: Observation
Id: be-interhub-lab-observation
Title: "Belgian Interhub Laboratory Observation (DIGIRELAB)"
Description: "Discrete laboratory result extracted from a Belgian Interhub laboratory report document and returned by the Interhub lab observation search. Every reference is a logical reference by national business identifier (patient SSIN, performer NIHDI/CBE, source document uniqueId), so the responding hub needs no endpoint other than DocumentReference and Observation. Each observation links to the DocumentReference it was extracted from, which plays the role of the source entity in IHE mXDE Provenance."

* ^status = #active
* ^version = "0.1.0"

// Flat payload: everything a consumer needs is inline or identified by business identifier
* contained 0..0

// -------------------------------------------------------------------------
// Routing: where the source document lives
// -------------------------------------------------------------------------
* extension contains BeExtHomeCommunityId named homeCommunityId 1..1 MS
* extension[homeCommunityId] ^short = "Home Community ID of the hub holding the source document (target of $retrieve-document)"
* extension[homeCommunityId] ^definition = "SHALL equal the homeCommunityId of the DocumentReference identified in derivedFrom. It tells the initiating hub which hub to send $retrieve-document to, so the observation stays traceable across the federation."

// -------------------------------------------------------------------------
// Status & Category
// -------------------------------------------------------------------------
* status MS
* status ^short = "final | amended | corrected | preliminary (entered-in-error is never returned)"

* category 1..* MS
* category ^slicing.discriminator.type = #pattern
* category ^slicing.discriminator.path = "$this"
* category ^slicing.rules = #open
* category contains laboratory 1..1 MS
* category[laboratory] = $OBS-CATEGORY#laboratory
* category[laboratory] ^short = "Fixed HL7 observation category 'laboratory' (other codings such as v2-0074 LAB may be present)"

// -------------------------------------------------------------------------
// Test Code: LOINC mandatory, local lab codes preserved (open slicing)
// -------------------------------------------------------------------------
* code MS
* code.coding 1..* MS
* code.coding ^slicing.discriminator.type = #value
* code.coding ^slicing.discriminator.path = "system"
* code.coding ^slicing.rules = #open
* code.coding contains loinc 1..1 MS
* code.coding[loinc].system = $LNC (exactly)
* code.coding[loinc].code 1..1 MS
* code.coding[loinc] ^short = "LOINC analyte code (local laboratory codings MAY travel alongside)"

// -------------------------------------------------------------------------
// Logical references (business identifier, no URL)
// -------------------------------------------------------------------------
* subject MS
* subject only Reference($BePatient)
* insert LogicalReference(subject)
* subject.identifier.system = $BE-NS-SSIN (exactly)
* subject ^short = "Patient by SSIN/INSZ only; lets the initiating hub verify every federated result belongs to the queried patient"

* performer MS
* performer only Reference($BePractitioner or $BePractitionerRole or $BeOrganization)
* insert LogicalReference(performer)
* performer.extension contains BeExtHcPartyType named hcPartyType 0..1 MS
* performer ^short = "Performing laboratory and/or responsible clinical biologist by NIHDI or CBE number"

* derivedFrom 1..1 MS
* derivedFrom only Reference(BeInterhubDocumentReference)
* insert LogicalReference(derivedFrom)
* derivedFrom.identifier.system = "urn:ietf:rfc:3986" (exactly)
* derivedFrom ^short = "Source laboratory report: uniqueId (masterIdentifier) of its DocumentReference"
* derivedFrom ^definition = "Logical reference to the BeInterhubDocumentReference this result was extracted from, by its RFC 3986 uniqueId (DocumentReference.masterIdentifier). The same identifier is passed to $retrieve-document at the hub named in homeCommunityId to obtain the full legal report. Equivalent to Provenance.entity.what (role = source) in the IHE mXDE Provenance profile."

// -------------------------------------------------------------------------
// Timing & Result
// -------------------------------------------------------------------------
* effective[x] 1..1 MS
* effective[x] ^short = "Clinically relevant time (specimen collection time)"

* value[x] MS
* valueQuantity.system = $UCUM
* dataAbsentReason MS
* interpretation MS
* referenceRange MS
* referenceRange.low MS
* referenceRange.high MS
* referenceRange.text MS
* note MS
* note.author[x] only string

// -------------------------------------------------------------------------
// Prohibited: no business identifier exists nationally, or the context
// belongs to the source document (retrieve it with $retrieve-document)
// -------------------------------------------------------------------------
* basedOn 0..0
* partOf 0..0
* focus 0..0
* encounter 0..0
* specimen 0..0
* device 0..0
* hasMember 0..0
* hasMember ^short = "Not used: panel members are returned as individual observations"


// =========================================================================
// SearchParameter: searchtype (Federation Scope)
// =========================================================================
Instance: InterhubSearchType
InstanceOf: SearchParameter
Usage: #definition
Title: "Interhub Federation Scope Search Parameter (searchtype)"
Description: "Controls federation scope for DocumentReference and Observation searches: 'federated' (default) permits fan-out to connected hub sources and partner hubs; 'local' confines the query to the receiving hub's own index. See [laboratory search parameters](transactions.html#lab-observation-search-parameters) and [document discovery](transactions.html#22-http-interaction--query-parameters-post-based-search)."
* url = "https://www.ehealth.fgov.be/standards/fhir/interhub/SearchParameter/interhub-searchtype"
* name = "InterhubSearchType"
* status = #active
* code = #searchtype
* base[0] = #DocumentReference
* base[1] = #Observation
* type = #token
* description = "Belgian search scope: 'federated' (default) lets the responding hub fan out to connected hub sources and partner hubs; 'local' restricts the answer to the hub's own index, reporting no downstream partial failure."
