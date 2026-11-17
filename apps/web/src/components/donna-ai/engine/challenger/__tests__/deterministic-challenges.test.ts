import { describe, expect, it } from "vitest";
import { buildDecisionOutput } from "../../../engine";
import { EMPTY_WIZARD_STATE, SAMPLE_PROFILE } from "../../../data";
import { buildAlternativeChallenges, buildConstraintChallenges, buildDeterministicChallenges, buildEvidenceChallenges, buildFinancialChallenges } from "../deterministic-challenges";
import { ECONOMIC_SCENARIOS } from "../../business-case/calculations";
import { computeBusinessCase } from "../../business-case/calculations";
import type { BusinessCaseOptionInput } from "../../business-case/types";

describe("Challenger — deterministic challenges", () => {
  it("buildAlternativeChallenges never challenges a non-pivotal dimension (weightToTie null)", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const challenges = buildAlternativeChallenges(output.engineResult!);
    const pivotalCount = output.engineResult!.scenarios.pivotalDimensions.filter((p) => p.weightToTie !== null).length;
    expect(challenges).toHaveLength(pivotalCount);
    expect(challenges.every((c) => c.type === "ALTERNATIVE_CHALLENGE" && c.source === "deterministic")).toBe(true);
  });

  it("buildConstraintChallenges fires only for UNKNOWN constraints on the winner, never for PASS", () => {
    const output = buildDecisionOutput(EMPTY_WIZARD_STATE); // no constraints stated -> everything UNKNOWN
    const challenges = buildConstraintChallenges(output.engineResult!);
    const winner = output.engineResult!.ranking[0];
    const unknownCount = winner.constraints.filter((c) => c.status === "UNKNOWN").length;
    expect(challenges).toHaveLength(unknownCount);
    expect(challenges.every((c) => c.type === "CONSTRAINT_CHALLENGE")).toBe(true);
  });

  it("buildConstraintChallenges produces nothing when every constraint passes", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE); // SAMPLE_PROFILE states both vendor and cloud preference
    const winner = output.engineResult!.ranking[0];
    if (winner.constraints.every((c) => c.status === "PASS")) {
      expect(buildConstraintChallenges(output.engineResult!)).toHaveLength(0);
    }
  });

  it("buildEvidenceChallenges fires on a high assumption ratio for a mostly-empty profile", () => {
    const output = buildDecisionOutput(EMPTY_WIZARD_STATE);
    const challenges = buildEvidenceChallenges(output.engineResult!);
    expect(challenges.length).toBeGreaterThan(0);
    expect(challenges.every((c) => c.type === "EVIDENCE_CHALLENGE")).toBe(true);
  });

  it("buildFinancialChallenges returns nothing without business case data", () => {
    expect(buildFinancialChallenges(null, new Map())).toHaveLength(0);
  });

  it("buildFinancialChallenges finds a real flip multiplier when two options' business cases differ", () => {
    const inputA: BusinessCaseOptionInput = {
      optionId: "a",
      costs: [{ category: "implementation", label: "x", year: 1, estimate: { kind: "point", value: 1_000_000 }, provenance: "customer-input", note: null }],
      benefits: [{ category: "runCostReduction", label: "x", year: 1, estimate: { kind: "point", value: 1_500_000 }, provenance: "customer-input", note: null }],
      costOfDelay: null,
    };
    const inputB: BusinessCaseOptionInput = {
      optionId: "b",
      costs: [],
      benefits: [{ category: "runCostReduction", label: "x", year: 1, estimate: { kind: "point", value: 300_000 }, provenance: "customer-input", note: null }],
      costOfDelay: null,
    };
    const businessCase = computeBusinessCase([inputA, inputB], ECONOMIC_SCENARIOS.base, 1, 0);
    const challenges = buildFinancialChallenges(businessCase, new Map([["a", inputA], ["b", inputB]]));
    expect(challenges.length).toBeGreaterThan(0);
    expect(challenges.every((c) => c.type === "FINANCIAL_CHALLENGE")).toBe(true);
  });

  it("every deterministic challenge has every required field populated and a non-generic statement", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const challenges = buildDeterministicChallenges(output.engineResult!);
    for (const c of challenges) {
      expect(c.id.length).toBeGreaterThan(0);
      expect(c.statement.length).toBeGreaterThan(10);
      expect(["low", "medium", "high"]).toContain(c.severity);
      expect(c.source).toBe("deterministic");
      expect(Array.isArray(c.evidenceReferences)).toBe(true);
    }
  });

  it("is deterministic for identical input", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const a = buildDeterministicChallenges(output.engineResult!);
    const b = buildDeterministicChallenges(output.engineResult!);
    expect(a).toEqual(b);
  });
});
