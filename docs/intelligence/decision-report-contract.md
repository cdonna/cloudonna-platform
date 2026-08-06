# The `DecisionReport` Contract

**File:** `apps/web/src/components/donna-ai/intelligence/types.ts`

This is the shape every future UI, test, and provider builds against. It
does not depend on React, OpenAI, or Supabase.

## `DecisionInput`

```ts
interface DecisionInput {
  wizardState: WizardState;                       // populated — today's real input
  organizationContext?: OrganizationContext | null; // reserved, unpopulated
  desiredOutcomes?: string[];                       // reserved, unpopulated
  architectureContext?: string | null;               // reserved, unpopulated
  operatingModelContext?: string | null;              // reserved, unpopulated
}
```

`wizardState` is exactly today's `WizardState` (`components/donna-ai/types.ts`)
— no change to the wizard, no new required fields. The four optional
fields are a forward-compatible seam for enterprise context the product
doesn't collect yet; see `donna-intelligence-architecture.md`, "Known
limitations."

Validated by `decisionInputSchema` (`schema.ts`) before anything else
touches it — bounds the free-text note fields at a generous 20,000
characters (an abuse ceiling, not a product limit) and requires
`wizardState.goals.goals` to be an array. A validation failure here throws
— it means the caller passed a malformed `WizardState`, which is a
programming error, not a runtime provider condition.

## `DeterministicDecisionOutput`

```ts
type DeterministicDecisionOutput = DecisionOutput; // type alias, zero redefinition
```

Exactly today's `DecisionOutput` (`components/donna-ai/types.ts`) —
`recommendation`, `alternativeRecommendation`, `alternatives`, `donnaScore`,
`confidenceScore`, `dimensions`, `currentSituation`, `decisionDrivers`,
`executiveSummary`, `positiveEvidence`, `concerns`, `risks`, `opportunities`,
`assumptions`, `nextSteps`, `workshops`. Not one field is added, removed,
or reshaped by this module. This is the load-bearing design decision of
Sprint 5.1: **every existing `ResultPanel` tab keeps working, unmodified,
against `DecisionReport.output`.**

## `EvidencePackage` and `IntelligenceEnrichment`

See `evidence-package.md` and `provider-boundaries.md` respectively.

## `DecisionReport`

```ts
interface DecisionReport {
  output: DeterministicDecisionOutput;   // unchanged shape, always present
  enrichment: IntelligenceEnrichment | null;
  provider: ProviderMetadata;
  fallback: FallbackMetadata;
  generatedAt: string;                    // ISO timestamp
}

interface ProviderMetadata {
  providerId: string;
  model: string | null;   // null for the deterministic provider — templates, not inference
}

interface FallbackMetadata {
  status: EnrichmentStatus; // "ok" | "disabled" | "timeout" | "rate_limited" | "unavailable" | "invalid_output"
  reason: string | null;    // present only when status !== "ok"; fixed, safe-to-display text, never a raw error
}
```

Revised in Sprint 5.2 from an earlier flat shape (`enrichmentStatus`,
`enrichmentFailureReason`, `providerId` as three separate top-level
fields) to these two nested objects — grouped because a UI always reads
"which provider, and did it work" as one decision together, never one
without the other. `EvidenceReference` (used inside
`IntelligenceEnrichment.evidenceReferences`) is a plain `string` type
alias, not a richer object — see `types.ts` for why a richer shape wasn't
worth the added schema surface.

Produced exclusively by `RecommendationOrchestrator.createDecision()`
(`orchestrator.ts`). `output` is present and complete in every single
outcome — `fallback.status` is the only thing that varies. Verified by
test: `orchestrator.test.ts`, "produces byte-for-byte identical
authoritative output regardless of enrichment outcome."

## Field bounds (`IntelligenceEnrichment`)

Centralized in `ENRICHMENT_BOUNDS` (`schema.ts`) so both the Zod schema and
every provider (`deterministic-provider.ts` and, as of Sprint 5.2,
`providers/openai-provider.ts`) read the same numbers — see
`provider-boundaries.md` for the full table.
