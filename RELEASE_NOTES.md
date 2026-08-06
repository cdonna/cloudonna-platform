# ClouDonna — Public Alpha 0.4

**Date:** August 2026
**Branch:** `worktree-web-presence`
**Scope:** `apps/web` — technical SEO foundation, homepage repositioning, four new journey
pages, an audience-aware Early Access route

## Summary

This release repositions ClouDonna's public site around the ClouDonna Decision Framework
(Business Goal → Capabilities → Solution Approaches → Technology → Vendor) and establishes the
technical SEO foundation that was previously entirely missing (no `robots.txt`, `sitemap.xml`,
canonical URLs, Open Graph, or structured data existed anywhere on the site). See
`docs/web-presence-sprint.md` for the full audit findings and the phased implementation plan
this release follows.

## New Features

- **Technical SEO foundation** — `app/robots.ts`, `app/sitemap.ts`, a dynamic
  `app/opengraph-image.tsx`, sitewide `metadataBase` and Organization JSON-LD in `layout.tsx`,
  and a self-referential `alternates.canonical` on every route, new and existing.
- **Goal-first homepage** — Hero rewritten around a business goal, not a product category; the
  mock dashboard's fabricated stats and named-vendor "best match" (Snowflake, 91%, fake TCO
  figures) replaced with an explicitly labeled "Illustrative example" using an anonymized
  platform and qualitative maturity bands. Added a `NarrativeSequence` section (the eleven-step
  Discovery path) and a `TrustStrip` linking to the new independence statement.
- **Four new journey pages** — `/discovery` (the full Discovery path, step by step),
  `/independence` (the public neutrality statement and rules), `/for-vendors` and
  `/for-partners` (audience-specific journeys, each ending in an audience-aware Early Access
  CTA).
- **Audience-aware Early Access** — `/early-access` is now a dedicated route that reads a
  `?type=` parameter (customer/vendor/partner/community) and adapts its headline, copy, and
  preselected "I'm interested as a" field accordingly. The interest field itself was changed
  from a product-name dropdown to an audience-role dropdown.
- **Honesty pass on the existing `DonnaLive` demo** — added a visible "Illustrative example"
  label matching the disclosure standard already used on `/donna-ai`; the demo's underlying
  fixed-output logic (always recommending the same platform regardless of input) was
  intentionally left unchanged as a larger, separate piece of work.

## Explicitly Out of Scope This Release

- `/solutions/[goal]`, `/capabilities`, `/compare`, `/vendors`, `/partners`, `/pricing`,
  `/research`, `/about` — deferred; building them now would mean thin pages with no real content
  behind them. A content model for the dynamic pages is documented in
  `docs/web-presence-sprint.md`.
- Rebuilding `DonnaLive`'s demo logic to actually reason through the Decision Framework instead
  of returning a fixed result — flagged as a candidate for its own future sprint.
- No OpenAI integration, no persistence/auth, no analytics, no DNS/Vercel changes.

# ClouDonna — Public Alpha 0.3

**Date:** August 2026
**Branch:** `worktree-public-alpha`
**Scope:** `apps/web` — new `/donna-ai` route, `components/donna-ai/`, shared `hooks/`

## Summary

This release turns Donna AI from a scripted single-question demo into a real Enterprise
Decision Assistant: a six-step guided consulting workflow (Company → Landscape → Goals →
Constraints → Review → Analysis) at a dedicated `/donna-ai` route, backed by a deterministic,
rule-based mock decision engine, producing a full executive dashboard. No LLM, no backend, no
APIs, no database, no authentication — everything runs client-side against a curated platform
catalog. See `docs/donna-ai-alpha.md` for the full user flow, scoring logic, component
architecture, and design decisions.

## New Features

- **`/donna-ai` route** — a dedicated page hosting the full guided assessment, separate from the
  homepage's lighter Donna AI teaser (which now links to it, as does the Ecosystem section's
  Donna AI card).
- **Six-step guided consulting workflow**:
  - **Company** — Industry, Country, Employees, Revenue, IT Organization Size.
  - **Landscape** — ERP, CRM, Analytics, Data Warehouse, Cloud, AI Platform.
  - **Goals** — multi-select from 8 goals (Modernization, Business AI, Planning, Governance,
    Data Products, Cost Reduction, Compliance, Innovation).
  - **Constraints** — Budget, Timeline, Risk Appetite, Preferred Cloud, Preferred Vendor,
    Internal Skills.
  - **Review** — per-step recap with Edit links, plus a "Back to review" shortcut once every
    step is complete.
  - **Analysis** — an animated five-stage sequence, then automatic hand-off to results.
  - A "Try a sample company" shortcut pre-fills every step for fast demoing.
- **Deterministic decision engine** (`components/donna-ai/engine.ts`) — pure functions scoring a
  4-platform catalog (SAP Business Data Cloud, Microsoft Fabric, Snowflake, Databricks) via
  explainable trait-matching, producing Donna Score, Confidence Score, Executive Summary,
  Recommendation, an explicit **Alternative Recommendation**, Risks, Opportunities, Assumptions,
  Suggested Next Steps, and **Suggested Workshops**.
- **Executive dashboard** — six-tab result panel (Overview, Alternatives, Risks & Opportunities,
  Roadmap, Architecture, TCO analysis).

## UX Improvements

- Step transitions, tab switches, and the results reveal use `tw-animate-css` (already a project
  dependency) for a polished, non-gratuitous motion layer.
- Chip selections give immediate visual + press feedback; "Next" is disabled with an explicit
  hint until every required field on the step is answered.
- Fixed an edge case found during self-review: if a user's selections don't map to any scoring
  trait (e.g., Oracle ERP + "Planning" goal + neutral constraints — all valid picks), the
  Executive Summary and "Why this recommendation?" card show an honest low-signal message
  instead of a malformed or fabricated-sounding sentence.

## Accessibility Improvements

- Full keyboard support: chips are real buttons, the six result tabs support Arrow/Home/End
  roving-tabindex navigation, and focus moves to the new step's heading on every wizard step
  change (forward, back, or edit-jump).
- Progress indicator carries an `aria-live` region announcing step changes; the result panel's
  Save/Export actions announce their outcome the same way.
- Every wizard field is a `<fieldset>`/`<legend>`; every free-text note has a properly
  associated `<label htmlFor>`.
- All new interaction respects the existing `prefers-reduced-motion` override.

## Technical Improvements

- New `components/donna-ai/` module: `types.ts` (data model), `data.ts` (static catalog/content),
  `engine.ts` (pure scoring/reducer logic, framework-independent), and presentational components
  under `IntakeWizard/` and `ResultPanel/`.
- Extracted a shared `useRovingTabs` hook (`apps/web/src/hooks/use-roving-tabs.ts`) found during
  final quality review: the accessible-tabs keyboard navigation had been duplicated almost
  identically between the homepage's Donna AI demo and the new dashboard. Both now share one
  implementation.
- Verified clean, from a cold `.next` state: `npx tsc --noEmit`, `npm run lint`, and
  `npm run build` all pass with no errors or warnings.

## Known Limitations

- Architecture and TCO analysis tabs remain illustrative/generic — not yet generated per
  recommended platform (tracked in `docs/donna-ai-alpha.md`).
- The decision engine's platform catalog is small (4 platforms, 8 traits) and hand-curated; it
  is explicitly a mock/demo engine, not a real analyst. Several valid inputs (Oracle, "Planning,"
  "Compliance," no-preference constraints) currently contribute no scoring signal.
- Company, Landscape, and Constraints require every field answered before advancing (not just
  one) — a deliberate choice, documented in `docs/donna-ai-alpha.md` → Design decisions.
- Export report and Save decision remain session-local — nothing is transmitted or stored.
- Single-select chip fields use `aria-pressed` rather than full `radiogroup` ARIA semantics.

## Next Sprint Preview

- See `docs/donna-ai-alpha.md` → Future AI integration points.

---

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
