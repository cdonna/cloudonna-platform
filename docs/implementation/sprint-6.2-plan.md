# Sprint 6.2 — Implementation Plan

**Status: planning only. Nothing in this document has been implemented as part of this pass.** Supersedes `docs/roadmap/sprint-6.2.md`'s MUST-HAVE list on the two points where this review found it out of step with this sprint's actual mission (decision-status lifecycle expansion, audit-log-backed timeline) — see the architecture assessment for the reasoning; `docs/roadmap/sprint-6.2.md` remains the source for everything else (risks, SHOULD/LATER lists).

## Important correction, load-bearing for everything below

A prior implementation pass in this codebase built version-viewing, structural diffing, and change-explanation capability and **labeled the version-viewing feature "Decision Replay."** It is not. It never re-runs the deterministic engine — it only reconstructs and redisplays a stored historical version, exactly as saved. Real Decision Replay — re-run the *current* engine against a *historical* input and diff the fresh result against the stored one — has not been built yet. This plan corrects the naming and treats the existing work as **Slice 6.2.1's foundation**, not as Slice 6.2.4. Slice 6.2.4 (the real Replay engine) is genuinely new work.

## Slice 6.2.1 — Version read model

**Purpose:** retrieve and display every immutable version of a decision.

**Status:** **Substantially already built**, reused as-is. `decisions-repository.ts` already exports `listDecisionVersions()` and `getDecisionVersionByNumber()`; `DecisionTimeline.tsx` already renders the version list.

**Files expected to change:** none required; `apps/web/src/app/app/decisions/[id]/page.tsx` needs a naming correction only (its "Replay" banner language currently describes version-viewing, not real replay — see Slice 6.2.4).

**Schema changes:** none.

**API changes:** none — existing Server Component data-fetching pattern, no new route.

**Domain logic:** none new.

**Tests:** existing coverage sufficient; add a regression test asserting version ordering is stable (`version_number asc`) if not already explicit.

**Security implications:** none new — inherits RLS from `decision_versions_select`, already verified in the freeze doc.

**Acceptance criteria:** a decision detail page lists every version, oldest first, each showing version number, author, timestamp, and change reason.

**Exclusions:** no pagination (out of scope — no decision is expected to accumulate enough versions in this sprint's timeframe to need it; a real, disclosed limitation if wrong).

## Slice 6.2.2 — Append new version

**Purpose:** let a user explicitly re-run a saved decision and save the result as the next immutable version, never overwriting history.

**Status:** net-new. `save_decision()` (the existing RPC) only ever creates version 1 for a brand-new decision.

**Files expected to change:** a new repository function, `appendDecisionVersion()`, in `decisions-repository.ts`; a new or extended API route (`POST /api/decisions/[id]/versions`); UI: a "Save as new version" action on the decision detail page, reusing `SaveDecisionDialog`'s existing form pattern with a `changeReason` field made prominent rather than optional.

**Schema changes:** a new Postgres RPC — see Architecture Decision 1.

**API changes:** `POST /api/decisions/[id]/versions` — body shape identical to the existing save-decision schema, minus `title`/`organizationId`/`workspaceId`/`projectId` (inherited from the existing decision), plus a required `changeReason`.

**Domain logic:** identical integrity guarantee as the original save path — the deterministic output is recomputed server-side from `decisionInput.wizardState`, never accepted from the client. This is not a new rule; it's the existing `handle-save-decision-request.ts` discipline applied to a second RPC.

**Tests:** version number increments correctly; `current_version_id` updates to the new version atomically; the previous version remains byte-identical and readable; a concurrent double-append does not produce two versions with the same `version_number` (see Architecture Decision 2); unauthenticated/cross-tenant append is rejected.

**Security implications:** the new RPC must be `security invoker` (never `security definer`) — restated explicitly because it's the exact kind of "make something easier" edit the operating model already names as the way RLS erodes (`docs/roadmap/02-engineering-operating-model.md`). Must also re-validate `is_org_member()` — inherited from RLS, not re-implemented in application code.

**Acceptance criteria:** re-running a saved decision and choosing "save as new version" produces version N+1, `current_version_id` now points to it, version N remains unchanged and independently readable.

**Exclusions:** "save as a new, unrelated decision" (a second, already-supported path via the existing `save_decision()` RPC with no `decisionId` — no new work required, out of this slice's scope to build, only to not break).

## Slice 6.2.3 — Domain-aware diff engine

**Purpose:** compare two versions using domain-aware logic — score, confidence, ranking, recommendation, input, constraint, priority, and provenance changes. Not a generic JSON diff.

**Status:** **already built**, reused as-is. `version-diff.ts` (`diffDecisionVersions`) and `score-explanation.ts` (`explainScoreChange`) already implement exactly this — structural, domain-aware, pure functions, zero I/O, already unit-tested (19 tests). This satisfies the prompt's explicit instruction ("do NOT build a generic JSON diff engine — detect score/confidence/ranking/recommendation/input/constraint/priority/provenance changes") as already written.

**Files expected to change:** one addition — provenance version-string diffing (`schema_version`/`scoring_engine_version`/`knowledge_base_version`) is not yet in `version-diff.ts`'s output and is required by Slice 6.2.4 (Replay needs to attribute a difference to "engine changed" specifically). Add a `changedProvenance: FieldChange[]` field to `VersionDiff`.

**Schema changes:** none.

**API changes:** none — this module has no API surface of its own, only consumed by Slices 6.2.1's diff panel and 6.2.4's replay comparison.

**Domain logic:** the provenance-diff addition described above; otherwise reused.

**Tests:** add coverage for the new provenance diff field, mirroring the existing test file's style (`version-diff.test.ts`).

**Security implications:** none — pure function, no I/O, cannot leak anything it isn't given.

**Acceptance criteria:** given two version snapshots with different `scoring_engine_version` strings, the diff surfaces this explicitly, attributable as "engine changed," not folded into the generic score delta.

**Exclusions:** narrative-text line diffing (explicitly out of scope, per `docs/roadmap/sprint-6.2.md`'s own LATER list — unchanged by this review).

## Slice 6.2.4 — Replay engine

**Purpose:** the real Decision Replay. Take a historical `decision_input_json`, run the **current** deterministic engine against it, and compare the stored historical result against the fresh replay result.

**Status:** net-new. Distinct from the existing version-viewer (Slice 6.2.1), which never recomputes anything.

**Files expected to change:** new module `apps/web/src/components/donna-ai/persistence/replay.ts` — a pure function `replayDecisionVersion(storedVersion: VersionSnapshot): ReplayResult` that calls `buildDecisionOutput()` (the same Sprint 5 pure function, unchanged) against the stored `decisionInput.wizardState`, wraps the fresh output as a synthetic `VersionSnapshot`, and returns both alongside a `VersionDiff` (Slice 6.2.3) between them. The `[id]/page.tsx` route gains a genuinely new `?replay=<versionNumber>` mode, distinct from `?version=<versionNumber>` (which remains the existing version-viewer, correctly renamed in its UI copy).

**Schema changes:** none — replay is read-only; it must never write anything.

**API changes:** none required if implemented as a Server Component computation (see Architecture Decision 3) — no new route.

**Domain logic:** the attribution logic named in the important architectural principle — every diff entry between stored and replayed output must be classified as `INPUT_CHANGE` (impossible here by construction, since the input is held constant — replay only varies engine/knowledge/evidence) or `ENGINE_CHANGE` (the `scoring_engine_version` string differs) or, structurally reserved but not populated in this sprint, `KNOWLEDGE_CHANGE` / `EVIDENCE_CHANGE` (see Architecture Decision 8).

**Tests:** replaying an unchanged engine/catalog version against its own stored output produces a diff with `hasChanges: false`; replaying against a fixture with a deliberately bumped `scoringEngineVersion` produces a real, attributed diff; replay never calls any repository write function (a static/lint-level check, or a test asserting the mock repository's write methods are never invoked).

**Security implications:** replay must run under the same RLS-scoped read the version-viewer already uses (a user can only replay a version they could otherwise view) — no new authorization surface, but must be explicitly tested, not assumed inherited.

**Acceptance criteria:** "why would Donna make a different recommendation today than six months ago" has a real, computed, attributed answer — never a bare "results differ."

**Exclusions:** knowledge/evidence historical reconstruction (structurally seamed for, per Architecture Decision 8, not solved this sprint — the vendor catalog itself is not snapshotted, a disclosed limitation carried from `docs/roadmap/sprint-6.2.md`'s own LATER list).

## Slice 6.2.5 — Timeline

**Purpose:** one chronological decision timeline, built from immutable decision versions and relevant audit events, never a competing second source of truth.

**Status:** **partially built, scope corrected.** `DecisionTimeline.tsx` already renders a version-only timeline. This review recommends *not* extending it with `audit_logs` events this sprint — see Architecture Assessment, Scope Changes Recommended.

**Files expected to change:** none beyond what Slice 6.2.1 already covers, if the scope correction is accepted.

**Schema changes:** none this sprint (deferred).

**API changes:** none.

**Domain logic:** none new.

**Tests:** existing coverage sufficient.

**Acceptance criteria:** every version of a decision appears on the timeline in order, with author, timestamp, and change reason.

**Exclusions:** audit-log-sourced events (approvals, status transitions) — deferred until an approval workflow actually exists to produce them; building partial audit integration now for events with no real workflow behind them is exactly the "two sources of truth" risk this slice's own purpose statement warns against.

## Slice 6.2.6 — Replay + comparison UI

**Purpose:** the thinnest possible UI consumer of Slices 6.2.3 and 6.2.4's domain logic — explicitly not where any new domain logic lives, per this sprint's architectural principle ("treat Replay as a domain capability, not a UI feature").

**Status:** partially built, needs correction. `VersionControls.tsx` and `VersionDiffPanel.tsx` exist and are reusable for the version-viewer and diff display; they currently have no path to real replay (Slice 6.2.4) at all.

**Files expected to change:** `VersionControls.tsx` — add a genuinely separate "Replay" action distinct from the existing "view this version" navigation, targeting the new `?replay=` mode; `[id]/page.tsx` — render the replay comparison (stored vs. fresh) using `VersionDiffPanel` when in replay mode; correct all existing UI copy that currently mislabels version-viewing as "replay" (the amber banner's text, specifically).

**Schema changes:** none.

**API changes:** none beyond Slice 6.2.4.

**Domain logic:** none — violation of this principle is the one thing this slice's review should actively watch for during implementation.

**Tests:** none beyond what a build/typecheck catches — this is presentation only; the logic it displays is already tested in 6.2.3/6.2.4.

**Security implications:** none new.

**Acceptance criteria:** a user can distinguish, at a glance, "I am viewing historical version N as it was saved" from "I am seeing what Donna would say about version N's input today" — two different UI states, never conflated.

**Exclusions:** any diff visualization beyond the plain, functional list already built in `VersionDiffPanel.tsx` — per `docs/roadmap/sprint-6.2.md`'s own explicit "do not build a visual UI yet" instruction from the prior planning pass, still correct.
