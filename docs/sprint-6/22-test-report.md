# Sprint 6.1 — Test Report

## Summary

| Gate | Result |
|---|---|
| `npx tsc --noEmit` (`apps/web`) | 0 errors |
| `npx tsc --noEmit` (`packages/database`, run separately per the task's own instruction) | 0 errors |
| `npm run lint` | 0 errors (2 real issues found and fixed — see below) |
| `npm run build` | Succeeds (1 real bug found and fixed — see below) |
| `npx vitest run` | 15 test files, 113 passed, 1 skipped, 0 failed |
| `npm audit` | 0 vulnerabilities |

## New test files (21 new tests, all passing)

| File | Tests | Covers |
|---|---|---|
| `persistence/__tests__/save-decision-schema.test.ts` | 9 | Valid request accepted; missing/blank title rejected; invalid UUID rejected; **attempted score override rejected** (`output` field, `.strict()`); unknown top-level field rejected; malformed provider/fallback metadata rejected; optional `changeReason` accepted. |
| `persistence/__tests__/handle-save-decision-request.test.ts` | 8 | Unauthenticated request rejected before any database call; malformed body → safe 400; extra-field (score-override) rejected; valid save → 200 with id/humanReadableId; **server-side recomputation of the deterministic output** (not trusting any client value); provenance version strings passed through; RLS rejection surfaced as a safe generic message, never the raw Postgres error; wizard-state note content never appears in any error response. |
| `persistence/__tests__/decisions-repository.test.ts` | 4 | RLS rejection → safe reason, not the raw message; successful save shape; empty evidence-references array when enrichment is null; **cross-tenant and truly-missing decisions are indistinguishable** (`getDecisionDetail` returns the same generic "not found" for both). |

Every new test uses a mocked Supabase client (a minimal fake satisfying only the methods actually called — `.rpc()`, or a chained `.from().select().eq().maybeSingle()`), never a real database connection, following the exact precedent Sprint 5 already established for mocking the OpenAI SDK.

## Existing Sprint 5 tests: unaffected

92 pre-existing tests (12 files) still pass unchanged; the one pre-existing intentional skip (`security.test.ts`'s cross-tenant placeholder) remains skipped — **that specific gap is not closed by Sprint 6.1's Vitest suite**, because closing it for real requires a live Postgres instance running the actual RLS policies, which is exactly what `supabase/tests/sprint6_1_rls_verification.sql` is written to do (and is disclosed as not executed in this environment — see `19-rls-verification.md`). The Vitest-level tests above prove the *application layer* behaves correctly (recomputation, generic errors, auth gating); they cannot and do not prove RLS itself holds — that requires the SQL script.

## Two real lint issues found and fixed

1. **`react/no-unescaped-entities`** — three raw apostrophes in JSX text (`app/app/page.tsx`, `app/app/decisions/page.tsx`). Fixed with `&apos;`.
2. **`react-hooks/set-state-in-effect`** — `SaveDecisionDialog` originally reset its own state (`status`, `errorMessage`, `savedHumanId`) synchronously inside a `useEffect` gated on an `open` prop, which React's lint rule correctly flags as a cascading-render risk. Fixed by restructuring: the dialog is now conditionally *rendered* by its parent (`{isSignedIn && saveDialogOpen && <SaveDecisionDialog .../>}`) rather than always-mounted-but-conditionally-visible, so every mount starts fresh from its own `useState` initializers with no imperative reset needed at all. This is a better design, not just a lint workaround — it also means closing the dialog now correctly discards all in-progress form state.

## One real build bug found and fixed

`npm run build` initially failed prerendering `/app`: `Error: Supabase is not configured` thrown during static generation. Root cause: `getCurrentUser()` returns `null` early (by design, for graceful degradation) without ever calling `cookies()` when Supabase env vars are absent — so Next.js's automatic "this route uses a dynamic API" detection never triggered, and the build attempted to statically prerender an authenticated dashboard route. It then crashed the moment a child page (`/app/page.tsx`) called the repository layer, which uses the *throwing* `createSupabaseServerClient()` variant (correctly, since a decision-list query with no database genuinely cannot proceed).

**Fix:** `export const dynamic = "force-dynamic"` added explicitly to `app/app/layout.tsx` (cascading to every route under `/app/*`) and to `app/donna-ai/page.tsx` (which now also reads session state via `isSignedIn`). This is the correct fix regardless of the Supabase-unconfigured edge case that surfaced it — an authenticated dashboard and a page whose rendering depends on live session state should never be static-generated at build time in the first place, since doing so would bake one point-in-time answer into a file served to every subsequent visitor.

## What is not automated, and why

- **RLS policy correctness** — written as a real SQL script, not executed (no local Postgres available in this environment; disclosed in `19-rls-verification.md`).
- **Actual browser rendering of `/login`, `/signup`, `SaveDecisionDialog`, decision history pages** — no React Testing Library / jsdom dependency exists in this codebase (Sprint 5's own precedent: deliberately not added for one component's sake). Covered by the build succeeding (proves every page compiles and every import resolves) and by manual review of the rendered output structure, not a rendered-DOM assertion.
- **End-to-end auth flow (sign up → bootstrap → save → reopen)** — requires a real Supabase project; not exercised against one in this task, consistent with "do not execute migrations against any remote database."
