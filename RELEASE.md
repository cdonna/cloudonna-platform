# v0.3.3-alpha — Mobile Hotfix: Result Transition & iOS Viewport Hardening

**Date:** 2026-08-15
**Deployed commit:** `bfe4f57` (tag `v0.3.3-alpha`)
**Branch:** fast-forwarded onto `main` (no merge commit, no history rewrite)
**Status:** Founder-approved on real hardware before this commit was even made (see below), then pushed and tagged.

## Founder real-device approval — the basis for this release

Unlike every prior release in this project's history, this one was **manually verified on a real iPhone by the Founder before being committed**, not verified by code reading or automated tests alone.

**Device:** real iPhone
**Browsers tested:** Safari — PASS; Chrome — PASS
**Founder verdict:** PASS ("sieht gut aus")

This is recorded honestly as what it is: a Founder-performed real-device test, not something this environment independently verified. No browser automation or device tooling exists here — every claim about the mobile fix's correctness prior to Founder approval was structural (component/scroll-architecture tracing) and HTTP-level (route/status checks), never a rendered-pixel or touch-interaction observation.

## The fix

**Root cause of "meaningful Donna results appear too far below the visible viewport"** (the Founder's original real-iPhone report): `DonnaAIExperience`'s four phases (intro/wizard/analysing/results) render as conditional siblings inside one container that never remounts, so a phase change never moves the viewport — new, taller content simply appears wherever the page's scroll position was already left. `AdaptiveIntake` already solved this for its own internal question-to-question transitions via a `headingRef.focus()` pattern (native `.focus()` scrolls the target into view); that pattern had never been extended to the two components that actually own the transitions the Founder hit.

- **`AnalysingState.tsx`**: `headingRef` + focus on mount (entering "analysing") and again on the transition into/out of the error state, so a retry failure gets the same treatment as the first attempt. Also reduces its `min-h-[38rem]` to `min-h-[32rem]` on mobile only (`sm:` and up unchanged) — real vertical-waste reduction without reintroducing layout jump.
- **`ResultPanel.tsx`**: `headingRef` + focus on mount, on "Your recommendation is ready" — the single most important heading in the product.
- **11 page wrappers**: `min-h-screen` → `min-h-dvh`, hardening against iOS Safari's dynamic address bar (which makes `100vh`-based `min-height` taller than the real visible viewport).

Reuses native focus-driven scrolling rather than a bespoke `scrollIntoView` call, so it transparently also fixes the same gap for browser Back/Forward through the synthetic Donna history entries, and gives assistive technology a standard way to discover new content when it appears.

## Build summary

- 13 files changed, +53/−19, one commit
- `npx tsc --noEmit`: clean
- `npm run lint`: clean (one real warning found and fixed during development — `react-hooks/exhaustive-deps` on a computed dependency — not suppressed)
- `npx vitest run`: 39 test files, 341 passed, 1 skipped, 0 failed — unchanged from the prior release, confirming no regression
- `npm run build`: succeeds, 72 pages, unchanged route structure
- Fresh `next start`: full 55-route matrix (5 locales × 11 pages) 200, `robots.txt`/`sitemap.xml`/`opengraph-image`/`favicon.ico` 200, `/xx` and unknown routes 404
- The specific fix (DOM `.focus()`-triggered scroll behavior) has no automated regression test — not unit-testable in this environment (no component-rendering harness; Node-only Vitest, disclosed consistently throughout this project). Verified by the Founder on real hardware instead, which is a stronger signal than a unit test could provide for this particular defect class.

## Known limitations

Everything from `v0.3.2-alpha`'s "Known limitations" below still applies unchanged — this release did not touch localization or the inquiry system. New: real layout-pressure testing across all 5 languages on real mobile viewports (clipped labels, chip wrapping, overflow) was not independently performed by this environment beyond the Founder's own spot-check; keyboard-open/close behavior, Core Web Vitals, and device-matrix viewport testing (320/360/375/390/393/412/430/768px) remain unverified beyond structural code review.

---

# v0.3.2-alpha — Localization Gap Closure + Confirmed Production Inquiry P0 Finding

**Date:** 2026-08-15
**Deployed commit:** `7f7fcb0` (tag `v0.3.2-alpha`)
**Branch:** fast-forwarded onto `main` (no merge commit, no history rewrite)
**Status:** Code pushed and tagged. **Vercel deployment status not independently re-verified for this exact commit from this environment** (no CLI/API access) — the Founder confirmed the prior release READY via the dashboard; this commit should deploy the same way if Git integration is active on `main`.

## Production Inquiry P0 — CONFIRMED BROKEN (not merely unverified)

Every prior release report described this as "unresolved" or "unverified." This pass changes that assessment to something more specific and more serious.

After a full read-only audit of the existing inquiry system (schema, migrations, RLS policies, API route, Zod validation, repository, honeypot, rate limiting, Founder inbox, notification provider — all found correctly built; no second system created, no existing inquiry code changed), this pass performed the exact safe, explicitly-authorized real Production test requested: one POST to `https://www.cdonna.com/api/inquiries` with unmistakable test content (`name: "Test Founder"`, `company: "ClouDonna Test"`, a `.invalid`-TLD email guaranteed never to deliver anywhere, and a message self-identifying as an authorized automated verification record).

**Result: HTTP 503, `{"error":"This inquiry could not be submitted. Please try again later."}`.**

This is not a generic failure — it is the *exact, specific* message `apps/web/src/app/api/inquiries/route.ts` returns from exactly one code path: `createSupabaseServerClient()` throwing inside the route's own try/catch, logged server-side as `supabase_client_unavailable`. It is textually distinct from every other failure message in the system (the repository's sanitized database-error fallback reads "...try again." — no "later"; the rate-limit message reads "Please wait a little..."). This precision is what makes the finding a diagnosis, not a guess.

**Conclusion: `NEXT_PUBLIC_SUPABASE_URL` and/or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing or invalid in the Vercel Production environment for this project right now.** Every real visitor attempting to submit any inquiry (Founding Tester, Enterprise Pilot, Partner, Vendor, General) on the live site is receiving this same failure. No inquiry has been persisted by this test — the write never reached Supabase.

**No fake success was returned to complete this test. No mock was substituted. No code changed to work around it**, per this task's own explicit instruction. This repository has no legitimate way to set Vercel Production environment variables.

### Exact Founder action required

1. In the Vercel dashboard, open this project's **Production** environment variables.
2. Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present and correct (matching the real Supabase project this app should write to). Also confirm `RESEND_API_KEY` and `FOUNDER_CONTACT_EMAIL` if real email notifications (rather than the `ConsoleNotificationProvider` server-log fallback) are wanted.
3. Redeploy (or trigger a new deployment) so Production picks up the corrected environment.
4. Re-run this exact safe test — a real POST with equally unmistakable test content to `/api/inquiries` — and confirm a `200` response with a real inquiry id, that the row appears in `/app/inquiries`, and that a notification is received if configured.
5. Only then does `PRODUCTION INQUIRY P0 = RESOLVED` become a claim this repository's own evidence can support.

One consequence worth naming honestly: **the diagnostic SQL script referenced in every prior release (`supabase/tests/production_diagnostic_p0.sql`) cannot even run yet** — it needs a working Supabase connection from someone with dashboard SQL Editor access, which is a separate concern from the env-var gap found here, and still needs to happen afterward to confirm the *schema* (not just the connection) is correct in Production.

## Release summary (code changes)

Closes three localization gaps disclosed in the prior release's "Known limitations": `og:locale` was hardcoded `en_US` on every page except home (Next.js doesn't deep-merge a child route's `openGraph` into the parent layout's, so any page that didn't set its own inherited the static root value regardless of actual locale) — fixed via a new `localizedOpenGraph()` helper applied to all 9 server-rendered localized pages, correct `xx_XX` format verified live for all 5 locales. Homepage `<title>` was the identical English brand tagline in every locale — now translated per language (description was already correct). Scoring-dimension labels ("Architecture Fit" etc — a fixed 10-value enum) now localized at the UI boundary via `dimension-labels.ts`, without touching `scoring/engine.ts`'s output shape — same pattern as the existing `option-labels.ts`. The larger body of dynamically-composed narrative text (evidence sentences, executive summary, trade-offs) remains English-only, deliberately not attempted this pass: closing it would require restructuring `DecisionOutput` to carry a key alongside each pre-composed sentence, a real shape change to a heavily-tested core module — disclosed rather than rushed.

Added inquiry-system regression coverage that wasn't already there: oversized-message rejection (>4000 chars), `source_page`/`utm_source` actually captured in the persisted insert payload, canonical `inquiry_type` enum storage proven independent of any localized label, and a properly-forced (module-mocked, not just asserted) notification-failure-after-successful-persistence case.

## Build summary

- 19 files changed, +249/−33, one commit
- `npx tsc --noEmit`: clean
- `npm run lint`: clean
- `npx vitest run`: 39 test files, 341 passed, 1 skipped, 0 failed (+14 from this pass)
- `npm run build`: succeeds, 72 pages, unchanged route structure
- Fresh `next start` re-verified: full 55-route matrix (5 locales × 11 pages), `og:locale` correct per locale on a non-home page (previously always `en_US`), homepage `<title>` correct per locale, `robots.txt`/`sitemap.xml`/`opengraph-image`/`favicon.ico`/404/unsupported-locale all confirmed
- Local dry-run of `/api/inquiries` (Supabase unconfigured in this environment, as always): honest `503`, no fake success — confirms the code's own failure-handling is correct even though it can't prove real persistence locally

## Known limitations

Everything from `v0.3.0-alpha`'s "Known limitations" below still applies, **except** the `og:locale` and homepage `<title>` items, which are resolved this pass. New: the larger body of Donna's dynamically-composed narrative text (evidence sentences, executive summary) remains English-only (see above); login/signup pages cannot export their own `generateMetadata` at all (they're Client Components — a Next.js restriction, not a bug) and so always show the root layout's static English title regardless of locale, a pre-existing structural gap not fixed this pass.

---

# v0.3.1-alpha — Founder Release Gate Verification Pass

**Date:** 2026-08-14
**Deployed commit:** `9344b8a` (tag `v0.3.1-alpha`); `main` is now at `838e72d` (one further docs-only commit)
**Branch:** fast-forwarded onto `main` (no merge commit, no history rewrite)
**Status:** On `main`, tagged, pushed. **Production deployment confirmed READY by the Founder via the Vercel dashboard** (deployed release commit `e037efd`, functionally identical to everything after it — only test coverage and documentation changed since, no application source) and independently smoke-tested against the real `https://www.cdonna.com` domain from this environment; see "Production verification" below.

## Release summary

No product behavior change. An independent, adversarial release-gate audit of `v0.3.0-alpha` — repository health check (no secrets, no debug leakage, no dead imports, no duplicate locale-detection mechanisms), an explicit `Accept-Language` fallback matrix (`en-US`/`en-GB` → `en`, `de-DE`/`de-CH` → `de`, `fr-FR`/`fr-CH` → `fr`, `es-ES` → `es`, `it-IT`/`it-CH` → `it`, each asserted individually and added as `resolve-locale.test.ts` cases), the full 5-locale × 12-route matrix re-verified against a fresh production build, redirect/error/unsupported-locale behavior (`/xx` → 404, unknown route under a valid locale → 404, `/en/early-access` → 307 with the correct locale-prefixed target), and the Donna cross-language recommendation pipeline.

**One finding worth recording, not a product defect:** re-verifying the Donna smoke test found the live API returning a different `confidenceScore` (67) than the value recorded in the prior release's own report (71) for what looked like the same input. Investigated rather than dismissed: the discrepancy was in this audit's own hand-typed test payload, which had fabricated plausible-looking `revenue`/`itOrgSize` values that were never actually present in the source Founder statement (the real extractor correctly leaves both `null`, since neither statement mentions company revenue or IT org size). Re-running with the exact real extractor output — `revenue: null, itOrgSize: null` — reproduced the original 81/71/"Business Data Cloud" result exactly, and did so identically across 5 repeated calls. Scoring is confirmed deterministic; the earlier gap was a test-methodology artifact in this session, not a code issue.

## Build summary

- 1 file changed, +21 lines (test-only)
- `npx tsc --noEmit`: clean
- `npm run lint`: clean
- `npm test -- --run`: 37 test files, 327 passed, 1 skipped, 0 failed (+9 from the new fallback-matrix cases)
- `npm run build`: succeeds, 72 pages, unchanged from v0.3.0-alpha
- Fresh `next start` re-verified: full 60-request route/redirect matrix (5 locales × 9 static pages + 2 dynamic pages + 5 early-access redirects), `robots.txt`/`sitemap.xml`/`opengraph-image`/404/unsupported-locale, and a live `/api/donna-ai/decision` call against the exact real German-extracted `WizardState`

## Deployment

No `vercel` CLI or credentials exist in this environment — the actual Production deploy could not be triggered or verified here, same disclosed limitation as every prior release this project. `main` is pushed at `9344b8a`, tagged `v0.3.1-alpha`. If this repo's Vercel project has Git integration configured for `main`, a Production deployment should have started automatically. **Production URL, deployment ID, and build status need to be confirmed from the Vercel dashboard.**

## Production verification

Performed against the real `https://www.cdonna.com` domain (confirmed genuine via the `server: Vercel` and `x-vercel-id` response headers, not a local build) — real network access was available from this environment for this task specifically. Read-only GET requests only; `/api/inquiries` was deliberately never called, to avoid creating any real inquiry record.

- All 55 direct routes (5 locales × 9 static + 5 locales × 2 dynamic) return 200; bare root/page paths correctly 307 to the resolved locale; `/early-access` correctly 307s per locale to `/contact?type=founding_tester`; `/xx` and unknown routes correctly 404; `robots.txt`/`sitemap.xml`/`opengraph-image`/`favicon.ico` all 200.
- Localized content confirmed genuinely served (not English fallback) for all 5 languages via each locale's real hero string; canonical and the full hreflang set (`x-default` + 5 locales) confirmed correct on a live page.
- `sitemap.xml` confirmed live with all 46 entries and per-entry hreflang alternates, matching the local build exactly.
- Donna AI page loads live; one safe `/api/donna-ai/decision` call with a representative SAP S/4HANA + SAP BW + Snowflake + Power BI + Azure landscape returned a real, correctly-computed recommendation (Fabric/Microsoft, Donna Score 79) with no error — no data persisted, no fake customer record created.
- **Two new, minor findings, not release-blocking:** (1) the homepage `<title>` is "ClouDonna — Enterprise Decision Intelligence" in all 5 locales by deliberate, consistent design (verified identical across all 5 dictionary source files — a brand tagline choice, not a bug); the meta description *is* correctly localized. Every other page's title (contact, privacy, etc.) localizes correctly. (2) `og:locale` is hardcoded to `en_US` in the root layout regardless of actual locale. Neither was fixed this pass, per "only fix an actual release-blocking Production defect" — both added to Known limitations below.
- Language switcher: trigger button and its localized `aria-label` confirmed present in production HTML; the dropdown's option list is correctly absent from initial HTML (collapsed by default, client-rendered on open — expected behavior, not a defect). Target-URL correctness verified via source code (`pathWithLocale()`) and its unit tests, not by clicking in a live browser — no browser automation tool available.
- **Production Inquiry P0: UNVERIFIED.** `/api/inquiries` was deliberately not called (would create a real record); no Supabase Production access exists in this environment to check persistence, Founder-side access, or notification delivery. Not claimed resolved.

## Known limitations

Everything from `v0.3.0-alpha`'s "Known limitations" (below) still applies, plus two new findings from live Production verification: the homepage `<title>` is an intentional English brand tagline in every locale (description is localized); `og:locale` is hardcoded to `en_US` in every locale.

---

# v0.3.0-alpha — Founder Walkthrough Hardening + EN/DE/FR/ES/IT Localization

**Date:** 2026-08-14
**Deployed commit:** `df2e00f` (tag `v0.3.0-alpha`)
**Branch:** fast-forwarded onto `main` (no merge commit, no history rewrite)
**Status:** On `main`, tagged, pushed. **Production deployment not verified from this environment** — no Vercel CLI or credentials exist here; see "Deployment" below.

## Release summary

One commit, bundling two sprints: a Founder-walkthrough product-hardening pass and a five-locale localization of the public product.

**Product hardening:** Fixed the multi-select auto-advance bug (`activeField` is now real state, set only from event handlers, never derived-then-effect-synced); browser Back/Forward destroying an in-progress assessment (new `session-history.ts` — `pushState`/`popstate` plus `sessionStorage`, used by both `AdaptiveIntake` and `DonnaAIExperience`); Donna silently degrading explicit high-fidelity facts ("around 4,000 employees") to a coarse band with no trace of the original wording (now preserved as `rawText` alongside the normalized value); multi-system landscapes losing data (SAP BW captured, Snowflake silently dropped — `matchAll` plus a new `additionalSystems` list fixes this without adding a new scoring dimension); "Donna inferred" pills rendering visually identical to rejected ones before any choice was made (three real states now: said/inferred-pending/removed); the question flow continuing to visually pressure the user once Donna already has enough to recommend; three `/app/*` Server Components missing the guard that caused a generic Next.js error screen; and `ResultPanel`'s information hierarchy reordered around recommendation → closeness → confidence → why → trade-offs → best alternative → evidence, replacing a wall of ten score bars as the first thing shown.

**Localization:** Real locale-prefixed routing (`src/app/[locale]/`) for the twelve pages that make up the public Founder journey (home, Donna AI, contact, early-access, for-partners, for-vendors, independence, login, signup, privacy, imprint, terms). Dictionaries for English, German, French, Spanish, and Italian, typed so a locale missing a key fails to compile (`src/i18n/dictionary.ts`). A NOVA-styled language switcher (dropdown on desktop, inline pills on mobile) with `NEXT_LOCALE` cookie persistence resolved in `middleware.ts` alongside the pre-existing Supabase session refresh. Switching language does not restart Donna or lose answers — it reuses the exact `sessionStorage` restoration built for the Back-button fix, so no new persistence logic was needed for state to survive a language switch. The deterministic extractor gained alias patterns for German, French, Spanish, and Italian across all thirteen domain categories (country, industry, ERP, CRM, analytics, data warehouse, cloud, AI platform, goals, timeline, employee count, budget, risk appetite, internal skills, vendor/cloud preference) — one extractor, no per-language schema or scoring duplication — including a real bug found and fixed along the way: JavaScript's `\b` word boundary silently fails to match at accented characters (`\bÖsterreich\b` and `\bconformité\b` never match), fixed with a Unicode-correct `(?<![\p{L}\p{N}])…(?![\p{L}\p{N}])` boundary used consistently for every non-English pattern. `sitemap.ts` was rebuilt for the new route structure — the pre-existing version pointed at now-redirecting unprefixed URLs and never mentioned any non-English locale; it now emits one entry per locale per page with `hreflang` alternates.

Italian was added as a fifth locale during this release's own review pass (the original brief scoped EN/DE/FR/ES) — the architecture generalizes over `SUPPORTED_LOCALES`, so this was a data addition (dictionary, extractor patterns, option-label overrides, two more test files), not a redesign.

## Build summary

- 86 files changed in one commit, `+7647 -1770`
- `npx tsc --noEmit`: clean
- `npm run lint`: clean
- `npm test -- --run`: 37 test files, 318 passed, 1 skipped, 0 failed
- `npm run build`: succeeds, 72 static pages (9 localized pages × 5 locales + `/discovery`, `/_not-found`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`) plus the dynamic `/[locale]/contact`, `/[locale]/donna-ai`, `/[locale]/early-access`, `/app/*`, `/api/*`, `/auth/callback`
- Verified against a real production server (`next start`): all 45 locale × static-page combinations return 200; `/en`, `/de`, `/fr`, `/es`, `/it` all render their own language; product/vendor names (SAP S/4HANA, Snowflake, etc.) confirmed untranslated in every locale; hreflang (`x-default` + all 5 locales) and canonical tags confirmed present and correct on live pages; `Accept-Language` and `NEXT_LOCALE` cookie resolution both confirmed live; the unauthenticated `/app` → `/login` redirect chain confirmed; `robots.txt`/`sitemap.xml`/`opengraph-image`/404 all confirmed; a real `POST /api/donna-ai/decision` call against a German-extracted `WizardState` confirmed the same recommendation (Business Data Cloud, vendor SAP, Donna Score 81) the unit tests predicted
- Zero new npm dependencies

## Deployment

No `vercel` CLI or credentials exist in this environment — the actual Production deploy could not be triggered or verified here, same disclosed limitation as every prior release this project. `main` is pushed at `df2e00f`, tagged `v0.3.0-alpha`. If this repo's Vercel project has Git integration configured for `main`, a Production deployment should have started automatically. **Production URL, deployment ID, and build status need to be confirmed from the Vercel dashboard.**

## Production Inquiry P0

**Still unresolved, not claimed otherwise.** This release did not touch the inquiry-persistence path, the P0 diagnostic script, or Supabase Production configuration. Nobody has run `supabase/tests/production_diagnostic_p0.sql` against real Production as far as this session knows, and this environment has no Supabase CLI or credentials to run it. The real, end-to-end visitor → inquiry API → validation → Supabase → persistence → Founder access → notification flow has not been verified in Production this release, same as every prior one.

## Known limitations

- Scoring-engine narrative content — `TRAIT_REASON_TEXT`, `GOAL_OPPORTUNITY_TEXT`, risk/budget/timeline risk text, workshop descriptions, and every per-recommendation evidence/concern sentence and dimension label — stays English-only in every locale. Only the structural UI around it (headings, tab labels, buttons, the Adaptive Intake) is localized.
- `DonnaLive.tsx` (the homepage's separate interactive demo widget) was not translated; still English in every locale.
- `/app/*`, `/api/*`, `/auth/*`, `/discovery` are out of scope for localization — English-only, unprefixed, per the brief's own enumerated Founder-journey page list.
- `<html lang>` is corrected client-side on mount (`src/i18n/LangSync.tsx`), not server-rendered correctly on first byte — a real, disclosed accessibility/SEO gap, not a claimed full fix.
- French/Spanish/Italian extractor phrasing for the "strong on X, limited on Y" internal-skills pattern is best-effort; only the German phrasing was verbatim-tested against a brief-supplied statement. The Italian Founder-equivalence test uses this release's own translation of the German statement, not a brief-supplied original — disclosed in `founder-case-it.test.ts`.
- No interactive browser session was used to verify any of this renders as intended — verified by code reading, the automated test suite, and `curl`/`urllib`-driven live route/API checks against a real `next start` server, not a real click-through, since no browser automation tool is available in this environment.
- Production Inquiry P0 remains unresolved (see above).
- Everything from v0.2.4-alpha's known limitations not superseded above still applies (see below).

---

## Release history

### v0.3.2-alpha — Localization Gap Closure + Confirmed Production Inquiry P0 Finding (`7f7fcb0`, 2026-08-15)
Fixed `og:locale` (was hardcoded `en_US` on every page except home), homepage `<title>` (was the identical English tagline in all 5 locales), and scoring-dimension labels (now localized at the UI boundary without touching the scoring engine). Added inquiry-system regression tests. Critically: a real, authorized test submission to the live `/api/inquiries` confirmed Production Inquiry P0 as **actively broken** (Supabase environment variables missing/invalid in Vercel Production), not merely unverified — exact Founder action documented.

### v0.3.1-alpha — Founder Release Gate Verification Pass (`9344b8a`, 2026-08-14)
No product behavior change. Independent adversarial audit of `v0.3.0-alpha`: repo health check, explicit Accept-Language fallback matrix, full route-matrix re-verification, and a Donna cross-language regression check that chased down and correctly root-caused an apparent confidence-score discrepancy to its own test-methodology artifact rather than a product bug. Also performed real, live verification against the actual `https://www.cdonna.com` Production domain for the first time (55/55 routes, hreflang, sitemap, one safe Donna API call).

### v0.3.0-alpha — Founder Walkthrough Hardening + EN/DE/FR/ES/IT Localization (`df2e00f`, 2026-08-14)
Multi-select auto-advance, browser Back destroying assessments, silently-degraded high-fidelity facts, lost multi-system landscape context, misleading confirmation pills, post-readiness question pressure, three unguarded `/app/*` pages, and `ResultPanel` hierarchy all fixed. Real locale-prefixed routing and compile-time-checked dictionaries for EN/DE/FR/ES/IT across the twelve Founder-journey pages; language switching reuses the Back-button fix's session persistence with no new logic; deterministic extractor gained multi-language alias patterns across all thirteen domain categories, including a Unicode word-boundary fix.

### v0.2.4-alpha — Production Observability + Donna AI Mobile Fixes (`6e79bfa`, 2026-08-08)
Structured, single-line logging across every stage of `POST /api/inquiries` (never message content or credentials); a read-only diagnostic script for a human with real Supabase access to confirm whether the `inquiry_type` taxonomy migration reached Production (unconfirmed, unresolved as of this writing). Mobile/accessibility fixes: `Chip` and `ResultPanel`'s secondary tabs brought up to the 44px touch-target minimum; the "Go deeper" tab-hierarchy label no longer hidden below `sm`.

### v0.2.3-alpha — Conversational Intake, Scroll Reveals, Calmer AI Motion (`2900427`, 2026-08-09)
`ConversationalFieldFlow` replaces the 11-simultaneous-chip Context screen with one question at a time, auto-advancing, with a re-clickable answer trail — the real fix for "still feels like an 11-step process," not a relabel. GPU-only scroll reveals (`useInView`) on every homepage section; `animate-nova-breathe` replaces `animate-ping` for "Donna is thinking." Data model, reducer, and scoring untouched — presentation only, confirmed by all 201 tests passing unmodified.

### v0.2.2-alpha — Project NOVA Phase 2: Experience Par Excellence (`4b09905`, 2026-08-09)
Full Nova sweep across every remaining light-themed route; named motion-duration system; Donna intake restructured from 6 screens to 4 stages (superseded by this release's deeper rework); ResultPanel primary/secondary tab hierarchy.

### v0.2.1-alpha — Public Operating Layer (`f747671`, 2026-08-09)
Real, persisted Inquiry System (5-type taxonomy, RLS-locked, rate-limited, honeypot-protected); `/contact` with 5 entry points; `/app/inquiries` staff inbox; real `ResendNotificationProvider` (inert until configured); first-party `business_events` analytics.

### v0.2.0-alpha — Project NOVA Phase 1 (`4794ad4`, 2026-08-08)
Deep Space design system across `/app`, decision workspace, Donna AI experience, and the full public marketing homepage; Sprint 6.1 auth/persistence; Sprint 6.2 Slices A–D (versioning); billing architecture (designed, inactive); B2B visitor intelligence research.
