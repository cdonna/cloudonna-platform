/**
 * Decision Engine V1.1 — turns a scenario (a set of weight overrides)
 * into a real, persistable DecisionOutput, by re-weighting the already
 * -computed dimension scores from the base output (runScenario) and
 * rebuilding every downstream field (ranking, evidence, confidence,
 * constraints, engineResult) against the new order. Nothing here
 * recomputes a dimension *score* — only how the existing scores are
 * weighted together changes, exactly as engine/scenario.ts already
 * guarantees for the read-only exploration path this reuses.
 *
 * This is the one function the server-side persistence handlers call
 * when a request carries `decisionInput.scenarioOverrides` — it is
 * never passed a client-supplied output, only a client-supplied
 * (bounded, validated) set of weight numbers; the actual output is
 * still 100% server-derived.
 */
import { buildEngineResult } from "./recommendation";
import { renormalizeWeights, type WeightOverrides } from "./scenario";
import type { DecisionOutput, WizardState } from "../types";
import type { RankedPlatform } from "../scoring/types";

/** Rebuilds each RankedPlatform with its dimensions' weights replaced
 * by the scenario's renormalized weights and overallScore recomputed
 * from them — the same `score × weight` sum scoring/engine.ts itself
 * uses, just with different weights applied to the same, unchanged
 * dimension scores. Ordered by the new overallScore, matching
 * runScenario's own ranking exactly (both derive from the same
 * weights applied to the same scores). */
function reweightRanked(output: DecisionOutput, overrides: WeightOverrides): RankedPlatform[] {
  const base = [output.recommendation, ...output.alternatives];
  const weights = renormalizeWeights(overrides);

  return base
    .map((r) => {
      const dimensions = r.dimensions.map((d) => ({ ...d, weight: weights[d.key] }));
      const overallScore = Math.round(dimensions.reduce((sum, d) => sum + d.score * d.weight, 0));
      return { ...r, dimensions, overallScore };
    })
    .sort((a, b) => b.overallScore - a.overallScore);
}

export function applyScenarioToOutput(state: WizardState, output: DecisionOutput, overrides: WeightOverrides): DecisionOutput {
  if (Object.keys(overrides).length === 0) return output;

  const reordered = reweightRanked(output, overrides);
  const [recommendation, ...alternatives] = reordered;

  const scenarioOutput: DecisionOutput = {
    ...output,
    recommendation,
    alternativeRecommendation: alternatives[0] ?? null,
    alternatives,
    donnaScore: recommendation.overallScore,
    dimensions: recommendation.dimensions,
  };

  return { ...scenarioOutput, engineResult: buildEngineResult(state, scenarioOutput) };
}
