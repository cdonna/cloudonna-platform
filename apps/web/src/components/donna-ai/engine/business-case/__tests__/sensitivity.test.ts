import { describe, expect, it } from "vitest";
import { ECONOMIC_SCENARIOS, computeNPV, computeYearlyCashFlows } from "../calculations";
import { findRoiFlipMultiplier, identifyLargestDrivers, identifyLargestUncertainty } from "../sensitivity";
import type { BusinessCaseOptionInput, CostLineItem, BenefitLineItem } from "../types";

function cost(category: CostLineItem["category"], year: number, estimate: CostLineItem["estimate"]): CostLineItem {
  return { category, label: category, year, estimate, provenance: "customer-input", note: null };
}
function benefit(category: BenefitLineItem["category"], year: number, estimate: BenefitLineItem["estimate"]): BenefitLineItem {
  return { category, label: category, year, estimate, provenance: "customer-input", note: null };
}

describe("identifyLargestDrivers", () => {
  it("ranks categories by total resolved amount, descending", () => {
    const input: BusinessCaseOptionInput = {
      optionId: "a",
      costs: [cost("implementation", 1, { kind: "point", value: 100 }), cost("subscriptionLicense", 1, { kind: "point", value: 900 })],
      benefits: [],
      costOfDelay: null,
    };
    const drivers = identifyLargestDrivers(input, ECONOMIC_SCENARIOS.base);
    expect(drivers[0].category).toBe("subscriptionLicense");
    expect(drivers[0].totalAmount).toBe(900);
  });

  it("never includes a category with no line items", () => {
    const input: BusinessCaseOptionInput = { optionId: "a", costs: [cost("implementation", 1, { kind: "point", value: 100 })], benefits: [], costOfDelay: null };
    const drivers = identifyLargestDrivers(input, ECONOMIC_SCENARIOS.base);
    expect(drivers.some((d) => d.category === "migration")).toBe(false);
  });

  it("sums a category across multiple years into one total", () => {
    const input: BusinessCaseOptionInput = {
      optionId: "a",
      costs: [cost("subscriptionLicense", 1, { kind: "point", value: 100 }), cost("subscriptionLicense", 2, { kind: "point", value: 100 }), cost("subscriptionLicense", 3, { kind: "point", value: 100 })],
      benefits: [],
      costOfDelay: null,
    };
    expect(identifyLargestDrivers(input, ECONOMIC_SCENARIOS.base)[0].totalAmount).toBe(300);
  });
});

describe("identifyLargestUncertainty", () => {
  it("ranks range estimates by (high - low) spread, descending", () => {
    const input: BusinessCaseOptionInput = {
      optionId: "a",
      costs: [cost("implementation", 1, { kind: "range", low: 2_000_000, base: 3_000_000, high: 4_500_000 })],
      benefits: [benefit("productivityGain", 1, { kind: "range", low: 100_000, base: 150_000, high: 180_000 })],
      costOfDelay: null,
    };
    const result = identifyLargestUncertainty(input);
    expect(result[0].category).toBe("implementation");
    expect(result[0].spread).toBe(2_500_000);
  });

  it("never includes a point estimate — there is no spread to measure", () => {
    const input: BusinessCaseOptionInput = { optionId: "a", costs: [cost("implementation", 1, { kind: "point", value: 1_000_000 })], benefits: [], costOfDelay: null };
    expect(identifyLargestUncertainty(input)).toHaveLength(0);
  });
});

describe("findRoiFlipMultiplier", () => {
  // Option A: cheap upfront, modest recurring benefit.
  // Option B: no upfront cost at all, smaller fixed benefit — a clean baseline to flip against.
  const optionA: BusinessCaseOptionInput = {
    optionId: "a",
    costs: [cost("implementation", 1, { kind: "point", value: 1_000_000 })],
    benefits: [benefit("runCostReduction", 1, { kind: "point", value: 500_000 }), benefit("runCostReduction", 2, { kind: "point", value: 500_000 }), benefit("runCostReduction", 3, { kind: "point", value: 500_000 })],
    costOfDelay: null,
  };
  const optionB: BusinessCaseOptionInput = { optionId: "b", costs: [], benefits: [benefit("runCostReduction", 1, { kind: "point", value: 200_000 }), benefit("runCostReduction", 2, { kind: "point", value: 200_000 }), benefit("runCostReduction", 3, { kind: "point", value: 200_000 })], costOfDelay: null };

  it("returns null when the target category has no line items in option A", () => {
    expect(findRoiFlipMultiplier(optionA, optionB, "cost", "migration", ECONOMIC_SCENARIOS.base, 3, 0)).toBeNull();
  });

  it("finds the exact multiplier that makes NPV_A equal NPV_B", () => {
    const k = findRoiFlipMultiplier(optionA, optionB, "benefit", "runCostReduction", ECONOMIC_SCENARIOS.base, 3, 0);
    expect(k).not.toBeNull();

    // Verify: scaling option A's runCostReduction benefit by k should
    // make its NPV equal option B's NPV at a 0% discount rate (so NPV
    // is just a plain sum, easy to hand-verify).
    const scaledA: BusinessCaseOptionInput = {
      ...optionA,
      benefits: optionA.benefits.map((b) => ({ ...b, estimate: b.estimate.kind === "point" ? { kind: "point" as const, value: b.estimate.value * k! } : b.estimate })),
    };
    const npvScaledA = computeNPV(computeYearlyCashFlows(scaledA, ECONOMIC_SCENARIOS.base, 3), 0);
    const npvB = computeNPV(computeYearlyCashFlows(optionB, ECONOMIC_SCENARIOS.base, 3), 0);
    expect(npvScaledA).toBeCloseTo(npvB, 6);
  });

  it("is deterministic for identical input", () => {
    const a = findRoiFlipMultiplier(optionA, optionB, "benefit", "runCostReduction", ECONOMIC_SCENARIOS.base, 3, 8);
    const b = findRoiFlipMultiplier(optionA, optionB, "benefit", "runCostReduction", ECONOMIC_SCENARIOS.base, 3, 8);
    expect(a).toBe(b);
  });
});
