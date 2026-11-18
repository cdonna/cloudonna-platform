/**
 * Next Best Action (brief §50) — a deterministic, rule-ordered pick of
 * the single most useful next step, from the same blockers/readiness
 * dimensions already computed by decision-readiness.ts. Not
 * predictive AI; a fixed priority list over real state.
 */
import type { DecisionReadiness } from "./decision-readiness";
import type { LifecycleStage } from "./lifecycle-stage";

export interface NextBestAction {
  label: string;
  stage: LifecycleStage;
}

export function computeNextBestAction(readiness: DecisionReadiness, hasHumanDecision: boolean): NextBestAction | null {
  if (hasHumanDecision) return null;

  const critical = readiness.blockers.find((b) => b.severity === "critical");
  if (critical) {
    switch (critical.code) {
      case "critical_evidence_missing":
        return { label: "Add evidence for the missing scoring dimensions", stage: "evidence" };
      case "hard_constraint_violated":
        return { label: "Resolve the violated hard constraint, or confirm it no longer applies", stage: "understand" };
      case "evidence_conflict_unresolved":
        return { label: "Resolve the open evidence conflict", stage: "evidence" };
      case "challenger_unresolved":
        return { label: "Review the unresolved high-severity Challenger finding", stage: "challenge" };
    }
  }

  const missingDimension = readiness.dimensions.find((d) => d.status === "missing");
  if (missingDimension) {
    const stageByKey: Record<string, LifecycleStage> = {
      context_completeness: "understand",
      option_coverage: "compare",
      evidence_coverage: "evidence",
      economic_model: "simulate",
      risk_review: "challenge",
      stakeholder_alignment: "align",
    };
    return { label: `Complete ${missingDimension.label.toLowerCase()}`, stage: stageByKey[missingDimension.key] ?? "understand" };
  }

  const warning = readiness.blockers.find((b) => b.severity === "warning");
  if (warning) {
    switch (warning.code) {
      case "business_case_incomplete":
        return { label: "Model a business case for the leading option", stage: "simulate" };
      case "recommendation_fragile":
        return { label: "Review which assumptions could flip the recommendation", stage: "simulate" };
      case "economic_buyer_not_aligned":
        return { label: "Invite the economic buyer to review and align", stage: "align" };
    }
  }

  if (readiness.level === "HIGH") {
    return { label: "Record the final human decision", stage: "decide" };
  }

  return { label: "Review the current recommendation", stage: "decide" };
}
