/**
 * Confidence Engine (brief §18) — moved here from engine.ts unchanged
 * (same formula, same inputs, same output range), with a qualitative
 * level and explicit reasons added alongside the existing numeric
 * score. The number was already deterministic and documented; what was
 * missing was translating it into something a reader can act on
 * without inventing false scientific precision ("confidence: 71.4%"
 * means nothing on its own) and without hiding *why* it landed where
 * it did.
 */
import type { RankedPlatform } from "../scoring/types";
import type { WizardState } from "../types";
import type { EvidenceDiagnostics } from "./evidence";

function isCompanyComplete(input: WizardState["company"]): boolean {
  return (
    input.industry !== null &&
    input.country !== null &&
    input.employees !== null &&
    input.revenue !== null &&
    input.itOrgSize !== null
  );
}

function isLandscapeComplete(input: WizardState["landscape"]): boolean {
  return (
    input.erp !== null &&
    input.crm !== null &&
    input.analytics !== null &&
    input.dataWarehouse !== null &&
    input.cloud !== null &&
    input.aiPlatform !== null
  );
}

function isConstraintsComplete(input: WizardState["constraints"]): boolean {
  return (
    input.budget !== null &&
    input.timeline !== null &&
    input.riskAppetite !== null &&
    input.preferredCloud !== null &&
    input.preferredVendor !== null &&
    input.internalSkills !== null
  );
}

/** Unchanged from the original engine.ts formula: reflects both input
 * completeness and the quality of scoring signal found — not just "did
 * you fill in the form." Kept at module scope (not exported further
 * down) since every caller now goes through evaluateConfidence below,
 * which returns the qualitative level and reasons alongside it. */
export function computeConfidenceScore(state: WizardState, topResult: RankedPlatform): number {
  const categoriesFilled = [
    isCompanyComplete(state.company),
    isLandscapeComplete(state.landscape),
    state.goals.goals.length > 0,
    isConstraintsComplete(state.constraints),
  ].filter(Boolean).length;

  const notesWritten = [state.company.note, state.landscape.note, state.goals.note, state.constraints.note].filter(
    (note) => note.trim().length > 0,
  ).length;

  const architectureDimension = topResult.dimensions.find((d) => d.key === "architecture");
  const hasWeakSignal = (architectureDimension?.positiveEvidence.length ?? 0) === 0;

  let confidence = 55 + categoriesFilled * 6 + notesWritten * 5;
  if (hasWeakSignal) confidence -= 10;

  return Math.max(30, Math.min(96, confidence));
}

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

/** Fixed, documented thresholds over the existing 30-96 score range —
 * not re-derived per call, not tunable per request. A score below 55
 * means at least two of the four wizard sections are incomplete; above
 * 80 means every section is filled with at least one note each. */
export function confidenceLevelFromScore(score: number): ConfidenceLevel {
  if (score < 55) return "LOW";
  if (score < 80) return "MEDIUM";
  return "HIGH";
}

export interface ConfidenceResult {
  score: number;
  level: ConfidenceLevel;
  reasons: string[];
}

/**
 * The full Confidence Engine result: the existing numeric score, the
 * level it maps to, and the concrete reasons behind it — every reason
 * traces to a specific input or diagnostic, never a vague restatement
 * of the number itself.
 */
export function evaluateConfidence(
  state: WizardState,
  topResult: RankedPlatform,
  evidenceDiagnostics: EvidenceDiagnostics,
): ConfidenceResult {
  const score = computeConfidenceScore(state, topResult);
  const level = confidenceLevelFromScore(score);
  const reasons: string[] = [];

  const sections: Array<[boolean, string]> = [
    [isCompanyComplete(state.company), "Company profile"],
    [isLandscapeComplete(state.landscape), "Current landscape"],
    [state.goals.goals.length > 0, "Goals"],
    [isConstraintsComplete(state.constraints), "Constraints"],
  ];
  const incomplete = sections.filter(([complete]) => !complete).map(([, label]) => label);
  if (incomplete.length > 0) {
    reasons.push(`${incomplete.join(", ")} ${incomplete.length === 1 ? "was" : "were"} left incomplete.`);
  } else {
    reasons.push("Every wizard section was completed.");
  }

  if (evidenceDiagnostics.coverage < 1) {
    reasons.push(
      `${Math.round(evidenceDiagnostics.coverage * 100)}% of scoring dimensions have supporting evidence; ${evidenceDiagnostics.missingCriticalEvidence.join(", ") || "none"} did not.`,
    );
  }

  if (evidenceDiagnostics.assumptionRatio > 0.3) {
    reasons.push(`${Math.round(evidenceDiagnostics.assumptionRatio * 100)}% of evidence items are assumptions rather than stated facts.`);
  }

  if (evidenceDiagnostics.freshnessWarnings.length > 0) {
    reasons.push("The recommended platform's catalog entry has not been reviewed recently.");
  }

  return { score, level, reasons };
}
