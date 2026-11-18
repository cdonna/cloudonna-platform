import "server-only";

/**
 * Framework-independent handler behind POST
 * /api/vendor-intelligence/refresh (brief §16 "Refresh Vendor
 * Knowledge" — distinct from decision research). Platform-staff only:
 * this writes PROPOSED global knowledge, which is exactly the
 * privileged operation brief §47/§48 restricts. Never auto-promotes —
 * every claim this writes stays lifecycle_status "proposed" until a
 * separate, explicit review call (handle-review-claim-request.ts).
 */
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadIntelligenceConfig } from "../../../intelligence/config";
import { isKnownProductSlug, vendorSlugForProduct } from "../validate-product-slug";
import { CAPABILITY_CATEGORY_KEYS } from "../types";
import { listActiveClaimsForProduct } from "./vendor-knowledge-repository";
import { selectVendorRefreshProvider } from "../vendor-refresh/select-vendor-refresh-provider";
import { runVendorKnowledgeRefresh } from "../vendor-refresh/vendor-refresh-orchestrator";
import type { ConflictCandidate } from "../conflict-detection";

const vendorRefreshRequestSchema = z
  .object({
    productSlug: z.string().min(1).max(100),
    capabilityKey: z.enum(CAPABILITY_CATEGORY_KEYS),
    question: z.string().min(1).max(500),
  })
  .strict();

export interface VendorRefreshHandlerResult {
  status: number;
  body:
    | { status: string; proposedClaimIds: string[]; duplicateCount: number; conflictCount: number }
    | { error: string };
}

export async function handleVendorRefreshRequest(rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<VendorRefreshHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to refresh vendor knowledge." } };

  // Checked explicitly, not left to surface as a confusing partial
  // success — the INSERT RLS policy on vendor_capability_claims would
  // also reject a non-staff caller's writes, but silently skipping
  // every proposed claim and returning status "ok" with zero results
  // would look like "nothing was found," not "you are not authorized."
  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "Only platform staff can refresh global vendor knowledge." } };

  const parsed = vendorRefreshRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };
  const { productSlug, capabilityKey, question } = parsed.data;

  if (!isKnownProductSlug(productSlug)) return { status: 400, body: { error: "Unknown product." } };
  const vendorSlug = vendorSlugForProduct(productSlug) ?? "unknown";

  const activeResult = await listActiveClaimsForProduct(supabase, productSlug, null);
  if (!activeResult.ok) return { status: 400, body: { error: activeResult.reason } };
  const existing: ConflictCandidate[] = activeResult.data.map((c) => ({ claimId: c.id, productSlug: c.productSlug, capabilityKey: c.capabilityKey, claim: c.claim }));

  const provider = selectVendorRefreshProvider(loadIntelligenceConfig());
  const taskId = `vrefresh-${productSlug}-${capabilityKey}-${Date.now()}`;
  const run = await runVendorKnowledgeRefresh(provider, { taskId, productSlug, capabilityKey, question, preferredSourceCategories: [] }, existing);

  if (run.status !== "ok") {
    return { status: 200, body: { status: run.status, proposedClaimIds: [], duplicateCount: 0, conflictCount: 0 } };
  }

  const proposedClaimIds: string[] = [];
  for (const { claim, source } of run.newClaims) {
    const { data: claimRow, error: claimError } = await supabase
      .from("vendor_capability_claims")
      .insert({
        vendor_slug: vendorSlug,
        product_slug: productSlug,
        capability_key: capabilityKey,
        claim: claim.claim,
        verification_status: "unknown",
        lifecycle_status: "proposed",
        scope: "global",
        organization_id: null,
      })
      .select("id")
      .single();
    if (claimError || !claimRow) continue;

    const { data: sourceRow } = await supabase
      .from("vendor_evidence_sources")
      .insert({
        canonical_url: source.url,
        retrieved_url: source.url,
        title: source.title,
        publisher: source.publisher,
        source_category: source.sourceCategory,
        published_at: source.publishedAt,
      })
      .select("id")
      .single();
    if (!sourceRow) continue;

    await supabase.from("vendor_capability_evidence").insert({
      claim_id: claimRow.id,
      source_id: sourceRow.id,
      polarity: "supports",
      excerpt: source.contentExcerpt,
      confidence: claim.confidence,
    });

    proposedClaimIds.push(claimRow.id);
  }

  return { status: 200, body: { status: "ok", proposedClaimIds, duplicateCount: run.duplicateCount, conflictCount: run.conflicts.length } };
}
