import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SAMPLE_PROFILE } from "../../data";
import { handleAppendDecisionVersionRequest } from "../handle-append-decision-version-request";

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    decisionInput: { wizardState: SAMPLE_PROFILE },
    enrichment: null,
    provider: { providerId: "deterministic-v1", model: null },
    fallback: { status: "ok", reason: null },
    changeReason: "Budget increased after Q3 planning",
    ...overrides,
  };
}

/** A minimal fake satisfying only the one method this domain actually
 * calls (`rpc`) — matches the precedent in
 * handle-save-decision-request.test.ts. */
function fakeSupabase(rpcResult: { data: unknown; error: { message: string } | null }): SupabaseClient {
  return { rpc: vi.fn().mockResolvedValue(rpcResult) } as unknown as SupabaseClient;
}

describe("handleAppendDecisionVersionRequest", () => {
  it("rejects an unauthenticated request before touching the database", async () => {
    const rpc = vi.fn();
    const supabase = { rpc } as unknown as SupabaseClient;

    const result = await handleAppendDecisionVersionRequest("decision-1", validBody(), supabase, null);

    expect(result.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects a malformed body with a safe, generic message", async () => {
    const supabase = fakeSupabase({ data: null, error: null });
    const result = await handleAppendDecisionVersionRequest("decision-1", { foo: "bar" }, supabase, "user-1");

    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).not.toMatch(/zod|schema|stack/i);
  });

  it("rejects a missing changeReason — required here, unlike the original save path", async () => {
    const body = validBody();
    delete (body as Record<string, unknown>).changeReason;
    const supabase = fakeSupabase({ data: null, error: null });

    const result = await handleAppendDecisionVersionRequest("decision-1", body, supabase, "user-1");
    expect(result.status).toBe(400);
  });

  it("rejects a body with an unknown extra field (e.g. an attempted score override)", async () => {
    const supabase = fakeSupabase({ data: null, error: null });
    const result = await handleAppendDecisionVersionRequest("decision-1", validBody({ output: { donnaScore: 100 } }), supabase, "user-1");
    expect(result.status).toBe(400);
  });

  it("appends a valid request and returns the new id/versionNumber", async () => {
    const supabase = fakeSupabase({
      data: [{ out_version_id: "version-uuid", out_version_number: 2 }],
      error: null,
    });

    const result = await handleAppendDecisionVersionRequest("decision-1", validBody(), supabase, "user-1");

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ id: "version-uuid", versionNumber: 2 });
  });

  it("recomputes the deterministic output server-side rather than trusting any client-supplied score", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ out_version_id: "id", out_version_number: 2 }], error: null });
    const supabase = { rpc } as unknown as SupabaseClient;

    await handleAppendDecisionVersionRequest("decision-1", validBody(), supabase, "user-1");

    const callArgs = rpc.mock.calls[0][1] as { p_deterministic_output: { donnaScore: number } };
    expect(typeof callArgs.p_deterministic_output.donnaScore).toBe("number");
    expect(callArgs.p_deterministic_output.donnaScore).toBeGreaterThanOrEqual(0);
    expect(callArgs.p_deterministic_output.donnaScore).toBeLessThanOrEqual(100);
  });

  it("passes the decisionId argument through as p_decision_id, never from the request body", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ out_version_id: "id", out_version_number: 2 }], error: null });
    const supabase = { rpc } as unknown as SupabaseClient;

    await handleAppendDecisionVersionRequest("decision-from-url", validBody(), supabase, "user-1");

    const callArgs = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.p_decision_id).toBe("decision-from-url");
  });

  it("passes provenance version strings through to the persisted row", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ out_version_id: "id", out_version_number: 2 }], error: null });
    const supabase = { rpc } as unknown as SupabaseClient;

    await handleAppendDecisionVersionRequest("decision-1", validBody(), supabase, "user-1");

    const callArgs = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.p_schema_version).toBe("decision-report/1");
    expect(callArgs.p_scoring_engine_version).toBe("donna-score-v2");
    expect(callArgs.p_knowledge_base_version).toBe("vendor-catalog-v1");
  });

  it("surfaces a database-level rejection (e.g. RLS) as a safe, generic message — never the raw Postgres error", async () => {
    const supabase = fakeSupabase({
      data: null,
      error: { message: 'new row violates row-level security policy for table "decision_versions"' },
    });

    const result = await handleAppendDecisionVersionRequest("decision-1", validBody(), supabase, "user-1");

    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).not.toContain("row-level security policy for table");
  });

  it("never includes the raw request body or wizard state notes in any thrown/returned error", async () => {
    const supabase = fakeSupabase({ data: null, error: { message: "unexpected failure detail" } });
    const body = validBody({
      decisionInput: {
        wizardState: {
          ...SAMPLE_PROFILE,
          constraints: { ...SAMPLE_PROFILE.constraints, note: "a secret business detail" },
        },
      },
    });

    const result = await handleAppendDecisionVersionRequest("decision-1", body, supabase, "user-1");

    expect(JSON.stringify(result.body)).not.toContain("secret business detail");
  });
});
