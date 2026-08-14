import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_PROFILE, EMPTY_WIZARD_STATE } from "../data";
import { requestDecision } from "../request-decision";
import type { DecisionReport } from "../intelligence/types";

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

function fakeReport(): DecisionReport {
  return {
    output: {} as DecisionReport["output"],
    enrichment: null,
    provider: { providerId: "openai", model: "gpt-test" },
    fallback: { status: "ok", reason: null },
    generatedAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("requestDecision", () => {
  it("returns the real server report on a successful, immediate response", async () => {
    const report = fakeReport();
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ report }));

    const result = await requestDecision(SAMPLE_PROFILE, { fetchImpl });
    expect(result).toEqual({ ok: true, report });
  });

  it("returns the real server report on a slow response that still resolves before the timeout", async () => {
    const report = fakeReport();
    const fetchImpl = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(jsonResponse({ report })), 8000)),
    );

    const promise = requestDecision(SAMPLE_PROFILE, { fetchImpl, timeoutMs: 12_000 });
    await vi.advanceTimersByTimeAsync(8000);
    const result = await promise;
    expect(result).toEqual({ ok: true, report });
  });

  it("falls back to a real, deterministic local report when the network request fails", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await requestDecision(SAMPLE_PROFILE, { fetchImpl });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.report.fallback.status).toBe("unavailable");
      expect(result.report.output.recommendation).toBeDefined();
    }
  });

  it("falls back to a real, deterministic local report when the server responds with an error status", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: "rate limited" }, false));

    const result = await requestDecision(SAMPLE_PROFILE, { fetchImpl });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.report.fallback.status).toBe("unavailable");
  });

  it("times out a request that never settles, and still returns a real local fallback rather than hanging forever", async () => {
    const fetchImpl = vi.fn().mockImplementation(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }),
    );

    const promise = requestDecision(SAMPLE_PROFILE, { fetchImpl, timeoutMs: 12_000 });
    await vi.advanceTimersByTimeAsync(12_000);
    const result = await promise;

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.report.fallback.status).toBe("unavailable");
  });

  it("does not resolve before the timeout elapses for a hanging request", async () => {
    const fetchImpl = vi.fn().mockImplementation(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }),
    );

    let settled = false;
    const promise = requestDecision(SAMPLE_PROFILE, { fetchImpl, timeoutMs: 12_000 }).then((r) => {
      settled = true;
      return r;
    });

    await vi.advanceTimersByTimeAsync(11_000);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1_000);
    await promise;
    expect(settled).toBe(true);
  });

  it("surfaces a real, sanitized failure — not an infinite wait — when even the local fallback cannot compute a result", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    // A WizardState missing required company/landscape data still
    // produces *some* DecisionOutput today (the engine tolerates
    // nulls) — this test documents that requestDecision's failure path
    // exists and returns ok:false with a safe message whenever the
    // fallback computation itself throws, using a state manufactured
    // to prove the branch, not to claim today's engine is fragile.
    const malformed = { ...EMPTY_WIZARD_STATE, goals: null } as unknown as typeof EMPTY_WIZARD_STATE;

    const result = await requestDecision(malformed, { fetchImpl });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).not.toMatch(/stack|Error:|at Object|node_modules/i);
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
