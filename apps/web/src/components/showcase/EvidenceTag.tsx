"use client";

import { useLocale } from "@/i18n/LocaleProvider";

export type EvidenceType = "customer-input" | "official-source" | "calculated" | "ai-interpretation" | "assumption";

const EVIDENCE_COLORS: Record<EvidenceType, string> = {
  "customer-input": "border-electric-blue/30 bg-electric-blue/10 text-electric-blue",
  "official-source": "border-nova-accent/30 bg-nova-accent/10 text-nova-accent-strong",
  calculated: "border-nova-success/30 bg-nova-success/10 text-nova-success",
  "ai-interpretation": "border-sunset-coral/30 bg-sunset-coral/10 text-sunset-coral",
  assumption: "border-nova-warning/30 bg-nova-warning/10 text-nova-warning",
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
    calculated: s.evidenceCalculated,
    "ai-interpretation": s.evidenceAiInterpretation,
    assumption: s.evidenceAssumption,
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.04em] uppercase ${EVIDENCE_COLORS[type]}`}>
      {labels[type]}
    </span>
  );
}
