# Sprint 6.1 — Implementation Slice

**Branch/worktree:** `worktree-sprint-6`, based on production `main` @ `b5abcfd` ("ClouDonna Platform Foundation v1" — Sprint 3+4+5, live).

This document is the exact scope actually implemented, written before the code (Phase 1 of this task) and reconciled against it afterward. It is deliberately narrower than the full Sprint 6 vision in `docs/sprint-6/00-current-state.md` through `15-implementation-phases.md` — this is the first real, working, end-to-end slice, not the whole plan.

## What Sprint 6.1 delivers

1. **Supabase client foundation** — browser, server, and middleware clients; no admin/service-role client (see `17-auth-implementation.md`, "Why no admin client").
2. **Authentication** — sign up, sign in (password + magic link), sign out, session refresh, route protection for `/app/*`.
3. **Tenant-safe user profile model** — a new `profiles` table linked to `auth.users`, plus an automatic tenant bootstrap (personal organization, workspace, project) on sign-up.
4. **Explicit Save Decision flow** — a real dialog, gated on authentication, requiring project selection and a title, never automatic.
5. **Persistent, validated `DecisionReport`s** — `decisions` + `decision_versions`, immutable versions, RLS-enforced.
6. **Decision history** — `/app`, `/app/decisions`, `/app/decisions/[id]`, rendering saved decisions through the same components a live result uses.

## What Sprint 6.1 deliberately does not build

Exactly the exclusion list from the task brief, restated here as the record of what was actually honored:

- Approvals, version comparison UI, outcome tracking — schema/UI seams for these exist in the broader Sprint 6 plan but nothing here implements them.
- Marketplace, billing, commissions, partner matching, unrestricted chat, autonomous agents, analytics warehouse — absent, not stubbed.
- Self-service organization creation, invitations, multi-organization switching UI — every user gets exactly one auto-provisioned organization; joining a second one or inviting a colleague is Sprint 6.2 scope (`docs/sprint-6/12-roadmap.md`, Phase 6.2), not built here.
- Enterprise SSO — a documented seam only (`17-auth-implementation.md`).
- Audit logging — Sprint 4's `audit_logs` table exists and is untouched by this slice; no `decisions`/`decision_versions` write in Sprint 6.1 emits an audit event. Disclosed as a real gap, not hidden — see `21-security-review.md`.

## Reconciliation against Phase 1's own review

Before writing code, Phase 1 reviewed: the existing `DecisionReport` contract (`intelligence/types.ts`), the existing `/api/donna-ai/decision` route and its framework-independent handler pattern, the existing wizard/result UI flow, the Sprint 4 schema already in the repository tree, and the existing `.env.example` conventions. Every new piece of Sprint 6.1 follows a pattern already established by one of those, rather than inventing a new one:

| Established pattern (Sprint 5) | Sprint 6.1's reuse of it |
|---|---|
| `server-only` guards on every server-secret-adjacent module | Applied to `lib/supabase/server.ts`, `middleware.ts`, and every persistence module |
| Framework-independent handler + thin route adapter | `handle-save-decision-request.ts` + `app/api/decisions/route.ts` |
| Zod `.strict()` schemas as the runtime validation gate | `save-decision-schema.ts` reuses `decisionInputSchema`/`intelligenceEnrichmentSchema` directly, adds its own `.strict()` schemas for the small new shapes |
| Safe, generic, fixed error messages — never a raw internal error | `classifySupabaseError()` in the repository layer |
| `.env.example` documents every variable, defaults to "runs without it" | Supabase variables added following the exact same comment style |

## A design decision that goes beyond what was literally asked, and why

The task's schema spec for `decision_versions` includes `deterministic_output_json` as data the client sends. Sprint 6.1's actual save path **never trusts that field from the client at all** — `handle-save-decision-request.ts` recomputes it server-side via `buildDecisionOutput(decisionInput.wizardState)`, the same pure function every other code path in this codebase already uses, and persists that instead. This is a stronger integrity guarantee than validating the client's copy could ever provide: it doesn't just check the shape looks plausible, it proves the persisted score is the real, current, unmodified deterministic answer for that input — closing an "edit the JSON before re-submitting" tampering path structurally. Full reasoning in `21-security-review.md`.

## A real bug found and fixed during this slice's own quality gate

`npm run build` initially failed: `/app` was being statically prerendered at build time and crashed calling an unconfigured Supabase client. Root cause: `getCurrentUser()` short-circuits to `null` without calling `cookies()` when Supabase isn't configured, so Next.js's automatic dynamic-route detection never triggered — until a child page called the repository layer directly. Fixed by explicitly forcing `/app/*` and `/donna-ai` to `export const dynamic = "force-dynamic"`, since both render per-session, personalized state that must never be baked into a static file regardless of whether Supabase happens to be configured at build time. Full account in `22-test-report.md`.
