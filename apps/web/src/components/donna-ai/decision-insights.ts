/**
 * Two small, deterministic additions on top of numbers the engine
 * already computed — never a new evidence source, never a fabricated
 * value, never a recompute of the score itself. Same "same input, same
 * output" rule as everything else in this engine.
 */
import type { ScoreDimensionKey } from "./scoring/types";
import type { LockInRisk } from "./vendor-intelligence/types";
import type { DecisionOutput, TimelineLevel, WizardState } from "./types";

export interface RecommendationLever {
  platformName: string;
  dimensionKey: ScoreDimensionKey;
  dimensionLabel: string;
  pointsNeeded: number;
}

/**
 * "What could change this recommendation." For each alternative, finds
 * the single dimension where the smallest realistic improvement would
 * close the gap to the current recommendation, holding every other
 * dimension constant — pure arithmetic on the exact weighted scores
 * scoring/engine.ts already produced. Only surfaces a lever when the
 * required improvement is plausible (the dimension has room to move).
 */
export function findRecommendationLevers(output: DecisionOutput): RecommendationLever[] {
  const leaderScore = output.recommendation.overallScore;
  const levers: RecommendationLever[] = [];

  for (const alternative of output.alternatives) {
    const gap = leaderScore - alternative.overallScore;
    if (gap <= 0) continue;

    let bestLever: RecommendationLever | null = null;
    for (const dimension of alternative.dimensions) {
      if (dimension.weight <= 0) continue;
      const pointsNeeded = Math.ceil(gap / dimension.weight);
      if (dimension.score + pointsNeeded > 100) continue;
      if (!bestLever || pointsNeeded < bestLever.pointsNeeded) {
        bestLever = {
          platformName: alternative.platform.productName,
          dimensionKey: dimension.key,
          dimensionLabel: dimension.label,
          pointsNeeded,
        };
      }
    }
    if (bestLever) levers.push(bestLever);
  }

  return levers.sort((a, b) => a.pointsNeeded - b.pointsNeeded).slice(0, 3);
}

export type OptionValueBand = "low" | "medium" | "high";

export interface StrategicFraming {
  timelineIsAggressive: boolean;
  optionValueBand: OptionValueBand;
}

const LOCK_IN_TO_OPTION_VALUE: Record<LockInRisk, OptionValueBand> = {
  low: "low",
  medium: "medium",
  high: "high",
  "very-high": "high",
};

/** Reuses state.constraints.timeline and the recommended platform's own
 * vendorLockInRisk field — both already real inputs to the engine, not
 * new evidence. */
export function buildStrategicFraming(state: WizardState, output: DecisionOutput): StrategicFraming {
  const timeline: TimelineLevel | null = state.constraints.timeline;
  return {
    timelineIsAggressive: timeline === "aggressive",
    optionValueBand: LOCK_IN_TO_OPTION_VALUE[output.recommendation.platform.vendorLockInRisk],
  };
}
