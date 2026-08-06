import { afterEach, describe, expect, it, vi } from "vitest";
import { loadIntelligenceConfig } from "../config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("loadIntelligenceConfig", () => {
  it("defaults to the deterministic-only provider when no API key is set", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const config = loadIntelligenceConfig();
    expect(config.provider).toBe("none");
    expect(config.apiKey).toBeUndefined();
  });

  it("selects openai when an API key is present", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-not-a-real-key");
    const config = loadIntelligenceConfig();
    expect(config.provider).toBe("openai");
    expect(config.apiKey).toBe("sk-test-not-a-real-key");
  });

  it("falls back to a sensible default model when DONNA_AI_MODEL is unset", () => {
    vi.stubEnv("DONNA_AI_MODEL", "");
    const config = loadIntelligenceConfig();
    expect(config.model.length).toBeGreaterThan(0);
  });

  it("respects an explicit DONNA_AI_MODEL", () => {
    vi.stubEnv("DONNA_AI_MODEL", "gpt-test-model");
    const config = loadIntelligenceConfig();
    expect(config.model).toBe("gpt-test-model");
  });

  it("falls back to defaults for malformed numeric env vars rather than producing NaN", () => {
    vi.stubEnv("DONNA_AI_TIMEOUT_MS", "not-a-number");
    const config = loadIntelligenceConfig();
    expect(Number.isFinite(config.timeoutMs)).toBe(true);
    expect(config.timeoutMs).toBeGreaterThan(0);
  });

  it("never reads process.env more than what it declares — no secret named elsewhere leaks in", () => {
    vi.stubEnv("SOME_UNRELATED_SECRET", "should-never-appear");
    const config = loadIntelligenceConfig();
    expect(JSON.stringify(config)).not.toContain("should-never-appear");
  });
});
