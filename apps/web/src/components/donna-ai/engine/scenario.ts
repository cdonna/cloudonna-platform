/**
 * Scenario Engine (brief §14/§15) for the real, live wizard decision —
 * deliberately separate from components/scenario-lab/scenario.ts, which
 * is an illustrative, hand-authored public demo with its own fixed
 * platform/score data and is not touched by this module. This one
 * operates on an already-computed RankedPlatform[] from the real
 * deterministic engine (scoring/engine.ts) and only ever re-weights the
 * dimension scores that engine already produced — it never recomputes
 * or guesses a dimension score itself.
 *
 * Weight overrides are renormalized deterministically: every overridden
 * weight is applied exactly as given, and every non-overridden weight
 * is scaled down proportionally so the full set still sums to 1 (brief
 * §8, "weights must normalize deterministically"). The same overrides
 * on the same ranking always produce the same result.
 */
import { SCORE_WEIGHTS } from "../scoring/weights";
import type { DimensionResult, RankedPlatform, ScoreDimensionKey } from "../scoring/types";

export type WeightOverrides = Partial<Record<ScoreDimensionKey, number>>;

function clampWeight(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Renormalizes SCORE_WEIGHTS given a set of overrides: overridden
 * dimensions take their given value verbatim (clamped to [0,1]); every
 * other dimension is scaled so the whole set sums to 1. If the
 * overrides alone already sum to >= 1, the non-overridden dimensions
 * are set to 0 rather than going negative — still a valid weight set,
 * just one where the overridden dimensions now account for everything.
 */
export function renormalizeWeights(overrides: WeightOverrides): Record<ScoreDimensionKey, number> {
  const keys = Object.keys(SCORE_WEIGHTS) as ScoreDimensionKey[];
  const overriddenKeys = keys.filter((k) => overrides[k] !== undefined);
  const freeKeys = keys.filter((k) => overrides[k] === undefined);

  const overriddenTotal = overriddenKeys.reduce((sum, k) => sum + clampWeight(overrides[k]!), 0);
  const freeBudget = Math.max(0, 1 - overriddenTotal);
  const freeTotalBefore = freeKeys.reduce((sum, k) => sum + SCORE_WEIGHTS[k], 0);

  const result = {} as Record<ScoreDimensionKey, number>;
  for (const k of overriddenKeys) result[k] = clampWeight(overrides[k]!);
  for (const k of freeKeys) {
    result[k] = freeTotalBefore === 0 ? 0 : (SCORE_WEIGHTS[k] / freeTotalBefore) * freeBudget;
  }
  return result;
}

function reweight(dimensions: DimensionResult[], weights: Record<ScoreDimensionKey, number>): number {
  return Math.round(dimensions.reduce((sum, d) => sum + d.score * weights[d.key], 0));
}

export interface ScenarioRankingEntry {
  platformId: string;
  name: string;
  baseScore: number;
  scenarioScore: number;
  delta: number;
}

export interface ScenarioResult {
  weights: Record<ScoreDimensionKey, number>;
  ranking: ScenarioRankingEntry[];
  recommendationChanged: boolean;
  baseWinnerId: string;
  scenarioWinnerId: string;
  /** Deterministic, derived from the ranking above — never a separate
   * narrative generator. Empty when the winner didn't change. */
  whyItChanged: string[];
}

export function runScenario(ranked: RankedPlatform[], overrides: WeightOverrides): ScenarioResult {
  const weights = renormalizeWeights(overrides);

  const entries: ScenarioRankingEntry[] = ranked
    .map((r) => ({
      platformId: r.platform.id,
      name: `${r.platform.vendor} ${r.platform.productName}`,
      baseScore: r.overallScore,
      scenarioScore: reweight(r.dimensions, weights),
      delta: 0,
    }))
    .map((e) => ({ ...e, delta: e.scenarioScore - e.baseScore }))
    .sort((a, b) => b.scenarioScore - a.scenarioScore);

  const baseWinnerId = ranked[0]?.platform.id ?? "";
  const scenarioWinnerId = entries[0]?.platformId ?? "";
  const recommendationChanged = baseWinnerId !== scenarioWinnerId;

  const whyItChanged: string[] = [];
  if (recommendationChanged) {
    const overriddenLabels = (Object.keys(overrides) as ScoreDimensionKey[]).filter((k) => overrides[k] !== undefined);
    const newWinner = entries[0];
    const oldWinner = entries.find((e) => e.platformId === baseWinnerId);
    whyItChanged.push(
      `${newWinner.name} overtakes ${oldWinner?.name ?? "the prior leader"} once ${overriddenLabels.join(", ") || "weights"} ${overriddenLabels.length === 1 ? "is" : "are"} reweighted.`,
    );
  }

  return { weights, ranking: entries, recommendationChanged, baseWinnerId, scenarioWinnerId, whyItChanged };
}

export interface PivotalDimension {
  dimension: ScoreDimensionKey;
  label: string;
  currentWeight: number;
  /** The weight this dimension would need (with every other weight
   * renormalized proportionally around it) for the current #2 to tie
   * the current #1 — null if no weight in [0,1] achieves a tie, meaning
   * this dimension alone can never flip the ranking. */
  weightToTie: number | null;
}

const BISECTION_ITERATIONS = 30;

/**
 * For the current top-2, finds — for every dimension — the weight that
 * dimension would need for the two to tie, holding the other weights'
 * relative proportions fixed and renormalizing. A bounded bisection
 * search (30 iterations) over a provably monotonic function (raising
 * one platform's own best dimension's weight only ever helps or hurts
 * monotonically as that weight grows, for a fixed pair of dimension
 * score vectors) — not a general optimizer, just a closed, small,
 * deterministic search over one variable per dimension.
 */
export function findPivotalDimensions(ranked: RankedPlatform[]): PivotalDimension[] {
  if (ranked.length < 2) return [];
  const [first, second] = ranked;
  const keys = Object.keys(SCORE_WEIGHTS) as ScoreDimensionKey[];

  const scoreDiffAt = (weights: Record<ScoreDimensionKey, number>) => {
    const a = reweight(first.dimensions, weights);
    const b = reweight(second.dimensions, weights);
    return a - b;
  };

  return keys.map((dimension) => {
    const label = first.dimensions.find((d) => d.key === dimension)?.label ?? dimension;
    const currentWeight = SCORE_WEIGHTS[dimension];

    const diffAt = (w: number) => scoreDiffAt(renormalizeWeights({ [dimension]: w }));
    const diffAtZero = diffAt(0);
    const diffAtOne = diffAt(1);

    // Exact tie already at a boundary — report it directly rather than
    // falling into the sign-change search below.
    if (diffAtZero === 0) return { dimension, label, currentWeight, weightToTie: 0 };
    if (diffAtOne === 0) return { dimension, label, currentWeight, weightToTie: 1 };

    // A tie otherwise requires a genuine sign change across [0,1]; if
    // both ends agree in sign, no weight on this single dimension alone
    // can ever flip it (diff(w) is linear in w — see module comment).
    if ((diffAtZero > 0 && diffAtOne > 0) || (diffAtZero < 0 && diffAtOne < 0)) {
      return { dimension, label, currentWeight, weightToTie: null };
    }

    let lo = 0;
    let hi = 1;
    for (let i = 0; i < BISECTION_ITERATIONS; i += 1) {
      const mid = (lo + hi) / 2;
      const d = diffAt(mid);
      if ((d >= 0) === (diffAtZero >= 0)) lo = mid;
      else hi = mid;
    }

    return { dimension, label, currentWeight, weightToTie: Math.round(((lo + hi) / 2) * 1000) / 1000 };
  });
}

/** "Which options are robust across scenarios" (brief §15) — runs a
 * fixed, small set of representative stress scenarios (each doubling
 * one dimension's relative weight) and reports whether the #1 ever
 * changes. Not every possible scenario — a bounded, named set, exactly
 * like the brief's own CFO/Cloud/Speed/Risk scenario examples. */
export function robustnessAcrossStressScenarios(ranked: RankedPlatform[]): { robust: boolean; winnerChangedUnder: ScoreDimensionKey[] } {
  const baseWinnerId = ranked[0]?.platform.id ?? "";
  const keys = Object.keys(SCORE_WEIGHTS) as ScoreDimensionKey[];
  const winnerChangedUnder: ScoreDimensionKey[] = [];

  for (const key of keys) {
    const doubled = Math.min(1, SCORE_WEIGHTS[key] * 2);
    const result = runScenario(ranked, { [key]: doubled });
    if (result.scenarioWinnerId !== baseWinnerId) winnerChangedUnder.push(key);
  }

  return { robust: winnerChangedUnder.length === 0, winnerChangedUnder };
}
