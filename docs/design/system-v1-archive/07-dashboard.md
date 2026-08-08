# Dashboard and Decision Page

## Dashboard — current state vs. target

`/app` today is a two-card landing page (`app/app/page.tsx`) — functional, honest, not yet a dashboard in the Linear/Stripe/Snowflake sense the brief asks for. The gap isn't effort, it's scope: today's page answers "where do I go," a real dashboard also answers "what's the state of my world right now."

### Target layout

```
┌─────────────────────────────────────────────────────────────┐
│  Org switcher (⌘K-accessible)          Search    Account     │
├─────────────────────────────────────────────────────────────┤
│                                                                 │
│  Welcome back — one line, calm, never "Hi there! 👋"           │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │ Recent Decisions │  │ Decision         │  │ Run a new      │ │
│  │ (list, 5 max,     │  │ Confidence        │  │ assessment     │ │
│  │  human_readable_id,│  │ (aggregate across │  │ (the one       │ │
│  │  status pill,      │  │  saved decisions, │  │  primary CTA   │ │
│  │  score ring mini)   │  │  distribution not  │  │  on the whole  │ │
│  │                    │  │  a single number)   │  │  page)         │ │
│  └─────────────────┘  └─────────────────┘  └───────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ Decision Timeline — a real horizontal timeline, not a   │   │
│  │ list; recent saves/approvals/outcomes as points on it    │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌───────────────────────────┐  ┌─────────────────────────┐  │
│  │ Workspaces / Projects       │  │ Knowledge Graph preview  │  │
│  │ (grid, per docs/sprint-6)   │  │ (a static, beautiful      │  │
│  │                              │  │  snapshot — see           │  │
│  │                              │  │  09-donna-experience.md)  │  │
│  └───────────────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### What each element borrows, specifically

- **Org switcher** — Linear's exact pattern: a compact trigger, keyboard-accessible, opens the same component the command palette uses for org context.
- **Large cards over dense tables on the landing view** — Stripe Dashboard's instinct: the first screen is glanceable, not a data grid; a data grid is one click away (Decision History), never the default.
- **Decision Confidence as a distribution, not a single average** — Snowflake-caliber honesty about data: averaging confidence bands across dissimilar decisions would produce a meaningless number; a distribution (how many High/Medium/Low) tells the truth instead.
- **Decision Timeline as a real horizontal timeline component** — new, does not exist today; the single most "Linear-polish" new element on this page, built once and reused wherever a decision's lifecycle needs showing (also referenced in `docs/sprint-6/06-timeline.md`'s architecture).
- **Knowledge Graph preview as a static, beautiful snapshot, not a live interactive graph on the dashboard** — Apple's restraint principle: the full interactive graph lives on the decision page where it's earned context; the dashboard gets a taste, not a distraction.

## Decision Page — "the heart of ClouDonna," designed to feel board-ready

This is the highest-stakes screen in the product — the one a VP might screenshot into a board deck. Every element below is chosen against that bar specifically.

### Structure

1. **Executive header** — human-readable ID, title, status pill, Donna Score at `text-display` size with the count-up reveal (`06-motion.md`) on first view only. This is the one place `text-display` is used outside the homepage — deliberately, since this number *is* the headline of this page.
2. **Executive Summary** — one paragraph, `text-body`, generous line-height, max 65 characters wide even inside a full-width layout — read by someone who will not read the rest of the page.
3. **Recommendation vs. Alternatives** — a real side-by-side comparison, not a ranked list with the winner merely bolded; Snowflake-caliber data density done calmly, using the Decision Score color scale (`04-colors.md`) consistently across both.
4. **Confidence Decomposition** (`docs/sprint-6/24-confidence-model.md`) — rendered as named dimension bars, never a bare percentage, directly implementing that document's own "never false precision" rule visually.
5. **Evidence Trace** — collapsed by default (this is the "board-ready" instinct: an executive doesn't want to see every citation upfront, but a skeptical reviewer must be able to expand it in one click) — uses the Evidence Reliability color dots (`04-colors.md`).
6. **Trade-offs / Risks / Business Impact / Technical Impact** — a tabbed or accordion structure (reusing the existing, already-well-built roving-tabindex pattern from `ResultPanel`), never all expanded simultaneously — competing for attention is exactly what "confidence before complexity" rules out.
7. **Decision Memory footer** — version number, provenance (schema/engine/knowledge-base versions), created-by/date — small, `text-caption`, present but never competing with the content above it.

### What makes it feel board-ready, specifically

Not more content — *less*, arranged so the most important fact is unmissable and everything else is one deliberate click away. A board-ready document is edited, not exhaustive; this page's information architecture is the design system's answer to that standard.
