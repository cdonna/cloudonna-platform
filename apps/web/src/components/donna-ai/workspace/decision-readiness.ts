/**
 * Decision Readiness (brief §33/§51/§77) — a deterministic composition
 * of engine output that already exists (ConfidenceResult,
 * EvidenceDiagnostics, ConstraintEvaluation[], DecisionChallenge[],
 * BusinessCaseOutput, scenario robustness) plus two genuinely new
 * signals this sprint adds (stakeholder alignment, open research
 * conflicts). Nothing here recomputes a score or invents a figure —
 * every dimension and blocker traces to a specific, already-computed
 * value.
 *
 * Deliberately LOW/MEDIUM/HIGH (brief §33: "avoid fake precision...
 * may be better than an artificial 87%"), never a weighted percentage.
 */
import type { ConfidenceLevel } from "../engine/confidence";
import type { EvidenceDiagnostics } from "../engine/evidence";
import type { ConstraintEvaluation } from "../engine/constraints";
import type { DecisionChallenge } from "../engine/challenger/types";
import type { BusinessCaseOutput } from "../engine/business-case/types";

export type ReadinessLevel = "LOW" | "MEDIUM" | "HIGH";

export type ReadinessDimensionStatus = "complete" | "partial" | "missing";

export type ReadinessDimensionKey =
  | "context_completeness"
  | "option_coverage"
  | "evidence_coverage"
  | "economic_model"
  | "risk_review"
  | "stakeholder_alignment";

export interface ReadinessDimension {
  key: ReadinessDimensionKey;
  label: string;
  status: ReadinessDimensionStatus;
  detail: string;
}

export type BlockerCode =
  | "critical_evidence_missing"
  | "hard_constraint_violated"
  | "business_case_incomplete"
  | "evidence_conflict_unresolved"
  | "challenger_unresolved"
  | "recommendation_fragile"
  | "economic_buyer_not_aligned";

export interface DecisionBlocker {
  code: BlockerCode;
  message: string;
  severity: "warning" | "critical";
}

export interface DecisionReadiness {
  level: ReadinessLevel;
  dimensions: ReadinessDimension[];
  blockers: DecisionBlocker[];
}

export interface DecisionReadinessInput {
  confidenceLevel: ConfidenceLevel;
  evidenceDiagnostics: EvidenceDiagnostics;
  constraints: ConstraintEvaluation[];
  /** Undefined when the Challenger has never been run for this
   * decision — distinct from an empty array (run, found nothing). */
  challenges: DecisionChallenge[] | undefined;
  businessCase: BusinessCaseOutput | null | undefined;
  optionCount: number;
  scenarioRobust: boolean;
  openResearchConflictCount: number;
  stakeholderAlignmentCounts: Partial<Record<"not_reviewed" | "aligned" | "conditional" | "objected" | "approved", number>>;
  hasEconomicBuyerAligned: boolean | null;
}

const DIMENSION_LABELS: Record<ReadinessDimensionKey, string> = {
  context_completeness: "Context completeness",
  option_coverage: "Option coverage",
  evidence_coverage: "Evidence coverage",
  economic_model: "Economic model completeness",
  risk_review: "Risk review",
  stakeholder_alignment: "Stakeholder alignment",
};

export function computeDecisionReadiness(input: DecisionReadinessInput): DecisionReadiness {
  const dimensions: ReadinessDimension[] = [];
  const blockers: DecisionBlocker[] = [];

  // Context completeness — read directly off the Confidence Engine's
  // own level, which already encodes wizard-section completeness.
  dimensions.push({
    key: "context_completeness",
    label: DIMENSION_LABELS.context_completeness,
    status: input.confidenceLevel === "HIGH" ? "complete" : input.confidenceLevel === "MEDIUM" ? "partial" : "missing",
    detail: input.confidenceLevel === "HIGH" ? "Enterprise context is complete." : "Some enterprise context sections are incomplete.",
  });

  // Option coverage
  dimensions.push({
    key: "option_coverage",
    label: DIMENSION_LABELS.option_coverage,
    status: input.optionCount >= 2 ? "complete" : input.optionCount === 1 ? "partial" : "missing",
    detail: `${input.optionCount} option${input.optionCount === 1 ? "" : "s"} compared.`,
  });

  // Evidence coverage
  const evidenceStatus: ReadinessDimensionStatus = input.evidenceDiagnostics.coverage >= 0.8 ? "complete" : input.evidenceDiagnostics.coverage > 0 ? "partial" : "missing";
  dimensions.push({
    key: "evidence_coverage",
    label: DIMENSION_LABELS.evidence_coverage,
    status: evidenceStatus,
    detail: `${Math.round(input.evidenceDiagnostics.coverage * 100)}% of scoring dimensions have supporting evidence.`,
  });
  if (input.evidenceDiagnostics.coverage < 0.5 && input.evidenceDiagnostics.missingCriticalEvidence.length > 0) {
    blockers.push({
      code: "critical_evidence_missing",
      message: `${input.evidenceDiagnostics.missingCriticalEvidence.join(", ")} ${input.evidenceDiagnostics.missingCriticalEvidence.length === 1 ? "has" : "have"} no supporting evidence.`,
      severity: "critical",
    });
  }

  // Economic model completeness
  dimensions.push({
    key: "economic_model",
    label: DIMENSION_LABELS.economic_model,
    status: input.businessCase ? "complete" : "missing",
    detail: input.businessCase ? "A business case has been modeled." : "No business case has been modeled yet.",
  });
  if (!input.businessCase) {
    blockers.push({ code: "business_case_incomplete", message: "No business case has been modeled for this decision yet.", severity: "warning" });
  }

  // Risk review (Challenger)
  const openHighSeverityChallenges = (input.challenges ?? []).filter((c) => c.status === "open" && c.severity === "high");
  dimensions.push({
    key: "risk_review",
    label: DIMENSION_LABELS.risk_review,
    status: input.challenges === undefined ? "missing" : openHighSeverityChallenges.length === 0 ? "complete" : "partial",
    detail: input.challenges === undefined ? "The Challenger has not reviewed this decision yet." : `${openHighSeverityChallenges.length} high-severity challenge(s) unresolved.`,
  });
  if (openHighSeverityChallenges.length > 0) {
    blockers.push({ code: "challenger_unresolved", message: `${openHighSeverityChallenges.length} high-severity Challenger finding(s) remain unresolved.`, severity: "critical" });
  }

  // Stakeholder alignment
  const totalStakeholders = Object.values(input.stakeholderAlignmentCounts).reduce((sum, n) => sum + (n ?? 0), 0);
  const unresolvedStakeholders = (input.stakeholderAlignmentCounts.not_reviewed ?? 0) + (input.stakeholderAlignmentCounts.objected ?? 0);
  dimensions.push({
    key: "stakeholder_alignment",
    label: DIMENSION_LABELS.stakeholder_alignment,
    status: totalStakeholders === 0 ? "missing" : unresolvedStakeholders === 0 ? "complete" : "partial",
    detail: totalStakeholders === 0 ? "No stakeholders added yet." : `${unresolvedStakeholders} of ${totalStakeholders} stakeholder(s) not yet reviewed or objecting.`,
  });

  if (input.hasEconomicBuyerAligned === false) {
    blockers.push({ code: "economic_buyer_not_aligned", message: "The economic buyer has not yet aligned on this decision.", severity: "warning" });
  }

  const hardConstraintViolations = input.constraints.filter((c) => c.status === "FAIL");
  if (hardConstraintViolations.length > 0) {
    blockers.push({
      code: "hard_constraint_violated",
      message: `${hardConstraintViolations.length} hard constraint(s) violated: ${hardConstraintViolations.map((c) => c.label).join(", ")}.`,
      severity: "critical",
    });
  }

  if (input.openResearchConflictCount > 0) {
    blockers.push({ code: "evidence_conflict_unresolved", message: `${input.openResearchConflictCount} evidence conflict(s) remain unresolved.`, severity: "critical" });
  }

  if (!input.scenarioRobust) {
    blockers.push({ code: "recommendation_fragile", message: "The recommendation changes under at least one minor sensitivity scenario.", severity: "warning" });
  }

  const hasCriticalBlocker = blockers.some((b) => b.severity === "critical");
  const level: ReadinessLevel =
    hasCriticalBlocker || input.confidenceLevel === "LOW" ? "LOW" : input.confidenceLevel === "HIGH" && blockers.length === 0 ? "HIGH" : "MEDIUM";

  return { level, dimensions, blockers };
}
