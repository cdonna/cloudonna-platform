# v0.2.2-alpha — Project NOVA Phase 2: Experience Par Excellence

**Date:** 2026-08-09
**Deployed commit:** `4b09905` (tag `v0.2.2-alpha`)
**Branch:** fast-forwarded onto `main` (no merge commit, no history rewrite)
**Status:** On `main`, tagged, pushed. **Production deployment not verified from this environment** — no Vercel CLI or credentials exist here; see "Deployment" below.

## Release summary

One visual world, everywhere. Every remaining light-themed route (`/discovery`, `/independence`, `/login`, `/signup`, `/donna-ai`, `/app`, `/app/decisions/[id]`, and all 6 secondary Donna result tabs) is now on the Deep Space Nova system — the last light-theme remnants in the codebase, verified gone by exhaustive grep. A named motion system (5 semantic durations, 1 shared easing curve) replaces raw numbers, verified to actually generate real CSS before being used anywhere. The Donna intake wizard is restructured from 6 screens to 4 named stages (Context, Priorities, Constraints, Review) by merging Company+Landscape into one screen — the underlying state machine, reducer, and scoring engine are byte-for-byte unchanged (zero business-logic risk, confirmed by all 201 tests passing unmodified). Two real progressive-disclosure rules (Financial Services → regulatory hint, SAP present → vendor-influence hint). ResultPanel's 7-tab bar now visually separates the primary Overview from 6 secondary "go deeper" tabs.

## Build summary

- 22 files changed in this release, on top of `f747671` (v0.2.1-alpha)
- `npx tsc --noEmit`: clean
- `npm run lint`: clean
- `npm test`: 201 passed, 1 skipped, 0 failed — unchanged from before this release, confirming zero scoring/business-logic impact
- `npm run build`: succeeds, 23 routes
- Verified against a real production server (`next start`, not `next dev`): all 14 requested routes + favicon/robots/sitemap/OG image/404 return correct status codes, zero server errors logged
- Zero new npm dependencies

## Deployment

No `vercel` CLI or credentials exist in this environment — the actual Production deploy could not be triggered or verified here, same disclosed limitation as v0.2.0-alpha and v0.2.1-alpha. `main` is pushed at `4b09905`, tagged `v0.2.2-alpha`. If this repo's Vercel project has Git integration configured for `main`, a Production deployment should have started automatically. **Production URL, deployment ID, and build status need to be confirmed from the Vercel dashboard.**

## Known limitations

- No dedicated mobile-device/breakpoint audit this pass — no browser automation tool available; existing responsive patterns (grid collapse, flex-wrap) were preserved and extended, not freshly verified.
- OverviewTab's content wasn't rebuilt to a strict 1:1 match of the requested Recommendation/Confidence/Why/Evidence/Trade-offs/Alternatives order — it's close (that hierarchy already existed from earlier work) but not a literal restructure.
- The signature Analysing→Results transition is a tasteful reveal (duration-reveal, 550ms fade+rise), not the fuller choreographed light/depth/evidence sequence originally envisioned — a real next-sprint candidate.
- Screen-reader behavior carried forward from established patterns (`motion-safe:`, roving tabindex, `aria-selected`), not freshly re-audited this pass.
- Everything from v0.2.1-alpha's known limitations still applies unchanged: `RESEND_API_KEY`/`FOUNDER_CONTACT_EMAIL` unset (notifications log-only), `platform_staff` empty (seed manually), no CAPTCHA on `/api/inquiries`, Vercel production status unconfirmed.

---

## Release history

### v0.2.1-alpha — Public Operating Layer (`f747671`, 2026-08-09)
Real, persisted Inquiry System (5-type taxonomy, RLS-locked, rate-limited, honeypot-protected) replacing every simulated contact form; `/contact` with 5 entry points; `/app/inquiries` staff inbox with inline status editing; real `ResendNotificationProvider` (inert until configured); first-party `business_events` analytics (no third-party SDK). Full report in conversation history.

### v0.2.0-alpha — Project NOVA Phase 1 (`4794ad4`, 2026-08-08)
Deep Space design system across `/app`, decision workspace, Donna AI experience, and the full public marketing homepage; Sprint 6.1 auth/persistence; Sprint 6.2 Slices A–D (versioning); billing architecture (designed, inactive); B2B visitor intelligence research.
