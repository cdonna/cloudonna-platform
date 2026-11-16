/**
 * One illustrative evidence record, shown on the Trust Center so the
 * page's claims about provenance are visible rather than asserted.
 * English only, same precedent as every other content catalog here.
 *
 * The fields are the real ones the evidence model carries (see
 * docs/intelligence-fabric/evidence-model.md): source type and name,
 * the date the source took effect, the date it was retrieved, a
 * freshness and confidence band, and the scope the claim is valid for.
 *
 * Two deliberate choices: the dates are relative-looking placeholders
 * rather than fabricated precise ones for a named vendor document, and
 * the record includes a *stale* freshness band. A trust page that only
 * ever shows fresh, high-confidence evidence is advertising, not
 * disclosure.
 */
export interface EvidenceRecordField {
  /** Which dict.trustCenterPage.fieldLabels key labels this row. */
  key: "source" | "effectiveDate" | "retrievedDate" | "freshness" | "confidence" | "scope";
  value: string;
  /** Rendered with the caution signal when the value is a limitation
   * rather than a reassurance. */
  caution?: boolean;
}

export const EVIDENCE_RECORD = {
  claim: "SAP Business Data Cloud ships governed data products for core SAP objects without custom modelling.",
  fields: [
    { key: "source", value: "Vendor product documentation, SAP Business Data Cloud" },
    { key: "effectiveDate", value: "Stated effective date of the published document" },
    { key: "retrievedDate", value: "Date ClouDonna last retrieved and hashed it" },
    { key: "freshness", value: "Review due — the source has not been re-checked this quarter", caution: true },
    { key: "confidence", value: "Medium — single official source, no independent corroboration", caution: true },
    { key: "scope", value: "Core SAP objects only. Says nothing about non-SAP sources." },
  ] as EvidenceRecordField[],
};
