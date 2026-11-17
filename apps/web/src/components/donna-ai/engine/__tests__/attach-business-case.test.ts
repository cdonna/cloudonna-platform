import { describe, expect, it } from "vitest";
import { buildDecisionOutput } from "../../engine";
import { SAMPLE_PROFILE } from "../../data";
import { attachBusinessCase } from "../attach-business-case";
import type { BusinessCaseOptionInput } from "../business-case/types";

describe("attachBusinessCase", () => {
  it("returns the output unchanged when no businessCaseInputs are given", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const result = attachBusinessCase(output, {});
    expect(result).toBe(output);
    expect(result.engineResult!.businessCase).toBeUndefined();
  });

  it("returns the output unchanged for an empty businessCaseInputs array", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const result = attachBusinessCase(output, { businessCaseInputs: [] });
    expect(result).toBe(output);
  });

  it("attaches a real, computed businessCase when inputs are given", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const winnerId = output.recommendation.platform.id;
    const inputs: BusinessCaseOptionInput[] = [
      { optionId: winnerId, costs: [{ category: "implementation", label: "x", year: 1, estimate: { kind: "point", value: 1_000_000 }, provenance: "customer-input", note: null }], benefits: [], costOfDelay: null },
    ];
    const result = attachBusinessCase(output, { businessCaseInputs: inputs, horizonYears: 3, discountRatePercent: 8 });
    expect(result.engineResult!.businessCase).toBeDefined();
    expect(result.engineResult!.businessCase!.options[0].summary.tco).toBe(1_000_000);
  });

  it("recomputes executiveRecommendation with a real economic lens once business case data exists", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    expect(output.engineResult!.executiveRecommendation.economic).toBeNull();

    const winnerId = output.recommendation.platform.id;
    const inputs: BusinessCaseOptionInput[] = [
      { optionId: winnerId, costs: [], benefits: [{ category: "runCostReduction", label: "x", year: 1, estimate: { kind: "point", value: 1_000_000 }, provenance: "customer-input", note: null }], costOfDelay: null },
    ];
    const result = attachBusinessCase(output, { businessCaseInputs: inputs });
    expect(result.engineResult!.executiveRecommendation.economic).not.toBeNull();
  });

  it("never mutates the base output object it was given", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const snapshot = JSON.parse(JSON.stringify(output));
    const inputs: BusinessCaseOptionInput[] = [
      { optionId: output.recommendation.platform.id, costs: [{ category: "implementation", label: "x", year: 1, estimate: { kind: "point", value: 500_000 }, provenance: "customer-input", note: null }], benefits: [], costOfDelay: null },
    ];
    attachBusinessCase(output, { businessCaseInputs: inputs });
    expect(JSON.parse(JSON.stringify(output))).toEqual(snapshot);
  });
});
