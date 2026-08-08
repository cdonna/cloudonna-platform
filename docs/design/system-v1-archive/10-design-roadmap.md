# Design Roadmap

## Component inventory — build vs. restyle vs. new

| Component | Action |
|---|---|
| Button | Restyle (already token-wired; stop the override pattern) |
| Card | Build (new shared primitive, replaces copy-pasted divs) |
| Forms/Inputs | Restyle |
| Table | Build (one instance exists; formalize into a shared primitive) |
| Dialog | Build (one hand-rolled instance exists; formalize) |
| Toast/Notification | Build (doesn't exist) |
| Command Palette | Build (doesn't exist — new capability) |
| Charts (`DimensionBar`, `ScoreRing` v2, `TrendSpark`) | Build |
| Empty State | Build (pattern exists once; formalize) |
| Sequenced Loader | Build (pattern exists once, in `AnalysingState`; formalize and generalize) |
| Decision Graph | Build (new — the single largest net-new component in this roadmap) |
| Org Switcher | Build (doesn't exist — depends on Sprint 6.3's multi-org UI existing at all) |

## Migration strategy

1. **Replace `globals.css`'s token layer first**, before touching any component — this is the one change that makes every subsequent restyle a mechanical find-and-replace instead of a redesign. Until this lands, "restyle onto tokens" has nothing to point at.
2. **Migrate the shared primitives next** (Button's override pattern, a real Card) — highest leverage, since every page uses them.
3. **Migrate page by page**, starting with the highest-traffic/highest-stakes screens (Homepage, Decision Page) — not alphabetically, not by ease.
4. **Build genuinely new components last** (Command Palette, Decision Graph, Charts) — these have no legacy version to migrate away from, so they're pure addition and can happen in parallel with the migration work above once the token layer exists.

## Effort estimate

- Token layer replacement: small, mechanical, low-risk — a single `globals.css` change plus a Tailwind theme config update.
- Shared primitive builds (Card, Table, Dialog, Toast, Empty State, Sequenced Loader): moderate — six components, each genuinely small once the token layer exists.
- Page-by-page restyle: the largest line-item by volume, but each individual page change is low-risk (visual only, no logic change) — the kind of work that parallelizes well across more than one implementation session.
- Net-new builds (Command Palette, Decision Graph, Charts, Org Switcher): the highest-skill, highest-risk-of-scope-creep work — Decision Graph specifically deserves its own focused pass, not a "while I'm in there" addition to an unrelated page migration.
- New dependency: `framer-motion` (or its current package name) — zero cost today (not yet added), real integration cost once motion work starts (`06-motion.md`).

## Design Sprint 1 — Foundation

**Scope:** token layer (`globals.css` replacement per `02-design-system.md`/`04-colors.md`), Button/Card/Forms restyle, typography scale applied globally. No new components, no new pages — the goal is making the *existing* product visually consistent before anything new is built on top of it.
**Explicitly excludes:** Command Palette, Decision Graph, motion (Framer Motion isn't installed yet — installing it and doing nothing with it yet would be premature).
**Done when:** every color/radius/spacing value in the codebase traces to a named token — the audit's central finding, closed.

## Design Sprint 2 — Application Experience

**Scope:** Dashboard redesign (`07-dashboard.md`), Decision Page redesign, Table/Dialog/Toast/Empty-State/Sequenced-Loader primitives built and applied, dark mode's real palette (`04-colors.md`'s "recompose, don't invert" rule executed, not just stated).
**Depends on:** Design Sprint 1's token layer existing.
**Explicitly excludes:** Command Palette, Decision Graph, Homepage motion.

## Design Sprint 3 — Signature Moments

**Scope:** Framer Motion added as a real dependency; the full Motion System (`06-motion.md`) implemented; Homepage hero redesign including the ambient Decision Chain animation (`08-homepage.md`); the full interactive Decision Graph (`09-donna-experience.md`); Command Palette; Donna's state animations (thinking pulse refinement, score count-up, graph traversal).
**Depends on:** Design Sprints 1 and 2 — this sprint is where the system becomes *distinctive*, which only works once it's already *consistent*.
**This is the sprint that actually produces "The ClouDonna Experience"** as a recognizable, differentiated feeling — Sprints 1 and 2 are necessary, unglamorous groundwork; Sprint 3 is where the brief's ambition is actually realized.

## What this roadmap deliberately does not schedule

Illustration/character work (none is recommended, per `02-design-system.md`), a marketing video, or any homepage element requiring real customer content that doesn't exist yet (logos, testimonials) — none of these are design-system work; scheduling them here would be scope creep into product-marketing decisions this document isn't positioned to make.
