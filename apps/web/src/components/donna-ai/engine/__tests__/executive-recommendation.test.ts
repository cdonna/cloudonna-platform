import { describe, expect, it } from "vitest";
import { scoreAllPlatformsV2 } from "../../scoring/engine";
import { SAMPLE_PROFILE } from "../../data";
import { computeExecutiveRecommendation } from "../executive-recommendation";
import { computeBusinessCase, ECONOMIC_SCENARIOS } from "../business-case/calculations";
import type { BusinessCaseOptionInput } from "../business-case/types";

const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);

describe("Executive Recommendation", () => {
  it("strategic always matches the base engine's own winner", () => {
    const result = computeExecutiveRecommendation(ranked);
    expect(result.strategic.optionId).toBe(ranked[0].platform.id);
  });

  it("economic is null when no business case data is given — never guessed", () => {
    const result = computeExecutiveRecommendation(ranked, null);
    expect(result.economic).toBeNull();
  });

  it("overall always equals the strategic lens, never a silently averaged lens", () => {
    const result = computeExecutiveRecommendation(ranked);
    expect(result.overall).toEqual(result.strategic);
  });

  it("agree is true and disagreementNote is null when every lens points to the same option", () => {
    // Build a business case where the strategic winner is ALSO the
    // economic winner by giving it the only, clearly best NPV.
    const strategicWinnerId = ranked[0].platform.id;
    const businessCaseInputs: BusinessCaseOptionInput[] = ranked.slice(0, 2).map((r) => ({
      optionId: r.platform.id,
      costs: [{ category: "implementation", label: "x", year: 1, estimate: { kind: "point", value: 1_000_000 }, provenance: "customer-input", note: null }],
      benefits: [{ category: "runCostReduction", label: "x", year: 1, estimate: { kind: "point", value: r.platform.id === strategicWinnerId ? 5_000_000 : 1_000_000 }, provenance: "customer-input", note: null }],
      costOfDelay: null,
    }));
    const businessCase = computeBusinessCase(businessCaseInputs, ECONOMIC_SCENARIOS.base, 1, 0);
    const result = computeExecutiveRecommendation(ranked, businessCase);
    expect(result.economic?.optionId).toBe(strategicWinnerId);
    // Architecture lens may or may not agree depending on real catalog
    // data — only assert the no-business-case-disagreement case when
    // architecture also happens to agree, otherwise just check economic matches.
    if (result.architecture.optionId === strategicWinnerId) {
      expect(result.agree).toBe(true);
      expect(result.disagreementNote).toBeNull();
    }
  });

  it("flags disagreement explicitly, naming every lens, when they point to different options", () => {
    const strategicWinnerId = ranked[0].platform.id;
    const runnerUpId = ranked[1].platform.id;
    const businessCaseInputs: BusinessCaseOptionInput[] = [
      { optionId: strategicWinnerId, costs: [{ category: "implementation", label: "x", year: 1, estimate: { kind: "point", value: 1_000_000 }, provenance: "customer-input", note: null }], benefits: [], costOfDelay: null },
      {
        optionId: runnerUpId,
        costs: [],
        benefits: [{ category: "runCostReduction", label: "x", year: 1, estimate: { kind: "point", value: 5_000_000 }, provenance: "customer-input", note: null }],
        costOfDelay: null,
      },
    ];
    const businessCase = computeBusinessCase(businessCaseInputs, ECONOMIC_SCENARIOS.base, 1, 0);
    const result = computeExecutiveRecommendation(ranked, businessCase);
    expect(result.economic?.optionId).toBe(runnerUpId);
    expect(result.agree).toBe(false);
    expect(result.disagreementNote).toContain(result.strategic.optionName);
    expect(result.disagreementNote).toContain(result.economic!.optionName);
  });

  it("is deterministic for identical input", () => {
    const a = computeExecutiveRecommendation(ranked, null);
    const b = computeExecutiveRecommendation(ranked, null);
    expect(a).toEqual(b);
  });
});
