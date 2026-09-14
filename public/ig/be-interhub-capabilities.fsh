// -------------------------------------------------------------------------
// Belgian Interhub Document Responder CapabilityStatement
// -------------------------------------------------------------------------
Instance: BeInterhubDocumentResponder
InstanceOf: CapabilityStatement
Usage: #definition
Title: "Belgian Interhub Document Responder Capability Statement"
Description: "Defines the mandatory capabilities for Belgian eHealth Hubs and repositories responding to Interhub metadata discovery (getTransactionList / MHD ITI-67), document retrieval (getTransaction / MHD ITI-68) and laboratory observation search requests via HTTP POST. See [Laboratory Observation Search](transactions.html#lab-observation-search) for the contract and [search parameters](transactions.html#lab-observation-search-parameters) for all supported query inputs."
* status = #active
* date = "2026-08-17"
* kind = #requirements
* fhirVersion = #4.0.1
* format[0] = #json
* format[1] = #xml
* rest.mode = #server
* rest.documentation = "Belgian Federated Interhub Document Sharing Server (MHD ITI-67 Responder / ITI-68 Responder / lab observation responder based on IHE QEDm PCC-44). Exposes exactly three interactions — getTransactionList, getTransaction and the laboratory observation search — and mandates HTTP POST for all of them, so that neither the patient SSIN nor the clinical search criteria ever appear in a URL, a proxy access log or a browser history. No endpoints exist for Patient, Practitioner, Organization or Specimen: every reference in a returned resource is either contained or a logical reference by national business identifier."

// Resource: DocumentReference (for getTransactionList / ITI-67 discovery & $retrieve-document)
* rest.resource[0].type = #DocumentReference
* rest.resource[0].profile = "https://www.ehealth.fgov.be/standards/fhir/interhub/StructureDefinition/be-interhub-documentreference"
* rest.resource[0].supportedProfile[0] = "https://www.ehealth.fgov.be/standards/fhir/interhub/StructureDefinition/be-interhub-minimal-documentreference"
* rest.resource[0].interaction[0].code = #search-type
* rest.resource[0].interaction[0].documentation = "Mandatory document discovery via HTTP POST to [base]/DocumentReference/_search with application/x-www-form-urlencoded body. Responding hubs SHALL support POST search. Servers MAY additionally support GET search where required for generic IHE MHD conformance, but Belgian consumers SHALL NOT use it. No read, create, update, delete or history interaction is part of this transaction: the Interhub surface is read-only and consists of this search plus $retrieve-document."

* rest.resource[0].operation[0].name = "retrieve-document"
* rest.resource[0].operation[0].definition = "https://www.ehealth.fgov.be/standards/fhir/interhub/OperationDefinition/be-op-retrieve-document"
* rest.resource[0].operation[0].documentation = "Document retrieval operation invoked via HTTP POST [base]/DocumentReference/$retrieve-document. Accepts a Parameters resource referencing the target DocumentReference and returns the BeInterhubDocumentBundle (Bundle.type = #document) directly, or — under Accept: application/pdf — the hub-rendered PDF as a raw binary stream. This operation replaces a FHIR read on Bundle or Binary: a GET read would put the document identifier in the URL, which the Belgian profile forbids (see transactions.md §3.2)."

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

* rest.resource[0].searchParam[8].name = "searchtype"
* rest.resource[0].searchParam[8].type = #token
* rest.resource[0].searchParam[8].documentation = "Belgian search scope: 'federated' (default) lets the responding hub fan out to its connected hub sources and partner hubs; 'local' restricts the answer to the hub's own index, and therefore reports no downstream partial failure."

* rest.resource[0].searchParam[9].name = "_count"
* rest.resource[0].searchParam[9].type = #number
* rest.resource[0].searchParam[9].documentation = "Maximum number of results per page."

* rest.resource[0].searchParam[10].name = "_sort"
* rest.resource[0].searchParam[10].type = #string
* rest.resource[0].searchParam[10].documentation = "Result ordering: '-date' (default, most recent first) or 'date'."

// Resource: Observation (laboratory observation search, based on IHE QEDm PCC-44)
* rest.resource[1].type = #Observation
* rest.resource[1].profile = "https://www.ehealth.fgov.be/standards/fhir/interhub/StructureDefinition/be-interhub-lab-observation"
* rest.resource[1].interaction[0].code = #search-type
* rest.resource[1].interaction[0].documentation = "Mandatory laboratory observation search via HTTP POST to [base]/Observation/_search with application/x-www-form-urlencoded body. Returns BeInterhubLabObservation resources extracted from laboratory report documents, each carrying logical references only (subject by SSIN, performer by NIHDI/CBE, derivedFrom by source document uniqueId). A responding hub SHALL apply the access decision of the source DocumentReference to every observation extracted from it, SHALL NOT return observations extracted from end-to-end encrypted documents, and SHALL only return observations whose source DocumentReference has status 'current'. No read interaction is offered: the full context of a result is obtained with $retrieve-document on its source document."

* rest.resource[1].searchParam[0].name = "patient.identifier"
* rest.resource[1].searchParam[0].type = #token
* rest.resource[1].searchParam[0].documentation = "Mandatory patient SSIN/INSS (system=https://www.ehealth.fgov.be/standards/fhir/core/NamingSystem/ssin), same syntax as getTransactionList. Matched against Observation.subject.identifier: the responder does not resolve a Patient resource."

* rest.resource[1].searchParam[1].name = "code"
* rest.resource[1].searchParam[1].type = #token
* rest.resource[1].searchParam[1].documentation = "Mandatory: one or more LOINC analyte codes, e.g. 'http://loinc.org|1558-6'."

* rest.resource[1].searchParam[2].name = "category"
* rest.resource[1].searchParam[2].type = #token
* rest.resource[1].searchParam[2].documentation = "Optional, for IHE QEDm compatibility: 'http://terminology.hl7.org/CodeSystem/observation-category|laboratory'. Every observation on this endpoint is a laboratory result, so omitting it does not change the result."

* rest.resource[1].searchParam[3].name = "date"
* rest.resource[1].searchParam[3].type = #date
* rest.resource[1].searchParam[3].documentation = "Filters observations by effectiveDateTime timestamp range (ge, le)."

* rest.resource[1].searchParam[4].name = "searchtype"
* rest.resource[1].searchParam[4].type = #token
* rest.resource[1].searchParam[4].documentation = "Belgian federation scope: 'federated' (default, fans out across connected hubs) or 'local' (searches only local hub index)."

* rest.resource[1].searchParam[5].name = "_count"
* rest.resource[1].searchParam[5].type = #number
* rest.resource[1].searchParam[5].documentation = "Maximum number of observations returned per page."

* rest.resource[1].searchParam[6].name = "_sort"
* rest.resource[1].searchParam[6].type = #string
* rest.resource[1].searchParam[6].documentation = "Result ordering: '-date' (default, newest first) or 'date'."

// -------------------------------------------------------------------------
// Belgian Interhub Document Consumer CapabilityStatement
// -------------------------------------------------------------------------
Instance: BeInterhubDocumentConsumer
InstanceOf: CapabilityStatement
Usage: #definition
Title: "Belgian Interhub Document Consumer Capability Statement"
Description: "Defines the mandatory capabilities for initiating Belgian eHealth Hubs (and cross-border NCPeH endpoints) discovering and retrieving health documents and searching laboratory observations from responding Belgian Hubs via Interhub using HTTP POST. See [Laboratory Observation Search](transactions.html#lab-observation-search) for the contract and [search parameters](transactions.html#lab-observation-search-parameters) for all supported query inputs."
* status = #active
* date = "2026-08-17"
* kind = #requirements
* fhirVersion = #4.0.1
* format[0] = #json
* format[1] = #xml
* rest.mode = #client
* rest.documentation = "Belgian Federated Interhub Document Consumer (MHD ITI-67 Initiating Hub / ITI-68 Initiating Hub / lab observation consumer based on IHE QEDm PCC-44). Initiating consumers SHALL execute metadata queries, document retrievals and laboratory observation searches via HTTP POST, and SHALL NOT rely on any other interaction of the responding hub, nor attempt to resolve logical references (they carry a business identifier, not a URL)."

* rest.resource[0].type = #DocumentReference
* rest.resource[0].profile = "https://www.ehealth.fgov.be/standards/fhir/interhub/StructureDefinition/be-interhub-documentreference"
* rest.resource[0].supportedProfile[0] = "https://www.ehealth.fgov.be/standards/fhir/interhub/StructureDefinition/be-interhub-minimal-documentreference"
* rest.resource[0].interaction[0].code = #search-type
* rest.resource[0].interaction[0].documentation = "Consumers SHALL execute discovery queries via HTTP POST to [base]/DocumentReference/_search with search parameters encoded in the request body as application/x-www-form-urlencoded. Pagination SHALL also use POST, replaying the opaque continuation parameter carried in Bundle.link[relation=next]."

* rest.resource[0].operation[0].name = "retrieve-document"
* rest.resource[0].operation[0].definition = "https://www.ehealth.fgov.be/standards/fhir/interhub/OperationDefinition/be-op-retrieve-document"
* rest.resource[0].operation[0].documentation = "Consumers SHALL execute document retrieval via HTTP POST [base]/DocumentReference/$retrieve-document, providing the target DocumentReference in the request Parameters, and SHALL NOT attempt a GET read on the returned Bundle or Binary."

* rest.resource[1].type = #Observation
* rest.resource[1].profile = "https://www.ehealth.fgov.be/standards/fhir/interhub/StructureDefinition/be-interhub-lab-observation"
* rest.resource[1].interaction[0].code = #search-type
* rest.resource[1].interaction[0].documentation = "Consumers SHALL execute laboratory observation queries via HTTP POST to [base]/Observation/_search with search parameters encoded in the request body as application/x-www-form-urlencoded. Consumers SHALL check that Observation.subject.identifier matches the queried SSIN before merging federated results, and SHALL obtain the full report by calling $retrieve-document at the hub named in the homeCommunityId extension, passing derivedFrom.identifier."

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
* parameter[0].documentation = "The BeInterhubDocumentReference representing the document to be retrieved: either a literal reference taken from a getTransactionList result (DocumentReference/[id]), or a logical reference carrying only identifier (system urn:ietf:rfc:3986, value = the document uniqueId), as found in BeInterhubLabObservation.derivedFrom and DocumentReference.relatesTo.target. The responding hub SHALL support both forms."

* parameter[1].name = #return
* parameter[1].use = #out
* parameter[1].min = 0
* parameter[1].max = "1"
* parameter[1].type = #Resource
* parameter[1].documentation = "The retrieved clinical document payload: a FHIR Document Bundle (Bundle.type = #document) or a Binary resource representing raw/rendered content (e.g., PDF or CDA)."
