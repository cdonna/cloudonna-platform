import "server-only";

/**
 * Framework-independent handler behind GET /api/vendor-intelligence/products/[slug]
 * — the Product Profile data (brief §21): every active capability
 * claim for a product, each with its own evidence-derived freshness
 * and quality tier, plus deterministic coverage metrics (brief §41).
 * A single bounded query per product, not "dozens of sources per
 * page load" (brief §52) — one claims query, one evidence+sources
 * query scoped to exactly those claim ids, nothing per-row.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { classifyFreshnessByAge, type FreshnessCategory } from "../freshness-v2";
import { computeProductCoverage, type CoverageClaimInput } from "../coverage-metrics";
import { isKnownProductSlug, productDisplayName } from "../validate-product-slug";
import { listActiveClaimsForProduct } from "./vendor-knowledge-repository";
import type { EvidenceSourceCategory } from "../types";
// Relative, not "@/..." — vitest.config.mts has no path-alias
// resolution (only Next.js's own bundler reads tsconfig `paths`); see
// research/providers/openai-research-provider.ts's sibling modules for
// the same constraint elsewhere in this codebase.
import { getPrimaryOrganizationForCurrentUser } from "../../../../../lib/billing/billing-repository";

export interface ProductKnowledgeHandlerResult {
  status: number;
  body:
    | {
        productSlug: string;
        productDisplayName: string;
        claims: Array<{
          id: string;
          capabilityKey: string;
          claim: string;
          verificationStatus: string;
          lifecycleStatus: string;
          evidenceQuality: string | null;
          freshness: FreshnessCategory;
          scope: string;
          lastVerifiedAt: string | null;
          version: number;
        }>;
        coverage: ReturnType<typeof computeProductCoverage>;
      }
    | { error: string };
}

export async function handleProductKnowledgeRequest(
  productSlug: string,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<ProductKnowledgeHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to view vendor intelligence." } };
  if (!isKnownProductSlug(productSlug)) return { status: 404, body: { error: "Unknown product." } };

  const org = await getPrimaryOrganizationForCurrentUser(supabase);
  const claimsResult = await listActiveClaimsForProduct(supabase, productSlug, org?.organizationId ?? null);
  if (!claimsResult.ok) return { status: 404, body: { error: claimsResult.reason } };

  const claimIds = claimsResult.data.map((c) => c.id);
  let evidenceByClaimId = new Map<string, { sourceCategory: EvidenceSourceCategory; publishedAt: string | null }[]>();

  if (claimIds.length > 0) {
    const { data } = await supabase
      .from("vendor_capability_evidence")
      .select("claim_id, polarity, vendor_evidence_sources(source_category, published_at)")
      .in("claim_id", claimIds)
      .eq("polarity", "supports");

    const rows = (data as Array<{ claim_id: string; vendor_evidence_sources: { source_category: EvidenceSourceCategory; published_at: string | null } | Array<{ source_category: EvidenceSourceCategory; published_at: string | null }> | null }> | null) ?? [];
    const map = new Map<string, { sourceCategory: EvidenceSourceCategory; publishedAt: string | null }[]>();
    for (const row of rows) {
      const source = Array.isArray(row.vendor_evidence_sources) ? row.vendor_evidence_sources[0] : row.vendor_evidence_sources;
      if (!source) continue;
      const list = map.get(row.claim_id) ?? [];
      list.push({ sourceCategory: source.source_category, publishedAt: source.published_at });
      map.set(row.claim_id, list);
    }
    evidenceByClaimId = map;
  }

  function freshnessForClaim(claimId: string): FreshnessCategory {
    const entries = evidenceByClaimId.get(claimId) ?? [];
    if (entries.length === 0) return "unknown";
    // The freshest available supporting evidence wins — one current
    // official source is enough to call a claim current, even if an
    // older source also backs it.
    const order: FreshnessCategory[] = ["current", "aging", "stale", "unknown"];
    let best: FreshnessCategory = "unknown";
    for (const entry of entries) {
      const freshness = classifyFreshnessByAge(entry.publishedAt, entry.sourceCategory);
      if (order.indexOf(freshness) < order.indexOf(best)) best = freshness;
    }
    return best;
  }

  const coverageInputs: CoverageClaimInput[] = claimsResult.data.map((claim) => ({ claim, freshness: freshnessForClaim(claim.id) }));

  return {
    status: 200,
    body: {
      productSlug,
      productDisplayName: productDisplayName(productSlug) ?? productSlug,
      claims: claimsResult.data.map((claim) => ({
        id: claim.id,
        capabilityKey: claim.capabilityKey,
        claim: claim.claim,
        verificationStatus: claim.verificationStatus,
        lifecycleStatus: claim.lifecycleStatus,
        evidenceQuality: claim.evidenceQuality,
        freshness: freshnessForClaim(claim.id),
        scope: claim.scope,
        lastVerifiedAt: claim.lastVerifiedAt,
        version: claim.version,
      })),
      coverage: computeProductCoverage(coverageInputs),
    },
  };
}
