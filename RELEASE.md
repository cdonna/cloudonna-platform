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
