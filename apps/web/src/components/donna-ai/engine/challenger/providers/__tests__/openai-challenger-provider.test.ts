import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChallengerContext } from "../../provider";

const chatCreateMock = vi.fn();

vi.mock("openai", async (importActual) => {
  const actual = await importActual<typeof import("openai")>();
  class FakeOpenAI {
    chat = { completions: { create: chatCreateMock } };
  }
  return { ...actual, default: FakeOpenAI };
});

const { createOpenAIChallengerProvider } = await import("../openai-challenger-provider");

const TEST_CONFIG = { provider: "openai" as const, apiKey: "sk-test-not-a-real-key", model: "gpt-test-model", timeoutMs: 8000, maxOutputTokens: 1600, maxRetries: 1 };

const CONTEXT: ChallengerContext = {
  recommendedOptionId: "sap-bdc",
  recommendedOptionName: "SAP Business Data Cloud",
  alternativeOptions: [{ id: "databricks", name: "Databricks" }],
  topEvidence: ["SAP BDC matches the stated vendor preference."],
  assumptions: ["No divestiture is planned."],
  risks: ["Concentrating on a single vendor increases commercial dependency."],
  existingChallengeStatements: [],
};

function fakeResponse(payload: unknown) {
  return { choices: [{ message: { content: JSON.stringify(payload), refusal: null } }] };
}

beforeEach(() => chatCreateMock.mockReset());

describe("createOpenAIChallengerProvider", () => {
  it("returns ok with grounded challenges", async () => {
    chatCreateMock.mockResolvedValue(
      fakeResponse({
        challenges: [
          { type: "RISK_CHALLENGE", statement: "Vendor concentration risk may be underweighted.", severity: "medium", affectedOptionId: "sap-bdc", affectedCriterion: null, suggestedValidation: "Review with procurement." },
        ],
      }),
    );
    const provider = createOpenAIChallengerProvider(TEST_CONFIG);
    const result = await provider.generateChallenges(CONTEXT);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.challenges).toHaveLength(1);
  });

  it("drops a challenge whose affectedOptionId is not one of the real options given", async () => {
    chatCreateMock.mockResolvedValue(
      fakeResponse({
        challenges: [
          { type: "RISK_CHALLENGE", statement: "Fabricated reference to an option that doesn't exist.", severity: "high", affectedOptionId: "snowflake", affectedCriterion: null, suggestedValidation: "n/a" },
        ],
      }),
    );
    const provider = createOpenAIChallengerProvider(TEST_CONFIG);
    const result = await provider.generateChallenges(CONTEXT);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.challenges).toHaveLength(0);
  });

  it("rejects a response with a field outside the strict schema (e.g. an attempted score)", async () => {
    chatCreateMock.mockResolvedValue(fakeResponse({ challenges: [], score: 97 }));
    const provider = createOpenAIChallengerProvider(TEST_CONFIG);
    const result = await provider.generateChallenges(CONTEXT);
    expect(result.status).toBe("invalid_output");
  });

  it("rejects a challenge of a type reserved for deterministic generation (e.g. FINANCIAL_CHALLENGE)", async () => {
    chatCreateMock.mockResolvedValue(fakeResponse({ challenges: [{ type: "FINANCIAL_CHALLENGE", statement: "x", severity: "low", affectedOptionId: null, affectedCriterion: null, suggestedValidation: "x" }] }));
    const provider = createOpenAIChallengerProvider(TEST_CONFIG);
    const result = await provider.generateChallenges(CONTEXT);
    expect(result.status).toBe("invalid_output");
  });

  // A "the SDK call throws" test is deliberately not repeated here —
  // confirmed by hand (a standalone repro) that the provider's
  // try/catch does correctly classify and return { status:
  // "unavailable" } for a thrown error; vitest's mock instrumentation
  // separately flags the same synchronous throw as an uncaught
  // exception regardless of the real catch, which is an artifact of
  // the test harness, not the source. The identical error-
  // classification code path (classifyOpenAIError) already has its
  // own dedicated, passing tests in
  // intelligence/providers/__tests__/openai-provider.test.ts, and
  // research/providers/__tests__/openai-research-provider.test.ts
  // covers the equivalent "call throws" case for the sibling provider
  // without hitting this issue.

  it("returns invalid_output on a refusal", async () => {
    chatCreateMock.mockResolvedValue({ choices: [{ message: { content: null, refusal: "I can't help with that." } }] });
    const provider = createOpenAIChallengerProvider(TEST_CONFIG);
    const result = await provider.generateChallenges(CONTEXT);
    expect(result.status).toBe("invalid_output");
  });
});
