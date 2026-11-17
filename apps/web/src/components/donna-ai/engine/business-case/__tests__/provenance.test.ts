import { describe, expect, it } from "vitest";
import { computeFinancialConfidence } from "../provenance";
import type { BusinessCaseOptionInput, CostLineItem } from "../types";

function item(provenance: CostLineItem["provenance"]): CostLineItem {
  return { category: "implementation", label: "x", year: 1, estimate: { kind: "point", value: 100 }, provenance, note: null };
}

describe("computeFinancialConfidence", () => {
  it("rates LOW when there is no data at all", () => {
    const result = computeFinancialConfidence({ optionId: "a", costs: [], benefits: [], costOfDelay: null });
    expect(result.level).toBe("low");
  });

  it("rates HIGH when every figure is customer-input/official-source/calculated", () => {
    const input: BusinessCaseOptionInput = { optionId: "a", costs: [item("customer-input"), item("official-source"), item("calculated"), item("customer-input")], benefits: [], costOfDelay: null };
    expect(computeFinancialConfidence(input).level).toBe("high");
  });

  it("rates LOW when most figures are unvalidated assumptions", () => {
    const input: BusinessCaseOptionInput = { optionId: "a", costs: [item("assumption"), item("assumption"), item("assumption"), item("customer-input")], benefits: [], costOfDelay: null };
    expect(computeFinancialConfidence(input).level).toBe("low");
  });

  it("never sets confidence from an AI interpretation alone — ai-interpretation pulls the level down, not up", () => {
    const allInterpreted: BusinessCaseOptionInput = { optionId: "a", costs: [item("ai-interpretation"), item("ai-interpretation")], benefits: [], costOfDelay: null };
    const allOfficial: BusinessCaseOptionInput = { optionId: "a", costs: [item("official-source"), item("official-source")], benefits: [], costOfDelay: null };
    const rank = { high: 2, medium: 1, low: 0 };
    expect(rank[computeFinancialConfidence(allInterpreted).level]).toBeLessThanOrEqual(rank[computeFinancialConfidence(allOfficial).level]);
  });

  it("always includes at least one concrete reason", () => {
    const input: BusinessCaseOptionInput = { optionId: "a", costs: [item("customer-input")], benefits: [], costOfDelay: null };
    expect(computeFinancialConfidence(input).reasons.length).toBeGreaterThan(0);
  });
});
