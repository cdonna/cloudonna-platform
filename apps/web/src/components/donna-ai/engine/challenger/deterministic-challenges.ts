/**
 * Deterministic challenges (brief §12) — every challenge here is
 * derived directly from numbers the engine already computed
 * (engine/scenario.ts's pivotal-dimension sensitivity,
 * engine/evidence.ts's diagnostics, engine/constraints.ts's UNKNOWN
 * status, engine/business-case/sensitivity.ts's ROI-flip multiplier).
 * No AI call, no judgment call — these challenges exist whenever the
 * underlying number does, independent of any model.
 */
import { SCORE_DIMENSION_LABELS } from "../../scoring/weights";
import type { EngineResult } from "../recommendation";
import type { BusinessCaseOutput } from "../business-case/types";
import { findRoiFlipMultiplier } from "../business-case/sensitivity";
import type { BusinessCaseOptionInput } from "../business-case/types";
import { ECONOMIC_SCENARIOS } from "../business-case/calculations";
import type { DecisionChallenge } from "./types";

/** Content-derived, not a counter — a module-global counter would
 * make two calls with identical input return different ids, breaking
 * the "same input, same output" determinism every other engine
 * module in this product guarantees. */
function challengeId(prefix: string, ...parts: Array<string | number | null>): string {
  return [prefix, ...parts.filter((p) => p !== null)].join("-");
}

/** ALTERNATIVE_CHALLENGE — "what change would make the runner-up
 * win?" One challenge per pivotal dimension the Sensitivity Engine
 * already found, using the SAME numbers the Scenario Workbench's own
 * sensitivity map shows — never a separate, re-derived figure. */
export function buildAlternativeChallenges(engineResult: EngineResult): DecisionChallenge[] {
  return engineResult.scenarios.pivotalDimensions
    .filter((p) => p.weightToTie !== null)
    .map((p) => ({
      id: challengeId("alt", p.dimension),
      type: "ALTERNATIVE_CHALLENGE" as const,
      target: "recommendation",
      statement: `The recommendation flips if ${SCORE_DIMENSION_LABELS[p.dimension]}'s weight moves from ${Math.round(p.currentWeight * 100)}% to about ${Math.round(p.weightToTie! * 100)}%.`,
      severity: Math.abs(p.weightToTie! - p.currentWeight) <= 0.05 ? "high" : Math.abs(p.weightToTie! - p.currentWeight) <= 0.15 ? "medium" : "low",
      evidenceReferences: [],
      affectedOption: null,
      affectedCriterion: p.dimension,
      suggestedValidation: `Confirm with stakeholders whether ${SCORE_DIMENSION_LABELS[p.dimension]} genuinely deserves its current weight.`,
      status: "open" as const,
      source: "deterministic" as const,
    }));
}

/** CONSTRAINT_CHALLENGE — "which constraint could invalidate the
 * winner?" Fires whenever a hard constraint evaluation came back
 * UNKNOWN for the recommended option, never when it genuinely PASSed
 * — an UNKNOWN is a real gap, a PASS is not a challenge. */
export function buildConstraintChallenges(engineResult: EngineResult): DecisionChallenge[] {
  const winner = engineResult.ranking[0];
  if (!winner) return [];
  return winner.constraints
    .filter((c) => c.status === "UNKNOWN")
    .map((c) => ({
      id: challengeId("constraint", winner.id, c.id),
      type: "CONSTRAINT_CHALLENGE" as const,
      target: winner.id,
      statement: `${c.label} was never confirmed for ${winner.name} — it is UNKNOWN, not passed.`,
      severity: "medium" as const,
      evidenceReferences: [],
      affectedOption: winner.id,
      affectedCriterion: null,
      suggestedValidation: `Confirm ${c.label.toLowerCase()} explicitly before relying on this recommendation.`,
      status: "open" as const,
      source: "deterministic" as const,
    }));
}

/** EVIDENCE_CHALLENGE — "which evidence is weakest?" Fires on real
 * diagnostic gaps already computed by the Evidence Engine: missing
 * critical evidence, or an assumption ratio over the SAME 30%
 * threshold engine/confidence.ts already uses to flag a confidence
 * reason — not a new, separately invented cutoff. */
export function buildEvidenceChallenges(engineResult: EngineResult): DecisionChallenge[] {
  const challenges: DecisionChallenge[] = [];
  const diagnostics = engineResult.evidenceDiagnostics;
  const winner = engineResult.ranking[0];

  if (diagnostics.missingCriticalEvidence.length > 0) {
    challenges.push({
      id: challengeId("evidence", "missing", winner?.id ?? null),
      type: "EVIDENCE_CHALLENGE",
      target: winner?.id ?? "recommendation",
      statement: `No supporting evidence exists for: ${diagnostics.missingCriticalEvidence.join(", ")}.`,
      severity: "medium",
      evidenceReferences: [],
      affectedOption: winner?.id ?? null,
      affectedCriterion: null,
      suggestedValidation: "Run Research Agent against the missing criteria before treating this recommendation as final.",
      status: "open",
      source: "deterministic",
    });
  }

  if (diagnostics.assumptionRatio > 0.3) {
    challenges.push({
      id: challengeId("evidence", "assumption-ratio", winner?.id ?? null),
      type: "EVIDENCE_CHALLENGE",
      target: winner?.id ?? "recommendation",
      statement: `${Math.round(diagnostics.assumptionRatio * 100)}% of the evidence behind this recommendation is unvalidated assumption, not verified fact.`,
      severity: diagnostics.assumptionRatio > 0.6 ? "high" : "medium",
      evidenceReferences: [],
      affectedOption: winner?.id ?? null,
      affectedCriterion: null,
      suggestedValidation: "Validate the stated assumptions with the actual stakeholders before finalizing.",
      status: "open",
      source: "deterministic",
    });
  }

  return challenges;
}

/** FINANCIAL_CHALLENGE — "which financial assumption most affects
 * ROI?" One challenge per largest-driver category per option pair,
 * using the exact closed-form flip multiplier from
 * business-case/sensitivity.ts — only emitted when business case data
 * actually exists (brief §17: "only show such statements when
 * deterministically calculated"). */
export function buildFinancialChallenges(businessCase: BusinessCaseOutput | null, rawInputsByOption: Map<string, BusinessCaseOptionInput>): DecisionChallenge[] {
  if (!businessCase || businessCase.options.length < 2) return [];

  const [leaderOutput, runnerUpOutput] = [...businessCase.options].sort((a, b) => b.summary.npv - a.summary.npv);
  const leaderInput = rawInputsByOption.get(leaderOutput.optionId);
  const runnerUpInput = rawInputsByOption.get(runnerUpOutput.optionId);
  if (!leaderInput || !runnerUpInput) return [];

  const scenario = ECONOMIC_SCENARIOS[businessCase.scenario === "upside" || businessCase.scenario === "downside" ? businessCase.scenario : "base"];
  const challenges: DecisionChallenge[] = [];
  const categories = new Set([...leaderInput.benefits.map((b) => b.category), ...leaderInput.costs.map((c) => c.category)]);

  for (const category of categories) {
    const isCostCategory = leaderInput.costs.some((c) => c.category === category);
    const k = findRoiFlipMultiplier(leaderInput, runnerUpInput, isCostCategory ? "cost" : "benefit", category, scenario, businessCase.horizonYears, businessCase.discountRatePercent);
    if (k === null || k < 0) continue;

    const direction = isCostCategory ? (k > 1 ? "rises" : "falls") : k > 1 ? "rises" : "falls";
    challenges.push({
      id: challengeId("financial", leaderOutput.optionId, runnerUpOutput.optionId, category),
      type: "FINANCIAL_CHALLENGE",
      target: leaderOutput.optionId,
      statement: `${runnerUpOutput.optionId} becomes economically preferable if ${leaderOutput.optionId}'s ${category} ${direction} to about ${Math.round(k * 100)}% of its current estimate.`,
      severity: Math.abs(k - 1) < 0.15 ? "high" : Math.abs(k - 1) < 0.4 ? "medium" : "low",
      evidenceReferences: [],
      affectedOption: leaderOutput.optionId,
      affectedCriterion: null,
      suggestedValidation: `Stress-test the ${category} estimate for ${leaderOutput.optionId} — it is the single most economically decisive figure between these two options.`,
      status: "open",
      source: "deterministic",
    });
  }

  return challenges.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1));
}

export function buildDeterministicChallenges(
  engineResult: EngineResult,
  businessCase: BusinessCaseOutput | null = null,
  rawInputsByOption: Map<string, BusinessCaseOptionInput> = new Map(),
): DecisionChallenge[] {
  return [
    ...buildAlternativeChallenges(engineResult),
    ...buildConstraintChallenges(engineResult),
    ...buildEvidenceChallenges(engineResult),
    ...buildFinancialChallenges(businessCase, rawInputsByOption),
  ];
}
