/**
 * Vendor Knowledge Refresh (brief §16) — domain types. Deliberately a
 * SEPARATE workflow from research/types.ts's ResearchTask/
 * RetrievalResult: "what do we need to know for this decision" and
 * "which canonical vendor facts are stale or conflicting" are
 * different questions with different inputs (decision/criterion/
 * option vs. product/capability) even though both ultimately call the
 * same kind of live web retrieval — see vendor-refresh-orchestrator.ts
 * for exactly what IS shared.
 */
import type { CapabilityCategoryKey, EvidenceSourceCategory } from "../types";

export const VENDOR_REFRESH_AGENT_VERSION = "vendor-refresh-v1";

export interface VendorRefreshTask {
  taskId: string;
  productSlug: string;
  capabilityKey: CapabilityCategoryKey;
  question: string;
  preferredSourceCategories: EvidenceSourceCategory[];
}

export interface VendorRefreshSourceDocument {
  id: string;
  url: string;
  title: string;
  publisher: string;
  publishedAt: string | null;
  retrievedAt: string;
  sourceCategory: EvidenceSourceCategory;
  contentExcerpt: string;
}

export interface ProposedVendorClaim {
  claim: string;
  /** Index into the retrieval's sources array this claim is grounded
   * in — validated against the real, deduped source list before this
   * claim is ever trusted, same discipline as research's
   * ProposedClaim.citationIndex. */
  citationIndex: number;
  confidence: "high" | "medium" | "low";
}

export type VendorRefreshStatus = "ok" | "no_source_found" | "retrieval_failed" | "parse_failed";

export type VendorRefreshResult =
  | { status: "ok"; claims: ProposedVendorClaim[]; sources: VendorRefreshSourceDocument[] }
  | { status: Exclude<VendorRefreshStatus, "ok">; reason: string };
