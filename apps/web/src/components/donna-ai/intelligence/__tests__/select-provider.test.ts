import { describe, expect, it } from "vitest";
import { loadIntelligenceConfig } from "../config";
import { selectIntelligenceProvider } from "../select-provider";
import { deterministicIntelligenceProvider } from "../providers/deterministic-provider";

describe("selectIntelligenceProvider", () => {
  it("returns the deterministic provider when no API key is configured", () => {
    const provider = selectIntelligenceProvider({ ...loadIntelligenceConfig(), provider: "none", apiKey: undefined });
    expect(provider).toBe(deterministicIntelligenceProvider);
    expect(provider.model).toBeNull();
  });

  it("returns an OpenAI-backed provider, distinct from the deterministic one, when a key is configured", () => {
    const provider = selectIntelligenceProvider({
      provider: "openai",
      apiKey: "sk-test-not-a-real-key",
      model: "gpt-test-model",
      timeoutMs: 8000,
      maxOutputTokens: 1600,
      maxRetries: 1,
    });

    expect(provider).not.toBe(deterministicIntelligenceProvider);
    expect(provider.id).toBe("openai-gpt-test-model");
    expect(provider.model).toBe("gpt-test-model");
  });

  it("falls back to deterministic even if provider says openai but no key is actually present (defensive)", () => {
    const provider = selectIntelligenceProvider({
      provider: "openai",
      apiKey: undefined,
      model: "gpt-test-model",
      timeoutMs: 8000,
      maxOutputTokens: 1600,
      maxRetries: 1,
    });

    expect(provider).toBe(deterministicIntelligenceProvider);
  });
});
