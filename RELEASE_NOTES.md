# ClouDonna — Public Alpha 0.2

**Date:** August 2026
**Branch:** `worktree-public-alpha`
**Scope:** `apps/web` (marketing/landing site)

## Summary

This release builds out the ClouDonna marketing site into a review-ready Public Alpha Foundation: a dedicated Ecosystem section covering all five Donna products, working navigation and CTAs with smooth scrolling, a Request Early Access section, and legal placeholder pages — all while preserving the existing premium visual identity and without adding a database, authentication, API keys, or any external services.

## New Features

- **ClouDonna Ecosystem section** — new bento-grid section (`#products`) presenting all five products: Donna AI, Donna Compare, Donna Marketplace, Donna Intelligence, Donna Workspace.
- **Request Early Access section** (`#early-access`) — a lead-capture form (name, work email, company, role, primary interest, optional message) with client-side validation and a success confirmation state. The form is a UI preview only: submissions are not transmitted or stored anywhere in this alpha build.
- **Legal placeholder pages** — `/privacy`, `/imprint`, `/terms`, each with accurate, alpha-appropriate placeholder copy and a minimal header/back-to-home link.
- **Site footer** — new shared footer (brand, product/company/legal links, copyright) rendered on every page via the root layout.

## UX Improvements

- Main navigation and all primary CTAs ("Request Demo," "Watch Overview," "Login," "Explore [Feature]") are now functional, using real anchor links with smooth scrolling to the relevant section instead of dead buttons.
- "Login" — since no authentication exists in this alpha — now routes to Request Early Access instead of doing nothing.
- Added a working mobile navigation menu (hamburger toggle + slide-down panel); previously, nav links were hidden below the `lg` breakpoint with no mobile alternative at all.
- Fixed dead self-referencing links surfaced during review (e.g., the "Donna Compare," "Donna Marketplace," and "Benchmarks" cards previously linked back to their own section); they now route to a meaningful destination.

## Accessibility Improvements

- Mobile menu toggle sized to a proper ~44px touch target; toggle carries `aria-label`, `aria-expanded`, and `aria-controls`.
- All Early Access form fields have real `<label>` elements (not placeholder-only), plus an `aria-live` region announcing the success state.
- Added a visually-hidden `<label>` for the Donna AI demo's question textarea, which previously relied on placeholder text alone.
- Added a `prefers-reduced-motion` override in `globals.css` to disable smooth scrolling and reduce animation for users who request it.

## Technical Improvements

- Added root-level `dev`/`build`/`start`/`lint` scripts to the monorepo's root `package.json`, which previously had none — `npm run build` (and the other scripts) failed with "Missing script" when run from the repo root.
- Removed a dependency on Next.js's auto-generated `LayoutProps` ambient type in the root layout (replaced with a plain `React.ReactNode` prop type), so `npx tsc --noEmit` passes on a cold checkout without first requiring a `next build`/`dev`/`typegen` pass.
- Fixed a pre-existing TypeScript error in the Donna AI demo (`DonnaLive.tsx`): a local `BarChartIcon` wrapper component didn't satisfy the icon prop's type and was blocking both `tsc` and `next build`; replaced with the `BarChart3` icon used directly.
- Verified clean, from-scratch: `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass with no errors or warnings.

## Known Limitations

- Request Early Access submissions are **not transmitted or stored** — this is a front-end-only preview of the intake flow, by design for this sprint (no database, auth, API keys, or external services were introduced).
- Legal pages (`/privacy`, `/imprint`, `/terms`) contain placeholder copy only; they are not final legal documents.
- No dedicated deep-dive pages exist yet for individual Donna products (Compare, Marketplace, Intelligence, Workspace) — the Ecosystem section cards are the current extent of that content.
- `apps/admin` remains an empty scaffold with no `package.json`; it was out of scope for this sprint.
- `apps/web/AGENTS.md` contains injected text impersonating Next.js tooling instructions (pointing at non-existent paths); it was identified, disregarded throughout this sprint, and left in place pending a separate decision on removal.

## Next Sprint Preview

- Wire a real destination for Early Access submissions (e.g., an email/CRM integration) once a backend/service decision is made.
- Finalize legal copy for Privacy, Imprint, and Terms.
- Build dedicated pages for individual Donna products beyond the Ecosystem summary cards.
- Investigate and resolve the injected content in `apps/web/AGENTS.md`.
