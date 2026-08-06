# Donna Intelligence Engine — Architecture

**Module:** `apps/web/src/components/donna-ai/intelligence/`, `apps/web/src/app/api/donna-ai/decision/`
**Status:** Implemented (contracts, orchestration, deterministic provider, OpenAI provider, UI integration), not committed
**Depends on:** `components/donna-ai/decision-engine.ts`, `engine.ts`, `scoring/`, `vendor-intelligence/` (all Sprint 3, unchanged)

This document now covers the full Sprint 5 implementation (Phases 5.1
through 5.8, completed in one continuous pass after Phase 5.1's initial
review). See `sprint-5-review.md` for the phase-by-phase account of what
shipped when.

## Why this exists

Donna's deterministic scoring engine (Sprint 3) already produces a
complete, evidence-based recommendation. What it does not do is write in
the register a business decision-maker actually reads — richer situation
framing, trade-off narrative, challenge questions. That's a real product
gap, and it's tempting to close it by calling an LLM directly from the
result screen. This module exists to make sure that never happens: every
AI call is forced through a pipeline that cannot let narrative quality
override computed fact — enforced structurally, not by prompt wording
alone.

## The pipeline

```
validate DecisionInput
  → DecisionEngine.evaluate()                 [deterministic, authoritative, unchanged]
  → KnowledgeProvider.buildEvidencePackage()   [bounded selection, nothing invented]
  → IntelligenceProvider.enrich()              [deterministic templates, or OpenAI structured output]
  → schema + reference + numeric-claim + vendor-mention validation
  → merge (narrative fields only)
  → DecisionReport                             [the stable UI contract]
  → ResultPanel's "AI Insights" tab             [rendered, or a clear "unavailable" state]
```

Every stage after "evaluate" can fail, time out, or be skipped entirely —
the pipeline is designed so that every one of those outcomes still
produces a complete, valid `DecisionReport`. See `fallback-and-failure-model.md`.

## Authoritative vs. narrative — the one rule everything else follows

| | Authoritative (`DecisionOutput` / `DeterministicDecisionOutput`) | Narrative (`IntelligenceEnrichment`) |
|---|---|---|
| Produced by | `scoring/engine.ts` + `engine.ts` (Sprint 3, unchanged) | `IntelligenceProvider.enrich()` |
| Contains | `donnaScore`, `confidenceScore`, `dimensions`, ranking, structured risks/opportunities/assumptions/nextSteps/workshops | Prose narration of the same facts, plus questions and framing |
| Can the narrative layer ever change it? | No — not structurally possible. `IntelligenceEnrichment` (`types.ts`) has no numeric field at all. | — |
| What happens if a provider tries anyway? | Rejected before it reaches the UI. | — |

Enforced in four independent places, not just by convention:

1. **Type-level:** `IntelligenceEnrichment` literally has no field that could hold a score.
2. **Schema-level:** `intelligenceEnrichmentSchema` (`schema.ts`) is `.strict()` — an unexpected field (e.g. a smuggled `donnaScore`) fails validation outright.
3. **Content-level:** `findUnsupportedNumericClaims` scans narrative text for a percentage that doesn't match any real computed score.
4. **Content-level:** `findUnsupportedVendorMentions` scans narrative text for a real catalog product name that isn't in this session's shortlist — the "fabricated vendor claim" defense.

## Vendor neutrality

Nothing changes about how vendor neutrality is enforced — it was already
structural in Sprint 3 (every platform scored on the same weighted
dimensions, no field for a commercial relationship to influence). This
domain adds two more guarantees on top: the evidence package a provider
receives (`EvidencePackage.shortlist`) is built by taking the
deterministic engine's own ranking, unmodified — `KnowledgeProvider`
selects from an already-neutral ranking, never re-ranks or curates — and
`findUnsupportedVendorMentions` catches a narrative that names a platform
outside that ranking.

## Module map

| File | Role |
|---|---|
| `types.ts` | Every domain contract |
| `schema.ts` | Zod runtime validation, shared bounds (`ENRICHMENT_BOUNDS`), claim validation |
| `errors.ts` | Fixed, safe-to-display failure reasons |
| `sanitize.ts` | Free-text bounding and injection flagging |
| `provider.ts` | The `IntelligenceProvider` interface |
| `prompt.ts` | The layered prompt builder — pure, no SDK dependency |
| `config.ts` | **server-only** — the one file that reads `process.env` |
| `select-provider.ts` | **server-only** — config → concrete provider |
| `providers/deterministic-provider.ts` | Template-based provider, always succeeds |
| `providers/openai-provider.ts` | **server-only** — the real external provider |
| `knowledge-provider.ts` | Builds `EvidencePackage` from `DeterministicDecisionOutput` |
| `rate-limit.ts` | Rate-limit seam + an in-memory reference implementation |
| `audit.ts` | Metadata-only audit event shape |
| `orchestrator.ts` | `RecommendationOrchestrator` — composition root and fallback owner |
| `handle-decision-request.ts` | **server-only** — framework-independent HTTP handler logic |
| `index.ts` | Barrel export (deliberately excludes the server-only files above — see "Barrel boundary") |

`app/api/donna-ai/decision/route.ts` is the thin Next.js adapter around
`handle-decision-request.ts` — Node.js runtime, the only file that ever
reads `OPENAI_API_KEY` in practice (transitively).

## Barrel boundary

`index.ts` re-exports the provider-independent domain (types, schema,
errors, sanitize, the deterministic provider, the orchestrator) but
**deliberately does not** re-export `config.ts`, `select-provider.ts`, or
`openai-provider.ts`. Those are server-only by design; keeping them out of
the general barrel means anything that imports `intelligence/index.ts`
(a future client component, a test) never accidentally pulls in
credential-adjacent code. Consumers that genuinely need the server-only
pieces (the API route) import them by direct path.

## What this domain deliberately does not do

- Persist anything to Supabase (in-memory only — see "Database boundary" below).
- Implement authentication.
- Allow unrestricted conversation — there is exactly one endpoint, one shape in, one shape out; no chat history, no follow-up turns, no free-form question answering.
- Modify `decision-engine.ts`, `engine.ts`, `scoring/`, or `vendor-intelligence/` in any way.

## Known limitations

- **`DecisionInput.organizationContext` / `desiredOutcomes` / `architectureContext` / `operatingModelContext` are unpopulated.** The wizard doesn't collect this context today.
- **`EvidencePackage.candidateArchitecturePatterns` is always `[]`.** Sprint 4's `architecture_patterns` table exists but isn't wired to this in-memory catalog.
- **No persistence.** `DecisionReport` is constructed and returned; nothing writes it anywhere.
- **The claim-validation heuristics (`findUnsupportedNumericClaims`, `findUnsupportedVendorMentions`) are best-effort**, not a guarantee — a paraphrased or misspelled claim would not be caught. See `fallback-and-failure-model.md`.
- **The in-memory rate limiter resets per server process** — not usable as a real multi-instance abuse control on Vercel's serverless functions. See `cost-controls.md`.
- **No automated test exercises `IntelligenceTab.tsx`'s actual rendering** (no React Testing Library / jsdom dependency was added — deliberately, to avoid an unjustified new dependency for one component). Covered instead by the manual local visual review — see `sprint-5-review.md`.

## Database boundary (Sprint 4 relationship)

Sprint 4's repository layer (`packages/database`) and schema
(`supabase/migrations/`) are the approved persistence baseline and are
available in this worktree, but **nothing in `intelligence/` imports from
`packages/database`.** Every function in this module is pure and
in-memory-testable — verified by the fact that all 92 default-run tests in
`intelligence/__tests__/` run with no database, no network, and no
environment variables. `ai_conversations`/`ai_messages` (already migrated,
unused) are the natural future home for a persisted `DecisionReport`, once
authentication exists to scope who can read it — not before, since every
RLS policy on those tables is keyed on `auth.uid()`, which doesn't exist
yet.
