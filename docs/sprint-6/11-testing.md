# Sprint 6 — 11. Testing Strategy

Follows the precedent Sprint 5 already established and proved: pure/unit-testable domain logic wherever possible, mocked external services, no live credentials required for the default run, honest disclosure of what isn't automated.

**Status update (architecture extension pass):** this document was written pre-implementation and refers to `decision_reports` (below) — Sprint 6.1 actually tested `decisions`/`decision_versions`. The plan's substance held even though the table names changed: 21 new Vitest tests were written and pass (mocked Supabase client, same discipline described here), including a direct test of the exact "attempted score override rejected" property, and the RLS verification script was written but genuinely not executed (no local Postgres available in the implementation environment) — exactly the gap this document already anticipated in "What requires a real local Supabase instance," now confirmed still open. Full, accurate results: `docs/sprint-6/22-test-report.md`.

## The one genuinely new category: RLS itself

RLS policy logic is SQL, evaluated by Postgres — not unit-testable in Vitest. **Recommendation: a pgTAP or plain-SQL test suite run against a local Supabase instance** (`supabase start`), asserting that a simulated `auth.uid()` can/cannot read or write specific rows. Sprint 5 never needed this category because it had no database; Sprint 6 introduces it as a first-class, required part of the release gate, not an afterthought.

Specific, required RLS tests:

- A member of Organization A cannot read Organization B's `decision_reports` even with a guessed UUID — zero rows returned, not an error that would leak existence. **This is the exact test Sprint 5 left as `it.skip`, with the comment "requires real authentication ... neither of which exists in Phase 5.1." Sprint 6 is where that skip finally becomes a real, passing test.**
- The `decision_reports_one_current_version` unique index rejects a second "current" version under real concurrency (two simultaneous version-saves), not just sequential test calls.
- The immutable-content trigger rejects a direct `UPDATE` of `decision_input`/`deterministic_output`/`enrichment` on an existing row.
- Only `is_org_admin()` can transition a decision to `approved`/`rejected`.
- The self-service `organizations` insert policy (the highest-scrutiny new grant in this plan) creates exactly one organization and exactly one owner membership, atomically — never one without the other.
- Invitation acceptance by an email not matching any pending invitation is rejected.

## What's testable in Vitest, no database required

- The save-boundary validator (`08-security.md`) — pure Zod schema validation, identical in kind to Sprint 5's existing `schema.test.ts`.
- Human-ID formatting, version-number increment logic — extracted as pure functions, tested without I/O, same "domain logic pure, I/O at the edges" discipline `intelligence/` already follows.
- Rate limiting — `@upstash/ratelimit` supports an ephemeral in-memory store for local tests; the `RateLimiter` interface remains mockable exactly as Sprint 5's tests already mock it.
- Decision Replay's diff logic — given two `DeterministicDecisionOutput` objects, does the diff correctly identify score/ranking deltas — pure function, no engine call needed for the diff itself.

## What requires a real local Supabase instance

- Every RLS test above.
- The full auth-flow integration test: sign up → org creation → invite → accept → membership visible — a genuine multi-step interaction between `auth.users`, the sync trigger, and RLS that isn't meaningfully unit-testable in isolation.
- Migration correctness — every new migration run against a fresh local instance in CI (`supabase db reset` + migrate), not just reviewed by eye.

## Required failure-mode tests (mirroring Sprint 5's own discipline)

- Save attempt with no session → rejected.
- Save attempt for an organization the user isn't a member of → rejected by RLS even if application logic were somehow bypassed.
- Rate limit exceeded on a write endpoint → 429, not a raw error.
- Replay against an unchanged engine/catalog version → "unchanged." Replay after a deliberately bumped `scoring_engine_version` fixture → a real, attributed diff.

## Testing implications of the Knowledge Graph, Evidence Engine, and Explainability extensions

Added in the architecture extension pass:

- **Evidence quality and confidence decomposition are pure functions** (`15-evidence-engine.md`'s 8-dimension model, `24-confidence-model.md`'s decomposition) — testable in Vitest with no database, the same "domain logic pure, I/O at the edges" discipline already applied above.
- **Sensitivity analysis (`23-explainability-layer.md`) re-runs the real deterministic engine** — testable exactly like Decision Replay's diff logic already is: given a known input and a perturbed weight set, assert the rank either does or doesn't change, deterministically and reproducibly.
- **The `product_facts_ai_never_self_verifies` constraint (`14-product-knowledge-layer.md`) needs a real Postgres test**, not a Vitest one — attempt an insert with `source_class = 'ai_generated', verification_status = 'verified'`, assert it's rejected. Joins the existing list of RLS/constraint tests that require a local Supabase instance, above.
- **Outcome Intelligence's consent/anonymization fields (`25-outcome-intelligence.md`) need their own RLS tests** once implemented — a `decision_outcomes` row with `retrospective_visibility = 'tenant_private'` must be genuinely unreadable outside its organization, the same property every other tenant-scoped table is already tested for.

## What Sprint 6's testing strategy explicitly does not attempt

- Load/performance testing — no scale target has been set (a product decision, flagged in `12-roadmap.md`, not a testing gap).
- End-to-end browser testing (Playwright/Cypress) — not currently used anywhere in this codebase; introducing it is a real, separate infrastructure decision this document doesn't make unilaterally. A candidate, not a commitment.
