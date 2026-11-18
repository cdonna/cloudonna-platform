/**
 * Vendor Knowledge Refresh orchestrator (brief §16/§18). Pure
 * composition over a VendorRefreshProvider — retrieval/extraction is
 * delegated entirely to the provider; this function's job is the
 * deterministic part: deduplicate the proposed claims against what is
 * already known (brief §30 "do we already know this"), detect
 * cross-session conflicts against the current canonical claims (brief
 * §11), and never decide anything about promotion to global knowledge
 * — that stays a separate, human step (handle-review-claim-request.ts).
 */
import { dedupeClaims, type SimilarityCandidate } from "../claim-similarity";
import { detectCrossSessionConflicts, type ConflictCandidate, type DetectedConflict } from "../conflict-detection";
import type { VendorRefreshProvider } from "./provider";
import type { ProposedVendorClaim, VendorRefreshSourceDocument, VendorRefreshTask } from "./types";

export interface VendorRefreshRunResult {
  status: "ok" | "no_source_found" | "retrieval_failed" | "parse_failed";
  reason: string | null;
  /** Claims that survived dedup against the existing active set —
   * what the caller should actually persist as PROPOSED. */
  newClaims: Array<{ claim: ProposedVendorClaim; source: VendorRefreshSourceDocument }>;
  duplicateCount: number;
  conflicts: DetectedConflict[];
}

export async function runVendorKnowledgeRefresh(
  provider: VendorRefreshProvider,
  task: VendorRefreshTask,
  existingActiveClaims: ConflictCandidate[],
): Promise<VendorRefreshRunResult> {
  const result = await provider.retrieveAndExtract(task);

  if (result.status !== "ok") {
    return { status: result.status, reason: result.reason, newClaims: [], duplicateCount: 0, conflicts: [] };
  }

  const candidates: Array<SimilarityCandidate & { claimRef: ProposedVendorClaim }> = result.claims.map((c) => ({
    productSlug: task.productSlug,
    capabilityKey: task.capabilityKey,
    claim: c.claim,
    claimRef: c,
  }));

  const { unique, duplicateCount } = dedupeClaims(candidates);

  const allConflicts: DetectedConflict[] = [];
  for (const candidate of unique) {
    allConflicts.push(...detectCrossSessionConflicts(candidate, existingActiveClaims));
  }

  const newClaims = unique
    .map((c) => {
      const source = result.sources[c.claimRef.citationIndex];
      if (!source) return null;
      return { claim: c.claimRef, source };
    })
    .filter((c): c is { claim: ProposedVendorClaim; source: VendorRefreshSourceDocument } => c !== null);

  return { status: "ok", reason: null, newClaims, duplicateCount, conflicts: allConflicts };
}
