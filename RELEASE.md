# v0.2.0-alpha — Project NOVA Phase 1

**Date:** 2026-08-08
**Deployed commit:** `4794ad4` (tag `v0.2.0-alpha`)
**Branch:** merged into `main` (fast-forward from `project-nova-v0.2.0-alpha`, no merge commit)
**Status:** On `main`, tagged. **Production deployment not verified from this environment** — no Vercel CLI or credentials available here; see "Deployment" below.

## Build summary

- 195 files changed across the full history leading to this tag (`e14f920` + `4794ad4` on top of `b5abcfd`)
- `npx tsc --noEmit`: clean
- `npm run lint`: clean
- `npm test`: 185 passed, 1 skipped, 0 failed
- `npm run build`: succeeds, 22 routes (13 static, 9 dynamic)
- Verified against an actual production server (`next start`, not just `next dev`): all 15 public/app routes return correct status codes, zero server errors logged

## Deployment

This environment has no `vercel` CLI installed and no Vercel credentials, so the actual Production deploy could not be triggered or verified here. `main` has been pushed with the tagged commit — if this repo's Vercel project has Git integration configured for `main`, a Production deployment should have started automatically on the push above. **Production URL, deployment ID, and build status need to be confirmed from the Vercel dashboard** and added here once available.

## Highlights

- **Deep Space design system** — Void/Obsidian/Carbon/Titanium/Aurora tokens, applied across the authenticated `/app` shell, the decision detail workspace, the Donna AI experience, and now the full public marketing site.
- **Public site rewrite** — Homepage restructured into Problem, Solution, Donna, Trust, Enterprise Decision Intelligence, Use Cases, and Founding Testers. Full editorial pass: removed fabricated traction numbers (a stats block claiming 500+ customers on a Public Alpha product), marked unbuilt products "Planned" instead of presenting them as live.
- **Sprint 6.1** — Supabase auth, organizations/decisions persistence with RLS, `save_decision()` RPC, authenticated `/app` shell.
- **Sprint 6.2** — Decision-view resolver decoupling, corrected "Replay" → "View" terminology for historical versions, provenance diff, `append_decision_version()` RPC, Append Version UI.
- **Billing architecture (designed, not active)** — entitlements boundary, `BillingProvider` seam, billing schema migration. No payment provider configured.
- **B2B visitor intelligence research** — vendor evaluation and privacy architecture, recommendation only, nothing deployed.

## Screenshots to take

Before sharing this release externally, capture:
1. Homepage hero (`/`) — above the fold
2. Homepage Problem → Solution → Donna scroll sequence
3. Donna AI live demo mid-interaction (`/#donna`, "answering" or "complete" state)
4. Use Cases section, showing the "Planned" badge treatment
5. Founding Testers form (`/early-access`), both empty and submitted states
6. `/app/decisions` list and a decision detail page (dark authenticated shell)
7. Mobile viewport: homepage hero + hamburger nav open

## Known issues

- Fixed in this release: `/app` (dashboard) threw an unhandled server-side exception when Supabase env vars are unset, because the page called the throwing Supabase client constructor unconditionally instead of gating on `getCurrentUser()` first like every other route. Only reachable when Supabase is unconfigured — production has it configured — but it was a real logged error, now fixed with a defensive guard.
- Investigated, not a real defect: `/opengraph-image` returned HTTP 500 under `next dev` ("Input buffer contains unsupported image format") but rendered a correct 1200×630 PNG under `next start` (the actual production server) with zero errors. Confirmed dev-mode-only artifact, not present in the production build.
- `/discovery`, `/independence`, `/for-vendors`, `/for-partners`, `/login`, `/signup` were **not** included in the Deep Space redesign — still the earlier light theme. The global Footer is now dark, so these pages currently end in a visible light-to-dark seam.
- Donna AI's secondary result tabs (Comparison, Risks & Opportunities, Roadmap, Architecture, TCO) and the wizard's inner steps were not restyled — only the top-level shell, Overview tab, and loading state.
- Billing is schema-only — `BILLING STATUS = DESIGNED / NOT ACTIVE` (see `docs/commercial/01-billing-architecture.md`).
- Sprint 6.2 Slice E/F (Decision Replay — actually re-executing the engine against historical input, distinct from the "View" capability already shipped) is not started.
- Mobile menu and form submission were verified to exist in code and render correctly (200 on every route), but were **not** exercised through an actual browser/interaction test in this pass — no browser automation tool was available, so this smoke test was HTTP-status-only, not behavioral.
- Migration files (`supabase/migrations/2026080813...`–`2026080814...`) and their verification SQL are written but **not executed** — no local Postgres instance is available in this environment. This has been true and disclosed since Sprint 6.2 Slice C.

## Next milestone

Sprint 6.2 Slice E/F (real Decision Replay), or NOVA Phase 2 (remaining public pages + secondary Donna AI tabs) — not yet sequenced against each other; a founder call, not a technical one.
