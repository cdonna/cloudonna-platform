/**
 * Mocked-provider integration tests: exercise createOpenAIIntelligenceProvider
 * end to end with a fake OpenAI client — no network access, no API key
 * required. Complements openai-provider.test.ts (which tests error
 * classification in isolation) by testing the full enrich() path,
 * including the manual JSON.parse + schema validation this provider does
 * instead of relying on the SDK's own auto-parse. See
 * docs/intelligence/testing-strategy.md, "Mocked provider tests".
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_PROFILE } from "../../data";
import { buildDecisionOutput } from "../../engine";
import { deterministicKnowledgeProvider } from "../knowledge-provider";
import { createOpenAIIntelligenceProvider } from "../providers/openai-provider";
import type { DecisionInput, IntelligenceRequest } from "../types";

const createMock = vi.fn();

// vi.mock calls are hoisted above imports by Vitest's transform, so this
// takes effect before providers/openai-provider.ts's own `import OpenAI
// from "openai"` resolves, even though it's written after the static
// import above.
vi.mock("openai", async (importActual) => {
  const actual = await importActual<typeof import("openai")>();
  class FakeOpenAI {
    chat = { completions: { create: createMock } };
  }
  return { ...actual, default: FakeOpenAI };
});

function buildRequest(): IntelligenceRequest {
  const output = buildDecisionOutput(SAMPLE_PROFILE);
  const input: DecisionInput = { wizardState: SAMPLE_PROFILE };
  const evidence = deterministicKnowledgeProvider.buildEvidencePackage(input, output);
  return { evidence, sanitizedNotes: [] };
}

const TEST_CONFIG = {
  provider: "openai" as const,
  apiKey: "sk-test-not-a-real-key",
  model: "gpt-test-model",
  timeoutMs: 8000,
  maxOutputTokens: 1600,
  maxRetries: 1,
};

beforeEach(() => {
  createMock.mockReset();
});

describe("createOpenAIIntelligenceProvider — mocked successful response", () => {
  it("parses a valid structured JSON response into status ok", async () => {
    const request = buildRequest();
    const validPayload = {
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
      evidenceReferences: request.evidence.shortlist.map((p) => p.id),
      disclosure: "AI-generated narrative.",
    };
    createMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validPayload), refusal: null } }],
    });

    const provider = createOpenAIIntelligenceProvider(TEST_CONFIG);
    const result = await provider.enrich(request);

    expect(result.status).toBe("ok");
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});

describe("createOpenAIIntelligenceProvider — mocked invalid responses", () => {
  it("returns invalid_output for malformed (non-JSON) content", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: "not valid json{{{", refusal: null } }],
    });

    const provider = createOpenAIIntelligenceProvider(TEST_CONFIG);
    const result = await provider.enrich(buildRequest());

    expect(result.status).toBe("invalid_output");
  });

  it("returns invalid_output when the model refuses", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: null, refusal: "I cannot help with that." } }],
    });

    const provider = createOpenAIIntelligenceProvider(TEST_CONFIG);
    const result = await provider.enrich(buildRequest());

    expect(result.status).toBe("invalid_output");
    expect(JSON.stringify(result)).not.toContain("I cannot help with that");
  });

  it("returns invalid_output when content is valid JSON but fails schema validation", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ onlyOneField: "not a full enrichment" }), refusal: null } }],
    });

    const provider = createOpenAIIntelligenceProvider(TEST_CONFIG);
    const result = await provider.enrich(buildRequest());

    expect(result.status).toBe("invalid_output");
  });

  it("returns invalid_output when there are no choices at all", async () => {
    createMock.mockResolvedValue({ choices: [] });

    const provider = createOpenAIIntelligenceProvider(TEST_CONFIG);
    const result = await provider.enrich(buildRequest());

    expect(result.status).toBe("invalid_output");
  });

  it("classifies a thrown network error as unavailable, without the raw message", async () => {
    createMock.mockRejectedValue(new Error("ECONNREFUSED at 10.0.0.1:443"));

    const provider = createOpenAIIntelligenceProvider(TEST_CONFIG);
    const result = await provider.enrich(buildRequest());

    expect(result.status).toBe("unavailable");
    expect(JSON.stringify(result)).not.toContain("10.0.0.1");
  });
});
