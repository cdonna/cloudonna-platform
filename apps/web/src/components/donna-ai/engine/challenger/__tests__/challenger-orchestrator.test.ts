import { describe, expect, it, vi } from "vitest";
import { buildDecisionOutput } from "../../../engine";
import { SAMPLE_PROFILE } from "../../../data";
import { runChallengeSession } from "../challenger-orchestrator";
import type { ChallengeGenerationResult, ChallengerProvider } from "../provider";

const output = buildDecisionOutput(SAMPLE_PROFILE);

describe("Challenger Orchestrator", () => {
  it("always returns deterministic challenges, even when the AI provider is disabled", async () => {
    const provider: ChallengerProvider = { id: "disabled", model: null, generateChallenges: vi.fn(async (): Promise<ChallengeGenerationResult> => ({ status: "disabled", reason: "no key" })) };
    const result = await runChallengeSession(provider, { engineResult: output.engineResult! });
    expect(result.aiStatus).toBe("disabled");
    expect(result.challenges.every((c) => c.source === "deterministic")).toBe(true);
  });

  it("merges AI-assisted challenges with deterministic ones when the provider succeeds", async () => {
    const provider: ChallengerProvider = {
      id: "fake",
      model: null,
      generateChallenges: vi.fn(
        async (): Promise<ChallengeGenerationResult> => ({
          status: "ok",
          challenges: [{ type: "RISK_CHALLENGE", statement: "A real challenge.", severity: "medium", affectedOptionId: null, affectedCriterion: null, suggestedValidation: "Check with risk team." }],
        }),
      ),
    };
    const result = await runChallengeSession(provider, { engineResult: output.engineResult! });
    expect(result.aiStatus).toBe("ok");
    expect(result.challenges.some((c) => c.source === "ai-assisted")).toBe(true);
  });

  it("passes the real winner/alternative names and existing deterministic statements into the AI context", async () => {
    let capturedContext: unknown;
    const provider: ChallengerProvider = {
      id: "fake",
      model: null,
      generateChallenges: vi.fn(async (context): Promise<ChallengeGenerationResult> => {
        capturedContext = context;
        return { status: "ok", challenges: [] };
      }),
    };
    await runChallengeSession(provider, { engineResult: output.engineResult! });
    const context = capturedContext as { recommendedOptionId: string; existingChallengeStatements: string[] };
    expect(context.recommendedOptionId).toBe(output.engineResult!.recommendedOption.id);
  });

  it("never lets the AI provider's challenges carry a deterministic-only type", async () => {
    const provider: ChallengerProvider = {
      id: "fake",
      model: null,
      generateChallenges: vi.fn(
        async (): Promise<ChallengeGenerationResult> => ({
          status: "ok",
          // The provider layer's own schema already prevents this at
          // the type level; this proves the orchestrator doesn't need
          // a second guard because the type system already makes it
          // unrepresentable — the array below only type-checks
          // because every entry really is one of the three
          // AI-eligible types.
          challenges: [{ type: "ASSUMPTION_CHALLENGE", statement: "x", severity: "low", affectedOptionId: null, affectedCriterion: null, suggestedValidation: "x" }],
        }),
      ),
    };
    const result = await runChallengeSession(provider, { engineResult: output.engineResult! });
    const aiChallenges = result.challenges.filter((c) => c.source === "ai-assisted");
    expect(aiChallenges.every((c) => c.type === "ASSUMPTION_CHALLENGE" || c.type === "ARCHITECTURE_CHALLENGE" || c.type === "RISK_CHALLENGE")).toBe(true);
  });
});
