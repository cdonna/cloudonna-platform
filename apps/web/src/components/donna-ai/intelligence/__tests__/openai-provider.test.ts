import { describe, expect, it } from "vitest";
import { APIConnectionTimeoutError, APIError, RateLimitError } from "openai";
import { classifyOpenAIError } from "../providers/openai-provider";
import { selectIntelligenceProvider } from "../select-provider";

describe("classifyOpenAIError", () => {
  it("classifies a RateLimitError as rate_limited", () => {
    const err = new RateLimitError(429, {}, "Rate limited", new Headers());
    expect(classifyOpenAIError(err)).toEqual({ code: "rate_limited", message: expect.any(String) });
  });

  it("classifies an APIConnectionTimeoutError as timeout", () => {
    const err = new APIConnectionTimeoutError({ message: "Request timed out." });
    expect(classifyOpenAIError(err).code).toBe("timeout");
  });

  it("classifies a generic APIError (e.g. 500) as network_error", () => {
    const err = new APIError(500, {}, "Internal server error", undefined);
    expect(classifyOpenAIError(err).code).toBe("network_error");
  });

  it("classifies an AbortError as timeout", () => {
    const err = new Error("The operation was aborted.");
    err.name = "AbortError";
    expect(classifyOpenAIError(err).code).toBe("timeout");
  });

  it("classifies an unrecognized error as unknown, never leaking its message", () => {
    const err = new Error("some internal detail: connection string abc123");
    const classified = classifyOpenAIError(err);
    expect(classified.code).toBe("unknown");
    expect(classified.message).not.toContain("abc123");
  });

  it("never includes the raw SDK error message in the classified output", () => {
    const err = new APIError(401, { message: "Incorrect API key provided: sk-abc123" }, undefined, undefined);
    const classified = classifyOpenAIError(err);
    expect(classified.message).not.toContain("sk-abc123");
  });
});

describe("createOpenAIIntelligenceProvider (via selectIntelligenceProvider)", () => {
  it("is constructed without making a network call — safe to build even with a fake key", () => {
    // Construction alone must never throw or attempt a connection; only
    // calling .enrich() would reach the network, and no test here does that.
    expect(() =>
      selectIntelligenceProvider({
        provider: "openai",
        apiKey: "sk-test-not-a-real-key",
        model: "gpt-test-model",
        timeoutMs: 100,
        maxOutputTokens: 100,
        maxRetries: 0,
      }),
    ).not.toThrow();
  });
});
