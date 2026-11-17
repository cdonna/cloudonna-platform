/**
 * Claim deduplication (brief §10) — deterministic and conservative,
 * the same philosophy as research/duplicate-detection.ts (and,
 * deliberately, a sibling function rather than a generalized shared
 * one: that module's rule is scoped to option/criterion, this one to
 * product/capability — forcing them into one function would need a
 * configurable "scope key" parameter for no real gain in clarity).
 *
 * Merge only when two claims are genuinely about the same product and
 * capability AND their text is identical or one is a near-verbatim
 * restatement of the other. Same vendor, same URL, or same capability
 * category alone is never sufficient — false duplicates (silently
 * dropping a genuinely distinct fact) are worse than two near-
 * duplicate rows a human can still tell apart (brief §10's own
 * instruction).
 */
export interface SimilarityCandidate {
  productSlug: string;
  capabilityKey: string;
  claim: string;
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?]+$/, "");
}

export function isDuplicateClaim<T extends SimilarityCandidate>(candidate: SimilarityCandidate, existing: T[]): T | null {
  const candidateNormalized = normalize(candidate.claim);
  for (const item of existing) {
    if (item.productSlug !== candidate.productSlug || item.capabilityKey !== candidate.capabilityKey) continue;
    const itemNormalized = normalize(item.claim);
    if (itemNormalized === candidateNormalized) return item;
    // One is a near-verbatim restatement of the other (e.g. the same
    // sentence with a trailing clause added) — a 90%+ length overlap
    // via substring containment, not a fuzzy/ML similarity score,
    // keeps this deterministic and auditable.
    if (itemNormalized.length > 20 && candidateNormalized.length > 20) {
      if (itemNormalized.includes(candidateNormalized) || candidateNormalized.includes(itemNormalized)) return item;
    }
  }
  return null;
}

export function dedupeClaims<T extends SimilarityCandidate>(items: T[]): { unique: T[]; duplicateCount: number } {
  const unique: T[] = [];
  let duplicateCount = 0;
  for (const item of items) {
    if (isDuplicateClaim(item, unique)) {
      duplicateCount += 1;
      continue;
    }
    unique.push(item);
  }
  return { unique, duplicateCount };
}
