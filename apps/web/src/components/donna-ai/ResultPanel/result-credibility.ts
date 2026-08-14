import type { RankedPlatform } from "../scoring/types";
import type { DecisionOutput } from "../types";

/** Below this point gap, the two top platforms are close enough that
 * presenting the recommendation as obvious would be dishonest — see
 * the Founder report's "RESULT CREDIBILITY FIX". Not a scoring change:
 * this only decides whether the "this is close" callout renders. The
 * ranking itself is untouched. */
export const NARROW_MARGIN_THRESHOLD = 3;

export interface CredibilityAssessment {
  scoreGap: number | null;
  isNarrowMargin: boolean;
  decisionHinges: string[];
}

/** What the decision actually hinges on, computed from the two
 * platforms' own per-dimension scores — never invented copy. The
 * dimensions with the largest score gap between the top two are
 * genuinely what's pulling the recommendation one way, so those are
 * the ones named. Both platforms' `dimensions` arrays are always built
 * in the same fixed order by scorePlatform() in scoring/engine.ts, so
 * pairing by index is safe. */
export function computeDecisionHinges(recommendation: RankedPlatform, alternative: RankedPlatform, limit = 4): string[] {
  return recommendation.dimensions
    .map((dimension, index) => ({
      label: dimension.label,
      gap: Math.abs(dimension.score - (alternative.dimensions[index]?.score ?? dimension.score)),
    }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, limit)
    .map((entry) => entry.label);
}

export function assessResultCredibility(output: DecisionOutput): CredibilityAssessment {
  if (!output.alternativeRecommendation) {
    return { scoreGap: null, isNarrowMargin: false, decisionHinges: [] };
  }

  const scoreGap = output.donnaScore - output.alternativeRecommendation.overallScore;
  const isNarrowMargin = scoreGap <= NARROW_MARGIN_THRESHOLD;

  return {
    scoreGap,
    isNarrowMargin,
    decisionHinges: isNarrowMargin ? computeDecisionHinges(output.recommendation, output.alternativeRecommendation) : [],
  };
}
