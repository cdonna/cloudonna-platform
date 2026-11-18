/**
 * Cross-session conflict detection (brief §11) — Research Agent V1's
 * own conflict detection (research/types.ts's ProposedConflict) only
 * compares claims proposed within a single run. This extends the
 * check to the canonical knowledge graph: a newly retrieved claim is
 * compared against every currently-active claim for the same
 * product/capability, regardless of which session (or no session —
 * direct curation) produced either one.
 *
 * Deterministic and conservative, the same way claim-similarity.ts is:
 * this never decides which claim is "right" — it only decides whether
 * a conflict exists at all, which is itself already decided
 * conservatively (brief: "do not silently replace old evidence...
 * ClouDonna must create a real conflict"). The severity heuristic adds
 * real value for the brief's own example ("generally available" vs.
 * "preview") without needing an AI call, but a conflict is still
 * raised even when no antonym pair is recognized — an unrecognized
 * difference in wording is still a difference a human should see, not
 * evidence that nothing is wrong.
 */
import { isDuplicateClaim, type SimilarityCandidate } from "./claim-similarity";

export interface ConflictCandidate extends SimilarityCandidate {
  claimId: string;
}

export type ConflictSeverity = "low" | "medium" | "high";

export interface DetectedConflict {
  existingClaimId: string;
  newClaimText: string;
  existingClaimText: string;
  severity: ConflictSeverity;
  explanation: string;
}

/** Status-antonym pairs the brief's own example turns on (GA vs.
 * preview). Deliberately small and literal — a false "no antonym
 * found" only lowers severity to medium, it never suppresses the
 * conflict itself. */
const ANTONYM_GROUPS: string[][] = [
  ["generally available", "ga", "available", "released"],
  ["preview", "beta", "not available", "unavailable", "deprecated", "retired", "sunset", "discontinued"],
];

function antonymGroupIndex(normalized: string): number {
  return ANTONYM_GROUPS.findIndex((group) => group.some((phrase) => normalized.includes(phrase)));
}

function detectSeverity(existingNormalized: string, newNormalized: string): ConflictSeverity {
  const existingGroup = antonymGroupIndex(existingNormalized);
  const newGroup = antonymGroupIndex(newNormalized);
  if (existingGroup >= 0 && newGroup >= 0 && existingGroup !== newGroup) return "high";
  return "medium";
}

/**
 * Compares one newly-retrieved claim against every currently-active
 * claim for the same product/capability. Returns a conflict for every
 * active claim that is NOT a duplicate of the new one (duplicate =
 * isDuplicateClaim already recognizes it as the same fact, in which
 * case there is nothing to flag).
 */
export function detectCrossSessionConflicts(newClaim: SimilarityCandidate, activeClaims: ConflictCandidate[]): DetectedConflict[] {
  const relevant = activeClaims.filter((c) => c.productSlug === newClaim.productSlug && c.capabilityKey === newClaim.capabilityKey);
  const conflicts: DetectedConflict[] = [];

  for (const existing of relevant) {
    if (isDuplicateClaim(newClaim, [existing])) continue;
    const existingNormalized = existing.claim.trim().toLowerCase();
    const newNormalized = newClaim.claim.trim().toLowerCase();
    conflicts.push({
      existingClaimId: existing.claimId,
      newClaimText: newClaim.claim,
      existingClaimText: existing.claim,
      severity: detectSeverity(existingNormalized, newNormalized),
      explanation: `A new claim for this product/capability does not match the currently active claim and was not recognized as the same fact — both are preserved pending review.`,
    });
  }

  return conflicts;
}
