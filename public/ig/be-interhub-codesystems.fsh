// -------------------------------------------------------------------------
// Belgian Patient Access CodeSystem & ValueSet
// -------------------------------------------------------------------------
CodeSystem: BeCSPatientAccess
Id: be-cs-patient-access
Title: "Belgian Patient Access Code System"
Description: "Codes representing patient access rights and visibility to health documents in the Belgian federated hub system (derived from KMEHR PatientAccess scheme)."
* ^status = #active
* ^experimental = false
* ^caseSensitive = true
* #yes "Accessible to Patient" "The document is accessible to the patient, subject to the optional release date in accessDate. Maps from a KMEHR cd[@S=LOCAL @SL=PatientAccess] whose text is TRUE or YES (compared case-insensitively)."
* #no "Temporarily Withheld" "The document is not currently accessible to the patient. May be released later by the treating physician. This is the value a gateway uses when the KMEHR PatientAccess flag is absent, empty, or holds any value other than TRUE/YES: absence means not released, never unknown."
* #never "Permanently Restricted" "The document is permanently not accessible to the patient (sealed / therapeutic exception). This code has no equivalent in the current KMEHR patient-access flag, which is boolean; a gateway MUST NOT synthesise it from a missing flag and may only emit it where a source system states permanent restriction explicitly."

ValueSet: BeVSPatientAccess
Id: be-vs-patient-access
Title: "Belgian Patient Access Value Set"
Description: "Value set containing patient access codes for Belgian Interhub document sharing."
* ^status = #active
* ^experimental = false
* include codes from system BeCSPatientAccess

// -------------------------------------------------------------------------
// Belgian CD-TRANSACTION CodeSystem & ValueSet
// -------------------------------------------------------------------------
CodeSystem: BeCSCDTransaction
Id: be-cs-cd-transaction
Title: "Belgian CD-TRANSACTION Code System"
Description: "Belgian eHealth CD-TRANSACTION codes representing high-level document categories in the KMEHR and Interhub FHIR ecosystems."
* ^url = "https://www.ehealth.fgov.be/standards/fhir/core/CodeSystem/cd-transaction"
* ^status = #active
* ^experimental = false
* ^caseSensitive = true
* #sumehr "Summarized Electronic Health Record" "Summarized Electronic Health Record (SUMEHR) containing key patient health summary."
* #labresult "Laboratory Result" "Diagnostic laboratory report containing test results, observations, and specimens."
* #discharge "Discharge Report" "Hospital discharge summary or clinical episode report."
* #telemonitoring "Telemonitoring / Remote Patient Monitoring" "Remote patient monitoring report or telemonitoring session summary."
* #note "Clinical Note / Consultation" "Consultation note or contact report."
* #referral "Referral Letter" "Referral letter to another healthcare provider or facility."
* #prescription "Prescription" "Medical prescription for medication, nursing, physiotherapy, or diagnostic tests."
* #radiology "Medical Imaging / Radiology Report" "Medical imaging report and DICOM manifest reference."
* #vaccination "Vaccination Summary" "Vaccination and immunization administration record."
* #dietetics "Dietetics Report" "Dietetics and nutritional assessment report."
* #paramedical "Paramedical Report" "Paramedical or allied health professional report."
* #nursing "Nursing Report" "Nursing care plan and assessment report."

ValueSet: BeVSCDTransaction
Id: be-vs-cd-transaction
Title: "Belgian CD-TRANSACTION Value Set"
Description: "Value set of Belgian document transaction categories used in Interhub sharing."
* ^status = #active
* ^experimental = false
* include codes from system BeCSCDTransaction

// -------------------------------------------------------------------------
// Belgian End-to-End Encryption (ETK) Actor Types
// -------------------------------------------------------------------------
CodeSystem: BeCSETKEncryptionActor
Id: be-cs-etk-encryption-actor
Title: "Belgian ETK Encryption Actor Types"
Description: "Actor types used in the Belgian eHealth End-to-End Encryption (ETEE) and ETK Depot system."
* ^status = #active
* ^experimental = false
* ^caseSensitive = true
* #NIHII "Physician / HCP NIHDI" "Healthcare professional identified by NIHDI / RIZIV number."
* #NIHII-HOSPITAL "Hospital NIHDI" "Hospital or care institution identified by NIHDI institution number."
* #NIHII-PHARMACY "Pharmacy NIHDI" "Public or hospital pharmacy identified by NIHDI pharmacy number."
* #CBE "Enterprise CBE / KBO" "Enterprise or legal entity identified by Crossroads Bank for Enterprises number."
* #SSIN "Citizen SSIN / INSS" "Citizen / patient identified by Social Security Identification Number."
* #EHP "eHealth Platform Entity" "Internal or certified eHealth Platform service entity."

ValueSet: BeVSETKEncryptionActor
Id: be-vs-etk-encryption-actor
Title: "Belgian ETK Encryption Actor Value Set"
Description: "Value set of ETK encryption actor types for end-to-end encrypted Interhub exchanges."
* ^status = #active
* ^experimental = false
* include codes from system BeCSETKEncryptionActor

// -------------------------------------------------------------------------
// Belgian Interhub Format Codes
// -------------------------------------------------------------------------
CodeSystem: BeCSInterhubFormatCodes
Id: be-cs-interhub-format-codes
Title: "Belgian Interhub Document Format Codes"
Description: "Format codes identifying structured FHIR Document Bundles and legacy payloads shared across Belgian Hubs."
* ^status = #active
* ^experimental = false
* ^caseSensitive = true
* #urn:be:fgov:ehealth:lab:document:1.0 "Belgian Lab Report FHIR Document (v1.0)" "Belgian FHIR Document Bundle conforming to the BeLaboratoryReport specification."
* #urn:be:fgov:ehealth:telemonitoring:document:1.0 "Belgian Telemonitoring FHIR Document (v1.0)" "Belgian FHIR Document Bundle conforming to the Telemonitoring / Patient Monitoring specification."
* #urn:be:fgov:ehealth:sumehr:1.0 "Belgian SUMEHR Document (v1.0)" "Belgian Summarized Electronic Health Record Document."
* #urn:be:fgov:ehealth:kmehr:2010 "Legacy KMEHR XML Document" "Legacy KMEHR XML encapsulated message."
* #urn:ihe:iti:xds:2017:pdf "PDF Embedded Document" "PDF document encapsulated in FHIR attachment or binary."

ValueSet: BeVSInterhubFormatCodes
Id: be-vs-interhub-format-codes
Title: "Belgian Interhub Format Codes Value Set"
Description: "Value set containing document format codes recognized by Belgian Hubs."
* ^status = #active
* ^experimental = false
* include codes from system BeCSInterhubFormatCodes
* include codes from valueset http://ihe.net/fhir/ValueSet/mhd-formatcodes
