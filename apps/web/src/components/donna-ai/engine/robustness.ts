/**
 * Recommendation Robustness (brief §12) — a deterministic, documented
 * heuristic, not a statistical model. Three inputs, each already
 * computed by an existing engine module:
 *
 *  1. Score gap to the runner-up (points, 0-100 scale).
 *  2. Stability across the fixed stress-scenario set
 *     (engine/scenario.ts's robustnessAcrossStressScenarios).
 *  3. The smallest weight change that flips the top-2
 *     (engine/scenario.ts's findPivotalDimensions — the closest
 *     pivotal dimension's |weightToTie - currentWeight|).
 *
 * FRAGILE if the winner changes under ANY stress scenario, or the
 * smallest flip requires less than a 5-point weight shift.
 * ROBUST if the winner survives every stress scenario AND the
 * smallest flip requires at least a 15-point weight shift AND the
 * score gap is at least 10 points.
 * MODERATELY_ROBUST otherwise — the honest middle, not a residual
 * category hidden from the reader.
 *
 * These three cutoffs (5/15/10 points) are fixed constants, stated
 * here once, never tuned per request — the same "no invented
 * scientific precision" rule the Confidence Engine already follows.
 */
import type { RankedPlatform } from "../scoring/types";
import { findPivotalDimensions, robustnessAcrossStressScenarios } from "./scenario";

export type RobustnessLevel = "ROBUST" | "MODERATELY_ROBUST" | "FRAGILE";

export interface RobustnessResult {
  level: RobustnessLevel;
  scoreGap: number;
  stableAcrossStressScenarios: boolean;
  smallestFlipDelta: number | null;
  reasons: string[];
}

const FRAGILE_FLIP_DELTA_POINTS = 5;
const ROBUST_FLIP_DELTA_POINTS = 15;
const ROBUST_SCORE_GAP_POINTS = 10;

export function computeRobustness(ranked: RankedPlatform[]): RobustnessResult {
  const scoreGap = ranked.length > 1 ? ranked[0].overallScore - ranked[1].overallScore : 100;
  const { robust: stableAcrossStressScenarios, winnerChangedUnder } = robustnessAcrossStressScenarios(ranked);

  const pivots = findPivotalDimensions(ranked).filter((p) => p.weightToTie !== null) as Array<{
    weightToTie: number;
    currentWeight: number;
    label: string;
  }>;
  const smallest = pivots.length > 0 ? pivots.reduce((a, b) => (Math.abs(a.weightToTie - a.currentWeight) < Math.abs(b.weightToTie - b.currentWeight) ? a : b)) : null;
  const smallestFlipDelta = smallest ? Math.round(Math.abs(smallest.weightToTie - smallest.currentWeight) * 100) : null;

  const reasons: string[] = [];

  let level: RobustnessLevel;
  if (!stableAcrossStressScenarios || (smallestFlipDelta !== null && smallestFlipDelta < FRAGILE_FLIP_DELTA_POINTS)) {
    level = "FRAGILE";
    if (!stableAcrossStressScenarios) {
      reasons.push(`The winner changes under a stress scenario on ${winnerChangedUnder.join(", ")}.`);
    }
    if (smallestFlipDelta !== null && smallestFlipDelta < FRAGILE_FLIP_DELTA_POINTS) {
      reasons.push(`${smallest!.label}'s weight would only need to move ${smallestFlipDelta} points to flip the recommendation.`);
    }
  } else if (stableAcrossStressScenarios && (smallestFlipDelta === null || smallestFlipDelta >= ROBUST_FLIP_DELTA_POINTS) && scoreGap >= ROBUST_SCORE_GAP_POINTS) {
    level = "ROBUST";
    reasons.push(`The winner leads by ${scoreGap} points and survives every stress scenario tested.`);
    if (smallestFlipDelta !== null) reasons.push(`The smallest weight change that could flip it is ${smallestFlipDelta} points.`);
  } else {
    level = "MODERATELY_ROBUST";
    reasons.push(`The winner survives the stress scenarios tested, but the margin is not large (${scoreGap}-point gap${smallestFlipDelta !== null ? `, smallest flip ${smallestFlipDelta} points` : ""}).`);
  }

  return { level, scoreGap, stableAcrossStressScenarios, smallestFlipDelta, reasons };
}
