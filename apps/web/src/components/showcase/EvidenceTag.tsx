"use client";

import { useLocale } from "@/i18n/LocaleProvider";

export type EvidenceType = "customer-input" | "official-source" | "observed-data" | "calculated" | "ai-interpretation" | "assumption";

/**
 * Register-relative, so the same tag is legible on a warm paper page and
 * inside a dark product canvas without a second code path.
 *
 * `ai-interpretation` is deliberately the one type with no colour of its
 * own and a dashed edge. Every other type is a kind of evidence; AI
 * interpretation is a narrative *over* evidence, and the Trust Center
 * commits to never presenting it as verified evidence. Giving it the
 * same solid, coloured treatment as an official source would contradict
 * that commitment in the visual language while the copy denied it.
 */
const EVIDENCE_STYLES: Record<EvidenceType, string> = {
  "customer-input": "border-sig-input/40 bg-sig-input/10 text-sig-input",
  "official-source": "border-accent/40 bg-accent-wash text-accent",
  "observed-data": "border-sig-neutral/40 bg-sig-neutral/10 text-sig-neutral",
  calculated: "border-sig-positive/40 bg-sig-positive/10 text-sig-positive",
  "ai-interpretation": "border-dashed border-rule-2 bg-transparent text-ink-3",
  assumption: "border-sig-caution/40 bg-sig-caution/10 text-sig-caution",
};

/**
 * Makes the Trust Center's claims tangible instead of asserted — every
 * place this renders is labeling a real distinction already present in
 * the data (positive evidence vs. an assumption vs. an AI narrative),
 * never a decorative badge invented for effect.
 */
export function EvidenceTag({ type }: { type: EvidenceType }) {
  const { dict } = useLocale();
  const s = dict.showcase;
  const labels: Record<EvidenceType, string> = {
    "customer-input": s.evidenceCustomerInput,
    "official-source": s.evidenceOfficialSource,
    "observed-data": s.evidenceObservedData,
    calculated: s.evidenceCalculated,
    "ai-interpretation": s.evidenceAiInterpretation,
    assumption: s.evidenceAssumption,
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.625rem] font-medium tracking-[0.1em] uppercase ${EVIDENCE_STYLES[type]}`}>
      {labels[type]}
    </span>
  );
}
