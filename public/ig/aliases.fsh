// -------------------------------------------------------------------------
// Standard HL7 & Terminology Aliases
// -------------------------------------------------------------------------
Alias: $LNC = http://loinc.org
Alias: $SCT = http://snomed.info/sct
Alias: $UCUM = http://unitsofmeasure.org
Alias: $V2-0074 = http://terminology.hl7.org/CodeSystem/v2-0074
Alias: $V3-Confidentiality = http://terminology.hl7.org/CodeSystem/v3-Confidentiality
Alias: $DOC-STATUS = http://hl7.org/fhir/ValueSet/composition-status
Alias: $MHD-FORMATCODES = http://ihe.net/fhir/ValueSet/mhd-formatcodes

// -------------------------------------------------------------------------
// Belgian National Identifiers & Code Systems (eHealth Platform)
// -------------------------------------------------------------------------
Alias: $BE-NS-SSIN = https://www.ehealth.fgov.be/standards/fhir/core/NamingSystem/ssin
Alias: $BE-NS-NIHDI = https://www.ehealth.fgov.be/standards/fhir/core/NamingSystem/nihdi
Alias: $BE-NS-CBE = https://www.ehealth.fgov.be/standards/fhir/core/NamingSystem/cbe
Alias: $BE-CS-CD-TRANSACTION = https://www.ehealth.fgov.be/standards/fhir/core/CodeSystem/cd-transaction
Alias: $BE-CS-CD-HCPARTY = https://www.ehealth.fgov.be/standards/fhir/core/CodeSystem/cd-hcparty
Alias: $BE-CS-CD-HCPARTY-SPEC = https://www.ehealth.fgov.be/standards/fhir/core/CodeSystem/cd-hcparty-spec
Alias: $BE-VS-CD-HCPARTY = https://www.ehealth.fgov.be/standards/fhir/core/ValueSet/be-vs-cd-hcparty

// -------------------------------------------------------------------------
// Belgian OID Roots
// -------------------------------------------------------------------------
Alias: $BE-OID-SSIN = urn:oid:1.3.6.1.4.1.21297.100.1.1
Alias: $BE-OID-NIHDI-PRACTITIONER = urn:oid:1.3.6.1.4.1.21297.100.9.1
Alias: $BE-OID-NIHDI-HOSPITAL = urn:oid:1.3.6.1.4.1.21297.100.11.1
Alias: $BE-OID-CBE = urn:oid:1.3.6.1.4.1.21297.100.11.2
Alias: $BE-OID-CD-TRANSACTION = urn:oid:1.3.6.1.4.1.21297.100.3.1
Alias: $BE-OID-FACILITY-TYPE = urn:oid:1.3.6.1.4.1.21297.100.4.1
Alias: $BE-OID-PRACTICE-SETTING = urn:oid:1.3.6.1.4.1.21297.100.5.1
Alias: $BE-OID-HUB-ROOT = urn:oid:1.3.6.1.4.1.21297.1
Alias: $BE-OID-REPOSITORY-ROOT = urn:oid:1.3.6.1.4.1.21297.100.2

// -------------------------------------------------------------------------
// IHE MHD & XDS Aliases
// -------------------------------------------------------------------------
Alias: $IHE-HOME-COMMUNITY = urn:ihe:iti:xds:2023:homeCommunityId

// -------------------------------------------------------------------------
// Belgian Federal Core Profiles (hl7.fhir.be.core)
//
// These are the national profiles this IG builds on. Every reference to a
// person, practitioner or organisation in this specification targets one of
// these profiles rather than the plain HL7 base resource, so that a Belgian
// consumer is guaranteed the national identifier slices (SSIN, NIHDI, CBE,
// EHP), the BeAddress line decomposition and the CD-HCPARTY typing.
// -------------------------------------------------------------------------
Alias: $BePatient = https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-patient
Alias: $BePractitioner = https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-practitioner
Alias: $BePractitionerRole = https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-practitionerrole
Alias: $BeOrganization = https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-organization
Alias: $BeDocumentReference = https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-documentreference
Alias: $BeProvenance = https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-provenance
Alias: $BeCommunication = https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-communication
Alias: $BeAddress = https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-address
Alias: $BeCodedAnnotation = https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-coded-annotation

// Belgian Federal Core Clinical Profiles (hl7.fhir.be.core-clinical)
Alias: $BeObservation = https://www.ehealth.fgov.be/standards/fhir/core-clinical/StructureDefinition/be-observation
Alias: $BeClinicalObservation = https://www.ehealth.fgov.be/standards/fhir/core-clinical/StructureDefinition/be-clinical-observation

// Belgian Federal Core Extensions
Alias: $BeExtGenderAtBirth = https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-ext-gender-at-birth
Alias: $BeExtRecorder = https://www.ehealth.fgov.be/standards/fhir/core/StructureDefinition/be-ext-recorder

// Additional Belgian NamingSystems used by the be.core identifier slices
Alias: $BE-NS-EHP = https://www.ehealth.fgov.be/standards/fhir/core/NamingSystem/ehp
