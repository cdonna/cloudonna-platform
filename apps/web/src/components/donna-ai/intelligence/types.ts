/**
 * Domain contracts for the Donna Intelligence Engine (Sprint 5.1).
 *
 * These types depend on nothing outside this domain: no React, no
 * Next.js, no OpenAI, no Supabase, no environment variables. They are the
 * stable shape every future provider, every UI, and every test builds
 * against — see docs/intelligence/decision-report-contract.md.
 */
import type { DecisionOutput, WizardState } from "../types";
import type { ScoreDimensionKey } from "../scoring/types";

// ---------------------------------------------------------------------------
// Input

/**
 * Today, `wizardState` is the only populated field — it is exactly what
 * the existing wizard already collects, unchanged. The other fields are a
 * forward-compatible seam for enterprise context the product does not
 * collect yet (organization identity, explicit desired-outcomes text,
 * architecture/operating-model narrative). Nothing in Phase 5.1 reads or
 * populates them; they exist so the contract does not need a breaking
 * change when the wizard grows to collect this context. See
 * docs/intelligence/donna-intelligence-architecture.md, "Known
 * limitations".
 */
export interface DecisionInput {
  wizardState: WizardState;
  organizationContext?: OrganizationContext | null;
  desiredOutcomes?: string[];
  architectureContext?: string | null;
  operatingModelContext?: string | null;
}

export interface OrganizationContext {
  organizationId?: string | null;
  organizationName?: string | null;
}

// ---------------------------------------------------------------------------
// Deterministic output — an alias, not a redefinition.
//
// DecisionOutput (components/donna-ai/types.ts) already IS the
// deterministic, authoritative output: scores, ranking, dimension
// breakdowns, and the template-generated narrative fields that exist
// today. This alias exists only so this module's contracts can use the
// brief's naming without duplicating or reshaping a single field of it.

export type DeterministicDecisionOutput = DecisionOutput;

// ---------------------------------------------------------------------------
// Evidence package — what the intelligence layer is allowed to see.
//
// Every string and number in this shape is copied from a
// DeterministicDecisionOutput that has already been computed — nothing
// here is newly derived, matched, or scored. See
// docs/intelligence/evidence-package.md.

export interface EvidencePackage {
  decisionContext: {
    goals: string[];
    industry: string | null;
    companySize: string | null;
  };
  /** Primary + up to two alternatives — never the full catalog. See
   * docs/intelligence/evidence-package.md, "Why only three". */
  shortlist: EvidencePlatform[];
  matchedCapabilities: string[];
  candidateSolutionPatterns: string[];
  candidateTechnologyPatterns: string[];
  /**
   * Not yet backed by real data. Sprint 4's `architecture_patterns` table
   * exists but is not wired to this in-memory catalog. Always `[]` in
   * Phase 5.1 — kept in the shape rather than omitted so a future
   * populated version is not a breaking change.
   */
  candidateArchitecturePatterns: string[];
  sourceReferences: EvidenceSourceReference[];
  knownInformationGaps: string[];
  /**
   * Already-computed deterministic facts the enrichment layer narrates
   * but never invents or extends — copied verbatim from
   * DeterministicDecisionOutput, same reasoning as `shortlist` above.
   */
  deterministicRisks: string[];
  deterministicOpportunities: string[];
  deterministicAssumptions: string[];
  deterministicNextSteps: Array<{ text: string; horizon: "now" | "next" | "later" }>;
  deterministicWorkshops: Array<{ title: string; description: string }>;
}

export interface EvidencePlatform {
  id: string;
  name: string;
  overallScore: number;
  dimensionScores: Array<{ key: ScoreDimensionKey; label: string; score: number; weight: number }>;
  positiveEvidence: string[];
  negativeEvidence: string[];
}

export type EvidenceReliability = "primary_source" | "vendor_published" | "analyst_report" | "internal_review";

export interface EvidenceSourceReference {
  platformId: string;
  note: string;
  reliability: EvidenceReliability;
}

// ---------------------------------------------------------------------------
// Intelligence request — the deliberately minimized payload a provider
// actually receives. Distinct from EvidencePackage: the request builder
// (KnowledgeProvider's caller, in the orchestrator) may drop fields from
// the evidence package that exist for the deterministic/audit trail but
// add no value to narrative generation.

export interface IntelligenceRequest {
  evidence: EvidencePackage;
  /** Sanitized, bounded free text from the wizard's own note fields — see
   * sanitize.ts. Never the raw, unsanitized user input. */
  sanitizedNotes: string[];
}

// ---------------------------------------------------------------------------
// Intelligence enrichment — narrative only. No field here may hold a
// number that could be mistaken for an authoritative score, and none of
// them ever reaches the UI as a replacement for the deterministic fields
// they narrate.

export interface IntelligenceEnrichment {
  currentSituation: string;
  businessOutcomes: string;
  decisionDrivers: string[];
  recommendationNarrative: string;
  alternativeNarrative: string;
  keyTradeOffs: string[];
  risksNarrative: string;
  opportunitiesNarrative: string;
  assumptionsNarrative: string;
  missingInformation: string[];
  validationQuestions: string[];
  challengeQuestions: string[];
  suggestedNextStepsNarrative: string;
  suggestedWorkshopsNarrative: string;
  executiveSummary: string;
  confidenceExplanation: string;
  /** Every entry must be a platform id present in the EvidencePackage that
   * produced this enrichment — enforced by schema.ts, not by convention.
   * Kept as a plain string id (not a richer object) deliberately — see
   * `EvidenceReference` below for why. */
  evidenceReferences: EvidenceReference[];
  /** Set by whichever provider produced this enrichment, describing how
   * it was generated (e.g. "deterministic template" vs "AI-enriched") —
   * the orchestrator passes it through unchanged rather than rewriting
   * it, since only the provider knows its own generation method. See
   * providers/deterministic-provider.ts. */
  disclosure: string;
}

/**
 * A platform id referenced by a narrative claim, tracing it back to the
 * `EvidencePackage.shortlist` entry that supports it. Kept as a plain
 * string type alias rather than a richer `{ platformId, claimType }`
 * object deliberately: the only thing ever checked against it
 * (`validateEvidenceReferences` in schema.ts) is set membership against
 * known shortlist ids, and a richer shape would add schema surface with
 * no corresponding validation to justify it. Named as its own type,
 * not just `string`, so call sites read as intentional.
 */
export type EvidenceReference = string;

// ---------------------------------------------------------------------------
// Provider result — every outcome an IntelligenceProvider can produce.
// There is no "partial success" variant: §11/§14 of the Phase 1
// architecture require whole-response validation, and this type makes a
// partial result structurally unrepresentable.

export type EnrichmentStatus = "ok" | "disabled" | "timeout" | "rate_limited" | "unavailable" | "invalid_output";

export type IntelligenceResult =
  | { status: "ok"; enrichment: IntelligenceEnrichment }
  | { status: Exclude<EnrichmentStatus, "ok">; reason: string };

/**
 * A classified failure from a provider adapter, before it becomes an
 * IntelligenceResult. Exists so provider adapters (openai-provider.ts)
 * have one small, honest shape to normalize SDK-specific exceptions into
 * — never a raw error object, never a stack trace, never provider
 * internals. See docs/intelligence/fallback-and-failure-model.md.
 */
export type IntelligenceErrorCode = "timeout" | "rate_limited" | "network_error" | "invalid_response" | "unknown";

export interface IntelligenceError {
  code: IntelligenceErrorCode;
  /** Safe to log, safe to show — never the SDK's own message verbatim. */
  message: string;
}

// ---------------------------------------------------------------------------
// The stable UI contract.

/**
 * Which provider produced (or attempted to produce) the enrichment.
 * `model` is null for the deterministic provider, which has no model —
 * it's templates, not inference.
 */
export interface ProviderMetadata {
  providerId: string;
  model: string | null;
}

/**
 * The fallback outcome, as its own nested object rather than two flat
 * fields on DecisionReport — grouped because they're always read
 * together (a UI checks "did enrichment work, and if not, why" as one
 * decision, never one without the other).
 */
export interface FallbackMetadata {
  status: EnrichmentStatus;
  /** Present only when status !== "ok" — never a raw error message from a
   * provider, always one of the fixed reasons in errors.ts. */
  reason: string | null;
}

export interface DecisionReport {
  /** Unchanged shape — every existing ResultPanel tab keeps working
   * against this without modification. */
  output: DeterministicDecisionOutput;
  enrichment: IntelligenceEnrichment | null;
  provider: ProviderMetadata;
  fallback: FallbackMetadata;
  generatedAt: string;
}
