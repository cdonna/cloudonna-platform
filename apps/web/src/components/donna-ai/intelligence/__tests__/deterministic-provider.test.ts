import { describe, expect, it } from "vitest";
import { SAMPLE_PROFILE } from "../../data";
import { buildDecisionOutput } from "../../engine";
import { deterministicKnowledgeProvider } from "../knowledge-provider";
import { deterministicIntelligenceProvider } from "../providers/deterministic-provider";
import { intelligenceEnrichmentSchema } from "../schema";
import { sanitizeNotes } from "../sanitize";
import type { DecisionInput, EvidencePackage, IntelligenceRequest } from "../types";

function buildRequest(): { evidence: EvidencePackage; request: IntelligenceRequest } {
  const output = buildDecisionOutput(SAMPLE_PROFILE);
  const input: DecisionInput = { wizardState: SAMPLE_PROFILE };
  const evidence = deterministicKnowledgeProvider.buildEvidencePackage(input, output);
  const request: IntelligenceRequest = {
    evidence,
    sanitizedNotes: sanitizeNotes([SAMPLE_PROFILE.company.note, SAMPLE_PROFILE.goals.note]),
  };
  return { evidence, request };
}

describe("deterministicIntelligenceProvider", () => {
  it("has a stable, descriptive id", () => {
    expect(deterministicIntelligenceProvider.id).toBe("deterministic-v1");
  });

  it("returns status ok with an enrichment that passes schema validation", async () => {
    const { request } = buildRequest();
    const result = await deterministicIntelligenceProvider.enrich(request);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      const check = intelligenceEnrichmentSchema.safeParse(result.enrichment);
      expect(check.success).toBe(true);
    }
  });

  it("references only platform ids present in the evidence package", async () => {
    const { evidence, request } = buildRequest();
    const result = await deterministicIntelligenceProvider.enrich(request);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      const knownIds = new Set(evidence.shortlist.map((p) => p.id));
      for (const ref of result.enrichment.evidenceReferences) {
        expect(knownIds.has(ref)).toBe(true);
      }
    }
  });

  it("always includes a non-empty disclosure describing its own method", async () => {
    const { request } = buildRequest();
    const result = await deterministicIntelligenceProvider.enrich(request);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.enrichment.disclosure.length).toBeGreaterThan(0);
      expect(result.enrichment.disclosure.toLowerCase()).toContain("deterministic");
    }
  });

  it("returns invalid_output for an empty evidence package rather than throwing", async () => {
    const { request } = buildRequest();
    const emptyRequest: IntelligenceRequest = { ...request, evidence: { ...request.evidence, shortlist: [] } };
    const result = await deterministicIntelligenceProvider.enrich(emptyRequest);

    expect(result.status).toBe("invalid_output");
  });

  it("produces different narrative text for a different evidence package (not a fixed stub)", async () => {
    const { request } = buildRequest();
    const result1 = await deterministicIntelligenceProvider.enrich(request);

    const altered: IntelligenceRequest = {
      ...request,
      evidence: {
        ...request.evidence,
        decisionContext: { ...request.evidence.decisionContext, goals: ["Cost Reduction"] },
      },
    };
    const result2 = await deterministicIntelligenceProvider.enrich(altered);

    expect(result1.status).toBe("ok");
    expect(result2.status).toBe("ok");
    if (result1.status === "ok" && result2.status === "ok") {
      expect(result1.enrichment.businessOutcomes).not.toBe(result2.enrichment.businessOutcomes);
    }
  });
});
