import "server-only";

/**
 * Framework-independent handler behind POST
 * /api/vendor-intelligence/claims/[id]/review — the human review
 * boundary for GLOBAL vendor knowledge (brief §19/§48): PROPOSED →
 * ACTIVE or PROPOSED → REJECTED. The only write path is the
 * promote_vendor_claim() RPC (migration-defined), which only succeeds
 * for scope=global rows and only for a caller RLS already recognizes
 * as platform staff — this handler adds no privilege of its own.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReviewClaimHandlerResult {
  status: number;
  body: { claimId: string; lifecycleStatus: string } | { error: string };
}

export async function handleReviewClaimRequest(
  claimId: string,
  decision: "active" | "rejected",
  supabase: SupabaseClient,
  userId: string | null,
): Promise<ReviewClaimHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to review vendor knowledge." } };

  const { data, error } = await supabase.rpc("promote_vendor_claim", { p_claim_id: claimId, p_new_status: decision });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("not found") || message.includes("not accessible") || message.includes("not eligible")) {
      return { status: 404, body: { error: "This claim could not be found, is not global, or you are not authorized to review it." } };
    }
    return { status: 400, body: { error: "This review could not be completed." } };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { status: 404, body: { error: "This claim could not be found or is not eligible for review." } };

  return { status: 200, body: { claimId: row.out_id, lifecycleStatus: row.out_lifecycle_status } };
}
