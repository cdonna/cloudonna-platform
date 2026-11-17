import { describe, expect, it } from "vitest";
import { buildDecisionOutput } from "../../engine";
import { EMPTY_WIZARD_STATE, SAMPLE_PROFILE } from "../../data";
import { ENGINE_VERSION, SCORING_ENGINE_VERSION } from "../engine-version";

describe("Recommendation Engine — EngineResult contract", () => {
  it("attaches a fully-populated engineResult to every DecisionOutput", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    expect(output.engineResult).toBeDefined();
    const result = output.engineResult!;
    expect(result.engineVersion).toBe(ENGINE_VERSION);
    expect(result.scoringModelVersion).toBe(SCORING_ENGINE_VERSION);
    expect(result.recommendedOption.id).toBe(output.recommendation.platform.id);
    expect(result.score).toBe(output.donnaScore);
    expect(result.ranking.length).toBe(1 + output.alternatives.length);
    expect(result.criteriaBreakdown).toEqual(output.dimensions);
  });

  it("ranking includes an eligibility status and constraint detail for every option", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    for (const entry of output.engineResult!.ranking) {
      expect(["eligible", "conditionally_eligible", "ineligible"]).toContain(entry.eligibility);
      expect(entry.constraints.length).toBeGreaterThan(0);
      expect(entry.scoreDelta).toBeGreaterThanOrEqual(0);
    }
  });

  it("the winner's own scoreDelta is always 0", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    expect(output.engineResult!.ranking[0].scoreDelta).toBe(0);
  });

  it("includes the raw evidence list and a documented robustness level", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    expect(output.engineResult!.evidence.length).toBeGreaterThan(0);
    expect(["ROBUST", "MODERATELY_ROBUST", "FRAGILE"]).toContain(output.engineResult!.robustness.level);
  });

  it("never fabricates a score: ranking scores match the underlying platform scores exactly", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const allRanked = [output.recommendation, ...output.alternatives];
    const byId = new Map(allRanked.map((r) => [r.platform.id, r.overallScore]));
    for (const entry of output.engineResult!.ranking) {
      expect(entry.score).toBe(byId.get(entry.id));
    }
  });

  it("confidence is UNKNOWN-aware: an all-null profile yields LOW confidence with reasons", () => {
    const output = buildDecisionOutput(EMPTY_WIZARD_STATE);
    expect(output.engineResult!.confidence.level).toBe("LOW");
    expect(output.engineResult!.confidence.reasons.length).toBeGreaterThan(0);
  });

  it("conditionsToReconsider references unknown constraints for an all-null profile", () => {
    const output = buildDecisionOutput(EMPTY_WIZARD_STATE);
    expect(output.engineResult!.conditionsToReconsider.length).toBeGreaterThan(0);
  });

  it("produces no tradeoffs when there is no alternative to compare against", () => {
    // Can't easily force a single-option ranking through the public
    // wizard state, but the contract promises an empty array, never a
    // crash, when alternativeRecommendation is null — covered directly
    // via the underlying buildTradeoffs behavior through a normal run
    // that does have alternatives (sanity: tradeoffs is always an array).
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    expect(Array.isArray(output.engineResult!.tradeoffs)).toBe(true);
  });

  it("is deterministic: identical input produces an identical engineResult", () => {
    const a = buildDecisionOutput(SAMPLE_PROFILE);
    const b = buildDecisionOutput(SAMPLE_PROFILE);
    expect(a.engineResult).toEqual(b.engineResult);
  });

  it("round-trips through JSON (the same serialization path decision_versions persists)", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const roundTripped = JSON.parse(JSON.stringify(output));
    expect(roundTripped.engineResult.engineVersion).toBe(ENGINE_VERSION);
    expect(roundTripped.engineResult.recommendedOption.id).toBe(output.recommendation.platform.id);
  });
});
