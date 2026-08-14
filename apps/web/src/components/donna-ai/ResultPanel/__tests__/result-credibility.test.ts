import { describe, expect, it } from "vitest";
import { SAMPLE_PROFILE } from "../../data";
import { buildDecisionOutput } from "../../engine";
import { assessResultCredibility, computeDecisionHinges, NARROW_MARGIN_THRESHOLD } from "../result-credibility";

describe("assessResultCredibility", () => {
  it("flags a narrow margin when the gap is at or under the threshold — the exact Founder scenario (80 vs 78)", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const narrowed = {
      ...output,
      donnaScore: 80,
      alternativeRecommendation: output.alternativeRecommendation ? { ...output.alternativeRecommendation, overallScore: 78 } : null,
    };

    const result = assessResultCredibility(narrowed);
    expect(result.isNarrowMargin).toBe(true);
    expect(result.scoreGap).toBe(2);
  });

  it("does not flag a narrow margin when the gap is clearly outside it", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const wide = {
      ...output,
      donnaScore: 90,
      alternativeRecommendation: output.alternativeRecommendation ? { ...output.alternativeRecommendation, overallScore: 60 } : null,
    };

    const result = assessResultCredibility(wide);
    expect(result.isNarrowMargin).toBe(false);
    expect(result.decisionHinges).toHaveLength(0);
  });

  it("treats the threshold boundary as narrow (inclusive)", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const atThreshold = {
      ...output,
      donnaScore: 80,
      alternativeRecommendation: output.alternativeRecommendation
        ? { ...output.alternativeRecommendation, overallScore: 80 - NARROW_MARGIN_THRESHOLD }
        : null,
    };
    expect(assessResultCredibility(atThreshold).isNarrowMargin).toBe(true);

    const justOutside = {
      ...output,
      donnaScore: 80,
      alternativeRecommendation: output.alternativeRecommendation
        ? { ...output.alternativeRecommendation, overallScore: 80 - NARROW_MARGIN_THRESHOLD - 1 }
        : null,
    };
    expect(assessResultCredibility(justOutside).isNarrowMargin).toBe(false);
  });

  it("never claims a narrow margin when there is no alternative to compare against", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const solo = { ...output, alternativeRecommendation: null };
    const result = assessResultCredibility(solo);
    expect(result.isNarrowMargin).toBe(false);
    expect(result.scoreGap).toBeNull();
  });

  it("computes decision hinges from real per-dimension gaps, not invented copy", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    if (!output.alternativeRecommendation) throw new Error("fixture expects an alternative to exist");

    const hinges = computeDecisionHinges(output.recommendation, output.alternativeRecommendation, 3);
    expect(hinges.length).toBeGreaterThan(0);
    expect(hinges.length).toBeLessThanOrEqual(3);
    // Every returned label must be a real dimension label from the
    // recommendation's own scored dimensions — nothing fabricated.
    const realLabels = output.recommendation.dimensions.map((d) => d.label);
    for (const hinge of hinges) expect(realLabels).toContain(hinge);
  });
});
