// ---- Extensions ----

Extension: TelemonitoringId
Id: telemonitoring-id
Title: "Telemonitoring Session Identifier"
Description: "Identifies the telemonitoring session this resource belongs to. Multiple resources may share the same telemonitoring session identifier."
* value[x] only Identifier
* valueIdentifier 1..1
* valueIdentifier.system 1..1
* valueIdentifier.value 1..1

Extension: Carepath
Id: carepath
Title: "Carepath"
Description: "The carepath associated with this telemonitoring session"
* extension contains
    carepathId 1..1 and
    version 0..1
* extension[carepathId].value[x] only string
* extension[carepathId] ^short = "Carepath identifier"
* extension[version].value[x] only string
* extension[version] ^short = "Carepath version"

Extension: PrescriberApplication
Id: prescriber-application
Title: "Prescriber Application"
Description: "The application used by the prescriber to initiate the telemonitoring session"
* value[x] only string
* valueString 1..1

Extension: SourceTelemonitoringReport
Id: source-telemonitoring-report
Title: "Source Telemonitoring Report"
Description: "Identifies the original report that was used to generate this telemonitoring report, if applicable."
* value[x] only Reference(DiagnosticReport)
* valueReference 1..1

// ---- Profile ----

Profile: TelemonitoringDiagnosticReport
Parent: DiagnosticReport
Title: "Telemonitoring Diagnostic Report"
Description: "A DiagnosticReport profile for sharing telemonitoring observations between hubs. hl7.fhir.be.core defines no national DiagnosticReport profile, so this one derives from the HL7 base resource; every party and observation it references is nevertheless constrained to the Belgian federal profiles (BePatient, BePractitioner, BePractitionerRole, BeOrganization, BeObservation)."

* extension contains
    TelemonitoringId named telemonitoringId 1..1 and
    Carepath named carepath 0..1 and
    PrescriberApplication named prescriberApplication 0..1 and
    SourceTelemonitoringReport named sourceTelemonitoringReport 0..*

* status MS
* code 1..1 MS
* subject 1..1 MS
* subject only Reference($BePatient)
* subject ^short = "The monitored patient, as a Belgian federal BePatient (carrying the SSIN/INSS identifier slice)"
* performer 0..* MS
* performer only Reference($BePractitioner or $BePractitionerRole or $BeOrganization)
* performer ^short = "Prescriber, monitoring service or monitoring organisation, as Belgian federal profiles (NIHDI / CBE / EHP identifier slices)"
* result 0..* MS
* result only Reference($BeObservation)
* presentedForm 0..* MS

// ---- Example supporting resources ----

Instance: PatientExample
InstanceOf: BePatient
Description: "An example patient, conforming to the Belgian federal BePatient profile"
Usage: #example
* identifier[SSIN].system = $BE-NS-SSIN
* identifier[SSIN].value = "85073012345"
* name[0].family = "Tables"
* name[0].given[0] = "Bobby"
* gender = #male
* birthDate = "1985-07-30"

Instance: PrescriberExample
InstanceOf: BePractitioner
Description: "An example prescriber, conforming to the Belgian federal BePractitioner profile"
Usage: #example
* identifier[NIHDI].system = $BE-NS-NIHDI
* identifier[NIHDI].value = "13456789012"
* name[0].family = "Johnson"
* name[0].given[0] = "Difoolus"

Instance: SourceDiagnosticReportExample
InstanceOf: DiagnosticReport
Description: "An example source diagnostic report"
Usage: #example
* status = #final
* code = http://loinc.org#18754-2 "Ambulatory cardiac rhythm monitor (Holter) study"
* subject = Reference(PatientExample)

// ---- Example instance ----

Instance: TelemonitoringDiagnosticReportExample
InstanceOf: TelemonitoringDiagnosticReport
Description: "An example of a telemonitoring diagnostic report based on the TMP base message structure"
Usage: #example
* extension[telemonitoringId].valueIdentifier.system = "http://example.org/telemonitoring-id"
* extension[telemonitoringId].valueIdentifier.value = "tm-12345"
* extension[carepath].extension[carepathId].valueString = "holter-monitoring"
* extension[carepath].extension[version].valueString = "1.0"
* extension[prescriberApplication].valueString = "TeleMonApp v2.1"
* extension[sourceTelemonitoringReport].valueReference = Reference(SourceDiagnosticReportExample)
* status = #registered
* code = http://example.org/service-types#telemonitoring "Telemonitoring"
* subject = Reference(PatientExample)
* performer = Reference(PrescriberExample)
* presentedForm[0].contentType = #application/pdf
* presentedForm[0].language = #nl
* presentedForm[0].url = "https://storage.example.org/attachments/doc1.pdf"
* presentedForm[0].title = "Monitoring Report"
