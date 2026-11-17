/**
 * Revalidation Queue (brief §15) — a deterministic ranking, not a
 * fabricated urgency score. A claim's priority is the sum of a few
 * documented, independently-justifiable signals:
 *
 *  - status weight: CONFLICTED and STALE outrank everything else —
 *    both mean "we are not confident this is still true."
 *  - usage weight: how many decisions reference this claim (from
 *    decision_vendor_claim_refs) — a fact five decisions relied on
 *    matters more to get right than one nobody has used.
 *  - criterion weight: the Decision Engine's own SCORE_WEIGHTS for the
 *    criterion this claim's capability maps to — reuses the existing
 *    weighting rather than inventing a second one.
 *  - fragility weight: a small bonus when this claim's product is the
 *    winner of a currently-FRAGILE decision (brief's own example:
 *    "a fragile recommendation" ranks a stale fact higher).
 *
 * The exact numbers are documented constants, not tuned per request —
 * same discipline as engine/robustness.ts's fixed cutoffs. This
 * produces an ORDERING, never a percentage or probability.
 */
import { SCORE_WEIGHTS } from "../../scoring/weights";
import { CAPABILITY_TO_CRITERION } from "./capability-criterion-map";
import type { CapabilityCategoryKey, ClaimVerificationStatus } from "./types";

export interface RevalidationCandidate {
  claimId: string;
  productSlug: string;
  capabilityKey: CapabilityCategoryKey;
  verificationStatus: ClaimVerificationStatus;
  decisionReferenceCount: number;
  usedByFragileWinnerDecision: boolean;
}

export interface RevalidationQueueEntry {
  claimId: string;
  priorityScore: number;
  reasons: string[];
}

const STATUS_WEIGHT: Record<ClaimVerificationStatus, number> = {
  conflicted: 100,
  stale: 80,
  unknown: 20,
  partially_verified: 10,
  verified: 0,
};

const USAGE_WEIGHT_PER_DECISION = 8;
const MAX_USAGE_WEIGHT = 40;
const FRAGILE_WINNER_BONUS = 25;

export function rankRevalidationQueue(candidates: RevalidationCandidate[]): RevalidationQueueEntry[] {
  return candidates
    .map((c) => {
      const reasons: string[] = [];
      let score = STATUS_WEIGHT[c.verificationStatus];
      if (score > 0) reasons.push(`Verification status is ${c.verificationStatus}.`);

      const usageScore = Math.min(c.decisionReferenceCount * USAGE_WEIGHT_PER_DECISION, MAX_USAGE_WEIGHT);
      if (usageScore > 0) {
        reasons.push(`Referenced by ${c.decisionReferenceCount} decision${c.decisionReferenceCount === 1 ? "" : "s"}.`);
        score += usageScore;
      }

      const criterion = CAPABILITY_TO_CRITERION[c.capabilityKey];
      const criterionWeightScore = criterion ? Math.round(SCORE_WEIGHTS[criterion] * 100) : 0;
      score += criterionWeightScore;

      if (c.usedByFragileWinnerDecision) {
        score += FRAGILE_WINNER_BONUS;
        reasons.push("Used by the winning option in a decision whose recommendation is already fragile.");
      }

      if (reasons.length === 0) reasons.push("No urgency signal — low priority by default.");

      return { claimId: c.claimId, priorityScore: score, reasons };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}
