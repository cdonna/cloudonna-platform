/**
 * Challenger Agent V1 (brief §12/§13) — domain types. The Challenger
 * proposes challenges; it never alters a score, a ranking, or a
 * financial figure. Every DecisionChallenge is either DETERMINISTIC
 * (derived directly from already-computed engine/business-case
 * numbers — see deterministic-challenges.ts) or AI-ASSISTED (grounded
 * only in the evidence/assumptions/risks it was given — see
 * providers/openai-challenger-provider.ts), and both kinds share this
 * exact same output shape so a reader never needs to know which
 * produced a given challenge to trust its structure.
 */
import type { ScoreDimensionKey } from "../../types";

export type ChallengeType =
  | "ASSUMPTION_CHALLENGE"
  | "EVIDENCE_CHALLENGE"
  | "FINANCIAL_CHALLENGE"
  | "ARCHITECTURE_CHALLENGE"
  | "RISK_CHALLENGE"
  | "ALTERNATIVE_CHALLENGE"
  | "CONSTRAINT_CHALLENGE";

export type ChallengeSeverity = "low" | "medium" | "high";
export type ChallengeStatus = "open" | "acknowledged" | "dismissed";

export interface DecisionChallenge {
  id: string;
  type: ChallengeType;
  /** What this challenge is actually about — an option id, a
   * criterion, a financial category, or "recommendation" for a
   * challenge about the decision as a whole. */
  target: string;
  statement: string;
  severity: ChallengeSeverity;
  /** Evidence ids (research_evidence rows) or engine evidence claims
   * this challenge is grounded in — empty only for a challenge
   * derived purely from numeric engine output (e.g. a sensitivity-
   * based ALTERNATIVE_CHALLENGE), never empty for an AI-assisted one. */
  evidenceReferences: string[];
  affectedOption: string | null;
  affectedCriterion: ScoreDimensionKey | null;
  suggestedValidation: string;
  status: ChallengeStatus;
  /** Which generator produced this — lets a reader (and the eval
   * suite) distinguish a numeric fact from an AI-assisted judgment
   * without guessing from the prose. */
  source: "deterministic" | "ai-assisted";
}
