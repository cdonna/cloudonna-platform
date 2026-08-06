# Donna AI — Alpha Experience

**Route:** `/donna-ai`
**Module:** `apps/web/src/components/donna-ai/`
**Status:** Implemented, not yet committed or merged

Donna AI is not a chatbot — it's a structured, six-step consulting workflow that ends in an
executive decision report. Every step, score and recommendation is produced by a deterministic,
rule-based engine running entirely in the browser: no LLM, no backend, no APIs, no database, no
authentication.

## User flow

```
Intro → Company → Landscape → Goals → Constraints → Review → Analysis (auto) → Executive Dashboard
```

1. **Intro** — sets expectations ("not a chatbot"), offers "Start your assessment."
2. **Company** — Industry, Country, Employees, Revenue, IT Organization Size (all required).
3. **Landscape** — ERP, CRM, Analytics, Data Warehouse, Cloud, AI Platform (all required;
   each has an "Other / None" option so nothing forces a false answer).
4. **Goals** — multi-select from 8 goals (Modernization, Business AI, Planning, Governance,
   Data Products, Cost Reduction, Compliance, Innovation); at least one required.
5. **Constraints** — Budget, Timeline, Risk Appetite, Preferred Cloud, Preferred Vendor,
   Internal Skills (all required).
6. **Review** — recaps all four steps with per-field summaries and per-step Edit links. A
   "Back to review" shortcut appears on any step once every step is complete, so editing one
   answer doesn't force re-clicking Next through the rest.
7. **Analysis** — five-stage animated sequence ("Analyzing {industry} landscape...", "Comparing
   architectures...", "Evaluating technology fit...", "Calculating Donna Score...", "Preparing
   executive recommendation..."), then automatically advances — no user action required.
8. **Executive Dashboard** — a six-tab report: Overview, Alternatives, Risks & Opportunities,
   Roadmap (incl. Suggested Workshops), Architecture, TCO analysis.

Every field is single- or multi-select via chips — no free-form parsing. Each step also has an
optional free-text note, which is never analyzed, only echoed back honestly as context (in
Assumptions, if left blank) or included verbatim in the exported report.

A "Try a sample company" shortcut on step 1 pre-fills a realistic profile and jumps straight to
Review, for fast demoing.

## Design decisions

### Step-completion policy: require every field, not just one

**Decision:** Company, Landscape and Constraints each require *every* field answered before
"Next" is enabled — not just one, as an earlier draft of this sprint used. Goals (a genuine
multi-select) only requires at least one selection, since "select all that apply" has no
meaningful notion of a required subset.

**Why this is the simplest maintainable option:** step-advancement validation
(`canAdvanceFromStep`) and confidence-scoring completeness
(`isCompanyComplete`/`isLandscapeComplete`/`isConstraintsComplete` in `engine.ts`) are the exact
same functions. There is one definition of "this step is complete" in the codebase, used for
both purposes. The alternative — allowing advancement with only one field answered — would force
a choice between two worse options: either the confidence-scoring logic would need a second,
weaker completeness check that diverges from what actually gates advancement (two sources of
truth to keep in sync as fields are added or changed), or the Review step and Confidence Score
would routinely show "Not specified" gaps even after the user has moved on, reading as an
unfinished form rather than a completed assessment.

**Preserves the deterministic architecture:** the change is confined to a single boolean
predicate per step; the scoring engine, trait activation, and `DecisionOutput` generation are
untouched either way.

**Preserves the approved UX:** matches "make a CIO feel like they're working with a world-class
Enterprise Strategy Consultant" — a real intake asks for everything, not a sampling. Every field
still has an "Other / None" (or equivalent) option, so no question can force a false or made-up
answer, which keeps the higher completion bar from becoming a dead end.

**Preserves accessibility:** unaffected — the same `canAdvance` boolean already drives the
disabled state and the "Answer every question to continue." helper text; requiring more fields
doesn't add new interaction patterns, only more instances of the one that already exists.

**No code changes were needed** — this documents and confirms the existing implementation as
the deliberate choice, rather than an oversight to fix later.

## Scoring logic

**As of Sprint 3, scoring is Donna Score v2 — a 10-dimension, centrally-weighted model over a
10-platform vendor intelligence catalog.** Full detail lives in two dedicated docs rather than
duplicated here:

- `docs/vendor-intelligence-model.md` — the platform catalog and its field model
- `docs/donna-score-v2.md` — all ten dimensions, the weighting formula, and confidence scoring

The short version: `donnaScore` is a weighted sum of ten independently-scored dimensions
(Architecture, Business, Technology, Governance, AI Readiness, Security, Ecosystem, Cost,
Time-to-Value, Strategic Fit), each returning its own positive/negative evidence. The
Recommendation is the top-ranked platform; the next-highest is the **Alternative
Recommendation**, surfaced explicitly in the Overview tab.

### Confidence Score

```
confidence = 55 + 6 × (steps with ≥1 valid answer, max 4) + 5 × (free-text notes written, max 4)
             − 10 if the top result's Architecture Fit found zero positive evidence
```

Capped at 96, floored at 30. Distinct from Donna Score — it measures how much the user told
Donna and how strong the resulting signal was, not how good the match is in absolute terms.

### Risks, Opportunities, Assumptions, Workshops, Next Steps

- **Risks** — one snippet per constraint answer that has risk implications (tight budget,
  aggressive timeline, limited skills, single-vendor preference), padded to at least two with a
  fallback pool if fewer apply.
- **Opportunities** — one snippet per selected goal, same fallback pattern.
- **Assumptions** — two fixed baseline assumptions, plus one per step whose free-text note was
  left blank.
- **Suggested Workshops** — always includes an Architecture Deep-Dive; adds Governance
  Readiness, Business AI Readiness, TCO Validation, or Migration Planning depending on selected
  goals/constraints, padded to at least two.
- **Suggested Next Steps / Roadmap** — a mostly-fixed sequence grouped Now / Next / Later; one
  slot swaps to a phased-rollout suggestion under an aggressive timeline. The last item always
  points toward talking to the ClouDonna team.

### Low-signal input

If a user's selections activate zero traits, the Executive Summary and "Why this
recommendation?" card switch to a distinct, honest message explaining that the inputs didn't
strongly differentiate between platforms, rather than presenting a confident-sounding reason
that doesn't exist. Found and fixed during self-review by tracing a realistic input combination
(Oracle ERP + "Planning" goal + neutral constraints) by hand.

## Component architecture

```
Data layer      data.ts, vendor-intelligence/     — chip options, copy libraries, 10-platform catalog
Logic layer     engine.ts, scoring/, decision-engine.ts — reducer, Donna Score v2, provider seam (pure, no React)
Presentation    IntakeWizard/, ResultPanel/, comparison/, DonnaAIExperience.tsx
Shared hook     hooks/use-roving-tabs.ts — Arrow/Home/End keyboard navigation for accessible
                tablists, shared between this dashboard and the homepage's Donna AI demo
Future seams    persistence/types.ts — interfaces only, unimplemented and unused
```

`DonnaAIExperience` owns a phase state machine (`intro → wizard → analysing → results`) via
`useState`; the wizard's own multi-field, multi-step data lives in a separate `useReducer`
inside `IntakeWizard`, only handed to the orchestrator once via `onComplete` when Review is
confirmed. It calls `decisionEngine.run(state)` rather than the scoring engine directly — see
`docs/future-ai-integration.md`.

```
components/donna-ai/
  DonnaAIExperience.tsx    orchestrator (calls decisionEngine.run, not the engine directly)
  decision-engine.ts         RecommendationProvider/DecisionEngine seam
  types.ts                    WizardState, DecisionOutput, and every input union type
  data.ts                      chip option lists, copy libraries, sample profile
  engine.ts                     wizardReducer, DecisionOutput assembly, report export
  shared.tsx                     Chip, ScoreRing, SectionLabel
  AnalysingState.tsx              analysis sequence
  vendor-intelligence/
    types.ts, catalog.ts            10-platform catalog — see docs/vendor-intelligence-model.md
  scoring/
    types.ts, weights.ts, engine.ts   Donna Score v2 — see docs/donna-score-v2.md
  persistence/
    types.ts                          SavedAssessment/Project/Workspace — unused, interfaces only
  IntakeWizard/
    IntakeWizard.tsx             shell — reducer, step transitions, focus management
    WizardProgress.tsx            progress bar + step list + aria-live announcement
    ChipStep.tsx                   generic step — renders N chip fields + one note field
    ReviewStep.tsx                  recap with per-step Edit links
  comparison/
    ComparisonMatrix.tsx            up to 4 platforms, real computed dimension scores
  ResultPanel/
    ResultPanel.tsx                6-tab accessible shell (uses useRovingTabs), owns Save/Export
    OverviewTab.tsx                 Executive Summary, Donna/Confidence Score, Score Breakdown,
                                     Current Situation, Decision Drivers, evidence + concerns
    AlternativesTab.tsx              ComparisonMatrix + full per-platform detail cards
    RisksOpportunitiesTab.tsx         risks / opportunities / assumptions
    RoadmapTab.tsx                     Now/Next/Later next steps + Suggested Workshops
    ArchitectureTab.tsx                 illustrative, generic (not yet per-platform)
    TcoTab.tsx                           illustrative, generic (not yet per-platform)
```

`ChipStep` is the one deliberate abstraction doing real work here: every step (5 fields, 6
fields, or 1 multi-select field) is the same component with a different `fields` array, so
Company/Landscape/Constraints — despite having wildly different field counts — share one
implementation rather than three near-duplicates.

## Future AI integration points

See `docs/future-ai-integration.md` for the full detail. Short version: `decision-engine.ts`
defines `RecommendationProvider`/`DecisionEngine`; the deterministic engine is the only provider
today; a future LLM-backed provider implements the same interface and requires no UI changes.

Also still open:
- Generate Architecture and TCO tab content per recommended platform instead of the current
  generic illustrations.
- Expand the platform catalog and trait set further (see `docs/vendor-intelligence-model.md`).
- If free-text notes are ever actually parsed (rather than only echoed back), that's the
  natural seam for an LLM: notes stay optional and additive, so a real NLP step could enrich
  `DecisionOutput` without changing the required chip-based flow.
- Wire Export report / Save decision to a real destination once a backend/auth decision is
  made — currently both are session-local by design.

## Known limitations

- Single-select chip fields use `aria-pressed` rather than full `radiogroup`/`radio` ARIA
  semantics — keyboard-operable and understandable, but not the most precise pattern for a
  mutually exclusive choice.
- No browser automation was available while building this — verified via `tsc`/`lint`/`build`,
  a static-render smoke test, and manual tracing of the reducer/engine logic, not live
  click-through testing.
- Nothing persists across a page refresh, by design (no backend, no database).
