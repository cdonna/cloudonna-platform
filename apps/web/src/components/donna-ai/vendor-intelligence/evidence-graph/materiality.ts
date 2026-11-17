/**
 * Materiality rules (brief §39) — deterministic, documented, the same
 * "no invented scientific precision" discipline as engine/robustness.ts.
 * Decides whether a canonical vendor-knowledge change is worth a
 * human's attention on a specific decision, so a routine documentation
 * edit never generates the same alert as a change that could flip a
 * recommendation (brief's own instruction: "avoid noisy alerts").
 *
 * Every input here is already a real, existing fact about the change
 * and the decision — nothing is invented to make the rule look more
 * sophisticated than it is.
 */
import type { RobustnessLevel } from "../../engine/robustness";
import type { VendorKnowledgeChangeType, Materiality } from "./types";

/** Criteria at or above this weight are "high-weight" for materiality
 * purposes — architecture, business and technology in the current
 * SCORE_WEIGHTS (scoring/weights.ts), the three weighted at 0.12+. */
const HIGH_WEIGHT_CRITERION_THRESHOLD = 0.12;
/** Below this, a criterion is low-impact enough that even a winner-
 * affecting change stays at most MEDIUM. */
const LOW_WEIGHT_CRITERION_THRESHOLD = 0.08;

export interface MaterialityInput {
  changeType: VendorKnowledgeChangeType;
  isWinner: boolean;
  isTopAlternative: boolean;
  criterionWeight: number | null;
  robustnessLevel: RobustnessLevel | null;
  hardConstraintAffected: boolean;
  businessCaseAssumptionAffected: boolean;
  criticalRiskAffected: boolean;
}

export interface MaterialityResult {
  materiality: Materiality;
  reviewRecommended: boolean;
  reasons: string[];
}

export function computeMateriality(input: MaterialityInput): MaterialityResult {
  const reasons: string[] = [];

  if (input.hardConstraintAffected) {
    reasons.push("This change affects a hard constraint evaluation for this option.");
    return { materiality: "high", reviewRecommended: true, reasons };
  }

  if (input.criticalRiskAffected) {
    reasons.push("This change affects a risk already flagged as critical for this decision.");
    return { materiality: "high", reviewRecommended: true, reasons };
  }

  if (!input.isWinner && !input.isTopAlternative) {
    reasons.push("This change affects an option that is neither the current winner nor a top alternative.");
    return { materiality: "low", reviewRecommended: false, reasons };
  }

  const highWeight = input.criterionWeight !== null && input.criterionWeight >= HIGH_WEIGHT_CRITERION_THRESHOLD;
  const lowWeight = input.criterionWeight !== null && input.criterionWeight < LOW_WEIGHT_CRITERION_THRESHOLD;

  if (input.isWinner && input.robustnessLevel === "FRAGILE") {
    reasons.push("The recommendation is already fragile — any change to the winner's evidence is material.");
    return { materiality: "high", reviewRecommended: true, reasons };
  }

  if (input.isWinner && highWeight) {
    reasons.push(`This change affects the current winner on a high-weight criterion (${input.changeType}).`);
    return { materiality: "high", reviewRecommended: true, reasons };
  }

  if (input.businessCaseAssumptionAffected) {
    const materiality: Materiality = input.isWinner ? "high" : "medium";
    reasons.push("This change affects a business-case assumption used in this decision.");
    return { materiality, reviewRecommended: true, reasons };
  }

  if ((input.isWinner || input.isTopAlternative) && !lowWeight) {
    reasons.push("This change affects the winner or a top alternative on a criterion with meaningful weight.");
    return { materiality: "medium", reviewRecommended: true, reasons };
  }

  reasons.push("This change affects a relevant option, but only on a low-weight criterion with no other material factor.");
  return { materiality: "low", reviewRecommended: false, reasons };
}
