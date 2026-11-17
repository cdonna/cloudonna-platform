/**
 * ChallengerProvider — the Model Router pattern applied a third time
 * (brief §24): the exact same shape as intelligence/provider.ts's
 * IntelligenceProvider and research/provider.ts's ResearchProvider —
 * `id`, `model`, one async method. Three independent use cases
 * (narrative enrichment, evidence retrieval, challenge generation)
 * now share one architectural shape, which is what "provider-neutral
 * model interface... architect so future providers can be plugged in
 * without changing the Decision Engine" actually means in this
 * codebase: not a fourth abstraction layer, but the same seam proven
 * three times over. Nothing downstream of this interface ever imports
 * an SDK type.
 */
import type { AiChallenge } from "./schema";

export interface ChallengerContext {
  recommendedOptionId: string;
  recommendedOptionName: string;
  alternativeOptions: Array<{ id: string; name: string }>;
  /** Already-computed, real facts only — never re-derived by the
   * provider, only narrated/judged. */
  topEvidence: string[];
  assumptions: string[];
  risks: string[];
  /** Deterministic challenges already generated, included so the
   * AI-assisted pass can avoid restating the same point — never so
   * it can "improve" or override one. */
  existingChallengeStatements: string[];
}

export type ChallengeGenerationResult = { status: "ok"; challenges: AiChallenge[] } | { status: "disabled" | "unavailable" | "timeout" | "invalid_output"; reason: string };

export interface ChallengerProvider {
  readonly id: string;
  readonly model: string | null;
  generateChallenges(context: ChallengerContext): Promise<ChallengeGenerationResult>;
}
