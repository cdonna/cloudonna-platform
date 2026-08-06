/**
 * Fixed vocabulary of reasons an enrichment attempt did not produce
 * "ok". Every one is safe to show, log, or return from an API route
 * verbatim — none of them ever wraps a raw provider error message, a
 * stack trace, or anything that could contain a secret. See
 * docs/intelligence/fallback-and-failure-model.md.
 */
export const ENRICHMENT_FAILURE_REASONS = {
  disabled: "No intelligence provider is configured — showing the deterministic result only.",
  timeout: "The intelligence provider did not respond in time — showing the deterministic result only.",
  rate_limited: "The intelligence provider is temporarily rate-limited — showing the deterministic result only.",
  unavailable: "The intelligence provider is temporarily unavailable — showing the deterministic result only.",
  invalid_output:
    "The intelligence provider's response did not pass validation — showing the deterministic result only.",
} as const;

export type EnrichmentFailureCode = keyof typeof ENRICHMENT_FAILURE_REASONS;

/**
 * Thrown only by programming errors inside this domain (e.g. a
 * KnowledgeProvider called before a DeterministicDecisionOutput exists).
 * A provider failing to enrich is NOT an error — see IntelligenceResult
 * in types.ts, which models that as data, not an exception.
 */
export class IntelligenceDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntelligenceDomainError";
  }
}
