import type { Locale } from "./locales";

/**
 * Display-layer overrides for the ten fixed scoring-dimension labels
 * (`SCORE_DIMENSION_LABELS` in scoring/weights.ts) shown in
 * OverviewTab's "Evidence: full score breakdown" section. Deliberately
 * NOT a change to the scoring module itself — `ScoreDimensionKey` is a
 * closed, ten-value enum, so this is a safe, scoped, UI-boundary
 * translation, the same pattern as option-labels.ts. The much larger
 * body of dynamically-composed narrative text (positiveEvidence,
 * concerns, executiveSummary, currentSituation — built as pre-baked
 * English sentences inside scoring/engine.ts with no key attached for
 * a translation layer to look up) is NOT covered here; localizing that
 * would require restructuring DecisionOutput to carry a key alongside
 * each sentence, a real shape change to a heavily-tested core module —
 * out of scope for this pass, disclosed in the release report rather
 * than attempted under time pressure.
 */
const DIMENSION_LABEL_OVERRIDES: Record<string, Partial<Record<Locale, string>>> = {
  architecture: { de: "Architektur-Eignung", fr: "Adéquation architecture", es: "Adecuación de arquitectura", it: "Idoneità architetturale" },
  business: { de: "Business-Eignung", fr: "Adéquation métier", es: "Adecuación de negocio", it: "Idoneità di business" },
  technology: { de: "Technologie-Eignung", fr: "Adéquation technologique", es: "Adecuación tecnológica", it: "Idoneità tecnologica" },
  governance: { de: "Governance-Eignung", fr: "Adéquation gouvernance", es: "Adecuación de gobernanza", it: "Idoneità di governance" },
  aiReadiness: { de: "KI-Bereitschaft", fr: "Maturité IA", es: "Preparación para IA", it: "Prontezza per l'IA" },
  security: { de: "Sicherheits-Eignung", fr: "Adéquation sécurité", es: "Adecuación de seguridad", it: "Idoneità di sicurezza" },
  ecosystem: { de: "Ökosystem-Eignung", fr: "Adéquation écosystème", es: "Adecuación de ecosistema", it: "Idoneità dell'ecosistema" },
  cost: { de: "Kosten-Eignung", fr: "Adéquation coûts", es: "Adecuación de costos", it: "Idoneità dei costi" },
  timeToValue: { de: "Time-to-Value-Eignung", fr: "Adéquation délai de valorisation", es: "Adecuación de tiempo hasta el valor", it: "Idoneità del time-to-value" },
  strategic: { de: "Strategische Eignung", fr: "Adéquation stratégique", es: "Adecuación estratégica", it: "Idoneità strategica" },
};

export function localizedDimensionLabel(key: string, englishLabel: string, locale: Locale): string {
  if (locale === "en") return englishLabel;
  return DIMENSION_LABEL_OVERRIDES[key]?.[locale] ?? englishLabel;
}
