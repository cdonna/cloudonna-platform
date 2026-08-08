# Sprint 6.1 — Release Manifest

**Status:** Quality gates green, architecture frozen, release boundary verified. Awaiting explicit founder approval to commit, tag, merge, push, or deploy — none of those actions have been taken.

## Release scope

Supabase-backed authentication (email/password + magic link), an automatic per-user tenant bootstrap (personal organization/workspace/project), and an explicit, authenticated save/persist/history capability for Donna AI decisions — turning a stateless recommendation into a durable, versioned, tenant-owned record. Full detail: `docs/architecture/sprint-6.1-freeze.md`.

## Architecture summary

- **Auth:** Supabase Auth via `@supabase/ssr`; server/browser/middleware clients; no service-role client anywhere in the slice.
- **Persistence:** `decisions` (mutable pointer) + `decision_versions` (immutable, append-only) — a deliberate two-table split making "history is never overwritten" a schema property.
- **Save flow:** client submits wizard input only; the deterministic score is always recomputed server-side via `buildDecisionOutput()`, never trusted from the client.
- **Tenant isolation:** RLS via the existing `is_org_member()`/`is_org_admin()` pattern (Sprint 4), no new mechanism invented.
- **Route protection:** enforced at the `app/app/layout.tsx` Server Component, not in middleware — middleware only refreshes the session cookie.

Full diagrams and section-by-section detail: `docs/architecture/sprint-6.1-freeze.md` §1–10.

## Security guarantees (re-verified fresh this session)

| Guarantee | Verified |
|---|---|
| No service-role key in client or source | ✅ `grep` clean |
| No secret leakage in production bundle | ✅ `grep` against `.next/static` clean |
| No console logging in auth/persistence domain | ✅ `grep` clean |
| No raw stack traces returned | ✅ `grep` clean |
| Deterministic output recomputed server-side, never trusted from client | ✅ confirmed in `handle-save-decision-request.ts` |
| `current_version_id` integrity trigger exists and is active | ✅ `decisions_check_current_version_match` present in migration |
| Sign-up no-session flow handled (no broken redirect) | ✅ `data.session` check + `CHECK_EMAIL_MESSAGE` confirmed |
| Duplicate sign-up does not enumerate accounts | ✅ `user_already_exists`/`email_exists` collapsed to identical message |

## Quality gate results (fresh run, this session)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` (`apps/web`) | 0 errors |
| `npx tsc --noEmit` (`packages/database`, separate) | 0 errors |
| `npm run lint` | 0 errors |
| `npm test` (`vitest run`) | 17 files, 132 passed, 1 intentionally skipped, 0 failed |
| `npm run build` | Succeeds — 21 routes, correct static/dynamic split |
| `npm audit --omit=dev` | 0 vulnerabilities |

No regressions found. No code was modified during this verification pass.

## Files included in this release

**Modified (existing files, Sprint 6.1 wiring):** `README.md`, `apps/web/.env.example`, `apps/web/package.json`, `package-lock.json`, `apps/web/src/app/donna-ai/page.tsx`, `apps/web/src/components/donna-ai/DonnaAIExperience.tsx`, `apps/web/src/components/donna-ai/ResultPanel/ResultPanel.tsx`.

**New — application code:** `apps/web/middleware.ts`; `apps/web/src/lib/supabase/{env,browser,server,middleware}.ts`; `apps/web/src/app/{login,signup}/page.tsx`; `apps/web/src/app/auth/{actions.ts,callback/route.ts}`; `apps/web/src/app/app/{layout.tsx,page.tsx,decisions/page.tsx,decisions/[id]/page.tsx}`; `apps/web/src/components/auth/AccountMenu.tsx`; `apps/web/src/app/api/{decisions,save-targets}/route.ts`.

**New — persistence domain (`apps/web/src/components/donna-ai/persistence/`):** `decisions-repository.ts`, `handle-save-decision-request.ts`, `save-decision-schema.ts`, `SaveDecisionDialog.tsx`, plus `__tests__/{decisions-repository,handle-save-decision-request,save-decision-schema}.test.ts`.

**New — tests:** 21 tests across the three files above, all mocked-Supabase-client, no live database required.

## Known limitations — explicit, not hidden

1. **No application-level rate limiting on auth or save actions.** Supabase Auth's own platform-level limits are the only backstop.
2. **No password reset flow.** Only sign-in, sign-up, magic link, and sign-out exist.
3. **RLS policy correctness has not been executed against a live database.** `supabase/tests/sprint6_1_rls_verification.sql` (6 test cases) is written but unrun — no local Postgres instance is available in this environment.
4. **Organization slug collision risk at larger scale.** The 8-hex-char slug space becomes a practically-reachable collision rate (~50%) somewhere past roughly 60–70k total sign-ups.
5. **`profiles` and Sprint 4's `users` table coexist, unreconciled.** A disclosed, deliberate deferral, not an oversight.
6. **No full UI DOM/E2E test layer.** No React Testing Library/jsdom or browser-automation coverage exists; rendered UI is verified by the production build compiling successfully and manual structural review only.
7. **Audit logging is not yet active for Sprint 6.1.** `audit_logs` (Sprint 4) exists and is untouched — no `decisions`/`decision_versions` write emits an audit event.

## Intentionally deferred items

Self-service creation of a second organization; organization invitations; any review/approval workflow; decision comments; version history UI beyond a single-version view; replay; vendor-catalog snapshotting. All are Sprint 6.2+ candidates, none started or partially implemented in this slice.

## Migration files

- `supabase/migrations/20260806130000_sprint6_1_profiles_and_bootstrap.sql` — `profiles` table, `handle_new_auth_user()` trigger (tenant bootstrap).
- `supabase/migrations/20260806130100_sprint6_1_decisions.sql` — `decisions`/`decision_versions` tables, RLS policies, `save_decision()` RPC, `decisions_check_current_version_match` integrity trigger.

Neither migration has been applied to any live Supabase project — no project has been provisioned. Both exist only as files in this worktree.

## Test coverage

17 test files, 132 tests passed, 1 intentionally skipped (a pre-existing Sprint 5 cross-tenant placeholder that requires a live database to close for real), 0 failed. 21 of the 132 are new to Sprint 6.1, covering save-schema validation (including explicit score-override rejection), the save-request handler (auth gating, server-side recomputation, safe error surfacing), and the repository layer (RLS-rejection handling, cross-tenant/missing-decision indistinguishability).

## Exact git commit proposal

```
git add README.md apps/web/.env.example apps/web/package.json package-lock.json \
  apps/web/src/app/donna-ai/page.tsx \
  apps/web/src/components/donna-ai/DonnaAIExperience.tsx \
  apps/web/src/components/donna-ai/ResultPanel/ResultPanel.tsx \
  apps/web/middleware.ts \
  apps/web/src/lib/supabase/ \
  apps/web/src/app/login/ apps/web/src/app/signup/ apps/web/src/app/auth/ \
  apps/web/src/app/app/ \
  apps/web/src/components/auth/ \
  apps/web/src/app/api/decisions/ apps/web/src/app/api/save-targets/ \
  apps/web/src/components/donna-ai/persistence/decisions-repository.ts \
  apps/web/src/components/donna-ai/persistence/handle-save-decision-request.ts \
  apps/web/src/components/donna-ai/persistence/save-decision-schema.ts \
  apps/web/src/components/donna-ai/persistence/SaveDecisionDialog.tsx \
  "apps/web/src/components/donna-ai/persistence/__tests__/decisions-repository.test.ts" \
  "apps/web/src/components/donna-ai/persistence/__tests__/handle-save-decision-request.test.ts" \
  "apps/web/src/components/donna-ai/persistence/__tests__/save-decision-schema.test.ts" \
  supabase/migrations/20260806130000_sprint6_1_profiles_and_bootstrap.sql \
  supabase/migrations/20260806130100_sprint6_1_decisions.sql \
  supabase/tests/sprint6_1_rls_verification.sql \
  docs/architecture/sprint-6.1-freeze.md \
  docs/releases/sprint-6.1-release-manifest.md

git commit -m "feat: Sprint 6.1 — Supabase auth, tenant bootstrap, decision persistence

Adds email/password + magic-link auth, an automatic per-user tenant
bootstrap, and an explicit, authenticated save/version/history path for
Donna AI decisions. Deterministic score is always recomputed
server-side, never trusted from the client. RLS-enforced tenant
isolation via the existing is_org_member()/is_org_admin() pattern.
Known limitations (no rate limiting, no password reset, RLS unverified
against a live database, org-slug collision risk at scale,
profiles/users overlap, no audit logging) are disclosed in
docs/architecture/sprint-6.1-freeze.md and this release manifest."

git tag -a v0.6.1 -m "Sprint 6.1: auth, tenant bootstrap, RLS-enforced decision persistence — frozen"
```

Sprint 6.2 planning documents (`docs/roadmap/sprint-6.2.md`, `docs/implementation/sprint-6.2-plan.md`) and the broader company/founder/constitution strategy documents (`docs/company/`, `docs/founder/`, `docs/constitution/`, `docs/manifesto/`, `docs/roadmap/00`–`10`, `docs/sprint-6/23`–`27`, `docs/design/`) are **deliberately excluded from this commit** — they postdate the freeze and belong to their own commit(s), consistent with "do not mix unrelated sprint scopes in one implementation pass" (`docs/roadmap/02-engineering-operating-model.md`).

## Proposed tag

`v0.6.1`
