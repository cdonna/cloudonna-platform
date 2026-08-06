import { describe, expect, it } from "vitest";
import { EMPTY_WIZARD_STATE, SAMPLE_PROFILE } from "../../data";
import { buildDecisionOutput } from "../../engine";
import { deterministicKnowledgeProvider, type KnowledgeProvider } from "../knowledge-provider";
import { createRecommendationOrchestrator, DEFAULT_ORCHESTRATOR_CONFIG } from "../orchestrator";
import type { IntelligenceProvider } from "../provider";
import type { RateLimiter } from "../rate-limit";
import type { AuditEvent } from "../audit";
import type { DecisionInput, EvidencePackage, IntelligenceEnrichment, IntelligenceResult } from "../types";

function validEnrichment(evidence: EvidencePackage): IntelligenceEnrichment {
  return {
    currentSituation: "Situation.",
    businessOutcomes: "Outcomes.",
    decisionDrivers: ["Driver"],
    recommendationNarrative: "Recommendation.",
    alternativeNarrative: "Alternative.",
    keyTradeOffs: [],
    risksNarrative: "Risks.",
    opportunitiesNarrative: "Opportunities.",
    assumptionsNarrative: "Assumptions.",
    missingInformation: [],
    validationQuestions: [],
    challengeQuestions: [],
    suggestedNextStepsNarrative: "Next steps.",
    suggestedWorkshopsNarrative: "Workshops.",
    executiveSummary: "Summary.",
    confidenceExplanation: "Explanation.",
    evidenceReferences: evidence.shortlist.map((p) => p.id),
    disclosure: "Test-provided enrichment.",
  };
}

function fakeProvider(
  id: string,
  handler: (evidence: EvidencePackage) => Promise<IntelligenceResult>,
  model: string | null = null,
): IntelligenceProvider {
  return { id, model, enrich: (request) => handler(request.evidence) };
}

const SAMPLE_INPUT: DecisionInput = { wizardState: SAMPLE_PROFILE };

describe("RecommendationOrchestrator.createDecision", () => {
  it("produces a complete, valid decision using only the deterministic provider (default config)", async () => {
    const orchestrator = createRecommendationOrchestrator(DEFAULT_ORCHESTRATOR_CONFIG);
    const report = await orchestrator.createDecision(SAMPLE_INPUT);

    expect(report.fallback.status).toBe("ok");
    expect(report.enrichment).not.toBeNull();
    expect(report.output.recommendation).toBeDefined();
    expect(report.generatedAt).toBeTruthy();
  });

  it("works with no optional DecisionInput context provided at all", async () => {
    const orchestrator = createRecommendationOrchestrator(DEFAULT_ORCHESTRATOR_CONFIG);
    const minimalInput: DecisionInput = { wizardState: SAMPLE_PROFILE };
    const report = await orchestrator.createDecision(minimalInput);

    expect(report.fallback.status).toBe("ok");
  });

  it("falls back cleanly when the provider reports itself disabled (no API key)", async () => {
    const provider = fakeProvider("disabled-test", async () => ({ status: "disabled", reason: "no key" }));
    const orchestrator = createRecommendationOrchestrator({ ...DEFAULT_ORCHESTRATOR_CONFIG, intelligenceProvider: provider });
    const report = await orchestrator.createDecision(SAMPLE_INPUT);

    expect(report.fallback.status).toBe("disabled");
    expect(report.enrichment).toBeNull();
    expect(report.fallback.reason).toBeTruthy();
    expect(report.output.recommendation).toBeDefined();
  });

  it("falls back cleanly when the provider throws", async () => {
    const provider: IntelligenceProvider = {
      id: "throwing-test",
      model: null,
      enrich: async () => {
        throw new Error("network exploded");
      },
    };
    const orchestrator = createRecommendationOrchestrator({ ...DEFAULT_ORCHESTRATOR_CONFIG, intelligenceProvider: provider });
    const report = await orchestrator.createDecision(SAMPLE_INPUT);

    expect(report.fallback.status).toBe("unavailable");
    expect(report.enrichment).toBeNull();
    // the raw error message must never leak into the report
    expect(JSON.stringify(report)).not.toContain("network exploded");
  });

  it("falls back cleanly when the provider times out", async () => {
    const provider: IntelligenceProvider = {
      id: "slow-test",
      model: null,
      enrich: () => new Promise((resolve) => setTimeout(() => resolve({ status: "ok", enrichment: validEnrichment({ shortlist: [] } as unknown as EvidencePackage) }), 200)),
    };
    const orchestrator = createRecommendationOrchestrator({
      ...DEFAULT_ORCHESTRATOR_CONFIG,
      intelligenceProvider: provider,
      enrichmentTimeoutMs: 20,
    });
    const report = await orchestrator.createDecision(SAMPLE_INPUT);

    expect(report.fallback.status).toBe("timeout");
    expect(report.enrichment).toBeNull();
  });

  it("rejects malformed enrichment (missing required field) and falls back", async () => {
    const provider = fakeProvider("malformed-test", async (evidence) => {
      const enrichment = validEnrichment(evidence) as unknown as Record<string, unknown>;
      delete enrichment.disclosure;
      return { status: "ok", enrichment: enrichment as unknown as IntelligenceEnrichment };
    });
    const orchestrator = createRecommendationOrchestrator({ ...DEFAULT_ORCHESTRATOR_CONFIG, intelligenceProvider: provider });
    const report = await orchestrator.createDecision(SAMPLE_INPUT);

    expect(report.fallback.status).toBe("invalid_output");
    expect(report.enrichment).toBeNull();
  });

  it("rejects an attempted score override disguised as narrative text", async () => {
    const provider = fakeProvider("score-override-test", async (evidence) => ({
      status: "ok",
      enrichment: {
        ...validEnrichment(evidence),
        recommendationNarrative: "This platform actually scores 99% once you account for hidden factors.",
      },
    }));
    const orchestrator = createRecommendationOrchestrator({ ...DEFAULT_ORCHESTRATOR_CONFIG, intelligenceProvider: provider });
    const report = await orchestrator.createDecision(SAMPLE_INPUT);

    expect(report.fallback.status).toBe("invalid_output");
    expect(report.enrichment).toBeNull();
  });

  it("falls back cleanly when the provider itself reports a rate limit", async () => {
    const provider = fakeProvider("rate-limited-response-test", async () => ({
      status: "rate_limited",
      reason: "429 from provider",
    }));
    const orchestrator = createRecommendationOrchestrator({ ...DEFAULT_ORCHESTRATOR_CONFIG, intelligenceProvider: provider });
    const report = await orchestrator.createDecision(SAMPLE_INPUT);

    expect(report.fallback.status).toBe("rate_limited");
    expect(report.enrichment).toBeNull();
  });

  it("rejects a fabricated vendor claim — a real catalog product not in this session's shortlist", async () => {
    const provider = fakeProvider("fabricated-vendor-test", async (evidence) => ({
      status: "ok",
      enrichment: {
        ...validEnrichment(evidence),
        // A real Sprint 3 catalog product name, deliberately not in the shortlist.
        recommendationNarrative: "This is actually a weaker fit than Databricks Lakehouse Platform would be.",
      },
    }));
    const orchestrator = createRecommendationOrchestrator({ ...DEFAULT_ORCHESTRATOR_CONFIG, intelligenceProvider: provider });
    const report = await orchestrator.createDecision(SAMPLE_INPUT);

    // Only assert rejection if that product genuinely isn't in this
    // session's shortlist — guards the test against a future catalog
    // change that happens to shortlist Databricks for SAMPLE_PROFILE.
    const shortlistNames = new Set([report.output.recommendation.platform.productName, ...report.output.alternatives.map((a) => a.platform.productName)]);
    if (!shortlistNames.has("Databricks Lakehouse Platform")) {
      expect(report.fallback.status).toBe("invalid_output");
      expect(report.enrichment).toBeNull();
    }
  });

  it("rejects evidence references pointing outside the shortlist", async () => {
    const provider = fakeProvider("bad-reference-test", async (evidence) => ({
      status: "ok",
      enrichment: { ...validEnrichment(evidence), evidenceReferences: ["not-a-real-platform-id"] },
    }));
    const orchestrator = createRecommendationOrchestrator({ ...DEFAULT_ORCHESTRATOR_CONFIG, intelligenceProvider: provider });
    const report = await orchestrator.createDecision(SAMPLE_INPUT);

    expect(report.fallback.status).toBe("invalid_output");
  });

  it("falls back before even calling the provider when evidence is empty", async () => {
    let providerWasCalled = false;
    const provider = fakeProvider("should-not-be-called", async (evidence) => {
      providerWasCalled = true;
      return { status: "ok", enrichment: validEnrichment(evidence) };
    });
    const emptyKnowledgeProvider: KnowledgeProvider = {
      buildEvidencePackage: () => ({
        decisionContext: { goals: [], industry: null, companySize: null },
        shortlist: [],
        matchedCapabilities: [],
        candidateSolutionPatterns: [],
        candidateTechnologyPatterns: [],
        candidateArchitecturePatterns: [],
        sourceReferences: [],
        knownInformationGaps: [],
        deterministicRisks: [],
        deterministicOpportunities: [],
        deterministicAssumptions: [],
        deterministicNextSteps: [],
        deterministicWorkshops: [],
      }),
    };
    const orchestrator = createRecommendationOrchestrator({
      ...DEFAULT_ORCHESTRATOR_CONFIG,
      intelligenceProvider: provider,
      knowledgeProvider: emptyKnowledgeProvider,
    });
    const report = await orchestrator.createDecision(SAMPLE_INPUT);

    expect(report.fallback.status).toBe("invalid_output");
    expect(providerWasCalled).toBe(false);
  });

  it("produces a complete report for a low-confidence (empty) wizard state", async () => {
    const orchestrator = createRecommendationOrchestrator(DEFAULT_ORCHESTRATOR_CONFIG);
    const report = await orchestrator.createDecision({ wizardState: EMPTY_WIZARD_STATE });

    expect(report.output.confidenceScore).toBeLessThan(70);
    expect(report.fallback.status).toBe("ok");
  });

  it("rejects a pathologically long note at the input boundary", async () => {
    const orchestrator = createRecommendationOrchestrator(DEFAULT_ORCHESTRATOR_CONFIG);
    const state = { ...SAMPLE_PROFILE, company: { ...SAMPLE_PROFILE.company, note: "a".repeat(50_000) } };

    await expect(orchestrator.createDecision({ wizardState: state })).rejects.toThrow();
  });

  it("keeps the report shape identical whether enrichment succeeds or falls back", async () => {
    const ok = await createRecommendationOrchestrator(DEFAULT_ORCHESTRATOR_CONFIG).createDecision(SAMPLE_INPUT);
    const disabledProvider = fakeProvider("disabled-shape-test", async () => ({ status: "disabled", reason: "x" }));
    const fallback = await createRecommendationOrchestrator({
      ...DEFAULT_ORCHESTRATOR_CONFIG,
      intelligenceProvider: disabledProvider,
    }).createDecision(SAMPLE_INPUT);

    const okKeys = Object.keys(ok).sort();
    const fallbackKeys = Object.keys(fallback).sort();
    expect(okKeys).toEqual(fallbackKeys);
  });

  it("produces byte-for-byte identical authoritative output regardless of enrichment outcome", async () => {
    const ok = await createRecommendationOrchestrator(DEFAULT_ORCHESTRATOR_CONFIG).createDecision(SAMPLE_INPUT);
    const disabledProvider = fakeProvider("identical-output-test", async () => ({ status: "disabled", reason: "x" }));
    const fallback = await createRecommendationOrchestrator({
      ...DEFAULT_ORCHESTRATOR_CONFIG,
      intelligenceProvider: disabledProvider,
    }).createDecision(SAMPLE_INPUT);

    expect(fallback.output).toEqual(ok.output);
  });

  it("never mutates the deterministic output object it was given", async () => {
    const output = buildDecisionOutput(SAMPLE_PROFILE);
    const snapshot = JSON.parse(JSON.stringify(output));
    const evidence = deterministicKnowledgeProvider.buildEvidencePackage(SAMPLE_INPUT, output);

    // buildEvidencePackage must not have mutated the output it read from.
    expect(output).toEqual(snapshot);
    expect(evidence.shortlist.length).toBeGreaterThan(0);
  });

  it("is interchangeable across providers — two different providers produce reports satisfying the same contract", async () => {
    const providerA = fakeProvider("provider-a", async (evidence) => ({ status: "ok", enrichment: validEnrichment(evidence) }), "model-a");
    const providerB = fakeProvider("provider-b", async (evidence) => ({
      status: "ok",
      enrichment: { ...validEnrichment(evidence), disclosure: "A different provider's disclosure text." },
    }), "model-b");

    const reportA = await createRecommendationOrchestrator({ ...DEFAULT_ORCHESTRATOR_CONFIG, intelligenceProvider: providerA }).createDecision(SAMPLE_INPUT);
    const reportB = await createRecommendationOrchestrator({ ...DEFAULT_ORCHESTRATOR_CONFIG, intelligenceProvider: providerB }).createDecision(SAMPLE_INPUT);

    expect(reportA.fallback.status).toBe("ok");
    expect(reportB.fallback.status).toBe("ok");
    expect(reportA.provider).toEqual({ providerId: "provider-a", model: "model-a" });
    expect(reportB.provider).toEqual({ providerId: "provider-b", model: "model-b" });
    expect(reportA.output).toEqual(reportB.output);
  });

  it("throws and never calls the provider when the rate limiter rejects", async () => {
    let providerWasCalled = false;
    const provider = fakeProvider("rate-limited-provider-call-check", async (evidence) => {
      providerWasCalled = true;
      return { status: "ok", enrichment: validEnrichment(evidence) };
    });
    const rejectingLimiter: RateLimiter = {
      checkAndConsume: () => ({ allowed: false, reason: "Too many requests." }),
    };
    const orchestrator = createRecommendationOrchestrator({
      ...DEFAULT_ORCHESTRATOR_CONFIG,
      intelligenceProvider: provider,
      rateLimiter: rejectingLimiter,
    });

    await expect(orchestrator.createDecision(SAMPLE_INPUT)).rejects.toThrow("Too many requests.");
    expect(providerWasCalled).toBe(false);
  });

  it("emits an audit event with metadata only, never note content", async () => {
    const events: AuditEvent[] = [];
    const state = {
      ...SAMPLE_PROFILE,
      constraints: { ...SAMPLE_PROFILE.constraints, note: "a secret business detail that must not be logged" },
    };
    const orchestrator = createRecommendationOrchestrator({
      ...DEFAULT_ORCHESTRATOR_CONFIG,
      auditSink: (event) => events.push(event),
    });

    await orchestrator.createDecision({ wizardState: state });

    expect(events).toHaveLength(1);
    expect(events[0].enrichmentStatus).toBe("ok");
    expect(events[0].sanitizedNoteCount).toBeGreaterThan(0);
    expect(JSON.stringify(events[0])).not.toContain("secret business detail");
  });
});
