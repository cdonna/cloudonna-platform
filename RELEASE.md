# v0.2.4-alpha — Production Observability + Donna AI Mobile Fixes

**Date:** 2026-08-08
**Deployed commit:** `6e79bfa` (tag `v0.2.4-alpha`)
**Branch:** fast-forwarded onto `main` (no merge commit, no history rewrite)
**Status:** On `main`, tagged, pushed. **Production deployment not verified from this environment** — no Vercel CLI or credentials exist here; see "Deployment" below.

## Release summary

Two commits, neither previously tagged: `d022fb7` (structured observability across the inquiry write path, written in response to an unresolved production-inquiry-failure report) and this release's own `6e79bfa` (Donna AI mobile fixes).

**Observability (`d022fb7`):** Every stage of `POST /api/inquiries` now logs a structured, single-line event server-side (`request_received`, `validation_passed/failed`, `honeypot_triggered`, `rate_limit_checked/exceeded`, `database_insert_succeeded/failed`, `notification_succeeded/failed`, `response_sent`) — never message content, name, company, phone, or credentials, only enough to see *where* a request failed. The raw Postgres error is now logged server-side at `repository.ts`'s `createInquiry()`, before `classifySupabaseError()` sanitizes it for the client response — closing the exact gap between "acceptable message for the visitor" and "acceptable diagnosis for us." A read-only diagnostic script (`supabase/tests/production_diagnostic_p0.sql`) was also written for a human with real Supabase dashboard access to confirm whether the taxonomy-refinement migration (`inquiry_type` enum: `enterprise` vs `enterprise_pilot`/`customer`) was actually applied to Production — this is a well-evidenced hypothesis from code inspection, not a confirmed root cause. **This diagnostic has not been run by anyone as far as this session knows; the underlying production-inquiry-failure report remains unconfirmed and unresolved.**

**Donna AI mobile fixes (`6e79bfa`):** A concrete mobile/accessibility pass on `ResultPanel`, `ConversationalFieldFlow`, and the shared `Chip` component (every option button in the intake wizard) found and fixed two real issues, not just re-disclosed the same gap a fourth release running: (1) `Chip`, the primary tap target across the entire wizard, and `ResultPanel`'s secondary tabs were both under the 44px minimum touch target — both now use `min-h-11`; (2) the "Go deeper" label that carries the primary/secondary tab hierarchy was `hidden` below the `sm` breakpoint, meaning mobile users — the viewport where hierarchy matters most, given the least screen space — lost that hierarchy entirely. It's now visible at every width.

Items 1 and 2 of the requesting brief (complete remaining dark-theme migration, remove legacy light-theme styles) were re-verified this pass with a fresh repository-wide grep for legacy Tailwind slate/gray/blue/violet/white utility classes: zero remnants found — this work was already complete as of `2900427` (v0.2.3-alpha).

## Build summary

- 4 files changed across the two commits (3 touched this pass; `d022fb7` untouched this pass, already on `main`)
- `npx tsc --noEmit`: clean
- `npm run lint`: clean
- `npm test -- --run`: 22 test files, 201 passed, 1 skipped, 0 failed — unchanged from v0.2.3-alpha, confirming no regression
- `npm run build`: succeeds, 23 routes
- Verified against a real production server (`next start`): `/`, `/donna-ai`, `/discovery`, `/contact`, `/early-access`, `/for-partners`, `/for-vendors`, `/independence`, `/login`, `/signup`, `/privacy`, `/imprint`, `/terms`, `/app`, `/app/inquiries`, plus favicon/robots.txt/sitemap.xml/opengraph-image/404 all return correct status codes (200, or an expected 307 redirect for `/early-access` → `/contact?type=founding_tester` and `/app`, `/app/inquiries` → `/login` for an unauthenticated request; both redirect targets independently verified to return 200)
- Zero new npm dependencies

## Deployment

No `vercel` CLI or credentials exist in this environment — the actual Production deploy could not be triggered or verified here, same disclosed limitation as every prior release this project. `main` is pushed at `6e79bfa`, tagged `v0.2.4-alpha`. If this repo's Vercel project has Git integration configured for `main`, a Production deployment should have started automatically. **Production URL, deployment ID, and build status need to be confirmed from the Vercel dashboard.**

## Known limitations

- The production-inquiry-failure report that motivated `d022fb7` remains unconfirmed: nobody has run `supabase/tests/production_diagnostic_p0.sql` against real Production, and this environment has no Supabase CLI or credentials to run it. The migration-application-gap hypothesis is evidenced by code inspection only.
- Mobile fixes this pass were targeted at concrete issues found in the three most mobile-exposed Donna AI components; this is still not an exhaustive breakpoint-by-breakpoint audit of every surface (e.g. `IntakeWizard`'s `lg:grid-cols-[0.72fr_1.28fr]` layout collapse below `lg` was reviewed and found acceptable, not modified).
- No interactive browser session was used to verify these fixes render as intended — verified by code reading and the automated test suite, not a real click-through, since no browser automation tool is available in this environment.
- Everything from v0.2.3-alpha's known limitations not superseded above still applies (see below).

---

## Release history

### v0.2.3-alpha — Conversational Intake, Scroll Reveals, Calmer AI Motion (`2900427`, 2026-08-09)
`ConversationalFieldFlow` replaces the 11-simultaneous-chip Context screen with one question at a time, auto-advancing, with a re-clickable answer trail — the real fix for "still feels like an 11-step process," not a relabel. GPU-only scroll reveals (`useInView`) on every homepage section; `animate-nova-breathe` replaces `animate-ping` for "Donna is thinking." Data model, reducer, and scoring untouched — presentation only, confirmed by all 201 tests passing unmodified.

### v0.2.2-alpha — Project NOVA Phase 2: Experience Par Excellence (`4b09905`, 2026-08-09)
Full Nova sweep across every remaining light-themed route; named motion-duration system; Donna intake restructured from 6 screens to 4 stages (superseded by this release's deeper rework); ResultPanel primary/secondary tab hierarchy.

### v0.2.1-alpha — Public Operating Layer (`f747671`, 2026-08-09)
Real, persisted Inquiry System (5-type taxonomy, RLS-locked, rate-limited, honeypot-protected); `/contact` with 5 entry points; `/app/inquiries` staff inbox; real `ResendNotificationProvider` (inert until configured); first-party `business_events` analytics.

### v0.2.0-alpha — Project NOVA Phase 1 (`4794ad4`, 2026-08-08)
Deep Space design system across `/app`, decision workspace, Donna AI experience, and the full public marketing homepage; Sprint 6.1 auth/persistence; Sprint 6.2 Slices A–D (versioning); billing architecture (designed, inactive); B2B visitor intelligence research.
