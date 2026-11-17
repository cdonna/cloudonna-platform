import "server-only";

/**
 * Framework-independent handler behind GET
 * /api/vendor-intelligence/decisions/[id]/products/[slug] — the
 * Vendor Knowledge Panel (brief §51), opened from one decision option.
 * Returns the same product-knowledge payload
 * handle-product-knowledge-request.ts does, AND records a
 * decision-time snapshot reference (brief §34) for every claim shown
 * — the real, functioning mechanism for "what did we know when this
 * decision was made," scoped honestly: it captures what vendor
 * knowledge the decision's own workspace actually surfaced to a
 * human, since the Decision Engine does not yet consume canonical
 * claims as a direct scoring input (brief §23 keeps that boundary
 * deliberately separate — see Known Limitations in
 * docs/capabilities/vendor-intelligence-and-evidence-graph.md).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDecisionDetail } from "../../../persistence/decisions-repository";
import { handleProductKnowledgeRequest } from "./handle-product-knowledge-request";
import { recordDecisionVendorClaimRefs } from "./vendor-knowledge-repository";

export interface DecisionVendorKnowledgeHandlerResult {
  status: number;
  body: unknown;
}

export async function handleDecisionVendorKnowledgeRequest(
  decisionId: string,
  productSlug: string,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<DecisionVendorKnowledgeHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to view vendor intelligence." } };

  const decisionResult = await getDecisionDetail(supabase, decisionId);
  if (!decisionResult.ok) return { status: 404, body: { error: decisionResult.reason } };

  const productKnowledge = await handleProductKnowledgeRequest(productSlug, supabase, userId);
  if (productKnowledge.status !== 200) return productKnowledge;

  const body = productKnowledge.body as { claims: Array<{ id: string; version: number; verificationStatus: string }> };

  const { data: decisionRow } = await supabase.from("decisions").select("organization_id").eq("id", decisionId).maybeSingle();
  const organizationId = decisionRow?.organization_id as string | undefined;
  if (organizationId && body.claims.length > 0) {
    await recordDecisionVendorClaimRefs(
      supabase,
      decisionId,
      organizationId,
      body.claims.map((c) => ({ claimId: c.id, claimVersionAtReference: c.version, verificationStatus: c.verificationStatus as never })),
    );
  }

  return { status: 200, body };
}
