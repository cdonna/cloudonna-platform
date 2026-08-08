import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SAMPLE_PROFILE } from "../../data";
import { handleSaveDecisionRequest } from "../handle-save-decision-request";

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    title: "2027 Data Platform RFP",
    organizationId: "11111111-1111-1111-1111-111111111111",
    workspaceId: "22222222-2222-2222-2222-222222222222",
    projectId: "33333333-3333-3333-3333-333333333333",
    decisionInput: { wizardState: SAMPLE_PROFILE },
    enrichment: null,
    provider: { providerId: "deterministic-v1", model: null },
    fallback: { status: "ok", reason: null },
    ...overrides,
  };
}

/** A minimal fake satisfying only the one method this domain actually
 * calls (`rpc`) — not a full SupabaseClient mock, which would be a much
 * larger surface than this handler needs. */
function fakeSupabase(rpcResult: { data: unknown; error: { message: string } | null }): SupabaseClient {
  return { rpc: vi.fn().mockResolvedValue(rpcResult) } as unknown as SupabaseClient;
}

describe("handleSaveDecisionRequest", () => {
  it("rejects an unauthenticated request before touching the database", async () => {
    const rpc = vi.fn();
    const supabase = { rpc } as unknown as SupabaseClient;

    const result = await handleSaveDecisionRequest(validBody(), supabase, null);

    expect(result.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects a malformed body with a safe, generic message", async () => {
    const supabase = fakeSupabase({ data: null, error: null });
    const result = await handleSaveDecisionRequest({ foo: "bar" }, supabase, "user-1");

    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).not.toMatch(/zod|schema|stack/i);
  });

  it("rejects a body with an unknown extra field (e.g. an attempted score override)", async () => {
    const supabase = fakeSupabase({ data: null, error: null });
    const result = await handleSaveDecisionRequest(validBody({ output: { donnaScore: 100 } }), supabase, "user-1");
    expect(result.status).toBe(400);
  });

  it("saves a valid request and returns the id/humanReadableId", async () => {
    const supabase = fakeSupabase({
      data: [{ out_id: "decision-uuid", out_human_readable_id: "CDD-2026-000001" }],
      error: null,
    });

    const result = await handleSaveDecisionRequest(validBody(), supabase, "user-1");

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ id: "decision-uuid", humanReadableId: "CDD-2026-000001" });
  });

  it("recomputes the deterministic output server-side rather than trusting any client-supplied score", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ out_id: "id", out_human_readable_id: "CDD-2026-000002" }], error: null });
    const supabase = { rpc } as unknown as SupabaseClient;

    await handleSaveDecisionRequest(validBody(), supabase, "user-1");

    const callArgs = rpc.mock.calls[0][1] as { p_deterministic_output: { donnaScore: number } };
    // The persisted output must be a real, computed DecisionOutput
    // (has a numeric donnaScore in the expected range) — not an empty
    // object and not something copied verbatim from client input,
    // since the request body sent to this handler never contained an
    // "output" field to copy from in the first place.
    expect(typeof callArgs.p_deterministic_output.donnaScore).toBe("number");
    expect(callArgs.p_deterministic_output.donnaScore).toBeGreaterThanOrEqual(0);
    expect(callArgs.p_deterministic_output.donnaScore).toBeLessThanOrEqual(100);
  });

  it("passes provenance version strings through to the persisted row", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ out_id: "id", out_human_readable_id: "CDD-2026-000003" }], error: null });
    const supabase = { rpc } as unknown as SupabaseClient;

    await handleSaveDecisionRequest(validBody(), supabase, "user-1");

    const callArgs = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.p_schema_version).toBe("decision-report/1");
    expect(callArgs.p_scoring_engine_version).toBe("donna-score-v2");
    expect(callArgs.p_knowledge_base_version).toBe("vendor-catalog-v1");
  });

  it("surfaces a database-level rejection (e.g. RLS) as a safe, generic message — never the raw Postgres error", async () => {
    const supabase = fakeSupabase({
      data: null,
      error: { message: 'new row violates row-level security policy for table "decisions"' },
    });

    const result = await handleSaveDecisionRequest(validBody(), supabase, "user-1");

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

    const result = await handleSaveDecisionRequest(body, supabase, "user-1");

    expect(JSON.stringify(result.body)).not.toContain("secret business detail");
  });
});
