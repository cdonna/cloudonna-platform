import { describe, expect, it } from "vitest";
import { EMPTY_WIZARD_STATE, SAMPLE_PROFILE } from "../../data";
import { buildDecisionOutput } from "../../engine";
import { deterministicKnowledgeProvider } from "../knowledge-provider";
import type { DecisionInput } from "../types";

describe("deterministicKnowledgeProvider.buildEvidencePackage", () => {
  it("shortlists at most three platforms, never the full catalog", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const input: DecisionInput = { wizardState: SAMPLE_PROFILE };
    const evidence = deterministicKnowledgeProvider.buildEvidencePackage(input, output);

    expect(evidence.shortlist.length).toBeLessThanOrEqual(3);
    expect(evidence.shortlist.length).toBeGreaterThan(0);
    expect(evidence.shortlist[0].id).toBe(output.recommendation.platform.id);
  });

  it("copies deterministic risks/opportunities/assumptions verbatim, never inventing new ones", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const input: DecisionInput = { wizardState: SAMPLE_PROFILE };
    const evidence = deterministicKnowledgeProvider.buildEvidencePackage(input, output);

    expect(evidence.deterministicRisks).toEqual(output.risks.map((r) => r.text));
    expect(evidence.deterministicOpportunities).toEqual(output.opportunities.map((o) => o.text));
    expect(evidence.deterministicAssumptions).toEqual(output.assumptions.map((a) => a.text));
  });

  it("leaves candidateArchitecturePatterns empty — not yet backed by real data", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const input: DecisionInput = { wizardState: SAMPLE_PROFILE };
    const evidence = deterministicKnowledgeProvider.buildEvidencePackage(input, output);

    expect(evidence.candidateArchitecturePatterns).toEqual([]);
  });

  it("handles a low-signal (empty) wizard state without throwing", () => {
    const output = buildDecisionOutput(EMPTY_WIZARD_STATE);
    const input: DecisionInput = { wizardState: EMPTY_WIZARD_STATE };
    const evidence = deterministicKnowledgeProvider.buildEvidencePackage(input, output);

    expect(evidence.shortlist.length).toBeGreaterThan(0);
    expect(evidence.decisionContext.goals).toEqual([]);
  });

  it("every dimension score in the evidence package matches the deterministic output exactly", () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const input: DecisionInput = { wizardState: SAMPLE_PROFILE };
    const evidence = deterministicKnowledgeProvider.buildEvidencePackage(input, output);

    const primaryEvidence = evidence.shortlist[0];
    for (const dim of output.recommendation.dimensions) {
      const match = primaryEvidence.dimensionScores.find((d) => d.key === dim.key);
      expect(match?.score).toBe(dim.score);
      expect(match?.weight).toBe(dim.weight);
    }
  });
});
