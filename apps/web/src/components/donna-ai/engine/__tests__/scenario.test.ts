import { describe, expect, it } from "vitest";
import { scoreAllPlatformsV2 } from "../../scoring/engine";
import { SAMPLE_PROFILE } from "../../data";
import { SCORE_WEIGHTS } from "../../scoring/weights";
import { findPivotalDimensions, renormalizeWeights, robustnessAcrossStressScenarios, runScenario } from "../scenario";

describe("Scenario Engine — weight normalization", () => {
  it("renormalizes to a set of weights summing to 1 (within floating point tolerance)", () => {
    const weights = renormalizeWeights({ cost: 0.5 });
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    expect(total).toBeCloseTo(1, 9);
  });

  it("applies an override verbatim (clamped) and does not touch it during renormalization", () => {
    const weights = renormalizeWeights({ cost: 0.4 });
    expect(weights.cost).toBeCloseTo(0.4, 9);
  });

  it("clamps an out-of-range override into [0, 1]", () => {
    const weights = renormalizeWeights({ cost: 1.5 });
    expect(weights.cost).toBe(1);
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    expect(total).toBeCloseTo(1, 9);
  });

  it("returns the original SCORE_WEIGHTS unchanged when given no overrides", () => {
    const weights = renormalizeWeights({});
    for (const key of Object.keys(SCORE_WEIGHTS) as Array<keyof typeof SCORE_WEIGHTS>) {
      expect(weights[key]).toBeCloseTo(SCORE_WEIGHTS[key], 9);
    }
  });

  it("is deterministic for identical overrides", () => {
    const a = renormalizeWeights({ governance: 0.3 });
    const b = renormalizeWeights({ governance: 0.3 });
    expect(a).toEqual(b);
  });
});

describe("Scenario Engine — ranking", () => {
  const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);

  it("reproduces the base ranking when given no overrides", () => {
    const result = runScenario(ranked, {});
    expect(result.recommendationChanged).toBe(false);
    for (let i = 0; i < result.ranking.length; i += 1) {
      expect(result.ranking[i].scenarioScore).toBe(result.ranking[i].baseScore);
      expect(result.ranking[i].delta).toBe(0);
    }
  });

  it("can change the winner when a dimension is heavily overweighted toward the runner-up's strength", () => {
    // Find a dimension where the runner-up strictly beats the leader,
    // then push nearly all weight onto it — the ranking must flip.
    const [leader, runnerUp] = ranked;
    const pivot = leader.dimensions.find((d) => {
      const runnerDim = runnerUp.dimensions.find((rd) => rd.key === d.key);
      return runnerDim && runnerDim.score > d.score;
    });
    expect(pivot).toBeDefined();
    const result = runScenario(ranked, { [pivot!.key]: 0.95 });
    expect(result.scenarioWinnerId).toBe(runnerUp.platform.id);
    expect(result.recommendationChanged).toBe(true);
    expect(result.whyItChanged.length).toBeGreaterThan(0);
  });

  it("explains a changed recommendation in prose naming the overridden dimension", () => {
    const [leader, runnerUp] = ranked;
    const pivot = leader.dimensions.find((d) => {
      const runnerDim = runnerUp.dimensions.find((rd) => rd.key === d.key);
      return runnerDim && runnerDim.score > d.score;
    })!;
    const result = runScenario(ranked, { [pivot.key]: 0.95 });
    expect(result.whyItChanged[0]).toContain(runnerUp.platform.productName);
  });

  it("is deterministic: the same overrides on the same ranking always produce the same result", () => {
    const a = runScenario(ranked, { cost: 0.4 });
    const b = runScenario(ranked, { cost: 0.4 });
    expect(a).toEqual(b);
  });
});

describe("Scenario Engine — sensitivity", () => {
  const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);

  it("returns one pivotal-dimension entry per scoring dimension", () => {
    const pivots = findPivotalDimensions(ranked);
    expect(pivots).toHaveLength(Object.keys(SCORE_WEIGHTS).length);
  });

  it("reports weightToTie within [0, 1] whenever a tie is achievable", () => {
    const pivots = findPivotalDimensions(ranked);
    for (const pivot of pivots) {
      if (pivot.weightToTie !== null) {
        expect(pivot.weightToTie).toBeGreaterThanOrEqual(0);
        expect(pivot.weightToTie).toBeLessThanOrEqual(1);
      }
    }
  });

  it("returns an empty array when fewer than two platforms are ranked", () => {
    expect(findPivotalDimensions([ranked[0]])).toEqual([]);
    expect(findPivotalDimensions([])).toEqual([]);
  });

  it("reports robust: true only when no stress scenario changes the winner", () => {
    const { robust, winnerChangedUnder } = robustnessAcrossStressScenarios(ranked);
    expect(typeof robust).toBe("boolean");
    expect(robust).toBe(winnerChangedUnder.length === 0);
  });

  it("is deterministic for identical input", () => {
    const a = findPivotalDimensions(ranked);
    const b = findPivotalDimensions(ranked);
    expect(a).toEqual(b);
  });
});
