export const SSIN =
  "https://www.ehealth.fgov.be/standards/fhir/core/NamingSystem/ssin";
export const SSIN_OID = "urn:oid:1.3.6.1.4.1.21297.100.1.1";
export const EXT =
  "https://www.ehealth.fgov.be/standards/fhir/interhub/StructureDefinition/be-ext-";
export const CATEGORY =
  "https://www.ehealth.fgov.be/standards/fhir/core/CodeSystem/cd-transaction";
export const LAB_OBSERVATION_PROFILE =
  "https://www.ehealth.fgov.be/standards/fhir/interhub/StructureDefinition/be-interhub-lab-observation";
export const LOINC_SYSTEM = "http://loinc.org";
export const UCUM_SYSTEM = "http://unitsofmeasure.org";
export const pretty = (x) => JSON.stringify(x, null, 2);
export const extension = (r, name) =>
  r?.extension?.find((e) => e.url === EXT + name);
export const value = (e) =>
  e && Object.entries(e).find(([k]) => k.startsWith("value"))?.[1];
export const codeText = (c) =>
  c?.text ||
  c?.coding?.map((c) => c.display || c.code).join(" · ") ||
  "Not supplied";
export const humanName = (r) =>
  typeof r?.name === "string"
    ? r.name
    : r?.name?.[0]?.text ||
      [...(r?.name?.[0]?.given || []), r?.name?.[0]?.family]
        .filter(Boolean)
        .join(" ") ||
      r?.id ||
      "Not supplied";
export function resolveReference(ref, owner, bundle) {
  if (!ref?.reference) return null;
  if (ref.reference.startsWith("#"))
    return owner?.contained?.find((x) => "#" + x.id === ref.reference);
  return bundle?.entry?.find(
    (e) =>
      e.fullUrl === ref.reference ||
      `${e.resource?.resourceType}/${e.resource?.id}` === ref.reference,
  )?.resource;
}
export const referenceText = (ref, owner, bundle) =>
  ref?.display ||
  (resolveReference(ref, owner, bundle)
    ? humanName(resolveReference(ref, owner, bundle))
    : ref?.identifier?.value || ref?.reference || "Not supplied");
export const title = (r) =>
  r?.content?.[0]?.attachment?.title ||
  r?.description ||
  (r?.type ? codeText(r.type) : "Minimal document reference");
export const isMinimal = (r) =>
  r?.meta?.profile?.some((p) =>
    p.endsWith("/be-interhub-minimal-documentreference"),
  );
export function validateSsin(input, strict = false) {
  const normalized = String(input).replace(/[.\s-]/g, "");
  if (!/^\d{11}$/.test(normalized))
    return {
      valid: false,
      normalized,
      message: "Enter an 11-digit Belgian SSIN / INSS.",
    };
  const n = Number(normalized.slice(0, 9)),
    check = Number(normalized.slice(9));
  const checksum =
    97 - (n % 97) === check || 97 - ((2000000000 + n) % 97) === check;
  return {
    valid: !strict || checksum,
    normalized,
    checksum,
    message: checksum
      ? "Checksum valid"
      : strict
        ? "SSIN modulo-97 checksum is invalid."
        : "Synthetic SSIN: checksum validation is disabled.",
  };
}
export function searchParams(f, strict = false) {
  const ssin = validateSsin(f.patient, strict);
  if (!ssin.valid) throw Error(ssin.message);
  if (f.from && f.to && f.from > f.to)
    throw Error("Start date must be before end date.");
  const p = new URLSearchParams({
    "patient.identifier": `${f.system || SSIN}|${ssin.normalized}`,
  });
  for (const key of [
    "category",
    "type",
    "author.identifier",
    "status",
    "_id",
    "identifier",
    "searchtype",
    "_sort",
    "_count",
  ])
    if (f[key]) p.set(key, f[key]);
  if (f.from) p.append("date", "ge" + f.from);
  if (f.to) p.append("date", "le" + f.to);
  return p;
}
export function observationSearchParams(f, strict = false) {
  const ssin = validateSsin(f.patient, strict);
  if (!ssin.valid) throw Error(ssin.message);
  if (!f.code || !f.code.trim())
    throw Error("Enter at least one LOINC analyte code (e.g. 1558-6 or http://loinc.org|1558-6).");
  if (f.from && f.to && f.from > f.to)
    throw Error("Start date must be before end date.");
  const p = new URLSearchParams({
    "patient.identifier": `${f.system || SSIN}|${ssin.normalized}`,
    code: f.code.trim(),
  });
  for (const key of ["category", "searchtype", "_sort", "_count"])
    if (f[key]) p.set(key, f[key]);
  if (f.from) p.append("date", "ge" + f.from);
  if (f.to) p.append("date", "le" + f.to);
  return p;
}
export const retrieveBody = (ref) => ({
  resourceType: "Parameters",
  parameter: [
    {
      name: "documentReference",
      valueReference:
        typeof ref === "string" ? { reference: ref } : { identifier: ref },
    },
  ],
});
export const outcome = (code, diagnostics, severity = "error") => ({
  resourceType: "OperationOutcome",
  issue: [{ severity, code, diagnostics }],
});
export function splitSearch(bundle) {
  if (bundle?.resourceType !== "Bundle" || bundle.type !== "searchset")
    throw Error(
      "Expected a FHIR searchset Bundle. Inspect the response in the developer console.",
    );
  return {
    documents: (bundle.entry || [])
      .filter(
        (e) =>
          e.resource?.resourceType === "DocumentReference" &&
          e.search?.mode !== "outcome",
      )
      .map((e) => e.resource),
    observations: (bundle.entry || [])
      .filter(
        (e) =>
          e.resource?.resourceType === "Observation" &&
          e.search?.mode !== "outcome",
      )
      .map((e) => e.resource),
    issues: (bundle.entry || [])
      .filter((e) => e.resource?.resourceType === "OperationOutcome")
      .flatMap((e) => e.resource.issue || []),
  };
}
export function validateResource(r) {
  const checks = [];
  const add = (path, pass, requirement) =>
    checks.push({ path, pass: !!pass, requirement });
  if (r?.resourceType === "DocumentReference") {
    const minimal = isMinimal(r),
      a = r.content?.[0]?.attachment;
    add(
      "masterIdentifier",
      r.masterIdentifier?.system && r.masterIdentifier?.value,
      "Global document identifier",
    );
    add(
      "status",
      ["current", "superseded", "entered-in-error"].includes(r.status),
      "FHIR document reference status",
    );
    add(
      "subject.identifier",
      r.subject?.identifier?.system === SSIN && r.subject?.identifier?.value,
      "Inline Belgian SSIN",
    );
    const home = extension(r, "home-community-id");
    add(
      "extension.homeCommunityId",
      home?.valueUri || home?.valueIdentifier?.value,
      "Required home community routing identifier",
    );
    add(
      "content",
      r.content?.length === 1 && a?.url && a?.contentType,
      "Exactly one content attachment with URL and media type",
    );
    for (const rel of r.relatesTo || [])
      add(
        "relatesTo.target.identifier",
        rel.code &&
          rel.target?.identifier?.system === "urn:ietf:rfc:3986" &&
          rel.target?.identifier?.value,
        "Relationship uses a logical business identifier",
      );
    const access = extension(r, "patient-access");
    if (access) {
      const mode = value(access.extension?.find((x) => x.url === "access"));
      add(
        "extension.patientAccess.access",
        ["yes", "no", "never"].includes(mode),
        "Patient access permission",
      );
      add(
        "extension.patientAccess.accessDate",
        !access.extension?.some((x) => x.url === "accessDate") ||
          mode === "yes",
        "Access date only applies to yes",
      );
    }
    const enc = extension(r, "end-to-end-encryption");
    if (enc)
      for (const k of ["actorId", "actorType"])
        add(
          "extension.endToEndEncryption." + k,
          enc.extension?.some((e) => e.url === k && value(e)),
          "Required ETK metadata",
        );
    if (!minimal) {
      add(
        "category",
        r.category?.length === 1 &&
          r.category[0].coding?.some((c) => c.system === CATEGORY && c.code),
        "One CD-TRANSACTION category",
      );
      add(
        "type",
        r.type?.coding?.length &&
          r.type.coding.every((c) => c.system && c.code),
        "Clinical type coding",
      );
      add(
        "author",
        r.author?.length &&
          r.author.every(
            (a) => a.reference?.startsWith("#") && resolveReference(a, r),
          ),
        "Contained author references",
      );
      add(
        "context.sourcePatientInfo",
        r.context?.sourcePatientInfo?.reference?.startsWith("#") &&
          resolveReference(r.context.sourcePatientInfo, r)?.resourceType ===
            "Patient",
        "Contained patient snapshot",
      );
      add("securityLabel", r.securityLabel?.length, "Confidentiality label");
      for (const k of ["language", "creation"])
        add(
          "content.attachment." + k,
          a?.[k],
          "Required Comprehensive attachment metadata",
        );
      add(
        "content.format",
        r.content?.[0]?.format?.code,
        "Document format code",
      );
      for (const k of ["facilityType", "practiceSetting"])
        add("context." + k, r.context?.[k], "Required Comprehensive context");
      for (const k of ["authenticator", "custodian"])
        if (r[k])
          add(
            k,
            r[k].reference?.startsWith("#") && resolveReference(r[k], r),
            "Contained reference",
          );
    }
  } else if (r?.resourceType === "Bundle") {
    add(
      "type",
      r.type === "document",
      "Interhub retrieval returns a document Bundle",
    );
    add(
      "identifier",
      r.identifier?.system && r.identifier?.value,
      "Global document identifier",
    );
    add("timestamp", r.timestamp, "Document generation timestamp");
    add(
      "entry[0].resource",
      r.entry?.[0]?.resource?.resourceType === "Composition",
      "Composition is the first entry",
    );
    add(
      "entry.composition",
      r.entry?.filter((e) => e.resource?.resourceType === "Composition")
        .length === 1,
      "Exactly one Composition",
    );
    const urls = (r.entry || []).map((e) => e.fullUrl);
    add(
      "entry.fullUrl",
      urls.length && urls.every(Boolean) && new Set(urls).size === urls.length,
      "Unique fullUrl for each entry",
    );
    const walk = (node, owner, path) => {
      if (!node || typeof node !== "object") return;
      if (node.reference && typeof node.reference === "string")
        add(
          path + ".reference",
          !!resolveReference(node, owner, r),
          "Self-contained resolvable document reference",
        );
      for (const [k, v] of Object.entries(node))
        if (typeof v === "object")
          Array.isArray(v)
            ? v.forEach((a, i) => walk(a, owner, `${path}.${k}[${i}]`))
            : walk(v, owner, path + "." + k);
    };
    for (const [i, e] of (r.entry || []).entries())
      walk(e.resource, e.resource, `entry[${i}].resource`);
  } else if (r?.resourceType === "Observation") {
    add(
      "meta.profile",
      r.meta?.profile?.some((p) => p.endsWith("/be-interhub-lab-observation")),
      "Conforms to BeInterhubLabObservation profile",
    );
    add(
      "status",
      ["final", "amended", "corrected", "preliminary"].includes(r.status),
      "Observation status (entered-in-error is prohibited)",
    );
    add(
      "category",
      r.category?.some((cat) =>
        cat.coding?.some((c) => c.code === "laboratory"),
      ),
      "Fixed HL7 observation category 'laboratory'",
    );
    add(
      "code.coding[loinc]",
      r.code?.coding?.some((c) => c.system === "http://loinc.org" && c.code),
      "LOINC analyte code",
    );
    add(
      "subject.identifier",
      r.subject?.identifier?.system === SSIN && r.subject?.identifier?.value,
      "Logical reference to patient by national SSIN",
    );
    add(
      "performer[0].identifier",
      r.performer?.length &&
        r.performer.some((p) => p.identifier?.value && !p.reference),
      "Logical reference to performing laboratory by NIHDI/CBE",
    );
    add(
      "derivedFrom[0].identifier",
      r.derivedFrom?.length === 1 &&
        r.derivedFrom[0].identifier?.system === "urn:ietf:rfc:3986" &&
        r.derivedFrom[0].identifier?.value &&
        !r.derivedFrom[0].reference,
      "Logical reference to source document uniqueId (RFC 3986)",
    );
    const home = extension(r, "home-community-id");
    add(
      "extension.homeCommunityId",
      home?.valueUri || home?.valueIdentifier?.value,
      "Required homeCommunityId routing extension",
    );
    add(
      "effective[x]",
      r.effectiveDateTime || r.effectivePeriod,
      "Clinically relevant effective time",
    );
    add(
      "value[x]",
      (r.valueQuantity && r.valueQuantity.value !== undefined) ||
        r.valueString ||
        r.valueCodeableConcept ||
        r.dataAbsentReason,
      "Observation result value or dataAbsentReason",
    );
    if (r.valueQuantity) {
      add(
        "valueQuantity.system",
        r.valueQuantity.system === "http://unitsofmeasure.org",
        "UCUM unit system for quantitative values",
      );
    }
    const prohibited = [
      "basedOn",
      "partOf",
      "focus",
      "encounter",
      "specimen",
      "device",
      "hasMember",
      "contained",
    ];
    for (const p of prohibited) {
      add(
        p,
        !r[p] || (Array.isArray(r[p]) && r[p].length === 0),
        `Prohibited element '${p}' is absent`,
      );
    }
  }
  return checks;
}
export function tokenMatch(token, identifiers = []) {
  if (!token) return true;
  const bits = token.split("|");
  return identifiers.some((i) =>
    bits.length === 1
      ? (i.code || i.value) === bits[0]
      : i.system === bits[0] && (i.code || i.value) === bits[1],
  );
}
export function filterFixtures(docs, p) {
  let list = docs.filter((d) => {
    const raw = p.get("patient.identifier") || "",
      parts = raw.split("|");
    if (parts.length > 1 && ![SSIN, SSIN_OID].includes(parts[0])) return false;
    if (d.subject?.identifier?.value !== parts.at(-1)) return false;
    if (
      !tokenMatch(
        p.get("category"),
        d.category?.flatMap((c) => c.coding || []) || [],
      ) ||
      !tokenMatch(p.get("type"), d.type?.coding || [])
    )
      return false;
    if (p.get("status") && d.status !== p.get("status")) return false;
    if (p.get("_id") && d.id !== p.get("_id")) return false;
    if (
      !tokenMatch(
        p.get("identifier"),
        [d.masterIdentifier, ...(d.identifier || [])].filter(Boolean),
      )
    )
      return false;
    if (
      !tokenMatch(
        p.get("author.identifier"),
        (d.author || []).flatMap((a) =>
          [a.identifier, ...(resolveReference(a, d)?.identifier || [])].filter(
            Boolean,
          ),
        ),
      )
    )
      return false;
    return p.getAll("date").every((date) => {
      const prefix = date.slice(0, 2),
        day = date.slice(2),
        actual = (d.date || "").slice(0, 10);
      return (
        !!actual &&
        ({
          ge: actual >= day,
          le: actual <= day,
          gt: actual > day,
          lt: actual < day,
          eq: actual === day,
        }[prefix] ??
          false)
      );
    });
  });
  list.sort(
    (a, b) =>
      (a.date || "").localeCompare(b.date || "") *
      (p.get("_sort") === "date" ? 1 : -1),
  );
  return list;
}
export function filterObservationFixtures(obsList, p) {
  let list = obsList.filter((obs) => {
    const raw = p.get("patient.identifier") || "",
      parts = raw.split("|");
    if (parts.length > 1 && ![SSIN, SSIN_OID].includes(parts[0])) return false;
    if (obs.subject?.identifier?.value !== parts.at(-1)) return false;
    if (
      p.get("category") &&
      !tokenMatch(
        p.get("category"),
        obs.category?.flatMap((c) => c.coding || []) || [],
      )
    )
      return false;
    const requestedCodes = (p.get("code") || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (requestedCodes.length > 0) {
      const match = requestedCodes.some((codeToken) =>
        tokenMatch(codeToken, obs.code?.coding || []),
      );
      if (!match) return false;
    }
    return p.getAll("date").every((date) => {
      const prefix = date.slice(0, 2),
        day = date.slice(2),
        actual = (obs.effectiveDateTime || "").slice(0, 10);
      return (
        !!actual &&
        ({
          ge: actual >= day,
          le: actual <= day,
          gt: actual > day,
          lt: actual < day,
          eq: actual === day,
        }[prefix] ??
          false)
      );
    });
  });
  list.sort(
    (a, b) =>
      (a.effectiveDateTime || "").localeCompare(b.effectiveDateTime || "") *
      (p.get("_sort") === "date" ? 1 : -1),
  );
  return list;
}
export function redactHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [
      k,
      /authorization|cookie|token|secret|api.key|dpop|signature/i.test(k)
        ? "[REDACTED]"
        : v,
    ]),
  );
}
export function curlCommand(r) {
  const quote = (s) => "'" + String(s).replaceAll("'", "'\\''") + "'";
  return [
    "curl --request " + r.method + " " + quote(r.url),
    ...Object.entries(redactHeaders(r.headers)).map(
      ([k, v]) => "  --header " + quote(k + ": " + v),
    ),
    ...(r.body ? ["  --data-raw " + quote(r.body)] : []),
  ].join(" \\\n");
}
