/**
 * ResearchProvider — the seam between the deterministic research
 * pipeline and whatever actually performs live retrieval, mirroring
 * intelligence/provider.ts's IntelligenceProvider. research-orchestrator.ts
 * depends only on this interface, never on the OpenAI SDK directly.
 */
import type { ResearchTask, RetrievalResult } from "./types";

export interface ResearchRetrievalContext {
  /** Real option names, for building a precise search query — never a
   * raw internal id shown to the model as if it were the question. */
  optionName: string | null;
  criterionLabel: string | null;
  /** Already-accepted claims for this exact option/criterion cell, so
   * the extraction call can flag a genuine contradiction instead of
   * proposing a near-duplicate of something already accepted. */
  existingAcceptedClaims: string[];
}

export interface ResearchProvider {
  readonly id: string;
  readonly model: string | null;
  retrieveAndExtract(task: ResearchTask, context: ResearchRetrievalContext): Promise<RetrievalResult>;
}
