/**
 * The always-available fallback ResearchProvider. Unlike
 * intelligence/providers/deterministic-provider.ts (which can
 * genuinely narrate from already-computed data with zero network
 * access), there is no deterministic way to "research the live web" —
 * so this provider does not pretend to. It honestly reports
 * retrieval_failed with a clear reason, exactly the brief's own error
 * taxonomy (§32: "If web research fails: do not invent evidence"),
 * rather than returning a fabricated or templated "source."
 */
import type { ResearchProvider } from "../provider";
import type { RetrievalResult } from "../types";

export const deterministicResearchProvider: ResearchProvider = {
  id: "research-disabled",
  model: null,

  async retrieveAndExtract(): Promise<RetrievalResult> {
    return { status: "retrieval_failed", reason: "No research provider is configured." };
  },
};
