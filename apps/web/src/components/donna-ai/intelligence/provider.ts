import type { IntelligenceRequest, IntelligenceResult } from "./types";

/**
 * The one genuinely pluggable seam in this domain. `DecisionEngine`
 * (compute) has exactly one implementation and always will; this
 * interface is designed for many. It never references anything
 * OpenAI-specific, Supabase-specific, or React-specific — see
 * docs/intelligence/provider-boundaries.md.
 */
export interface IntelligenceProvider {
  readonly id: string;
  /** The model name behind this provider, e.g. "gpt-4o-mini" — null for a
   * provider with no model, like the deterministic template provider.
   * Surfaced in `DecisionReport.provider.model` so the UI (or an audit
   * log) can show exactly what produced a result without depending on
   * any provider-specific type. */
  readonly model: string | null;
  enrich(request: IntelligenceRequest): Promise<IntelligenceResult>;
}
