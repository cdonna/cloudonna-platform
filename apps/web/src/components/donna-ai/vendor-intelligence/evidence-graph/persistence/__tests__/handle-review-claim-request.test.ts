import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleReviewClaimRequest } from "../handle-review-claim-request";

function fakeSupabaseWithRpc(rpcResult: { data: unknown; error: { message: string } | null }) {
  return { rpc: vi.fn(() => Promise.resolve(rpcResult)) } as unknown as SupabaseClient;
}

describe("handleReviewClaimRequest", () => {
  it("rejects an unauthenticated request", async () => {
    const supabase = fakeSupabaseWithRpc({ data: null, error: null });
    const result = await handleReviewClaimRequest("claim-1", "active", supabase, null);
    expect(result.status).toBe(401);
  });

  it("promotes a proposed global claim to active via the RPC, never a raw UPDATE", async () => {
    const supabase = fakeSupabaseWithRpc({ data: [{ out_id: "claim-1", out_lifecycle_status: "active" }], error: null });
    const result = await handleReviewClaimRequest("claim-1", "active", supabase, "staff-1");
    expect(result.status).toBe(200);
    const body = result.body as { claimId: string; lifecycleStatus: string };
    expect(body.lifecycleStatus).toBe("active");
    expect(supabase.rpc).toHaveBeenCalledWith("promote_vendor_claim", { p_claim_id: "claim-1", p_new_status: "active" });
  });

  it("returns 404 when the RPC reports the claim is not found, not global, or not authorized", async () => {
    const supabase = fakeSupabaseWithRpc({ data: null, error: { message: "Global claim not found, not accessible, or not eligible for promotion." } });
    const result = await handleReviewClaimRequest("claim-1", "active", supabase, "user-1");
    expect(result.status).toBe(404);
  });

  it("supports rejecting a claim", async () => {
    const supabase = fakeSupabaseWithRpc({ data: [{ out_id: "claim-1", out_lifecycle_status: "rejected" }], error: null });
    const result = await handleReviewClaimRequest("claim-1", "rejected", supabase, "staff-1");
    expect(result.status).toBe(200);
    const body = result.body as { lifecycleStatus: string };
    expect(body.lifecycleStatus).toBe("rejected");
  });
});
