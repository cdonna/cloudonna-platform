# ClouDonna — Public Alpha 0.6

**Date:** August 2026
**Branch:** `worktree-sprint-5`
**Scope:** `apps/web/src/components/donna-ai/intelligence/` (new module), `app/api/donna-ai/decision/` (new route), `ResultPanel`/`DonnaAIExperience` (AI Insights tab wiring), `docs/intelligence/` (new documentation set)

## Summary

The Donna Intelligence Engine: an explainable, provider-independent narrative layer on top of
Donna's existing deterministic scoring engine. A real OpenAI-backed provider now ships alongside
the deterministic one, selected automatically by whether `OPENAI_API_KEY` is configured — with no
code change required to run without it. The deterministic engine remains the sole source of every
score, ranking, and dimension; the AI layer narrates and explains what was already computed and is
structurally unable to change it — enforced by type shape, `.strict()` schema validation, and two
content-level claim checks (unsupported numeric claims, unsupported vendor mentions), not by
prompt wording alone. Every failure mode — no key, timeout, rate limit, malformed response,
network error, an attempted score override, a fabricated vendor claim — degrades to a complete,
valid `DecisionReport` with a clear, honest "AI enrichment unavailable" state in the UI; the
Donna Score, ranking, and every existing `ResultPanel` tab are unaffected by any of it.

## New Features

- **`intelligence/` module** — `DecisionInput`, `EvidencePackage`, `IntelligenceEnrichment`,
  `DecisionReport` (with nested `ProviderMetadata`/`FallbackMetadata`) contracts;
  `IntelligenceProvider` and `KnowledgeProvider` interfaces; `RecommendationOrchestrator`
  composition root with rate-limiting and metadata-only audit seams built in.
- **Two providers** — `deterministicIntelligenceProvider` (template-based, always succeeds, the
  default with no configuration) and `createOpenAIIntelligenceProvider` (structured-output OpenAI
  calls via `zodResponseFormat`, server-only, configurable model/timeout/token budget/retries via
  environment variables — see `.env.example`).
- **Layered prompt architecture** (`prompt.ts`) — immutable policy and methodology layers,
  structured evidence serialization with an explicit untrusted-data boundary around user notes and
  retrieved evidence, defense-in-depth against prompt injection.
- **Runtime validation** (Zod) — every enrichment field bounded and schema-checked
  (`.strict()`, rejecting any smuggled field such as a numeric score); evidence references checked
  against the real evidence package; narrative text screened for unsupported numeric claims *and*
  unsupported vendor mentions (a real catalog product outside the session's shortlist).
- **Deterministic fallback matrix** — `disabled` / `timeout` / `rate_limited` / `unavailable` /
  `invalid_output`, every one producing a complete `DecisionReport`; a client-side fallback in
  `DonnaAIExperience.tsx` additionally covers total network failure by calling the local
  deterministic engine directly.
- **`app/api/donna-ai/decision` route** — the only place `OPENAI_API_KEY` is ever read; verified
  by grepping a real production build's client bundles for zero occurrences of the key or any
  OpenAI SDK call.
- **"AI Insights" tab** (`ResultPanel`) — surfaces the executive summary, situation framing,
  business outcomes, decision drivers, recommendation/alternative narrative, trade-offs, risks and
  opportunities in context, missing information, validation/challenge questions, next
  steps/workshops, confidence explanation, evidence references, and a disclosure notice — or a
  clear, accessible "unavailable" state with an explicit reassurance that scores are unaffected.
- **Test suite** (Vitest) — 92 tests across 12 files (unit, contract, failure-mode, security,
  integration, mocked-provider), plus one intentionally skipped cross-tenant placeholder and a
  separately-gated live-provider test never required in CI. Zero network access, zero API keys,
  zero environment variables required for the default run.
- **`docs/intelligence/`** — architecture, the `DecisionReport` contract, evidence package,
  provider boundaries, fallback/failure model, prompt architecture, security and privacy, cost
  controls, testing strategy, and a sprint review.

## Explicitly Not Done This Release

- No production authentication, no persistence of `DecisionReport` anywhere, no unrestricted chat
  or multi-turn conversation.
- No claim of GDPR compliance — see `docs/intelligence/security-and-privacy.md` for the specific
  legal/operational work that remains before real customer data reaches this pipeline.
- No billing, quota enforcement, or multi-instance-safe rate limiting — the in-memory limiter
  shipped is explicitly a single-instance reference implementation, not a production control.
- No live-vendor crawling, price scraping, model fine-tuning, or document ingestion.

---

# ClouDonna — Public Alpha 0.5

**Date:** August 2026
**Branch:** `worktree-sprint-3`
**Scope:** `apps/web/src/components/donna-ai/` — vendor intelligence, scoring, comparison, and seam modules

## Summary

Donna Intelligence Foundation: the deterministic engine and 4-platform catalog from the previous
sprint are replaced with a structured 10-platform vendor intelligence model and a transparent,
10-dimension Donna Score v2. Every recommendation now carries explicit positive evidence and
concerns per dimension, a real comparison matrix, and a current-situation/decision-drivers
recap. Two architectural seams (a `RecommendationProvider` interface for future AI integration,
and persistence-ready interfaces for saved assessments) are defined but intentionally
unimplemented. No LLM, no backend, no database, no authentication, no external API, no live
market data — this remains fully runnable without credentials.

## New Features

- **10-platform vendor intelligence catalog** — SAP Business Data Cloud, Snowflake, Databricks,
  Microsoft Fabric, Oracle, AWS, Google Cloud, Palantir, IBM, MongoDB. Each carries structured
  fields (best/poor-fit scenarios, strengths, limitations, governance/AI/security maturity,
  cost tier, lock-in risk, supported industries/sizes, and more) plus an explicit
  `sourceNotes` field stating this is curated mock data, not live market data or vendor
  certification.
- **Donna Score v2** — ten independently-scored, independently-weighted dimensions
  (Architecture, Business, Technology, Governance, AI Readiness, Security, Ecosystem, Cost,
  Time-to-Value, Strategic Fit) replace the previous single formula. Weights are centralized in
  one file and documented.
- **Comparison matrix** — a reusable component comparing up to 4 platforms across 13 criteria,
  using real computed scores from the same engine that produced the Donna Score. Flags
  cross-category comparisons (e.g. an operational database vs. a data platform) rather than
  implying false equivalence.
- **Executive Report v2** — the result dashboard gained Current Situation, Decision Drivers, an
  explicit Alternative Recommendation badge, structured positive evidence and concerns per
  dimension, and a persistent illustrative-alpha-output disclosure.
- **Future AI integration seam** — `RecommendationProvider`/`DecisionEngine` interfaces; the
  deterministic engine is wrapped as the only current provider. Documented, not built: no API
  keys, network calls, environment variables, or LLM package were added.
- **Future persistence seam** — `SavedAssessment`/`Project`/`Workspace` interfaces defined for
  future use. No database, no Supabase, no auth — genuinely unimplemented and unused today.

## Technical Improvements

- Confidence Score now factors in signal quality, not just input completeness — a fully
  completed assessment that still produces a weak-signal recommendation correctly reports lower
  confidence.
- Self-review caught and fixed three real issues before this release: the AI-integration seam
  was built but never actually called (fixed by wiring `DonnaAIExperience` through
  `decisionEngine.run()`); an `as never` type cast in the comparison matrix was replaced with
  correct typing; a duplicated `CATEGORY_LABELS` constant was consolidated into one module.
- Verified clean at every phase checkpoint: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Known Limitations

- 10 platforms and 15 traits remain intentionally small for an explainable mock engine — several
  valid inputs (Oracle, "Planning" goal, neutral constraints) still produce zero Architecture Fit
  signal, handled honestly rather than silently.
- Architecture and TCO tabs remain generic/illustrative, clearly labeled as such.
- No persistence, no AI call — both seams are interfaces only.

## Next Sprint Preview

- See `docs/sprint-3.md` → Next sprint candidates.

---

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

---

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
