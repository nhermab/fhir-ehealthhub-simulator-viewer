// -------------------------------------------------------------------------
// Belgian Interhub Document Responder CapabilityStatement
// -------------------------------------------------------------------------
Instance: BeInterhubDocumentResponder
InstanceOf: CapabilityStatement
Usage: #definition
Title: "Belgian Interhub Document Responder Capability Statement"
Description: "Defines the mandatory capabilities for Belgian eHealth Hubs and repositories responding to Interhub metadata discovery (getTransactionList / MHD ITI-67) and document retrieval (getTransaction / MHD ITI-68) requests via HTTP POST."
* status = #active
* date = "2026-08-17"
* kind = #requirements
* fhirVersion = #4.0.1
* format[0] = #json
* format[1] = #xml
* rest.mode = #server
* rest.documentation = "Belgian Federated Interhub Document Sharing Server (MHD ITI-67 Responder / ITI-68 Responder). Mandates HTTP POST for both metadata search and document retrieval to prevent sensitive patient data leakage in network access logs."

// Resource: DocumentReference (for getTransactionList / ITI-67 discovery & $retrieve-document)
* rest.resource[0].type = #DocumentReference
* rest.resource[0].profile = "https://www.ehealth.fgov.be/standards/fhir/interhub/StructureDefinition/be-interhub-documentreference"
* rest.resource[0].interaction[0].code = #search-type
* rest.resource[0].interaction[0].documentation = "Mandatory document discovery via HTTP POST to [base]/DocumentReference/_search with application/x-www-form-urlencoded body. Responding hubs SHALL support POST search. Servers MAY additionally support GET search where required for generic IHE MHD conformance."
* rest.resource[0].interaction[1].code = #read
* rest.resource[0].interaction[1].documentation = "Optional/conditional read of DocumentReference resources by ID."

* rest.resource[0].operation[0].name = "retrieve-document"
* rest.resource[0].operation[0].definition = "https://www.ehealth.fgov.be/standards/fhir/interhub/OperationDefinition/be-op-retrieve-document"
* rest.resource[0].operation[0].documentation = "Document retrieval operation invoked via HTTP POST [base]/DocumentReference/$retrieve-document. Accepts a Parameters resource referencing the target DocumentReference and returns the full Document Bundle (or Binary payload) directly."

* rest.resource[0].searchParam[0].name = "patient.identifier"
* rest.resource[0].searchParam[0].type = #token
* rest.resource[0].searchParam[0].documentation = "Mandatory patient search parameter using national SSIN/INSS (system=https://www.ehealth.fgov.be/standards/fhir/core/NamingSystem/ssin or urn:oid:1.3.6.1.4.1.21297.100.1.1)."

* rest.resource[0].searchParam[1].name = "category"
* rest.resource[0].searchParam[1].type = #token
* rest.resource[0].searchParam[1].documentation = "Filters by Belgian CD-TRANSACTION code (e.g. sumehr, labresult, discharge, telemonitoring)."

* rest.resource[0].searchParam[2].name = "type"
* rest.resource[0].searchParam[2].type = #token
* rest.resource[0].searchParam[2].documentation = "Filters by clinical document type (LOINC code)."

* rest.resource[0].searchParam[3].name = "date"
* rest.resource[0].searchParam[3].type = #date
* rest.resource[0].searchParam[3].documentation = "Filters by document creation date range (using ge and le prefixes)."

* rest.resource[0].searchParam[4].name = "author.identifier"
* rest.resource[0].searchParam[4].type = #token
* rest.resource[0].searchParam[4].documentation = "Filters by authoring practitioner or institution NIHDI/SSIN/CBE identifier."

* rest.resource[0].searchParam[5].name = "status"
* rest.resource[0].searchParam[5].type = #token
* rest.resource[0].searchParam[5].documentation = "Document reference status (current, superseded)."

* rest.resource[0].searchParam[6].name = "_id"
* rest.resource[0].searchParam[6].type = #token
* rest.resource[0].searchParam[6].documentation = "Document logical ID."

* rest.resource[0].searchParam[7].name = "identifier"
* rest.resource[0].searchParam[7].type = #token
* rest.resource[0].searchParam[7].documentation = "Universal or local document identifier."

// Resource: Bundle (for getTransaction / ITI-68 document retrieval)
* rest.resource[1].type = #Bundle
* rest.resource[1].profile = "https://www.ehealth.fgov.be/standards/fhir/interhub/StructureDefinition/be-interhub-document-bundle"
* rest.resource[1].interaction[0].code = #read
* rest.resource[1].documentation = "Retrieval of complete FHIR Document Bundles (type=document) by ID where standard GET read is supported in backend/downstream repositories."

// -------------------------------------------------------------------------
// Belgian Interhub Document Consumer CapabilityStatement
// -------------------------------------------------------------------------
Instance: BeInterhubDocumentConsumer
InstanceOf: CapabilityStatement
Usage: #definition
Title: "Belgian Interhub Document Consumer Capability Statement"
Description: "Defines the mandatory capabilities for initiating Belgian eHealth Hubs (and cross-border NCPeH endpoints) querying and retrieving health documents from responding Belgian Hubs via Interhub using HTTP POST."
* status = #active
* date = "2026-08-17"
* kind = #requirements
* fhirVersion = #4.0.1
* format[0] = #json
* format[1] = #xml
* rest.mode = #client
* rest.documentation = "Belgian Federated Interhub Document Consumer (MHD ITI-67 Initiating Hub / ITI-68 Initiating Hub). Initiating consumers SHALL execute metadata queries and document retrievals via HTTP POST."

* rest.resource[0].type = #DocumentReference
* rest.resource[0].profile = "https://www.ehealth.fgov.be/standards/fhir/interhub/StructureDefinition/be-interhub-documentreference"
* rest.resource[0].interaction[0].code = #search-type
* rest.resource[0].interaction[0].documentation = "Consumers SHALL execute discovery queries via HTTP POST to [base]/DocumentReference/_search with search parameters encoded in the request body as application/x-www-form-urlencoded."
* rest.resource[0].interaction[1].code = #read

* rest.resource[0].operation[0].name = "retrieve-document"
* rest.resource[0].operation[0].definition = "https://www.ehealth.fgov.be/standards/fhir/interhub/OperationDefinition/be-op-retrieve-document"
* rest.resource[0].operation[0].documentation = "Consumers SHALL execute document retrieval via HTTP POST [base]/DocumentReference/$retrieve-document, providing the target DocumentReference in the request Parameters."

* rest.resource[1].type = #Bundle
* rest.resource[1].profile = "https://www.ehealth.fgov.be/standards/fhir/interhub/StructureDefinition/be-interhub-document-bundle"
* rest.resource[1].interaction[0].code = #read

// -------------------------------------------------------------------------
// Belgian Interhub Retrieve Document OperationDefinition
// -------------------------------------------------------------------------
Instance: BeRetrieveDocument
InstanceOf: OperationDefinition
Usage: #definition
Title: "Belgian Interhub Document Retrieval Operation ($retrieve-document)"
Description: "Defines the FHIR R4 operation used by Belgian initiating hubs to retrieve complete clinical document bundles or rendered binaries via HTTP POST, avoiding URL and query parameter leakage in network access logs."
* url = "https://www.ehealth.fgov.be/standards/fhir/interhub/OperationDefinition/be-op-retrieve-document"
* name = "BeRetrieveDocument"
* status = #active
* kind = #operation
* code = #retrieve-document
* resource[0] = #DocumentReference
* system = false
* type = true
* instance = false
* affectsState = false

* parameter[0].name = #documentReference
* parameter[0].use = #in
* parameter[0].min = 1
* parameter[0].max = "1"
* parameter[0].type = #Reference
* parameter[0].targetProfile[0] = "https://www.ehealth.fgov.be/standards/fhir/interhub/StructureDefinition/be-interhub-documentreference"
* parameter[0].documentation = "Reference to the BeInterhubDocumentReference representing the document to be retrieved."

* parameter[1].name = #return
* parameter[1].use = #out
* parameter[1].min = 0
* parameter[1].max = "1"
* parameter[1].type = #Resource
* parameter[1].documentation = "The retrieved clinical document payload: a FHIR Document Bundle (Bundle.type = #document) or a Binary resource representing raw/rendered content (e.g., PDF or CDA)."
