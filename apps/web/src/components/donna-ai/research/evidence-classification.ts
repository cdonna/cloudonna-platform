/**
 * Evidence Classification (brief §2/§11) — turns one already-validated
 * ProposedClaim (grounded in a real citation by the provider layer)
 * into a full ResearchEvidence draft with provenance filled in.
 * Status is always "proposed" here — nothing in this module ever
 * writes "accepted".
 */
import { RESEARCH_AGENT_VERSION } from "./types";
import { classifyFreshness } from "./freshness";
import type { ProposedClaim, ResearchEvidence, SourceDocument } from "./types";

export function classifyEvidence(claim: ProposedClaim, source: SourceDocument, researchTaskId: string): Omit<ResearchEvidence, "id"> {
  return {
    type: claim.type,
    claim: claim.claim,
    interpretation: claim.interpretation,
    sourceUrl: source.url,
    sourceTitle: source.title,
    publisher: source.publisher,
    publishedAt: source.publishedAt,
    retrievedAt: source.retrievedAt,
    criterionId: claim.criterionId,
    optionId: claim.optionId,
    confidence: claim.confidence,
    freshness: classifyFreshness(source.publishedAt, source.sourceType),
    researchTaskId,
    agentVersion: RESEARCH_AGENT_VERSION,
    status: "proposed",
    metadata: { sourceType: source.sourceType },
  };
}
