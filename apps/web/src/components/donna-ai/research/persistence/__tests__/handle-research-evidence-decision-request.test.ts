import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleResearchEvidenceDecisionRequest } from "../handle-research-evidence-decision-request";

function fakeSupabase(rpcResult: { data: unknown; error: { message: string } | null }): SupabaseClient {
  return { rpc: vi.fn().mockResolvedValue(rpcResult) } as unknown as SupabaseClient;
}

describe("handleResearchEvidenceDecisionRequest", () => {
  it("rejects an unauthenticated request before touching the database", async () => {
    const rpc = vi.fn();
    const supabase = { rpc } as unknown as SupabaseClient;
    const result = await handleResearchEvidenceDecisionRequest("ev-1", "accepted", supabase, null);
    expect(result.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("accepts evidence via the decide_research_evidence RPC", async () => {
    const supabase = fakeSupabase({ data: [{ out_id: "ev-1", out_status: "accepted" }], error: null });
    const result = await handleResearchEvidenceDecisionRequest("ev-1", "accepted", supabase, "user-1");
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ id: "ev-1", status: "accepted" });
  });

  it("rejects evidence via the same RPC with the opposite status", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ out_id: "ev-1", out_status: "rejected" }], error: null });
    const supabase = { rpc } as unknown as SupabaseClient;
    await handleResearchEvidenceDecisionRequest("ev-1", "rejected", supabase, "user-1");
    const callArgs = rpc.mock.calls[0][1] as { p_status: string };
    expect(callArgs.p_status).toBe("rejected");
  });

  it("surfaces a database rejection (e.g. RLS) as a safe, generic message", async () => {
    const supabase = fakeSupabase({ data: null, error: { message: 'new row violates row-level security policy for table "research_evidence"' } });
    const result = await handleResearchEvidenceDecisionRequest("ev-1", "accepted", supabase, "user-1");
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).not.toContain("row-level security policy for table");
  });

  it("never lets a client-supplied reviewer id override the RPC's own auth.uid() usage — the handler never passes a reviewer id at all", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ out_id: "ev-1", out_status: "accepted" }], error: null });
    const supabase = { rpc } as unknown as SupabaseClient;
    await handleResearchEvidenceDecisionRequest("ev-1", "accepted", supabase, "user-1");
    const callArgs = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(callArgs)).toEqual(["p_evidence_id", "p_status"]);
  });
});
