# Commercialization Gates

Objective, checkable criteria for when ClouDonna is allowed to commercialize — not aspirational milestones, gates. A gate is only "passed" when every criterion underneath it is independently verifiable, not asserted. Mapped honestly against the current, real state of the codebase as of this document (worktree `worktree-sprint-6`, Sprint 6.1 and a narrow Sprint 6.2 slice implemented but **not committed, not merged, not deployed, not founder-approved**).

## Gate 0 — Internal prototype

| Dimension | Criteria |
|---|---|
| Product | Core deterministic scoring + AI narrative loop functions end to end for the beachhead use case. |
| Security | No obviously catastrophic issue (secrets in client bundle, no auth on write paths). |
| Privacy | No persistence of raw prompts/provider responses, structurally. |
| Reliability | Runs locally / in a single deployed environment without crashing. |
| Explainability | Basic reasoning is visible, even if not formalized. |
| Evidence | Evidence sourcing exists in some form, even if illustrative. |
| Support | None required. |
| Legal/commercial | None required — no customer-facing claim being made. |
| Enterprise architecture | None required. |

**Current status: PASSED.** The deterministic engine, AI narrative layer, and the illustrative-catalog disclosure are all live and functioning at `cdonna.com` today.

## Gate 1 — Design partner ready

| Dimension | Criteria |
|---|---|
| Product | A real user (not the founder) can complete the beachhead decision flow unassisted; save/reopen a decision works if persistence is part of the pitch. |
| Security | Auth, tenant isolation, and score-tampering protections implemented and code-reviewed. |
| Privacy | No confidential design-partner data used to populate shared knowledge without explicit consent (`07-customer-learning-system.md`). |
| Reliability | Quality gates (tsc/lint/vitest/build) green from a cold state, consistently — not "was green once." |
| Explainability | Every recommendation traces to its dimension scores and evidence sources, even informally. |
| Evidence | The catalog's illustrative status is disclosed to every design partner explicitly, not assumed obvious (`06-go-to-market.md`'s Founding Customer Program criteria already require this). |
| Support | Founder is directly, personally reachable — no support infrastructure required yet. |
| Legal/commercial | No payment collected; a simple, honest design-partner agreement covering data use exists (see `14-founder-decisions.md`). |
| Enterprise architecture | None required — the product runs as a single-tenant-feeling experience even if multi-tenant underneath. |

**Current status: NOT YET PASSED.** Product criterion partially met (the unauthenticated flow is genuinely usable today; the save/reopen loop is implemented but not deployed anywhere a real design partner could reach). Security criterion **partially met with real, disclosed caveats**: score-tampering protection and tenant isolation (RLS) are implemented and code-reviewed, and three specific findings from this codebase's own Sprint 6.1 review — `current_version_id` cross-decision integrity, the sign-up session-check bug, and the sign-up account-enumeration risk — have been fixed and re-verified. **Still open, and blocking this gate:** no authentication rate limiting exists in any form beyond a documented-as-non-production single-instance limiter; the RLS design has never been executed against a live Postgres instance, so tenant isolation remains a code-review-verified claim, not a test-verified one; no password reset flow exists. Reliability criterion met (quality gates are consistently green). This gate cannot be honestly marked passed until deployment happens and the still-open security items are closed.

## Gate 2 — Paid pilot ready

| Dimension | Criteria |
|---|---|
| Product | Version history, replay, and diff are real and used, not just implemented in a worktree. |
| Security | Rate limiting live; RLS independently verified against a real database, not just designed; audit logging exists for at least save/version events. |
| Privacy | A real, written data-handling policy exists and is shared with the pilot customer — retention, deletion, export. |
| Reliability | Deployed to a real, monitored production environment with an actual uptime track record, even if short. |
| Explainability | The formal Explainability Layer outputs (`docs/sprint-6/23-explainability-layer.md`) are live, not just designed. |
| Evidence | The knowledge graph has begun replacing the illustrative catalog for at least the pilot customer's decision category. |
| Support | A defined response-time commitment exists, even if informal. |
| Legal/commercial | A real pilot agreement, with defined scope, term, and price. |
| Enterprise architecture | Organization/team tenancy (Sprint 6.3) exists, since a pilot customer's team, not one user, needs access. |

**Current status: NOT PASSED.** Most criteria in this gate depend on capability that is roadmap only (Sprint 6.3, Sprint 6.4, formal Explainability Layer) — this gate is realistically a Year 1–2 milestone (`10-three-year-roadmap.md`), not a near-term one.

## Gate 3 — Enterprise production ready

| Dimension | Criteria |
|---|---|
| Product | Full five-system loop (`03-product-strategy.md`) live: intelligence, record, trust, learning (at least outcome capture), action (at least structured next-steps tracking). |
| Security | Independent third-party security review completed; no open high-severity findings. |
| Privacy | A genuine, verifiable compliance posture appropriate to the customer segment — not a claim made without the underlying work, per this codebase's own repeated "no compliance claim is made" discipline (`docs/sprint-6/08-security.md`). |
| Reliability | A real SLA, with a track record supporting it. |
| Explainability | All twelve explainability outputs live and used in real customer conversations. |
| Evidence | Knowledge graph coverage is broad enough that "illustrative" is no longer a caveat needed anywhere in the product for the customer's actual decision categories. |
| Support | A real support function exists, not founder-only. |
| Legal/commercial | Standard enterprise contracting (MSA, DPA) available. |
| Enterprise architecture | SSO, at minimum as a real (not seam-only) capability; audit logging complete and queryable by the customer's own security team. |

**Current status: NOT PASSED**, and realistically not reachable before this roadmap's Year 2–3 (`10-three-year-roadmap.md`).

## Gate 4 — Scale ready

| Dimension | Criteria |
|---|---|
| Product | The System of Learning's compounding assets are demonstrably improving product quality over time — measurable, not asserted. |
| Security | A mature, recurring security review cadence; a track record with no unresolved critical incident. |
| Privacy | Benchmark/data-product-grade anonymization infrastructure live and independently defensible. |
| Reliability | Multi-region or otherwise scale-tested infrastructure appropriate to real enterprise-scale usage. |
| Explainability | Explainability at this scale withstands scrutiny from customers' own audit and compliance functions as routine practice, not a special case. |
| Evidence | Knowledge graph coverage and freshness are a genuine competitive differentiator, evidenced by customer-reported decision quality, not just internal metrics. |
| Support | A real, tiered support organization. |
| Legal/commercial | The higher-trust-risk commercial models (`05-commercial-model.md`) are live, each independently reviewed and operating without incident. |
| Enterprise architecture | Full enterprise IT-governance compatibility (SCIM, granular permissions, etc.) as needed by the largest customers in the portfolio. |

**Current status: NOT PASSED** — Gate 4 is a Year 3+ conversation, not evaluated further here since evaluating it in detail today would be exactly the kind of premature, unearned confidence this document set exists to avoid.

## The honest one-line summary

ClouDonna sits at **Gate 0, passed**, and **Gate 1, not yet passed** — real security hardening has happened and is disclosed accurately above, but deployment, rate limiting, live RLS verification, and a password-reset flow are still required before a real design partner should be onboarded onto the persistence/save capability specifically. The unauthenticated, stateless experience (`cdonna.com` today) is already usable for early relationship-building under Gate 0's criteria, which is precisely why the founder-decisions register (`14-founder-decisions.md`) recommends starting there rather than waiting for Gate 1 to formally close before any customer conversation begins.
