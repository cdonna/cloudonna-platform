import { describe, expect, it } from "vitest";
import { scoreAllPlatformsV2 } from "../../scoring/engine";
import { SAMPLE_PROFILE } from "../../data";
import { computeRobustness } from "../robustness";

describe("Robustness model", () => {
  const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);

  it("always returns one of the three documented levels", () => {
    const result = computeRobustness(ranked);
    expect(["ROBUST", "MODERATELY_ROBUST", "FRAGILE"]).toContain(result.level);
  });

  it("reports a 100-point gap for a single-platform ranking (never divides by zero or crashes)", () => {
    const result = computeRobustness([ranked[0]]);
    expect(result.scoreGap).toBe(100);
    expect(Number.isFinite(result.scoreGap)).toBe(true);
  });

  it("always provides at least one reason", () => {
    const result = computeRobustness(ranked);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("is deterministic for identical input", () => {
    const a = computeRobustness(ranked);
    const b = computeRobustness(ranked);
    expect(a).toEqual(b);
  });

  it("scoreGap matches the real difference between the top two platforms", () => {
    const result = computeRobustness(ranked);
    expect(result.scoreGap).toBe(ranked[0].overallScore - ranked[1].overallScore);
  });

  it("is never ROBUST when the winner changes under a stress scenario", () => {
    const result = computeRobustness(ranked);
    if (!result.stableAcrossStressScenarios) {
      expect(result.level).toBe("FRAGILE");
    }
  });
});
