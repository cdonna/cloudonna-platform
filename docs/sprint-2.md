# Sprint 2 — Donna AI Alpha Experience

**Route:** `/donna-ai`
**Module:** `apps/web/src/components/donna-ai/`
**Status:** Implemented, not yet committed or merged

## Architecture

Three layers, kept strictly separated so the "decision engine" never depends on React:

```
Data layer      data.ts     — platform catalog, chip option lists, copy libraries, sample profile
Logic layer     engine.ts   — wizardReducer, scoring, output generation (pure functions, no React)
Presentation    IntakeWizard/, ResultPanel/, DonnaAIExperience.tsx
```

`DonnaAIExperience` is the top-level orchestrator. It owns a small phase state machine —
`"intro" | "wizard" | "analysing" | "results"` — via `useState`. The wizard's own multi-field,
multi-step data lives in a separate `useReducer` inside `IntakeWizard`, driven by
`wizardReducer` in `engine.ts`. The orchestrator only ever sees the wizard's *final* state
(passed once via the `onComplete` callback when the user confirms Review) — it never reaches
into the wizard's internals.

```
intro --start--> wizard --review confirmed--> analysing --auto--> results --start new analysis--> intro
```

Three of those four transitions are user-triggered; `analysing → results` is not — it fires
automatically once the analysis animation sequence completes.

## Implemented components

```
components/donna-ai/
  DonnaAIExperience.tsx    orchestrator — phase state machine
  types.ts                  shared TypeScript types (WizardState, DecisionOutput, PlatformProfile, ...)
  data.ts                    platform catalog, chip options, copy libraries, sample profile
  engine.ts                   wizardReducer, scoring, DecisionOutput generation, report export
  shared.tsx                  Chip, ScoreRing, SectionLabel — reused across wizard and dashboard
  AnalysingState.tsx           animated analysis sequence, personalized by the user's actual picks
  IntakeWizard/
    IntakeWizard.tsx             shell — owns the reducer, step transitions, focus management
    WizardProgress.tsx            progress indicator (bar + step list + aria-live announcement)
    ChipStep.tsx                   generic step (used for Company/Landscape/Goals/Constraints)
    ReviewStep.tsx                  recap of all four steps with per-step Edit links
  ResultPanel/
    ResultPanel.tsx                6-tab accessible shell (extends the tab pattern from the
                                    previous Donna AI sprint), owns Save/Export actions
    OverviewTab.tsx                 Executive Summary, Donna Score, Confidence, Score Breakdown,
                                     "Why this recommendation?", compact platform comparison
    AlternativesTab.tsx              full per-platform cards with matched-trait chips
    RisksOpportunitiesTab.tsx         two-column risks/opportunities + assumptions block
    RoadmapTab.tsx                     suggested next steps grouped Now / Next / Later
    ArchitectureTab.tsx                 illustrative architecture diagram (carried over, generic)
    TcoTab.tsx                           illustrative TCO model (carried over, generic)

app/donna-ai/page.tsx        route entry — minimal header (logo + back-to-home) + metadata
```

`apps/web/src/components/donna/DonnaLive.tsx` (the original homepage teaser) and
`components/landing/Ecosystem.tsx` were left otherwise untouched — the teaser gained one new
link to `/donna-ai`, and the Ecosystem section's "Donna AI" card now points at the full route
instead of the teaser anchor. Everything else from the previous sprint is unchanged.

## Scoring model

### Trait activation

User selections are mapped to a small, fixed set of scoring traits (`Trait` in `types.ts`):
`sap-native`, `governed-data`, `modern-architecture`, `multi-cloud`, `enterprise-scale`,
`cost-efficient`, `ai-ready`, `azure-aligned`. Not every chip activates a trait — e.g. Oracle,
"Faster decision-making," and "Limited internal resources" are valid, real selections that
don't map to anything in the current catalog. This is intentional (the trait set only covers
what the four catalog platforms actually differ on) but means the engine can legitimately
produce a low-signal result — handled explicitly, see Known Limitations.

### Donna Score

```
score(platform) = 34 + 15 × (matched traits)   — capped at 98
```

Platforms are ranked by score; ties fall back to catalog order (stable sort). The top score
becomes the Recommendation, the rest become Alternatives.

### Confidence Score

```
confidence = 55 + 6 × (categories with ≥1 selection, max 4) + 5 × (free-text notes written, max 4)
```

Capped at 96. This is deliberately a *different* signal from Donna Score — it measures how
much the user told Donna, not how good the resulting match is. It's capped below 100 as an
explicit, honest tell that even a fully-completed intake isn't certainty.

### Score Breakdown (Architecture / Business / Technology fit)

Each trait belongs to exactly one category (`FIT_CATEGORY_TRAITS` in `data.ts`):
architecture (`sap-native`, `governed-data`, `modern-architecture`, `multi-cloud`), business
(`enterprise-scale`, `cost-efficient`), technology (`ai-ready`, `azure-aligned`). A sub-score is
`matched-in-category / category's-total-trait-count`, using a fixed catalog-wide denominator
per category (not per-platform) so scores are comparable across platforms.

### Risks, Opportunities, Assumptions, Next Steps

- **Risks** — one snippet per selected constraint (`CONSTRAINT_RISK_TEXT`), padded to at least
  two with a small fallback pool if fewer than two constraints were selected.
- **Opportunities** — same pattern, keyed off selected goals.
- **Assumptions** — two fixed baseline assumptions, plus one per wizard step whose free-text
  note was left empty (an honest "here's what I didn't know" disclosure).
- **Suggested Next Steps** — a mostly-fixed four-item sequence grouped into Now/Next/Later; one
  slot swaps to a phased-rollout suggestion if "Aggressive timeline" was selected as a
  constraint. The last item always points toward Request Early Access.

## Known limitations

- **Small, hand-curated catalog** — four platforms, eight traits. This is an explainable mock
  engine, not a real market analysis.
- **Low-signal inputs are possible** — a user can complete the wizard with selections that
  activate zero traits (see Trait activation above). The engine handles this honestly (a
  distinct "didn't strongly differentiate" summary and reasoning message) rather than
  fabricating a plausible-sounding but meaningless answer.
- **Architecture and TCO tabs are generic** — carried over from the previous sprint's
  illustrative content, not yet generated per recommended platform.
- **No persistence** — Save decision, Export report, and the wizard's own progress are all
  session-local. Refreshing the page loses everything, by design (no backend, no database).
- **Single-select chip semantics use `aria-pressed`** rather than full `radiogroup`/`radio`
  ARIA for the Company step's Industry and Size fields. This is keyboard-operable and
  understandable to screen readers, but not the most precise ARIA pattern for a mutually
  exclusive choice — a reasonable simplification for this sprint's scope, not a blocker.

## Future integration points

- Swap the mock `engine.ts` for a real backend/LLM-backed service behind the same
  `DecisionOutput` shape — the presentation layer already only depends on that type, not on how
  it's produced.
- Generate Architecture and TCO content per recommended platform instead of the current
  illustrative placeholders.
- Expand the platform catalog and trait set as more products are evaluated.
- Wire Export report / Save decision to a real destination once a backend/auth decision is made
  (mirrors the same open question already noted for the Early Access form).
- Consider full `radiogroup` ARIA semantics for single-select chip fields if a future
  accessibility audit calls for it.
