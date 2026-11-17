import { describe, expect, it } from "vitest";
import { computeSourceConfidence } from "../source-confidence";

describe("Source Confidence", () => {
  it("rates an official, current, uncorroborated, unconflicted source HIGH", () => {
    const result = computeSourceConfidence({ type: "official-source", freshness: "current", optionId: "a", criterionId: "cost" }, false, 0);
    expect(result.level).toBe("high");
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("rates an AI interpretation with no corroboration lower than the equivalent official source", () => {
    const official = computeSourceConfidence({ type: "official-source", freshness: "current", optionId: "a", criterionId: "cost" }, false, 0);
    const interpretation = computeSourceConfidence({ type: "ai-interpretation", freshness: "current", optionId: "a", criterionId: "cost" }, false, 0);
    const rank = { high: 2, medium: 1, low: 0 };
    expect(rank[interpretation.level]).toBeLessThanOrEqual(rank[official.level]);
  });

  it("an open conflict always pulls the level down relative to the same evidence with no conflict", () => {
    const clean = computeSourceConfidence({ type: "official-source", freshness: "current", optionId: "a", criterionId: "cost" }, false, 0);
    const conflicted = computeSourceConfidence({ type: "official-source", freshness: "current", optionId: "a", criterionId: "cost" }, true, 0);
    const rank = { high: 2, medium: 1, low: 0 };
    expect(rank[conflicted.level]).toBeLessThan(rank[clean.level]);
  });

  it("never returns a numeric percentage — only HIGH/MEDIUM/LOW", () => {
    const result = computeSourceConfidence({ type: "official-source", freshness: "stale", optionId: "a", criterionId: "cost" }, false, 0);
    expect(["high", "medium", "low"]).toContain(result.level);
  });

  it("is deterministic for identical input", () => {
    const a = computeSourceConfidence({ type: "official-source", freshness: "aging", optionId: "a", criterionId: "cost" }, false, 1);
    const b = computeSourceConfidence({ type: "official-source", freshness: "aging", optionId: "a", criterionId: "cost" }, false, 1);
    expect(a).toEqual(b);
  });
});
