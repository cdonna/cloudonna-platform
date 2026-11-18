/**
 * Decision Impact Analysis (brief §37/§38) — given a canonical
 * VendorKnowledgeChange and the real, already-computed EngineResult
 * (and optional BusinessCaseOutput) for one decision, derive the
 * concrete inputs materiality.ts needs and produce a DecisionImpact
 * draft. Never touches decisions/decision_versions — this is strictly
 * an advisory record a human can inspect (brief §37's own "do not
 * automatically change their final human decision").
 *
 * hardConstraintAffected and criticalRiskAffected are documented,
 * conservative heuristics, not a full re-evaluation of the Constraint
 * Engine against the new claim (that would require re-running
 * evaluateConstraints with hypothetical new inputs, which this V1
 * deliberately does not attempt — see Known Limitations in
 * docs/capabilities/vendor-intelligence-and-evidence-graph.md).
 */
import { SCORE_WEIGHTS } from "../../scoring/weights";
import type { EngineResult } from "../../engine/recommendation";
import { computeMateriality } from "./materiality";
import { CAPABILITY_TO_CRITERION } from "./capability-criterion-map";
import type { CapabilityCategoryKey, Materiality, VendorKnowledgeChangeType } from "./types";

export interface ImpactAnalysisInput {
  decisionId: string;
  changeId: string;
  affectedProductSlug: string;
  affectedCapabilityKey: CapabilityCategoryKey;
  changeType: VendorKnowledgeChangeType;
  engineResult: EngineResult;
}

export interface DecisionImpactDraft {
  decisionId: string;
  changeId: string;
  affectedOption: string;
  affectedCriterion: string | null;
  materiality: Materiality;
  recommendationImpact: string;
  reviewRecommended: boolean;
}

/** Deliberately narrow: only the two change types that plausibly
 * interact with a hard constraint (data residency / regional
 * availability, a security certification lapsing) are checked against
 * the option's existing constraint evaluations. A broader rule (e.g.
 * "any non-PASS constraint on this option") produced false positives
 * for completely unrelated capabilities on any option that already
 * fails an unrelated constraint like preferred-vendor — found and
 * fixed via this module's own test suite. */
const CONSTRAINT_RELEVANT_CHANGE_TYPES = new Set<VendorKnowledgeChangeType>(["region_availability_changed", "security_certification_changed"]);
const CRITICAL_RISK_RELEVANT_CRITERIA = new Set(["security", "governance"]);

export function analyzeDecisionImpact(input: ImpactAnalysisInput): DecisionImpactDraft {
  const { engineResult, affectedProductSlug, affectedCapabilityKey } = input;
  const criterion = CAPABILITY_TO_CRITERION[affectedCapabilityKey] ?? null;
  const criterionWeight = criterion ? SCORE_WEIGHTS[criterion] : null;

  const isWinner = engineResult.recommendedOption.id === affectedProductSlug;
  const rankIndex = engineResult.ranking.findIndex((r) => r.id === affectedProductSlug);
  const isTopAlternative = rankIndex >= 0 && rankIndex <= 1 && !isWinner;

  const affectedEntry = engineResult.ranking.find((r) => r.id === affectedProductSlug) ?? null;
  const hardConstraintAffected =
    CONSTRAINT_RELEVANT_CHANGE_TYPES.has(input.changeType) &&
    (affectedEntry?.constraints.some((c) => c.status !== "PASS") ?? false);

  const criticalRiskAffected =
    criterion !== null &&
    CRITICAL_RISK_RELEVANT_CRITERIA.has(criterion) &&
    isWinner &&
    engineResult.risks.some((r) => r.category === "Vendor");

  const businessCaseAssumptionAffected = isWinner && Boolean(engineResult.businessCase);

  const { materiality, reviewRecommended, reasons } = computeMateriality({
    changeType: input.changeType,
    isWinner,
    isTopAlternative,
    criterionWeight,
    robustnessLevel: engineResult.robustness.level,
    hardConstraintAffected,
    businessCaseAssumptionAffected,
    criticalRiskAffected,
  });

  return {
    decisionId: input.decisionId,
    changeId: input.changeId,
    affectedOption: affectedProductSlug,
    affectedCriterion: criterion,
    materiality,
    recommendationImpact: reasons.join(" "),
    reviewRecommended,
  };
}
