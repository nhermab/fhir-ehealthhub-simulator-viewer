// =========================================================================
// SHARED DEMOGRAPHIC & INSTITUTIONAL INSTANCES
// =========================================================================

Instance: PatientPeeters
InstanceOf: BePatient
Title: "Patient Jan Peeters (Belgian INSS/SSIN)"
Description: "Example Belgian patient identified by official National Register SSIN/INSS, conforming to the federal BePatient profile."
Usage: #example
// identifier[SSIN] is the be.core slice: system is fixed to the national SSIN NamingSystem.
* identifier[SSIN].system = $BE-NS-SSIN
* identifier[SSIN].value = "79080412345"
// The OID form of the same SSIN, kept alongside for legacy KMEHR consumers.
* identifier[+].system = $BE-OID-SSIN
* identifier[=].value = "79080412345"
* name[0].family = "Peeters"
* name[0].given[0] = "Jan"
* gender = #male
* birthDate = "1979-08-04"
// BeAddress decomposes the street name, house number and postal box into
// separate address.line entries - always RECOMMENDED over a single free-text line.
* address[0].line[0] = "Kerkstraat"
* address[0].line[0].extension[Streetname].valueString = "Kerkstraat"
* address[0].line[1] = "12"
* address[0].line[1].extension[Housenumber].valueString = "12"
* address[0].city = "Leuven"
* address[0].postalCode = "3000"
* address[0].country = "BEL"

Instance: DrJeanDepondt
InstanceOf: BePractitioner
Title: "Dr. Jean Depondt (Cardiologist)"
Description: "Example Belgian medical specialist identified by NIHDI / RIZIV, conforming to the federal BePractitioner profile."
Usage: #example
* identifier[NIHDI].system = $BE-NS-NIHDI
* identifier[NIHDI].value = "19876543201"
* identifier[+].system = $BE-OID-NIHDI-PRACTITIONER
* identifier[=].value = "19876543201"
* name[0].family = "Depondt"
* name[0].given[0] = "Jean"

Instance: DrDanieleGovaerts
InstanceOf: BePractitioner
Title: "Dr. Danièle Govaerts (Clinical Biologist)"
Description: "Example Belgian clinical laboratory physician identified by NIHDI / RIZIV, conforming to the federal BePractitioner profile."
Usage: #example
* identifier[NIHDI].system = $BE-NS-NIHDI
* identifier[NIHDI].value = "10000007999"
* identifier[+].system = $BE-OID-NIHDI-PRACTITIONER
* identifier[=].value = "10000007999"
* name[0].family = "Govaerts"
* name[0].given[0] = "Danièle"

Instance: OrgUZLeuven
InstanceOf: BeOrganization
Title: "UZ Leuven"
Description: "Example Belgian University Hospital identified by NIHDI and Enterprise CBE numbers, conforming to the federal BeOrganization profile."
Usage: #example
* identifier[NIHDI].system = $BE-NS-NIHDI
* identifier[NIHDI].value = "71000012"
* identifier[CBE].system = $BE-NS-CBE
* identifier[CBE].value = "0419052173"
* identifier[+].system = $BE-OID-NIHDI-HOSPITAL
* identifier[=].value = "71000012"
// BeOrganization.type[CD-HCPARTY] carries the KMEHR party type on the resource
// itself; the envelope repeats it inline via BeExtHcPartyType so that a consumer
// need not resolve this reference to know it is dealing with a hospital.
* type[CD-HCPARTY] = $BE-CS-CD-HCPARTY#orghospital "hospital"
* name = "UZ Leuven"

Instance: HubCoZo
InstanceOf: BeOrganization
Title: "CoZo Regional Hub"
Description: "Example regional Belgian eHealth Hub (Home Community ID), conforming to the federal BeOrganization profile."
Usage: #example
// A hub is identified by its Home Community OID rather than by NIHDI or CBE;
// BeOrganization.identifier slicing is open, so this sits outside the named slices.
* identifier[+].system = "urn:ietf:rfc:3986"
* identifier[=].value = "urn:oid:1.3.6.1.4.1.21297.1.3"
* type[CD-HCPARTY] = $BE-CS-CD-HCPARTY#application "software application"
* name = "CoZo (Collaboratief Zorgplatform)"

// =========================================================================
// INLINE CONTAINED RESOURCE INSTANCES
// =========================================================================

Instance: ContainedPatient
InstanceOf: BePatient
Usage: #inline
* identifier[SSIN].system = $BE-NS-SSIN
* identifier[SSIN].value = "79080412345"
* name[0].family = "Peeters"
* name[0].given[0] = "Jan"
* gender = #male
* birthDate = "1979-08-04"

Instance: ContainedHubCoZo
InstanceOf: BeOrganization
Usage: #inline
* identifier[+].system = "urn:ietf:rfc:3986"
* identifier[=].value = "urn:oid:1.3.6.1.4.1.21297.1.3"
* type[CD-HCPARTY] = $BE-CS-CD-HCPARTY#application "software application"
* name = "CoZo Regional Hub"

Instance: ContainedOrgUZLeuven
InstanceOf: BeOrganization
Usage: #inline
* identifier[NIHDI].system = $BE-NS-NIHDI
* identifier[NIHDI].value = "71000012"
* identifier[CBE].system = $BE-NS-CBE
* identifier[CBE].value = "0419052173"
* type[CD-HCPARTY] = $BE-CS-CD-HCPARTY#orghospital "hospital"
* name = "UZ Leuven"

Instance: ContainedDrGovaerts
InstanceOf: BePractitioner
Usage: #inline
* identifier[NIHDI].system = $BE-NS-NIHDI
* identifier[NIHDI].value = "10000007999"
* name[0].family = "Govaerts"
* name[0].given[0] = "Danièle"

Instance: ContainedDrDepondt
InstanceOf: BePractitioner
Usage: #inline
* identifier[NIHDI].system = $BE-NS-NIHDI
* identifier[NIHDI].value = "19876543201"
* name[0].family = "Depondt"
* name[0].given[0] = "Jean"

// =========================================================================
// METADATA ENVELOPE EXAMPLES (BeInterhubDocumentReference - MHD Comprehensive)
// =========================================================================

Instance: DocRefLabReportContainedExample
InstanceOf: BeInterhubDocumentReference
Title: "DocumentReference: MHD Comprehensive Contained Lab Report"
Description: "Example of a Belgian Interhub metadata envelope conforming to IHE MHD Comprehensive with contained BePatient, BePractitioner, and BeOrganization resources."
Usage: #example

// Belgian National Extensions
* extension[homeCommunityId].valueUri = "urn:oid:1.3.6.1.4.1.21297.1.3"
* extension[patientAccess].extension[access].valueCode = #yes
* extension[patientAccess].extension[accessDate].valueDate = "2026-03-15"
* extension[recordDateTime].valueInstant = "2026-03-15T10:35:00Z"

// Identifiers
* masterIdentifier.system = "urn:ietf:rfc:3986"
* masterIdentifier.value = "urn:oid:1.3.6.1.4.1.21297.100.2.1.815933567"

* identifier[uniqueId].system = "urn:ietf:rfc:3986"
* identifier[uniqueId].value = "urn:oid:1.3.6.1.4.1.21297.100.2.1.815933567"

* identifier[entryUUID].system = "urn:ietf:rfc:3986"
* identifier[entryUUID].value = "urn:uuid:8b3e2365-5136-46b5-901d-5b32ec8ef991"

* identifier[localId].system = "https://uzleuven.be/lab/reports"
* identifier[localId].value = "LAB-2026-03-815933567"

* status = #current

// Categories & Clinical Type
* category.coding[cdTransactionCode] = $BE-CS-CD-TRANSACTION#labresult "Laboratory Result"
* type.coding[0] = $LNC#11502-2 "Laboratory report"

// Patient Reference & Inline SSIN
* subject = Reference(PatientPeeters)
* subject.identifier.system = $BE-NS-SSIN
* subject.identifier.value = "79080412345"

* date = "2026-03-15T10:30:00Z"
* description = "Comprehensive Blood Biochemistry and Hematology Laboratory Report"
* securityLabel[0] = $V3-Confidentiality#N "Normal"

// -------------------------------------------------------------------------
// Contained Resources Definition
// -------------------------------------------------------------------------
* contained[0] = ContainedPatient
* contained[1] = ContainedHubCoZo
* contained[2] = ContainedOrgUZLeuven
* contained[3] = ContainedDrGovaerts

// Pointers to Contained Resources
* context.sourcePatientInfo = Reference(ContainedPatient)

* author[0] = Reference(ContainedHubCoZo)
* author[0].extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#application "software application"

* author[1] = Reference(ContainedOrgUZLeuven)
* author[1].extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#orghospital "hospital"

* author[2] = Reference(ContainedDrGovaerts)
* author[2].extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#persphysician "physician"

* authenticator = Reference(ContainedDrGovaerts)
* authenticator.extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#persphysician "physician"

* custodian = Reference(ContainedOrgUZLeuven)
* custodian.extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#orghospital "hospital"

// Relationships
* relatesTo[0].code = #replaces
* relatesTo[0].target.identifier.system = "urn:ietf:rfc:3986"
* relatesTo[0].target.identifier.value = "urn:oid:1.3.6.1.4.1.21297.100.2.1.815933566"
* relatesTo[0].target.display = "Preliminary laboratory report of 2026-03-15 08:40"

// Payload Retrieval Attachment & Format
* content[0].attachment.contentType = #application/fhir+json
* content[0].attachment.language = #nl-BE
* content[0].attachment.url = "https://hub.cozo.be/fhir/Bundle/bundle-lab-report-example-01"
* content[0].attachment.title = "Lab Report - Peeters Jan"
* content[0].attachment.creation = "2026-03-15T10:30:00Z"
* content[0].format = #urn:be:fgov:ehealth:lab:document:1.0

// Contextual Classification
* context.facilityType = $SCT#257622000 "Healthcare related organization"
* context.practiceSetting = $SCT#394595002 "Pathology"
* context.period.start = "2026-03-15T08:00:00Z"
* context.period.end = "2026-03-15T10:30:00Z"

// DocRefLabReportExample kept as alias/mirror for references
Instance: DocRefLabReportExample
InstanceOf: BeInterhubDocumentReference
Title: "DocumentReference: Lab Report Metadata"
Description: "Example metadata carrier returned by getTransactionList (MHD ITI-67) for a laboratory report."
Usage: #example
* extension[homeCommunityId].valueUri = "urn:oid:1.3.6.1.4.1.21297.1.3"
* extension[patientAccess].extension[access].valueCode = #yes
* extension[patientAccess].extension[accessDate].valueDate = "2026-03-15"
* extension[recordDateTime].valueInstant = "2026-03-15T10:35:00Z"
* masterIdentifier.system = "urn:ietf:rfc:3986"
* masterIdentifier.value = "urn:oid:1.3.6.1.4.1.21297.100.2.1.815933567"
* identifier[uniqueId].system = "urn:ietf:rfc:3986"
* identifier[uniqueId].value = "urn:oid:1.3.6.1.4.1.21297.100.2.1.815933567"
* identifier[entryUUID].system = "urn:ietf:rfc:3986"
* identifier[entryUUID].value = "urn:uuid:8b3e2365-5136-46b5-901d-5b32ec8ef991"
* identifier[localId].system = "https://uzleuven.be/lab/reports"
* identifier[localId].value = "LAB-2026-03-815933567"
* status = #current
* category.coding[cdTransactionCode] = $BE-CS-CD-TRANSACTION#labresult "Laboratory Result"
* type.coding[0] = $LNC#11502-2 "Laboratory report"
* subject = Reference(PatientPeeters)
* subject.identifier.system = $BE-NS-SSIN
* subject.identifier.value = "79080412345"
* date = "2026-03-15T10:30:00Z"
* description = "Comprehensive Blood Biochemistry and Hematology Laboratory Report"
* securityLabel[0] = $V3-Confidentiality#N "Normal"
* contained[0] = ContainedPatient
* contained[1] = ContainedHubCoZo
* contained[2] = ContainedOrgUZLeuven
* contained[3] = ContainedDrGovaerts
* context.sourcePatientInfo = Reference(ContainedPatient)
* author[0] = Reference(ContainedHubCoZo)
* author[0].extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#application "software application"
* author[1] = Reference(ContainedOrgUZLeuven)
* author[1].extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#orghospital "hospital"
* author[2] = Reference(ContainedDrGovaerts)
* author[2].extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#persphysician "physician"
* authenticator = Reference(ContainedDrGovaerts)
* authenticator.extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#persphysician "physician"
* custodian = Reference(ContainedOrgUZLeuven)
* custodian.extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#orghospital "hospital"
* relatesTo[0].code = #replaces
* relatesTo[0].target.identifier.system = "urn:ietf:rfc:3986"
* relatesTo[0].target.identifier.value = "urn:oid:1.3.6.1.4.1.21297.100.2.1.815933566"
* relatesTo[0].target.display = "Preliminary laboratory report of 2026-03-15 08:40"
* content[0].attachment.contentType = #application/fhir+json
* content[0].attachment.language = #nl-BE
* content[0].attachment.url = "https://hub.cozo.be/fhir/Bundle/bundle-lab-report-example-01"
* content[0].attachment.title = "Lab Report - Peeters Jan"
* content[0].attachment.creation = "2026-03-15T10:30:00Z"
* content[0].format = #urn:be:fgov:ehealth:lab:document:1.0
* context.facilityType = $SCT#257622000 "Healthcare related organization"
* context.practiceSetting = $SCT#394595002 "Pathology"
* context.period.start = "2026-03-15T08:00:00Z"
* context.period.end = "2026-03-15T10:30:00Z"

Instance: DocRefMinimalExample
InstanceOf: BeInterhubMinimalDocumentReference
Title: "DocumentReference: Minimal Metadata Example"
Description: "Example lightweight metadata carrier conforming to BeInterhubMinimalDocumentReference (IHE MHD Minimal)."
Usage: #example
* extension[homeCommunityId].valueUri = "urn:oid:1.3.6.1.4.1.21297.1.3"
* masterIdentifier.system = "urn:ietf:rfc:3986"
* masterIdentifier.value = "urn:oid:1.3.6.1.4.1.21297.100.2.1.999000111"
* status = #current
* subject = Reference(PatientPeeters)
* subject.identifier.system = $BE-NS-SSIN
* subject.identifier.value = "79080412345"
* content[0].attachment.contentType = #application/fhir+json
* content[0].attachment.url = "https://hub.cozo.be/fhir/Bundle/bundle-minimal-example-01"

Instance: DocRefTelemonitoringExample
InstanceOf: BeInterhubDocumentReference
Title: "DocumentReference: Telemonitoring Session Metadata"
Description: "Example metadata carrier returned by getTransactionList (MHD ITI-67) for a remote patient monitoring session."
Usage: #example
* extension[homeCommunityId].valueUri = "urn:oid:1.3.6.1.4.1.21297.1.3"
* extension[patientAccess].extension[access].valueCode = #yes
* extension[recordDateTime].valueInstant = "2026-01-02T09:00:00Z"
* masterIdentifier.system = "urn:ietf:rfc:3986"
* masterIdentifier.value = "urn:uuid:7ed170b3-38d1-4ba5-8a60-1f722b107707"
* identifier[uniqueId].system = "urn:ietf:rfc:3986"
* identifier[uniqueId].value = "urn:uuid:7ed170b3-38d1-4ba5-8a60-1f722b107707"
* identifier[entryUUID].system = "urn:ietf:rfc:3986"
* identifier[entryUUID].value = "urn:uuid:7ed170b3-38d1-4ba5-8a60-1f722b107707"
* identifier[localId].system = "http://example.org/telemonitoring-id"
* identifier[localId].value = "tm-holter-001"
* status = #current
* category.coding[cdTransactionCode] = $BE-CS-CD-TRANSACTION#telemonitoring "Telemonitoring / Remote Patient Monitoring"
* type.coding[0] = $LNC#18754-2 "Ambulatory cardiac rhythm monitor (Holter) study"
* subject = Reference(PatientPeeters)
* subject.identifier.system = $BE-NS-SSIN
* subject.identifier.value = "79080412345"
* date = "2026-01-02T08:30:00Z"
* description = "24-Hour Continuous Holter ECG Monitoring Summary"
* securityLabel[0] = $V3-Confidentiality#N "Normal"
* contained[0] = ContainedPatient
* contained[1] = ContainedHubCoZo
* contained[2] = ContainedOrgUZLeuven
* contained[3] = ContainedDrDepondt
* context.sourcePatientInfo = Reference(ContainedPatient)
* author[0] = Reference(ContainedHubCoZo)
* author[0].extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#application "software application"
* author[1] = Reference(ContainedOrgUZLeuven)
* author[1].extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#orghospital "hospital"
* author[2] = Reference(ContainedDrDepondt)
* author[2].extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#persphysician "physician"
* custodian = Reference(ContainedOrgUZLeuven)
* custodian.extension[hcPartyType].valueCoding = $BE-CS-CD-HCPARTY#orghospital "hospital"
* content[0].attachment.contentType = #application/fhir+json
* content[0].attachment.language = #nl-BE
* content[0].attachment.url = "https://hub.cozo.be/fhir/Bundle/bundle-telemonitoring-example-01"
* content[0].attachment.creation = "2026-01-02T08:30:00Z"
* content[0].attachment.title = "Holter Monitoring Report - Jan Peeters"
* content[0].format = #urn:be:fgov:ehealth:telemonitoring:document:1.0
* context.facilityType = $SCT#257622000 "Healthcare related organization"
* context.practiceSetting = $SCT#394579002 "Cardiology"
* context.period.start = "2026-01-01T08:00:00Z"
* context.period.end = "2026-01-02T08:00:00Z"

// =========================================================================
// CLINICAL OBSERVATIONS & SPECIMEN FOR LAB DOCUMENT
// =========================================================================

Instance: SpecimenBloodExample
InstanceOf: Specimen
Title: "Specimen: Venous Whole Blood"
Description: "Example blood specimen collected for laboratory analysis."
Usage: #example
* type.coding[0] = $SCT#119297000 "Blood specimen"
* subject = Reference(PatientPeeters)
* collection.collectedDateTime = "2026-03-15T08:15:00Z"

Instance: ObsGlucoseExample
InstanceOf: BeObservation
Title: "Observation: Fasting Blood Glucose"
Description: "Laboratory test measurement for fasting blood glucose."
Usage: #example
* status = #final
* category[0] = $V2-0074#LAB "Laboratory"
* code = $LNC#1558-6 "Fasting glucose [Mass/volume] in Serum or Plasma"
* subject = Reference(PatientPeeters)
* effectiveDateTime = "2026-03-15T08:15:00Z"
* performer[0] = Reference(DrDanieleGovaerts)
* valueQuantity = 92 'mg/dL' "mg/dL"
* referenceRange[0].low = 70 'mg/dL' "mg/dL"
* referenceRange[0].high = 99 'mg/dL' "mg/dL"
* specimen = Reference(SpecimenBloodExample)

Instance: ObsCreatinineExample
InstanceOf: BeObservation
Title: "Observation: Serum Creatinine"
Description: "Laboratory test measurement for serum creatinine."
Usage: #example
* status = #final
* category[0] = $V2-0074#LAB "Laboratory"
* code = $LNC#2160-0 "Creatinine [Mass/volume] in Serum or Plasma"
* subject = Reference(PatientPeeters)
* effectiveDateTime = "2026-03-15T08:15:00Z"
* performer[0] = Reference(DrDanieleGovaerts)
* valueQuantity = 0.95 'mg/dL' "mg/dL"
* referenceRange[0].low = 0.70 'mg/dL' "mg/dL"
* referenceRange[0].high = 1.20 'mg/dL' "mg/dL"
* specimen = Reference(SpecimenBloodExample)

Instance: DiagnosticReportLabExample
InstanceOf: DiagnosticReport
Title: "DiagnosticReport: Laboratory Results Panel"
Description: "Diagnostic report grouping the biochemical observations."
Usage: #example
* status = #final
* category[0] = $V2-0074#LAB "Laboratory"
* code = $LNC#11502-2 "Laboratory report"
* subject = Reference(PatientPeeters)
* effectiveDateTime = "2026-03-15T08:15:00Z"
* issued = "2026-03-15T10:30:00Z"
* performer[0] = Reference(OrgUZLeuven)
* resultsInterpreter[0] = Reference(DrDanieleGovaerts)
* result[0] = Reference(ObsGlucoseExample)
* result[1] = Reference(ObsCreatinineExample)
* specimen[0] = Reference(SpecimenBloodExample)
* conclusion = "All fasting biochemistry parameters within normal reference limits."

// =========================================================================
// COMPLETE LAB REPORT FHIR DOCUMENT BUNDLE (MHD ITI-68 Payload)
// =========================================================================

Instance: CompLabReportExample
InstanceOf: BeInterhubLabComposition
Title: "Composition: Laboratory Report"
Description: "Root Composition of the Laboratory Report FHIR Document."
Usage: #example
* identifier.system = "https://uzleuven.be/lab/compositions"
* identifier.value = "COMP-LAB-2026-815933567"
* status = #final
* type = $LNC#11502-2 "Laboratory report"
* category = $BE-CS-CD-TRANSACTION#labresult "Laboratory Result"
* subject = Reference(PatientPeeters)
* date = "2026-03-15T10:30:00Z"
* author[0] = Reference(DrDanieleGovaerts)
* author[1] = Reference(OrgUZLeuven)
* title = "Biochemistry & Hematology Laboratory Report"
* custodian = Reference(OrgUZLeuven)
* section[0].title = "Clinical Biochemistry"
* section[0].code = $LNC#18719-5 "Chemistry studies (set)"
* section[0].text.status = #generated
* section[0].text.div = "<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><b>Clinical Biochemistry:</b> Fasting glucose: 92 mg/dL (Normal). Serum creatinine: 0.95 mg/dL (Normal).</p></div>"
* section[0].entry[0] = Reference(DiagnosticReportLabExample)
* section[0].entry[1] = Reference(ObsGlucoseExample)
* section[0].entry[2] = Reference(ObsCreatinineExample)

Instance: BundleLabReportExample
InstanceOf: BeInterhubDocumentBundle
Title: "Document Bundle: Complete Laboratory Report"
Description: "Complete FHIR Document Bundle (type=document) retrieved via getTransaction (MHD ITI-68)."
Usage: #example
* identifier.system = "urn:ietf:rfc:3986"
* identifier.value = "urn:oid:1.3.6.1.4.1.21297.100.2.1.815933567"
* type = #document
* timestamp = "2026-03-15T10:30:00Z"
* entry[composition].fullUrl = "http://example.org/Composition/CompLabReportExample"
* entry[composition].resource = CompLabReportExample
* entry[1].fullUrl = "http://example.org/DiagnosticReport/DiagnosticReportLabExample"
* entry[1].resource = DiagnosticReportLabExample
* entry[2].fullUrl = "http://example.org/Observation/ObsGlucoseExample"
* entry[2].resource = ObsGlucoseExample
* entry[3].fullUrl = "http://example.org/Observation/ObsCreatinineExample"
* entry[3].resource = ObsCreatinineExample
* entry[4].fullUrl = "http://example.org/Specimen/SpecimenBloodExample"
* entry[4].resource = SpecimenBloodExample
* entry[5].fullUrl = "http://example.org/Patient/PatientPeeters"
* entry[5].resource = PatientPeeters
* entry[6].fullUrl = "http://example.org/Practitioner/DrDanieleGovaerts"
* entry[6].resource = DrDanieleGovaerts
* entry[7].fullUrl = "http://example.org/Organization/OrgUZLeuven"
* entry[7].resource = OrgUZLeuven

// =========================================================================
// COMPLETE TELEMONITORING FHIR DOCUMENT BUNDLE (MHD ITI-68 Payload)
// =========================================================================

Instance: ObsHeartRateSummary
InstanceOf: BeObservation
Title: "Observation: Mean Heart Rate (Holter)"
Description: "Average heart rate observed during a 24h Holter telemonitoring session."
Usage: #example
* status = #final
* code = $LNC#8867-4 "Heart rate"
* subject = Reference(PatientPeeters)
* effectivePeriod.start = "2026-01-01T08:00:00Z"
* effectivePeriod.end = "2026-01-02T08:00:00Z"
* performer[0] = Reference(DrJeanDepondt)
* valueQuantity = 74 '/min' "beats/minute"

Instance: DeviceHolterMonitor
InstanceOf: Device
Title: "Device: Ambulatory ECG Holter"
Description: "Wearable continuous cardiac monitoring device."
Usage: #example
* deviceName[0].name = "CardioTrack Holter X4"
* deviceName[0].type = #model-name
* type.coding[0] = $SCT#462729004 "Ambulatory cardiac telemetry monitor"

Instance: CompTelemonitoringExample
InstanceOf: BeTelemonitoringComposition
Title: "Composition: Telemonitoring Holter Session"
Description: "Root Composition of the Telemonitoring FHIR Document."
Usage: #example
* identifier.system = "https://uzleuven.be/telemonitoring/compositions"
* identifier.value = "COMP-TM-2026-001"
* status = #final
* type = $LNC#18754-2 "Ambulatory cardiac rhythm monitor (Holter) study"
* category = $BE-CS-CD-TRANSACTION#telemonitoring "Telemonitoring / Remote Patient Monitoring"
* subject = Reference(PatientPeeters)
* date = "2026-01-02T08:30:00Z"
* author[0] = Reference(DrJeanDepondt)
* author[1] = Reference(OrgUZLeuven)
* title = "24-Hour Continuous Ambulatory ECG Monitoring Summary"
* custodian = Reference(OrgUZLeuven)
* section[0].title = "Holter Monitoring Results"
* section[0].text.status = #generated
* section[0].text.div = "<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><b>24h Holter Monitoring:</b> Mean Heart Rate: 74 bpm. Normal sinus rhythm maintained. No malignant ventricular arrhythmias observed.</p></div>"
* section[0].entry[0] = Reference(TelemonitoringFromHolterExample)
* section[0].entry[1] = Reference(ObsHeartRateSummary)

Instance: BundleTelemonitoringExample
InstanceOf: BeInterhubDocumentBundle
Title: "Document Bundle: Complete Telemonitoring Report"
Description: "Complete FHIR Document Bundle (type=document) retrieved via getTransaction (MHD ITI-68) for telemonitoring."
Usage: #example
* identifier.system = "urn:ietf:rfc:3986"
* identifier.value = "urn:uuid:7ed170b3-38d1-4ba5-8a60-1f722b107707"
* type = #document
* timestamp = "2026-01-02T08:30:00Z"
* entry[composition].fullUrl = "http://example.org/Composition/CompTelemonitoringExample"
* entry[composition].resource = CompTelemonitoringExample
* entry[1].fullUrl = "http://example.org/DiagnosticReport/TelemonitoringFromHolterExample"
* entry[1].resource = TelemonitoringFromHolterExample
* entry[2].fullUrl = "http://example.org/Observation/ObsHeartRateSummary"
* entry[2].resource = ObsHeartRateSummary
* entry[3].fullUrl = "http://example.org/Patient/PatientPeeters"
* entry[3].resource = PatientPeeters
* entry[4].fullUrl = "http://example.org/Practitioner/DrJeanDepondt"
* entry[4].resource = DrJeanDepondt
* entry[5].fullUrl = "http://example.org/Organization/OrgUZLeuven"
* entry[5].resource = OrgUZLeuven

// =========================================================================
// SEARCHSET BUNDLE & OPERATIONOUTCOME EXAMPLES (MHD ITI-67 Response)
// =========================================================================

Instance: OutcomePartialFailureExample
InstanceOf: OperationOutcome
Title: "OperationOutcome: Partial Downstream Failure"
Description: "Example OperationOutcome returned inside a searchset Bundle when one or more connected downstream hub sources (such as a laboratory, hospital, pharmacy or care home system) fail to respond or time out during getTransactionList."
Usage: #example
* issue[0].severity = #warning
* issue[0].code = #timeout
* issue[0].details.coding[0] = http://terminology.hl7.org/CodeSystem/issue-type#timeout "Timeout"
* issue[0].details.text = "Downstream clinical repository timeout"
* issue[0].diagnostics = "Timeout communicating with connected laboratory repository (NIHDI: 71000012). Results from this facility may be incomplete or omitted from this list."
* issue[1].severity = #warning
* issue[1].code = #transient
* issue[1].details.coding[0] = http://terminology.hl7.org/CodeSystem/issue-type#transient "Transient Issue"
* issue[1].details.text = "Downstream system unavailable (maintenance)"
* issue[1].diagnostics = "Connected hub source (NIHDI: 72000034) is currently unavailable due to scheduled maintenance. Historical documents from this organisation are temporarily excluded."

Instance: BundleTransactionListResponseExample
InstanceOf: Bundle
Title: "Searchset Bundle: getTransactionList Response (MHD ITI-67)"
Description: "Example searchset Bundle returned when querying getTransactionList for patient SSIN 79080412345. Contains DocumentReference entries matching the search criteria alongside an OperationOutcome detailing partial downstream timeouts."
Usage: #example
* type = #searchset
* total = 2
* entry[0].fullUrl = "https://hub.cozo.be/fhir/DocumentReference/DocRefLabReportContainedExample"
* entry[0].resource = DocRefLabReportContainedExample
* entry[0].search.mode = #match
* entry[1].fullUrl = "https://hub.cozo.be/fhir/DocumentReference/DocRefTelemonitoringExample"
* entry[1].resource = DocRefTelemonitoringExample
* entry[1].search.mode = #match
* entry[2].fullUrl = "urn:uuid:6a28746c-63cf-4a69-8db3-705a5a1f26f2"
* entry[2].resource = OutcomePartialFailureExample
* entry[2].search.mode = #outcome
