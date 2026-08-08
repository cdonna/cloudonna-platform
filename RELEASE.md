# v0.2.3-alpha — Conversational Intake, Scroll Reveals, Calmer AI Motion

**Date:** 2026-08-09
**Deployed commit:** `2900427` (tag `v0.2.3-alpha`)
**Branch:** fast-forwarded onto `main` (no merge commit, no history rewrite)
**Status:** On `main`, tagged, pushed. **Production deployment not verified from this environment** — no Vercel CLI or credentials exist here; see "Deployment" below.

## Release summary

Rethinks the Donna intake interaction model instead of relabeling it. The real finding this release is built on: v0.2.2's "merge Company+Landscape into one Context screen" reduced stage count from 6 to 4, but increased on-screen density to 11 simultaneous chip fields — very plausibly the actual source of the "still feels like an 11-step process" feedback, independent of how many named stages exist. `ConversationalFieldFlow` replaces that with one question at a time, auto-advancing 350ms after a single-select answer, with a running trail of answered questions (compact, re-clickable pills) standing in for a visible progress bar of "what Donna already knows." `ChipStep`/`ChipFields` (the old show-everything-at-once renderer) are deleted as dead code. Data collected, `WizardState`, `wizardReducer`, `canAdvanceFromStep`, and `buildDecisionOutput` are byte-for-byte unchanged — presentation only, confirmed by all 201 tests passing unmodified.

Also: a ~30-line, dependency-free `useInView` hook drives GPU-only (opacity/transform) scroll-triggered reveals on every homepage section below the hero; `animate-nova-breathe` (a calm scale+opacity pulse) replaces Tailwind's default `animate-ping` for "Donna is thinking" in both the real wizard and the homepage demo — ping's sharp expand-to-transparent reads as an alert, not ongoing work; minor hover-token polish on `/app/decisions` and `/app/inquiries` table rows.

## Build summary

- 11 files changed on top of `f59691b` (v0.2.2-alpha docs)
- `npx tsc --noEmit`: clean
- `npm run lint`: clean — including two genuine `react-hooks/set-state-in-effect` findings, both fixed properly rather than suppressed blind: the wizard's stage-reset now uses React's own recommended "adjust state during render" pattern; the `useInView` reduced-motion check is a justified, commented exception (`window.matchMedia` is genuinely unavailable during SSR)
- `npm test`: 201 passed, 1 skipped, 0 failed — unchanged from before this release
- `npm run build`: succeeds, 23 routes
- Verified against a real production server (`next start`): all 14 requested routes + favicon/robots/sitemap/OG-image/404 return correct status codes, zero server errors logged
- Zero new npm dependencies

## Deployment

No `vercel` CLI or credentials exist in this environment — the actual Production deploy could not be triggered or verified here, same disclosed limitation as every prior release this project. `main` is pushed at `2900427`, tagged `v0.2.3-alpha`. If this repo's Vercel project has Git integration configured for `main`, a Production deployment should have started automatically. **Production URL, deployment ID, and build status need to be confirmed from the Vercel dashboard.**

## Known limitations

- The conversational flow was verified via compile/lint/existing-test-suite and a route-level HTTP smoke test, not an interactive browser session — no browser automation tool is available in this environment. The core state-machine logic (auto-advance, trail, stage reset) is straightforward enough to reason about directly, but a real click-through has not happened.
- No keyboard shortcuts (e.g. number keys to select an option) — a natural extension of the one-question-at-a-time model, not built this pass.
- No dedicated mobile-device/breakpoint audit this pass — carried forward from v0.2.2's same disclosed gap.
- Company's own note field no longer has a distinct UI entry point now that Context is one continuous flow — the single end-of-stage note now writes to `landscape.note`; `company.note` remains in the data model (LOAD_SAMPLE can still populate it) but has no conversational-flow path to set it directly.
- Everything from v0.2.1-alpha/v0.2.2-alpha's known limitations not superseded above still applies: `RESEND_API_KEY`/`FOUNDER_CONTACT_EMAIL` unset (notifications log-only), `platform_staff` empty (seed manually), no CAPTCHA on `/api/inquiries`, OverviewTab hierarchy not rebuilt to a strict 1:1 match.

---

## Release history

### v0.2.2-alpha — Project NOVA Phase 2: Experience Par Excellence (`4b09905`, 2026-08-09)
Full Nova sweep across every remaining light-themed route; named motion-duration system; Donna intake restructured from 6 screens to 4 stages (superseded by this release's deeper rework); ResultPanel primary/secondary tab hierarchy.

### v0.2.1-alpha — Public Operating Layer (`f747671`, 2026-08-09)
Real, persisted Inquiry System (5-type taxonomy, RLS-locked, rate-limited, honeypot-protected); `/contact` with 5 entry points; `/app/inquiries` staff inbox; real `ResendNotificationProvider` (inert until configured); first-party `business_events` analytics.

### v0.2.0-alpha — Project NOVA Phase 1 (`4794ad4`, 2026-08-08)
Deep Space design system across `/app`, decision workspace, Donna AI experience, and the full public marketing homepage; Sprint 6.1 auth/persistence; Sprint 6.2 Slices A–D (versioning); billing architecture (designed, inactive); B2B visitor intelligence research.
