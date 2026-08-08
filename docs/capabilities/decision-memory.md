# Capability: Decision Memory

**The first capability defined under the new standard** (`docs/engineering/capability-readiness-levels.md`). Everything previously scattered across "Sprint 6.1," "Sprint 6.2," and the System of Record (`docs/company/03-product-strategy.md`) that concerns saving, versioning, comparing, and reproducing a decision is this one capability, described here permanently rather than per-sprint.

## Mission

Turn a computed recommendation into a durable, owned, versioned enterprise asset — one that can answer, honestly, months or years later: what was decided, why, what changed since, and would the same conclusion hold today.

## Customer value

Restated from `docs/company/16-founder-questions.md` #1: the customer is not buying storage. They're buying the ability to answer "why did we decide this" credibly, to a board or a successor, without reconstructing it from memory. Decision Memory is the literal mechanism that makes that promise true rather than aspirational.

## Architecture

Two-table split — `decisions` (mutable pointer: title, status, `current_version_id`) and `decision_versions` (immutable, append-only content) — making "history is never overwritten" a database property, not a convention. Full detail: `docs/architecture/sprint-6.1-freeze.md`. Save path always recomputes the deterministic score server-side, never trusts a client-supplied value. RLS (`is_org_member()`/`is_org_admin()`) is the actual tenant-isolation enforcement, application code is never the boundary.

## Domain model

`Decision` (identity, current pointer) → `DecisionVersion` (immutable content: input, deterministic output, enrichment, provenance) → `VersionDiff` (structural comparison between two versions, domain-aware, never a generic JSON diff) → `ReplayResult` (a fresh recomputation of a historical input against the current engine, compared against what was stored). This chain is Decision Memory's own local instance of the broader eight-stage lifecycle already defined (`docs/founder/08-decision-intelligence-framework.md`): specifically the **Decision** and **Execution**-adjacent stages of that framework, not Information/Knowledge/Evidence (a different, not-yet-built capability) or Outcome/Learning (also separate).

## Dependencies

The deterministic scoring engine (`buildDecisionOutput()`, unchanged since Sprint 5) — Decision Memory never reimplements scoring, only persists and replays its output. Auth and tenancy (a separate, underlying capability — session/organization identity) — Decision Memory assumes `auth.uid()` and `is_org_member()` exist; it does not provide them.

## Security

RLS-scoped read/write, no service-role client, deterministic output always server-recomputed (never trusted from a client), a database trigger (`decisions_check_current_version_match`) guaranteeing a decision's current-version pointer can never be redirected to another decision's version. Full detail and live-verified findings: `docs/architecture/sprint-6.1-freeze.md` §9.

## Enterprise requirements

Immutability provable to an auditor, not just claimed (met, structurally — no UPDATE/DELETE policy exists on `decision_versions` for any role); full provenance per version (engine/schema/knowledge-base version strings, met); tenant isolation verified against a live database (**not met** — see Known Limitations); no service-role bypass anywhere in the write or read path (met).

## Current CRL

**CRL 3, overall — decomposed below, not asserted as one number without justification:**

| Sub-capability | CRL | Why |
|---|---|---|
| Save (create version 1) | 4 — Integrated | Live end-to-end through the real UI/route/repository, quality gates green. Not CRL 5: RLS unexecuted against a live database. |
| Version read/view | 4 — Integrated | Same status as save. |
| Domain-aware diff | 3 — Core logic implemented | Pure, tested in isolation (19 tests); wired into the UI but the UI layer itself carries unresolved coupling debt (per the last architecture review), so the *integration* isn't yet clean enough to call CRL 4 with confidence. |
| Change explanation | 3 — Core logic implemented | Same status as diff — built and tested, integration debt shared with diff. |
| Append new version | 1 — Architecture designed | Planned (`docs/implementation/sprint-6.2-plan.md`), zero code. |
| Real Replay (re-run engine) | 1 — Architecture designed | Same — planned, zero code. What exists today under the name "replay" is actually the version-view sub-capability above, mislabeled. |
| Timeline | 4 — Integrated | Version-events-only, correctly scoped down from an earlier, broader plan. |

**The capability as a whole is CRL 3** because Replay and Append-Version — both named in the capability's own mission statement ("what changed... can I reproduce it") — are not yet implemented at all, and a capability is only as mature as its least-mature required piece.

## Target CRL

**CRL 5** by the close of the current engineering horizon — every sub-capability integrated (CRL 4) and RLS/security verification actually executed against a live database (CRL 5). CRL 6 (production-deployed) is explicitly not targeted within engineering's own control — it requires a founder approval event and real infrastructure provisioning, both outside this capability's own scope.

## Future CRLs

CRL 6 once Sprint 6.1's freeze is formally approved, committed, tagged, and deployed to a real, provisioned environment. CRL 7 once a Founding Customer Program design partner has saved, versioned, and replayed a real decision of their own and confirmed the value, captured per `docs/company/07-customer-learning-system.md`. CRL 8 once real, outcome-linked decision history is accumulating across more than one customer relationship — the point at which Decision Memory stops being infrastructure and starts being the actual compounding moat asset (`docs/founder/04-moat-playbook.md`).

## Roadmap — Sprint 6.2's remaining work, translated into capability language

Per the prior architecture review's revised vertical slicing (`docs/implementation/sprint-6.2-plan.md`), restated as Capability → CRL target → Milestone → Vertical Slice:

| Vertical Slice | Milestone | Target CRL |
|---|---|---|
| A — Decouple & correct (extract `resolveDecisionView()`, fix "replay" mislabeling) | Milestone: *Integration debt cleared* | Raises Diff/Explanation sub-capability from 3 → 4 |
| B — Provenance diff (`changedProvenance` field) | Milestone: *Attribution complete* | Diff sub-capability, within CRL 4, feature-complete |
| C — Append-version backend (RPC, repository, route; no UI) | Milestone: *Versioning write path exists* | Append-Version: 1 → 3 |
| D — Append-version UI | Milestone: *Versioning usable* | Append-Version: 3 → 4 |
| E — Replay engine (domain, pure, no UI) | Milestone: *Reproducibility proven in isolation* | Replay: 1 → 3 |
| F — Replay UI | Milestone: *Reproducibility usable* | Replay: 3 → 4 |
| *(not yet scheduled)* — live RLS execution | Milestone: *Capability verified* | Whole capability: 4 → 5 |

Order unchanged from the prior review: A → B → C → D → E → F, live-RLS verification scheduled once infrastructure exists to run it against.

## Known limitations

No application-level rate limiting on save/append actions; no password reset (a dependency-capability gap, not this capability's own); RLS unexecuted against a live database (the single gap blocking CRL 5); no historical vendor-catalog snapshot (Replay can prove the catalog version changed, cannot reconstruct the exact historical catalog — a disclosed, deferred limitation, candidate for a future Knowledge capability); no audit-log writes for version-creation events (deferred, per the last architecture review's scope correction, until a real approval workflow exists to justify the integration).

## Deferred decisions

Whether `decision_status` grows into a full review/approval lifecycle inside this capability or a separate, later Governance capability (leaning toward the latter, not decided); whether Replay should eventually re-run enrichment as well as the deterministic engine (currently: no, deliberately — non-deterministic prose isn't a meaningful "would this differ" signal); retention policy for old versions (currently: kept indefinitely, a real policy decision for `docs/company/14-founder-decisions.md`, not resolved here).

## Integration points

Downstream: the Decision Detail UI (consumer of the read model and diff engine), the eventual Timeline capability (consumer of version events), a future Outcome Intelligence capability (will reference `decision_versions.id` as its foreign key, not yet built). Upstream: the deterministic scoring engine (Decision Memory calls it, never modifies it), the auth/tenancy capability (Decision Memory assumes it, never re-implements it).

## Success criteria

A user can save a decision, see its full version history, compare any two versions with a domain-aware, attributed diff, and get a real, computed answer — never a guess — to "would Donna recommend the same thing today." Each of these survives being demonstrated to a skeptical enterprise architect without a caveat beyond the ones explicitly disclosed above.

## Commercial readiness criteria

Maps directly onto `docs/company/11-commercialization-gates.md`'s Gate 1/2 criteria for this specific capability: Gate 1 requires CRL 4 across all sub-capabilities plus a disclosed-not-hidden limitations list (this document); Gate 2 requires CRL 5 (live-verified RLS) plus real customer usage evidence (CRL 7) on the append/replay loop specifically, since that loop is the capability's actual differentiator, not just its persistence layer.
