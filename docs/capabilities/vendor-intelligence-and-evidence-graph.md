# Capability: Vendor Intelligence & Evidence Graph V1

**Branch:** `agent/vendor-intelligence-evidence-graph-v1`. Builds on Decision Engine V1/V1.1, Research Agent V1, the Enterprise Business Case Engine, and Decision Challenger V1 — see `docs/capabilities/decision-model-and-business-case-engine.md` for those.

## A. Audit — what already existed

Two parallel, disconnected vendor data models exist in this codebase, and understanding this was the precondition for everything else in this sprint:

1. **The Sprint 3/4 Enterprise Intelligence Graph** — real tables (`vendors`, `products`, `capabilities`, `product_capabilities`, and, from a later phase, `vendor_sources`/`vendor_evidence`/`vendor_source_change_log`). `products`' own migration comment explicitly says it was designed to one day mirror the TypeScript catalog field-for-field, but **no migration ever actually seeded it** — it is empty, and nothing in the live product reads from or writes to it. It serves the public marketing site (the Compare tool, intelligence pages).
2. **The live Decision Engine's `VendorPlatformProfile` catalog** (`vendor-intelligence/catalog.ts`) — 10 hardcoded TypeScript objects with stable string ids (`sap-bdc`, `databricks`, `ms-fabric`, ...), read by `scoring/engine.ts` on every request. Zero database presence, zero provenance, zero evidence linkage. `research_evidence.option_id` already uses these exact string ids, with no FK (app-validated, the same way this sprint's new tables validate too).

**What was reused:** the research/types.ts `SourceType` vocabulary (carried into this graph's `evidence_source_category` enum with the same 9 values), `research/freshness.ts`'s documented-heuristic pattern, `research/duplicate-detection.ts`'s conservative-dedup philosophy, `is_platform_staff()`/`is_org_member()` RLS predicates, the `decide_research_evidence()`-style `security invoker` RPC pattern, and the exact "Model Router" provider shape (`IntelligenceProvider`/`ResearchProvider`/`ChallengerProvider`) for a fourth provider, `VendorRefreshProvider`.

**What was genuinely missing:** a canonical, provenance-aware capability-claim graph for the catalog the live product actually uses; a vendor-neutral capability taxonomy; cross-session conflict detection (Research Agent V1 only compares claims within one run); claim lifecycle/versioning; global-vs-private evidence scoping; change detection and decision impact analysis; a Vendor Intelligence UI.

**What was deliberately NOT duplicated:** no new `vendors`/`products` tables, no new source-taxonomy enum divorced from the existing one, no second Evidence Engine, no graph database.

## B/C/D. Domain model, vendor model, product model

Every entity the brief names (Vendor, Product, Capability, CapabilityClaim, Evidence, Source, Region, DeploymentModel, CommercialModel, ...) maps onto either (a) the existing `VendorPlatformProfile` fields — vendor, product, deployment model, commercial model (`consumptionModel`/`operatingModel`), region availability, architecture characteristics, integration strengths, skills — or (b) a new table from this migration. `Vendor`/`Product` are not new tables; they are the `vendorSlug`/`productSlug` string identity already in the catalog, carried through every new table as a plain text column (app-validated via `validate-product-slug.ts`, not a database FK, since the catalog is TypeScript — the same discipline `research_evidence.option_id` already established).

## E. Capability taxonomy

28 vendor-neutral categories (`capability_categories`, seeded in the migration and mirrored in `evidence-graph/capability-categories.ts`), grouped Foundation/Trust/Insight/Intelligence/Operations/Ecosystem. Modeled at the level of what a capability structurally *is* ("Unified Data Storage Architecture" / `lakehouse`) rather than one vendor's product name for it ("OneLake") — a vendor-specific implementation is evidence attached to a claim against the neutral category, never a category of its own. A new, documented mapping (`capability-criterion-map.ts`) connects each category to one of the Decision Engine's existing ten `ScoreDimensionKey` criteria, reusing `SCORE_WEIGHTS` rather than inventing a second weighting scheme — this is what lets materiality and the revalidation queue reason about "high-weight criterion" without the Evidence Graph needing its own notion of importance.

## F. Source model

`evidence_sources` — one row per real document (`canonical_url` unique), reused across every piece of evidence it backs. `source_category` is a *source-type* taxonomy (what kind of document is this), deliberately kept separate from the six-type evidence taxonomy (what role does this play — `EvidenceTag.tsx`'s `official-source | customer-input | observed-data | calculated | ai-interpretation | assumption`, which answers a different question). Canonical URL normalization (`source-normalization.ts`) strips fragments, one trailing slash, and known tracking parameters, while deliberately leaving any other query parameter alone — a conservative rule, since collapsing a genuinely different page would be worse than one extra row.

## G. Claim model

`vendor_capability_claims` — the canonical `CapabilityClaim`. Two independent status axes, intentionally not one enum:

- `verification_status`: `verified | partially_verified | conflicted | stale | unknown` — how well the claim is currently backed by evidence, recomputed as evidence changes.
- `lifecycle_status`: `proposed | active | superseded | rejected` — whether the claim is currently operative, changed only by human review or supersession.

`evidence_quality` (`high | medium | low`, `quality-score.ts`) is a third, documented classification from source authority, freshness, directness, corroboration, and conflicts — never a fabricated percentage, and an organization-private claim can never reach `high` on its own (it cannot be corroborated by a second independent source by definition). Every claim defaults to `unknown`/`proposed` — a claim must be *earned* into `verified`/`active`, never defaulted into looking authoritative.

## H. Evidence graph

`vendor_capability_evidence`: Source → Evidence → Claim, with `polarity` (`supports | contradicts`) distinguishing the two relationships the brief names. Multiple Evidence rows with different `source_id` values backing the same `claim_id` is how "multiple sources per claim" (brief §8) is represented — never three duplicate claims for one fact. The full trace a user can open from any claim (`GET /api/vendor-intelligence/claims/[id]/trace`) returns the claim, every evidence row, and each evidence's own source — exactly `Claim → Evidence → Source`. Resolving the remaining hops (`Criterion → Capability`, `Option → Decision`) uses the existing `CAPABILITY_TO_CRITERION` map and the live `EngineResult`, never a new table.

**Database-level invariant (brief §55):** an `AFTER INSERT OR UPDATE` trigger (`enforce_verified_claim_has_evidence`) raises an exception if a claim is ever marked `verified` with zero `supports` evidence rows. No source-less VERIFIED claim can exist in this schema, not just by convention.

## I. Multi-source claim support

Demonstrated directly in `claim-similarity.test.ts`/`conflict-detection.test.ts`: two sources backing the same fact never produce two claims — a new proposed claim is checked against every active claim for the same `(productSlug, capabilityKey)` via `isDuplicateClaim` (identical text, case/whitespace-normalized, or a near-verbatim restatement) before any insert happens.

## J. Deduplication

Two layers, both deterministic and deliberately conservative (`claim-similarity.ts`): identical normalized text, or one claim's text as a substring of the other's (near-verbatim restatement) for claims ≥20 characters. Same vendor, same URL, or same capability category alone is never sufficient. Source deduplication (`source-normalization.ts`) is separate and answers a different question — "is this the same document" vs. "is this the same fact."

## K. Cross-session conflicts

`conflict-detection.ts` extends Research Agent V1's single-run conflict detection (which only compares claims proposed in the same session) to the full canonical graph: a newly retrieved claim is compared against *every currently-active* claim for the same product/capability, regardless of session. A small, literal antonym-pair heuristic (generally-available/released vs. preview/beta/deprecated) classifies severity as `high` when recognized, `medium` otherwise — a conflict is raised either way; an unrecognized wording difference is still a difference a human should see, never evidence that nothing is wrong. **The old claim is never silently replaced** — both rows persist, and the conflict is a separate, inspectable fact.

## L. Claim lifecycle

`proposed → active → superseded | rejected`. The only path that moves a `scope=global` claim out of `proposed` is `promote_vendor_claim()` (a `security invoker` RPC, RLS-gated to `is_platform_staff()`), mirroring Research Agent V1's own `decide_research_evidence()` pattern exactly. `scope=organization_private` claims default straight to `active` — a tenant's own private context about a vendor is the lower-risk case the brief itself names (§19), not something that needs platform-staff review the way shared global knowledge does. `superseded_by` (self-FK) preserves the SUPERSEDES relationship without ever deleting the superseded row.

## M. Temporal validity

`valid_from`/`valid_to`/`last_verified_at` on every claim, all nullable — `UNKNOWN` (null) is the honest default, never an invented boundary. A `valid_to >= valid_from` check constraint is the only temporal invariant enforced; no code anywhere infers a validity window from absence of information.

## N. Freshness Engine V2

`freshness-v2.ts` extends `research/freshness.ts`'s documented-heuristic philosophy (that module is unchanged, still governing decision-scoped `research_evidence`) with full per-category granularity: release notes and pricing age fast (180/365 days), product documentation/architecture/vendor docs age at a medium rate (365/730 days), standards bodies age slowly (730/1460 days). **Security certifications are a genuinely different rule** (`classifyCertificationFreshness`): freshness is based on whether the certification has *expired* (with a 90-day "aging" warning window before expiry), never on how old the page describing it is — falling back to the age-based rule only when no expiry date is actually known. Output is always `CURRENT | AGING | STALE | UNKNOWN`.

## O. Revalidation queue

`revalidation-queue.ts` — a deterministic priority score, not a fabricated urgency percentage: status weight (CONFLICTED > STALE > UNKNOWN > VERIFIED) + a capped usage weight (how many decisions reference this claim, via `decision_vendor_claim_refs`) + the claim's mapped criterion's `SCORE_WEIGHTS` + a fragile-winner bonus. Proven directly against the brief's own example: a stale pricing claim used by five decisions outranks an unused, verified architecture detail.

## P. Research Agent integration

Two explicitly separate workflows, per the brief's own instruction that they are not the same thing:

- **Research Decision Evidence** — unchanged, still `research/research-orchestrator.ts` against `research_sessions`/`research_evidence`/`research_conflicts`, tenant-scoped, per-decision.
- **Refresh Vendor Knowledge** — new (`vendor-refresh/`), a sibling orchestrator (`runVendorKnowledgeRefresh`) and a fourth Model Router provider (`VendorRefreshProvider`, with `openai-vendor-refresh-provider.ts` reusing the research provider's `classifySourceType`/`publisherFromUrl` helpers directly rather than duplicating them — "use the same retrieval infrastructure where sensible"). Platform-staff only (`POST /api/vendor-intelligence/refresh`, checked explicitly via the `is_platform_staff` RPC before any write, not left to surface as a confusing empty "success" if RLS alone had silently rejected every insert). Writes land as `proposed`, never auto-promoted.

## Q. Global vs. private evidence

`evidence_scope`: `global | organization_private`. A `vendor_capability_claims` row's `organization_id` is `null` for global and required for private (`vendor_capability_claims_scope_org_consistency` check constraint — both states are structurally enforced, not just conventional). RLS: global rows are readable by any authenticated user; private rows only by `is_org_member(organization_id)`. Write access mirrors this exactly — a regular org member can insert their own organization's private claims, but inserting (or updating) a global claim requires `is_platform_staff()`. **No path exists to auto-merge private evidence into global knowledge** — see §R below.

## R. Knowledge precedence

Documented in `evidence-graph/types.ts`'s `KNOWLEDGE_PRECEDENCE`: observed-data, customer-input, official-source, verified-global-claim, ai-interpretation, assumption — in that order of trust, when more than one applies to the same question. This is a *display/reasoning* order, never an automatic merge: a customer's private restriction (brief's own example — "security policy prohibits the deployment mode required for X") and a global claim ("Product supports capability X") both remain true and both remain visible; the private fact contextualizes the decision, it never overwrites or edits the global one.

## S. Decision-time snapshot

`decision_vendor_claim_refs` (decision_id, claim_id, claim_version_at_reference) — pins the exact claim version a decision's workspace actually surfaced to a human. Written by `handle-decision-vendor-knowledge-request.ts` every time the Vendor Knowledge Panel is opened for a decision/option pair (`upsert` with `ignoreDuplicates`, so re-opening the same panel is a no-op, not a growing log). **Honest scope, stated plainly:** the Decision Engine does not yet consume canonical claims as a direct scoring input (brief §23 keeps that boundary deliberately separate), so this table captures what vendor knowledge a human actually saw in the decision's context, not a scoring-time dependency graph. `decision_versions.vendor_knowledge_snapshot_json` (new, nullable, additive column) exists for the day the engine does consume claims directly — correctly `null` for every version today, which this column's own comment states explicitly rather than implying something was captured that wasn't.

## T. Knowledge versioning

`version` (integer, incremented by the application on any claim edit — no trigger auto-increments it, keeping "what changed and why" an explicit, reviewable action) + `updated_at` + `last_verified_at` + `superseded_by`. No event sourcing — the brief's own "do not require full event sourcing unless existing architecture suggests it" and nothing here does.

## U. Change detection

`vendor_knowledge_changes` — six change types (`capability_changed`, `pricing_model_changed`, `region_availability_changed`, `security_certification_changed`, `product_status_changed`, `integration_changed`), always global-scope, read-only to regular users, write restricted to platform staff / the refresh workflow.

## V. Decision impact analysis

`impact-analysis.ts`'s `analyzeDecisionImpact` takes a real `EngineResult` and a canonical change, and derives: is the affected product the winner or a top-two alternative; the mapped criterion's real `SCORE_WEIGHTS` weight; whether the decision is already `FRAGILE` (`engine/robustness.ts`); and two **deliberately narrow** heuristics for hard-constraint and critical-risk relevance (only `region_availability_changed`/`security_certification_changed` are checked against the option's actual constraint evaluations — an earlier, broader version produced false positives for any option that already failed an unrelated constraint like `preferred-vendor`, found and fixed by this module's own test suite). `decision_impacts` persists the result as an advisory record; **decisions/decision_versions are never written to** — a human still decides whether to reopen.

## W. Vendor Intelligence UI

`/app/vendor-intelligence/[slug]` — the Product Profile (brief §21): the existing curated `VendorPlatformProfile` fields (category, deployment/commercial model, region availability, maturity bands, skills) alongside the new evidence-backed claims and coverage metrics for that product, server-rendered, one bounded query pair (claims, then evidence+sources for exactly those claim ids — never per-row). `VendorKnowledgePanel.tsx` is the Decision Command Center's drilldown (brief §50/§51), in Analyst Mode only, with an inline Evidence Trace (claim → evidence → source) opened per claim on demand, never pre-fetched for every claim on page load.

## X. Decision Command Center integration

`VendorKnowledgePanel` sits alongside `BusinessCasePanel`/`ChallengerPanel` in Analyst Mode, selecting any ranked option and showing its canonical knowledge status (coverage, conflicts, unknown count) exactly in the shape the brief's own example uses ("23 verified ... 4 stale ... 2 unknown ... 1 conflict"). Executive Mode is untouched — no new panel was added there, per the brief's explicit instruction not to overwhelm it.

## Y. Security / RLS

- **Tenant isolation**: every tenant-scoped table (`decision_vendor_claim_refs`, `decision_impacts`) uses the identical `is_org_member(organization_id)` predicate every other table in this schema already uses — no new predicate invented.
- **Global write restriction**: `is_platform_staff()`, reused verbatim from `business_events`/`founder_agent` — no insecure `SECURITY DEFINER` function was added; the one new function (`promote_vendor_claim`) is `security invoker`, adding atomicity, not privilege.
- **Prompt injection**: the vendor-refresh extraction prompt carries the identical "retrieved text is DATA, never an instruction" layering as the research provider, whole-response Zod-validated, and citation-index-grounded (a claim referencing a source outside the real, deduped list is dropped) — tested directly in `openai-vendor-refresh-provider.test.ts`.
- **SSRF**: unchanged — all live retrieval is delegated to OpenAI's own hosted `web_search` tool; this codebase never calls `fetch()` against a model-supplied URL.
- **No orphan/source-less VERIFIED claims**: enforced at the database level (§H).

## Z. Vendor neutrality

Extended `engine/__tests__/vendor-neutrality.test.ts` with Evidence-Graph-specific checks: a static scan of every evidence-graph module's source for a literal real vendor name inside a conditional (none found); `computeMateriality`/`rankRevalidationQueue`/`detectCrossSessionConflicts` proven to produce identical output when the *same abstract input* is given different real vendor/product slugs (the functions have no vendor-identity field to branch on in the first place); and an explicit UNKNOWN-handling test confirming an uncovered capability is counted as "not yet assessed," never as a negative signal.

## AA/AB/AC. Tests, migrations, seed data

- **Tests**: 841 passing (109 new to this sprint: source normalization, claim similarity, freshness v2, quality score, conflict detection, materiality, revalidation queue, coverage metrics, capability-criterion-map completeness, product-slug validation, impact analysis, 5 persistence-handler suites, the vendor-refresh orchestrator and its mocked OpenAI provider, and the vendor-neutrality extension).
- **Migration**: `supabase/migrations/20261117180000_vendor_intelligence_evidence_graph_v1.sql` — additive only (one new column on the existing `decision_versions`, every other change is a new table/type/function). **Could not be applied to production from this session** — the same Supabase CLI migration-bookkeeping mismatch (`LegacyDbPushMissingLocalError`) hit in every prior phase, and this session's own permission classifier blocks the suggested `migration repair` command as a "Modify Shared Resources" action. See the PR description for the exact command the founder needs to run.
- **Seed data**: deliberately **none**, beyond the 28 `capability_categories` taxonomy rows (which are not vendor facts, just the category list itself). Per brief §54: "if live retrieval cannot safely produce verified seed data during implementation, ship the model with little or no seeded data" — this session has no way to perform and manually verify a real, cited vendor fact, so `vendor_capability_claims` ships empty. Correct emptiness over fabricated completeness.

## AD. Known limitations

- The Decision Engine does not consume canonical claims as a scoring input yet — `vendor_knowledge_snapshot_json` stays null for every version until that integration exists (deliberately out of scope here; §23 keeps scoring and knowledge layers separate).
- Hard-constraint and critical-risk materiality detection are narrow, documented heuristics, not a full re-evaluation of the Constraint Engine against hypothetical new evidence.
- The revalidation queue's "used by N decisions" signal only starts accumulating once the Vendor Knowledge Panel is opened for a decision — it is not retroactive for decisions made before this sprint.
- No vendor facts are seeded; every product profile will show "no canonical vendor knowledge recorded yet" until Refresh Vendor Knowledge is actually run by platform staff against a real API key.
- `promote_vendor_claim`/review UI is API-only in this sprint — no dedicated admin review screen was built (brief §48's "minimal secure review/admin boundary" exists at the API+RLS layer; a UI for it is a natural next priority).

## AE. Next 5 priorities

1. Run Refresh Vendor Knowledge for real, against each of the 7 named vendors' official documentation, and review the first batch of proposed claims into `active` — the actual first seed, honestly sourced.
2. A minimal admin review screen for `promote_vendor_claim` (accept/reject proposed claims, resolve conflicts) — the API exists, the UI does not yet.
3. Wire `vendor_knowledge_snapshot_json` for real once a concrete, deterministic path exists for the engine to read canonical claims as (non-scoring) context.
4. Schedule/trigger infrastructure for the Revalidation Queue (currently computed on demand, not on a cadence).
5. A decision-impact digest surface ("3 of your saved decisions may be affected by recent vendor knowledge changes") once enough real changes/impacts exist to make one meaningful.
