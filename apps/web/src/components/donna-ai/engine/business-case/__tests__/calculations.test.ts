import { describe, expect, it } from "vitest";
import {
  computeBusinessCase,
  computeCostOfDelay,
  computeNPV,
  computePaybackYears,
  computeROI,
  computeTCO,
  computeTotalBenefits,
  computeYearlyCashFlows,
  ECONOMIC_SCENARIOS,
  resolveEstimate,
} from "../calculations";
import type { BusinessCaseOptionInput, CostLineItem, BenefitLineItem } from "../types";

function cost(category: CostLineItem["category"], year: number, estimate: CostLineItem["estimate"]): CostLineItem {
  return { category, label: category, year, estimate, provenance: "customer-input", note: null };
}
function benefit(category: BenefitLineItem["category"], year: number, estimate: BenefitLineItem["estimate"]): BenefitLineItem {
  return { category, label: category, year, estimate, provenance: "customer-input", note: null };
}

describe("resolveEstimate", () => {
  it("returns the point value unchanged for a point estimate, regardless of scenario", () => {
    const estimate = { kind: "point" as const, value: 100 };
    expect(resolveEstimate(estimate, ECONOMIC_SCENARIOS.base, "cost", "implementation")).toBe(100);
    expect(resolveEstimate(estimate, ECONOMIC_SCENARIOS.upside, "cost", "implementation")).toBe(100);
    expect(resolveEstimate(estimate, ECONOMIC_SCENARIOS.downside, "cost", "implementation")).toBe(100);
  });

  it("reads BASE for the base scenario on a range estimate", () => {
    const estimate = { kind: "range" as const, low: 2_000_000, base: 3_000_000, high: 4_500_000 };
    expect(resolveEstimate(estimate, ECONOMIC_SCENARIOS.base, "cost", "implementation")).toBe(3_000_000);
  });

  it("reads LOW for a cost and HIGH for a benefit under the upside scenario", () => {
    const estimate = { kind: "range" as const, low: 2_000_000, base: 3_000_000, high: 4_500_000 };
    expect(resolveEstimate(estimate, ECONOMIC_SCENARIOS.upside, "cost", "implementation")).toBe(2_000_000);
    expect(resolveEstimate(estimate, ECONOMIC_SCENARIOS.upside, "benefit", "productivityGain")).toBe(4_500_000);
  });

  it("reads HIGH for a cost and LOW for a benefit under the downside scenario", () => {
    const estimate = { kind: "range" as const, low: 2_000_000, base: 3_000_000, high: 4_500_000 };
    expect(resolveEstimate(estimate, ECONOMIC_SCENARIOS.downside, "cost", "implementation")).toBe(4_500_000);
    expect(resolveEstimate(estimate, ECONOMIC_SCENARIOS.downside, "benefit", "productivityGain")).toBe(2_000_000);
  });

  it("applies a custom multiplier to the matching category only", () => {
    const estimate = { kind: "range" as const, low: 100, base: 200, high: 300 };
    const custom = { name: "custom" as const, label: "Custom", customMultipliers: { consumption: 1.5 } };
    expect(resolveEstimate(estimate, custom, "cost", "consumption")).toBe(300); // 200 * 1.5
    expect(resolveEstimate(estimate, custom, "cost", "infrastructure")).toBe(200); // no multiplier for this category -> base
  });
});

describe("computeYearlyCashFlows / computeTCO / computeTotalBenefits — hand-computed", () => {
  const input: BusinessCaseOptionInput = {
    optionId: "test-option",
    costs: [cost("implementation", 1, { kind: "point", value: 1_000_000 }), cost("subscriptionLicense", 1, { kind: "point", value: 200_000 }), cost("subscriptionLicense", 2, { kind: "point", value: 200_000 }), cost("subscriptionLicense", 3, { kind: "point", value: 200_000 })],
    benefits: [benefit("runCostReduction", 1, { kind: "point", value: 100_000 }), benefit("runCostReduction", 2, { kind: "point", value: 400_000 }), benefit("runCostReduction", 3, { kind: "point", value: 400_000 })],
    costOfDelay: null,
  };

  it("sums costs and benefits per year exactly", () => {
    const flows = computeYearlyCashFlows(input, ECONOMIC_SCENARIOS.base, 3);
    expect(flows).toEqual([
      { year: 1, totalCost: 1_200_000, totalBenefit: 100_000, netCashFlow: -1_100_000, cumulativeCashFlow: -1_100_000 },
      { year: 2, totalCost: 200_000, totalBenefit: 400_000, netCashFlow: 200_000, cumulativeCashFlow: -900_000 },
      { year: 3, totalCost: 200_000, totalBenefit: 400_000, netCashFlow: 200_000, cumulativeCashFlow: -700_000 },
    ]);
  });

  it("TCO is the exact sum of all per-year costs", () => {
    const flows = computeYearlyCashFlows(input, ECONOMIC_SCENARIOS.base, 3);
    expect(computeTCO(flows)).toBe(1_600_000);
  });

  it("total benefits is the exact sum of all per-year benefits", () => {
    const flows = computeYearlyCashFlows(input, ECONOMIC_SCENARIOS.base, 3);
    expect(computeTotalBenefits(flows)).toBe(900_000);
  });

  it("a year with no line items at all produces zero, not an error", () => {
    const flows = computeYearlyCashFlows({ ...input, costs: [], benefits: [] }, ECONOMIC_SCENARIOS.base, 3);
    expect(flows.every((f) => f.totalCost === 0 && f.totalBenefit === 0)).toBe(true);
  });
});

describe("computeROI", () => {
  it("computes the exact percentage for a known net benefit and TCO", () => {
    expect(computeROI(500_000, 1_000_000)).toBe(50);
  });
  it("returns null when TCO is zero rather than dividing by zero", () => {
    expect(computeROI(500_000, 0)).toBeNull();
  });
  it("correctly computes a negative ROI when net benefit is negative", () => {
    expect(computeROI(-300_000, 1_000_000)).toBe(-30);
  });
});

describe("computeNPV — hand-computed against a 10% discount rate", () => {
  it("matches a manually discounted three-year cash flow", () => {
    const flows = [
      { year: 1, totalCost: 0, totalBenefit: 0, netCashFlow: -1000, cumulativeCashFlow: -1000 },
      { year: 2, totalCost: 0, totalBenefit: 0, netCashFlow: 500, cumulativeCashFlow: -500 },
      { year: 3, totalCost: 0, totalBenefit: 0, netCashFlow: 600, cumulativeCashFlow: 100 },
    ];
    // -1000/1.1^1 + 500/1.1^2 + 600/1.1^3 = -909.09 + 413.22 + 450.79 = -45.08
    expect(computeNPV(flows, 10)).toBe(-45);
  });

  it("at a 0% discount rate, NPV equals the simple sum of cash flows", () => {
    const flows = [
      { year: 1, totalCost: 0, totalBenefit: 0, netCashFlow: -1000, cumulativeCashFlow: -1000 },
      { year: 2, totalCost: 0, totalBenefit: 0, netCashFlow: 1200, cumulativeCashFlow: 200 },
    ];
    expect(computeNPV(flows, 0)).toBe(200);
  });
});

describe("computePaybackYears", () => {
  it("returns 0 when the very first year is already non-negative", () => {
    const flows = [{ year: 1, totalCost: 0, totalBenefit: 0, netCashFlow: 100, cumulativeCashFlow: 100 }];
    expect(computePaybackYears(flows)).toBe(0);
  });

  it("linearly interpolates within the crossing year", () => {
    const flows = [
      { year: 1, totalCost: 0, totalBenefit: 0, netCashFlow: -100, cumulativeCashFlow: -100 },
      { year: 2, totalCost: 0, totalBenefit: 0, netCashFlow: 150, cumulativeCashFlow: 50 },
    ];
    // Crosses zero 100/150 = 0.667 of the way through year 2.
    expect(computePaybackYears(flows)).toBe(1.67);
  });

  it("returns null when cumulative cash flow never turns positive within the horizon", () => {
    const flows = [
      { year: 1, totalCost: 0, totalBenefit: 0, netCashFlow: -500, cumulativeCashFlow: -500 },
      { year: 2, totalCost: 0, totalBenefit: 0, netCashFlow: -100, cumulativeCashFlow: -600 },
    ];
    expect(computePaybackYears(flows)).toBeNull();
  });
});

describe("computeBusinessCase — end to end across options", () => {
  const optionA: BusinessCaseOptionInput = {
    optionId: "a",
    costs: [cost("implementation", 1, { kind: "point", value: 2_000_000 })],
    benefits: [benefit("runCostReduction", 1, { kind: "point", value: 500_000 }), benefit("runCostReduction", 2, { kind: "point", value: 1_500_000 }), benefit("runCostReduction", 3, { kind: "point", value: 1_500_000 })],
    costOfDelay: null,
  };

  it("computes a full summary per option with no NaN/undefined fields", () => {
    const result = computeBusinessCase([optionA], ECONOMIC_SCENARIOS.base, 3, 8);
    const [output] = result.options;
    expect(Number.isFinite(output.summary.tco)).toBe(true);
    expect(Number.isFinite(output.summary.totalBenefits)).toBe(true);
    expect(Number.isFinite(output.summary.npv)).toBe(true);
    expect(output.summary.roiPercent).not.toBeNull();
  });

  it("never fabricates a figure for an option with zero inputs", () => {
    const result = computeBusinessCase([{ optionId: "empty", costs: [], benefits: [], costOfDelay: null }], ECONOMIC_SCENARIOS.base, 3, 8);
    const [output] = result.options;
    expect(output.summary.tco).toBe(0);
    expect(output.summary.roiPercent).toBeNull(); // zero TCO -> no meaningful ROI
    expect(output.summary.paybackYears).toBe(0); // cumulative is 0 >= 0 from year 1
  });

  it("is deterministic for identical input", () => {
    const a = computeBusinessCase([optionA], ECONOMIC_SCENARIOS.base, 3, 8);
    const b = computeBusinessCase([optionA], ECONOMIC_SCENARIOS.base, 3, 8);
    expect(a).toEqual(b);
  });
});

describe("computeCostOfDelay", () => {
  it("returns null when every field is unset — never assumes a delay cost", () => {
    expect(computeCostOfDelay({ monthlyDelayCost: null, revenueOpportunityDelay: null, legacyRunCostExtension: null, transformationDelayCost: null, delayMonths: 6 }, ECONOMIC_SCENARIOS.base)).toBeNull();
  });

  it("multiplies monthly delay cost by delayMonths exactly", () => {
    const result = computeCostOfDelay({ monthlyDelayCost: { kind: "point", value: 50_000 }, revenueOpportunityDelay: null, legacyRunCostExtension: null, transformationDelayCost: null, delayMonths: 6 }, ECONOMIC_SCENARIOS.base);
    expect(result?.totalCost).toBe(300_000);
  });

  it("sums every populated component", () => {
    const result = computeCostOfDelay(
      {
        monthlyDelayCost: { kind: "point", value: 10_000 },
        revenueOpportunityDelay: { kind: "point", value: 50_000 },
        legacyRunCostExtension: { kind: "point", value: 20_000 },
        transformationDelayCost: { kind: "point", value: 15_000 },
        delayMonths: 3,
      },
      ECONOMIC_SCENARIOS.base,
    );
    // monthly: 10_000 * 3 = 30_000, plus the three one-off figures.
    expect(result?.totalCost).toBe(30_000 + 50_000 + 20_000 + 15_000);
    expect(result?.breakdown).toHaveLength(4);
  });
});
