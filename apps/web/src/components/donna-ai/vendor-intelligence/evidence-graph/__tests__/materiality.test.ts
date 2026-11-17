import { describe, expect, it } from "vitest";
import { computeMateriality, type MaterialityInput } from "../materiality";

function base(overrides: Partial<MaterialityInput> = {}): MaterialityInput {
  return {
    changeType: "capability_changed",
    isWinner: false,
    isTopAlternative: false,
    criterionWeight: null,
    robustnessLevel: null,
    hardConstraintAffected: false,
    businessCaseAssumptionAffected: false,
    criticalRiskAffected: false,
    ...overrides,
  };
}

describe("computeMateriality", () => {
  it("is HIGH and review-recommended whenever a hard constraint is affected, regardless of other factors", () => {
    const result = computeMateriality(base({ hardConstraintAffected: true }));
    expect(result.materiality).toBe("high");
    expect(result.reviewRecommended).toBe(true);
  });

  it("is HIGH whenever a critical risk is affected", () => {
    expect(computeMateriality(base({ criticalRiskAffected: true })).materiality).toBe("high");
  });

  it("is LOW and not review-recommended for an option that is neither the winner nor a top alternative", () => {
    const result = computeMateriality(base({ criterionWeight: 0.15 }));
    expect(result.materiality).toBe("low");
    expect(result.reviewRecommended).toBe(false);
  });

  it("is HIGH when the recommendation is already fragile and the winner is affected, even on a low-weight criterion", () => {
    const result = computeMateriality(base({ isWinner: true, robustnessLevel: "FRAGILE", criterionWeight: 0.05 }));
    expect(result.materiality).toBe("high");
  });

  it("is HIGH when the winner is affected on a high-weight criterion", () => {
    const result = computeMateriality(base({ isWinner: true, criterionWeight: 0.15, robustnessLevel: "ROBUST" }));
    expect(result.materiality).toBe("high");
  });

  it("is LOW when the winner is affected but only on a low-weight criterion with no other material factor", () => {
    const result = computeMateriality(base({ isWinner: true, criterionWeight: 0.05, robustnessLevel: "ROBUST" }));
    expect(result.materiality).toBe("low");
  });

  it("is MEDIUM when a top alternative (not the winner) is affected on a meaningful-weight criterion", () => {
    const result = computeMateriality(base({ isTopAlternative: true, criterionWeight: 0.1 }));
    expect(result.materiality).toBe("medium");
  });

  it("escalates a business-case assumption change to HIGH only when it affects the winner", () => {
    expect(computeMateriality(base({ isWinner: true, businessCaseAssumptionAffected: true })).materiality).toBe("high");
    expect(computeMateriality(base({ isTopAlternative: true, businessCaseAssumptionAffected: true })).materiality).toBe("medium");
  });

  it("always returns at least one reason", () => {
    const result = computeMateriality(base());
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
