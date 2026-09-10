// This file shows an example of a mapping between an existing (set of) HolterDiagnosticReport's and the document that the hub can share. 
// This should show how a program can use existing telemonitoring resources to publish a shareable hub document. 

// --- Source: holter reports ---
Instance: HolterDiagnosticReport
 InstanceOf: holter-diagnostic-report
 Description: "Example source Holter Diagnostic Report"
 Usage: #example
* status = #final
* code = http://loinc.org#18754-2 "Ambulatory cardiac rhythm monitor (Holter) study"
* subject = Reference(PatientExample)
* effectivePeriod.start = "2026-01-01T08:00:00Z"
* effectivePeriod.end   = "2026-01-02T08:00:00Z"
* performer = Reference(PrescriberExample)

// --- Result: the generated TelemonitoringDiagnosticReport ---
Instance: TelemonitoringFromHolterExample
InstanceOf: TelemonitoringDiagnosticReport
Description: "TelemonitoringDiagnosticReport generated from a Holter Diagnostic Report"
Usage: #example
* extension[sourceTelemonitoringReport].valueReference = Reference(HolterDiagnosticReport)  // <-- links source to result
* extension[telemonitoringId].valueIdentifier.system = "http://example.org/telemonitoring-id"
* extension[telemonitoringId].valueIdentifier.value  = "tm-holter-001"
* extension[carepath].extension[carepathId].valueString = "holter-monitoring"
* extension[carepath].extension[version].valueString    = "1.0"
* extension[prescriberApplication].valueString = "TeleMonApp v2.1"
* status    = #final
* code      = http://loinc.org#18754-2 "Ambulatory cardiac rhythm monitor (Holter) study"
* subject   = Reference(PatientExample)
* performer = Reference(PrescriberExample)
* presentedForm[0].contentType = #application/pdf
* presentedForm[0].url         = "https://storage.example.org/reports/holter-001.pdf"
* presentedForm[0].title       = "Holter Monitoring Report"