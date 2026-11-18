import { describe, expect, it } from "vitest";
import { computeDecisionReadiness, type DecisionReadinessInput } from "../decision-readiness";

const BASE: DecisionReadinessInput = {
  confidenceLevel: "HIGH",
  evidenceDiagnostics: { coverage: 1, missingCriticalEvidence: [], assumptionRatio: 0, sourceDiversity: 3, freshnessWarnings: [] },
  constraints: [{ id: "c1", label: "Preferred cloud", status: "PASS", explanation: "ok" }],
  challenges: [],
  businessCase: { scenario: "base", horizonYears: 3, discountRatePercent: 8, options: [] },
  optionCount: 3,
  scenarioRobust: true,
  openResearchConflictCount: 0,
  stakeholderAlignmentCounts: { aligned: 2 },
  hasEconomicBuyerAligned: true,
};

describe("computeDecisionReadiness", () => {
  it("reaches HIGH only when every dimension is complete and there are no blockers", () => {
    const result = computeDecisionReadiness(BASE);
    expect(result.level).toBe("HIGH");
    expect(result.blockers).toEqual([]);
  });

  it("drops to LOW on a violated hard constraint, regardless of everything else being complete", () => {
    const result = computeDecisionReadiness({ ...BASE, constraints: [{ id: "c1", label: "Data residency", status: "FAIL", explanation: "fails" }] });
    expect(result.level).toBe("LOW");
    expect(result.blockers.some((b) => b.code === "hard_constraint_violated")).toBe(true);
  });

  it("drops to LOW when an open research conflict exists", () => {
    const result = computeDecisionReadiness({ ...BASE, openResearchConflictCount: 1 });
    expect(result.level).toBe("LOW");
    expect(result.blockers.some((b) => b.code === "evidence_conflict_unresolved")).toBe(true);
  });

  it("flags critical evidence missing only below the 50% coverage threshold", () => {
    const result = computeDecisionReadiness({
      ...BASE,
      evidenceDiagnostics: { coverage: 0.3, missingCriticalEvidence: ["Architecture"], assumptionRatio: 0.5, sourceDiversity: 1, freshnessWarnings: [] },
    });
    expect(result.blockers.some((b) => b.code === "critical_evidence_missing")).toBe(true);
    expect(result.level).toBe("LOW");
  });

  it("never fabricates completeness for a decision with no business case", () => {
    const result = computeDecisionReadiness({ ...BASE, businessCase: null });
    const economicDimension = result.dimensions.find((d) => d.key === "economic_model")!;
    expect(economicDimension.status).toBe("missing");
    expect(result.blockers.some((b) => b.code === "business_case_incomplete")).toBe(true);
  });

  it("flags unresolved stakeholders distinctly from having no stakeholders at all", () => {
    const noStakeholders = computeDecisionReadiness({ ...BASE, stakeholderAlignmentCounts: {} });
    expect(noStakeholders.dimensions.find((d) => d.key === "stakeholder_alignment")!.status).toBe("missing");

    const unresolvedStakeholders = computeDecisionReadiness({ ...BASE, stakeholderAlignmentCounts: { aligned: 1, not_reviewed: 1 } });
    expect(unresolvedStakeholders.dimensions.find((d) => d.key === "stakeholder_alignment")!.status).toBe("partial");
  });

  it("flags a high-severity open challenge as a critical blocker", () => {
    const result = computeDecisionReadiness({
      ...BASE,
      challenges: [
        { id: "ch1", type: "FINANCIAL_CHALLENGE", target: "recommendation", statement: "x", severity: "high", evidenceReferences: [], affectedOption: null, affectedCriterion: null, suggestedValidation: "y", status: "open", source: "deterministic" },
      ],
    });
    expect(result.blockers.some((b) => b.code === "challenger_unresolved")).toBe(true);
    expect(result.level).toBe("LOW");
  });
});
