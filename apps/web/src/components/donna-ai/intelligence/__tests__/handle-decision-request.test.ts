import { afterEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_PROFILE } from "../../data";
import { handleDecisionRequest } from "../handle-decision-request";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("handleDecisionRequest", () => {
  it("rejects a body with no wizardState field", async () => {
    const result = await handleDecisionRequest({ notWizardState: true }, "test-client");
    expect(result.status).toBe(400);
    expect(result.body).toHaveProperty("error");
  });

  it("rejects a non-object body", async () => {
    const result = await handleDecisionRequest("just a string", "test-client");
    expect(result.status).toBe(400);
  });

  it("produces a 200 with a complete DecisionReport for a valid wizard state, deterministic-only (no key configured)", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const result = await handleDecisionRequest({ wizardState: SAMPLE_PROFILE }, "test-client-1");

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("report");
    if ("report" in result.body) {
      expect(result.body.report.output.recommendation).toBeDefined();
      expect(result.body.report.fallback.status).toBe("ok"); // deterministic provider always succeeds
      expect(result.body.report.provider.model).toBeNull();
    }
  });

  it("never lets a malformed input crash the handler — returns a safe 400 instead", async () => {
    const result = await handleDecisionRequest({ wizardState: { company: { note: "a".repeat(50_000) } } }, "test-client-2");
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error: "The request could not be processed." });
  });

  it("error responses never contain internal validation details", async () => {
    const result = await handleDecisionRequest({ wizardState: { company: { note: "a".repeat(50_000) } } }, "test-client-3");
    expect(JSON.stringify(result.body)).not.toMatch(/zod|schema|stack/i);
  });

  it("rate-limits a client that exceeds the configured window, without ever affecting a different client", async () => {
    const key = `rate-limit-test-${Date.now()}`;
    let lastResult;
    for (let i = 0; i < 25; i++) {
      lastResult = await handleDecisionRequest({ wizardState: SAMPLE_PROFILE }, key);
    }
    expect(lastResult?.status).toBe(429);

    const otherClientResult = await handleDecisionRequest({ wizardState: SAMPLE_PROFILE }, `different-client-${Date.now()}`);
    expect(otherClientResult.status).toBe(200);
  });
});
