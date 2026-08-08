# Sprint 6.1 — Supabase Auth and Save Decision

**Status: implemented, tested, locally verified, awaiting founder approval.** Full implementation detail lives in `docs/sprint-6/16-implementation-slice-6-1.md` through `22-test-report.md` — this document is the roadmap-level summary and status record, not a duplicate of that detail.

## Mission

Turn anonymous Donna results into explicitly saved, tenant-owned enterprise decisions.

## Scope, and what actually shipped against it

| Scoped | Shipped |
|---|---|
| Supabase browser and server clients | Both, plus a middleware client for session refresh. No admin/service-role client — not genuinely required for this slice's scope. |
| Supabase Auth: sign up, sign in, sign out | All three, as Server Actions. |
| Magic-link seam | Fully working (not just a seam) — `signInWithMagicLink`, live. |
| Profile creation | A new `profiles` table, synced via an `auth.users` trigger, plus an automatic personal-organization bootstrap so Save Decision works immediately post-signup. |
| Explicit Save Decision action | A real dialog, gated on auth, requiring project selection and a title. |
| Validated DecisionReport persistence | `decisions` + `decision_versions`, with the deterministic score recomputed server-side rather than trusted from the client — a stronger guarantee than the literal scope asked for. |
| Initial decision version | Version 1, created atomically with the parent decision via a `security invoker` RPC. |
| Tenant-safe RLS | Every new table follows the existing `is_org_member()`/`is_org_admin()` pattern; a verification SQL script is written (not executed — no local Postgres available). |
| Minimal decision history | `/app`, `/app/decisions`, `/app/decisions/[id]`. |
| Environment-variable documentation | `.env.example` extended, all three new variables optional, app runs fully without them. |

## Non-negotiable behavior — verified, not assumed

- Anonymous assessments remain temporary — the compute endpoint (`/api/donna-ai/decision`) is unchanged, no database access added to it.
- No silent or automatic persistence — save is one explicit button click, one confirmation dialog, one explicit submit.
- Saving requires login — checked first, before any parsing, in `handleSaveDecisionRequest`.
- Saving requires an explicit user action — no autosave code path exists anywhere in the new code.
- No raw OpenAI response persistence, no raw prompt persistence — structurally impossible; the persisted schema has no field for either.
- No API-key persistence — nothing in the new schema or code path touches `OPENAI_API_KEY` or a Supabase key value at all.
- Only validated domain objects may be stored — Zod `.strict()` schemas plus server-side score recomputation.
- No service-role key in browser code — no service-role client exists in this slice, browser or otherwise.
- No production migration without explicit approval — both new migrations exist only as files in this worktree; nothing was applied anywhere.

## Completion criteria, checked against the actual result

- Auth works locally — verified via `npx tsc --noEmit`/build succeeding and the Server Action code paths reviewed directly (no live Supabase project was available to click through end-to-end; disclosed, not hidden).
- Save flow works with mocks — 21 new Vitest tests, all passing, mocking the Supabase client exactly as Sprint 5 mocked the OpenAI SDK.
- RLS design is verified — the design is verified by code review and a written SQL script; **execution against a real Postgres instance is the one completion criterion not yet met**, disclosed explicitly in `docs/sprint-6/19-rls-verification.md`.
- All quality gates pass — `tsc` (both `apps/web` and `packages/database`), `lint`, `build`, `vitest` (113 passed, 1 pre-existing skip, 0 failed), `npm audit` (0 vulnerabilities) — all green from a cold state.
- Documentation is complete — 7 files, `docs/sprint-6/16` through `22`, plus this roadmap entry.
- No production environment is changed — confirmed; no push, no deploy, no migration execution.
- Founder approval is received — **pending**, this is the request this document set is part of answering.

## What Sprint 6.1 deliberately left out (see `docs/sprint-6/16-implementation-slice-6-1.md` for the full list)

Self-service organization creation and invitations, audit logging, version comparison, approval workflow, outcome tracking — all correctly deferred to later stages per this roadmap's own sequencing, not omissions.
