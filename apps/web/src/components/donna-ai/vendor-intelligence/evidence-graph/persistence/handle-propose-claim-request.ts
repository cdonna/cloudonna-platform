import "server-only";

/**
 * Framework-independent handler behind POST
 * /api/vendor-intelligence/claims (brief §18's "Human Review" step,
 * upstream half): propose a new capability claim plus its first piece
 * of supporting evidence. Runs claim dedup and cross-session conflict
 * detection before ever inserting a row — never silently replaces an
 * existing active claim, and never merges into one that isn't
 * genuinely the same fact (brief §10/§11).
 *
 * A GLOBAL-scope claim always starts lifecycle_status "proposed" (RLS
 * on vendor_capability_claims lets any platform-staff caller insert
 * one, but it stays PROPOSED until promote_vendor_claim is called
 * separately — see handle-review-claim-request.ts). An
 * ORGANIZATION_PRIVATE claim is written by any org member for their
 * own organization and defaults to ACTIVE immediately — a tenant's
 * own private context about a vendor does not need platform-staff
 * review the way a claim about to become shared global knowledge
 * does (brief §19's "lower-risk enrichment may remain proposed until
 * reviewed" — private, single-tenant evidence is the lower-risk case).
 */
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { canonicalizeSourceUrl } from "../source-normalization";
import { isDuplicateClaim } from "../claim-similarity";
import { detectCrossSessionConflicts, type ConflictCandidate } from "../conflict-detection";
import { isKnownProductSlug, vendorSlugForProduct } from "../validate-product-slug";
import { CAPABILITY_CATEGORY_KEYS } from "../types";
import { listActiveClaimsForProduct } from "./vendor-knowledge-repository";
import { getPrimaryOrganizationForCurrentUser } from "../../../../../lib/billing/billing-repository";

const proposeClaimRequestSchema = z
  .object({
    productSlug: z.string().min(1).max(100),
    capabilityKey: z.enum(CAPABILITY_CATEGORY_KEYS),
    claim: z.string().min(1).max(2000),
    scope: z.enum(["global", "organization_private"]),
    source: z
      .object({
        url: z.string().url(),
        title: z.string().min(1).max(500),
        publisher: z.string().min(1).max(300),
        sourceCategory: z.enum([
          "official_vendor_documentation",
          "official_product_documentation",
          "official_security_compliance",
          "official_architecture",
          "official_pricing_licensing",
          "official_release_notes",
          "standards_body",
          "independent_analysis",
          "unknown",
        ]),
        publishedAt: z.string().nullable(),
        excerpt: z.string().max(2000).nullable(),
      })
      .strict(),
  })
  .strict();

export interface ProposeClaimHandlerResult {
  status: number;
  body:
    | { claimId: string; lifecycleStatus: string; duplicateOf: string | null; conflicts: Array<{ existingClaimId: string; severity: string; explanation: string }> }
    | { error: string };
}

export async function handleProposeClaimRequest(rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<ProposeClaimHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to propose vendor knowledge." } };

  const parsed = proposeClaimRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };
  const input = parsed.data;

  if (!isKnownProductSlug(input.productSlug)) return { status: 400, body: { error: "Unknown product." } };
  const vendorSlug = vendorSlugForProduct(input.productSlug) ?? "unknown";

  let organizationId: string | null = null;
  if (input.scope === "organization_private") {
    const org = await getPrimaryOrganizationForCurrentUser(supabase);
    if (!org) return { status: 400, body: { error: "No organization found for this account." } };
    organizationId = org.organizationId;
  }

  const activeResult = await listActiveClaimsForProduct(supabase, input.productSlug, organizationId);
  if (!activeResult.ok) return { status: 400, body: { error: activeResult.reason } };

  const candidate = { productSlug: input.productSlug, capabilityKey: input.capabilityKey, claim: input.claim };
  const duplicate = isDuplicateClaim(candidate, activeResult.data);
  if (duplicate) {
    return { status: 200, body: { claimId: duplicate.id, lifecycleStatus: duplicate.lifecycleStatus, duplicateOf: duplicate.id, conflicts: [] } };
  }

  const conflictCandidates: ConflictCandidate[] = activeResult.data.map((c) => ({ claimId: c.id, productSlug: c.productSlug, capabilityKey: c.capabilityKey, claim: c.claim }));
  const conflicts = detectCrossSessionConflicts(candidate, conflictCandidates);

  const lifecycleStatus = input.scope === "global" ? "proposed" : "active";

  const { data: claimRow, error: claimError } = await supabase
    .from("vendor_capability_claims")
    .insert({
      vendor_slug: vendorSlug,
      product_slug: input.productSlug,
      capability_key: input.capabilityKey,
      claim: input.claim,
      verification_status: "unknown",
      lifecycle_status: lifecycleStatus,
      scope: input.scope,
      organization_id: organizationId,
    })
    .select("id, lifecycle_status")
    .single();

  if (claimError || !claimRow) return { status: 400, body: { error: "This claim could not be saved." } };

  const canonicalUrl = canonicalizeSourceUrl(input.source.url);
  let sourceId: string | null = null;
  const { data: existingSource } = await supabase.from("vendor_evidence_sources").select("id").eq("canonical_url", canonicalUrl).maybeSingle();
  if (existingSource) {
    sourceId = existingSource.id;
  } else {
    const { data: newSource, error: sourceError } = await supabase
      .from("vendor_evidence_sources")
      .insert({
        canonical_url: canonicalUrl,
        retrieved_url: input.source.url,
        title: input.source.title,
        publisher: input.source.publisher,
        source_category: input.source.sourceCategory,
        published_at: input.source.publishedAt,
      })
      .select("id")
      .single();
    if (sourceError || !newSource) return { status: 400, body: { error: "This claim's source could not be saved." } };
    sourceId = newSource.id;
  }

  await supabase.from("vendor_capability_evidence").insert({
    claim_id: claimRow.id,
    source_id: sourceId,
    polarity: "supports",
    excerpt: input.source.excerpt,
    confidence: "high",
  });

  return {
    status: 200,
    body: {
      claimId: claimRow.id,
      lifecycleStatus: claimRow.lifecycle_status,
      duplicateOf: null,
      conflicts: conflicts.map((c) => ({ existingClaimId: c.existingClaimId, severity: c.severity, explanation: c.explanation })),
    },
  };
}
