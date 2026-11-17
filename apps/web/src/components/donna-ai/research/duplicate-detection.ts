/**
 * Duplicate Detection (brief §17) — deterministic, not fuzzy ML
 * matching. Two claims are the "same" evidence only if they target
 * the same option/criterion AND either:
 *  - their claim text is identical after normalizing whitespace/case, or
 *  - they come from the same URL AND one claim's normalized text
 *    contains the other's (a near-identical restatement of the same
 *    sentence) — same URL alone is deliberately NOT sufficient: one
 *    page routinely supports several genuinely distinct claims, and
 *    treating "same source" as "same fact" would silently drop real
 *    evidence (brief §15's own "Source A says GA / Source B says
 *    preview" example depends on two claims from different sources
 *    staying distinct — this rule must not accidentally collapse two
 *    distinct claims that happen to share a source either).
 * Near-miss paraphrases that are neither identical nor a substring of
 * each other are deliberately NOT merged in V1 — a false merge (hiding
 * a genuinely different claim) is worse than an occasional near-
 * duplicate kept separate; see "Known limitations" in the PR description.
 */
import type { ResearchEvidence } from "./types";

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isDuplicateEvidence(candidate: Pick<ResearchEvidence, "claim" | "sourceUrl" | "optionId" | "criterionId">, existing: ResearchEvidence[]): ResearchEvidence | null {
  const candidateNormalized = normalize(candidate.claim);
  for (const item of existing) {
    if (item.optionId !== candidate.optionId || item.criterionId !== candidate.criterionId) continue;
    const itemNormalized = normalize(item.claim);
    if (itemNormalized === candidateNormalized) return item;

    const sameUrl = candidate.sourceUrl !== null && item.sourceUrl === candidate.sourceUrl;
    const oneContainsOther = itemNormalized.includes(candidateNormalized) || candidateNormalized.includes(itemNormalized);
    if (sameUrl && oneContainsOther) return item;
  }
  return null;
}

export function dedupeProposedEvidence(items: ResearchEvidence[]): { unique: ResearchEvidence[]; duplicateCount: number } {
  const unique: ResearchEvidence[] = [];
  let duplicateCount = 0;
  for (const item of items) {
    if (isDuplicateEvidence(item, unique)) {
      duplicateCount += 1;
      continue;
    }
    unique.push(item);
  }
  return { unique, duplicateCount };
}

/**
 * Same dedup rule as dedupeProposedEvidence, but also returns, for
 * every original index, which index it survived as in `unique` — or
 * null if it was dropped as a duplicate of an earlier item. Lets a
 * caller that already resolved conflict references against the
 * pre-dedup array (research-orchestrator.ts) remap or drop them
 * afterward, instead of needing dedup to happen before indices are
 * ever assigned.
 */
export function dedupeWithIndexMap<T extends Pick<ResearchEvidence, "claim" | "sourceUrl" | "optionId" | "criterionId">>(
  items: T[],
): { unique: T[]; indexMap: Array<number | null> } {
  const unique: T[] = [];
  const indexMap: Array<number | null> = [];
  for (const item of items) {
    const match = isDuplicateEvidence(item, unique as unknown as ResearchEvidence[]);
    if (match) {
      indexMap.push(unique.indexOf(match as unknown as T));
      continue;
    }
    unique.push(item);
    indexMap.push(unique.length - 1);
  }
  return { unique, indexMap };
}
