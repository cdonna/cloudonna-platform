# ClouDonna Design System v2 — Overview

This document is the map; `03-typography.md` through `06-motion.md` are the detailed specifications each section below points to. The organizing idea is simple, stated once so every later document can assume it: **every visual value used anywhere in the product is a named token, and every token is defined in exactly one place.** The audit in `01-design-philosophy.md` found the opposite is true today (`bg-primary` used in one file, hardcoded `blue-600` everywhere else) — this system exists to close that gap, not to invent a new aesthetic from nothing.

## What "The ClouDonna Experience" actually means

Not a single borrowed element from any one inspiration — a specific combination, chosen for what each contributes to *this* product's job:

| Inspiration | What ClouDonna takes from it |
|---|---|
| Apple | Restraint. One idea per screen, generous negative space, materials (blur, translucency) used sparingly for real depth cues, never decoration. |
| Snowflake | Enterprise data-density done calmly — dense information that never feels cramped, because hierarchy carries the weight, not color. |
| Databricks | Confidence in showing real, structured, technical content (evidence, architecture) without dumbing it down for an "executive" audience that is, in reality, technically literate. |
| Dremio / Reltio | Comfort with graph and lineage visualization as a first-class UI pattern, not an afterthought chart. |
| SAP | The specific credibility signal of "this software will still be here, unchanged in its promises, in five years" — conveyed through consistency and the *absence* of trend-chasing, not through visual weight. |
| Vercel | Typography as the primary craftsmanship signal — Geist, already in this codebase, is a direct instance of this, not a metaphor. |
| Linear | Motion and interaction polish at the micro level — the feeling that every click was considered, never that "any" motion was applied for effect. |
| Stripe | Making genuinely complex domain concepts (here: evidence, confidence, trade-offs) legible through information design rather than through explanation. |
| Notion | Calm, humane microcopy and empty states — a product that talks *to* a person, never *at* them. |

## Token categories (full specification in the documents named)

- **Typography** — `03-typography.md`. One recommended pairing (Geist Sans + Geist Mono), a twelve-step named scale (Hero through Code).
- **Color** — `04-colors.md`. Neutral, primary, semantic, and four new domain-specific scales (Decision Score, Confidence, Evidence, Risk) that do not exist today.
- **Spacing** — an 8px-based scale, six semantic aliases (`space-component`, `space-card`, `space-section`, etc.) mapped onto raw steps so a future re-tune is a one-line change, not a find-and-replace.
- **Radius** — four tokens, replacing the five-plus ad hoc values found in the audit: `radius-sm` (4px, inputs/chips), `radius-md` (8px, buttons/small cards), `radius-lg` (16px, cards), `radius-xl` (28px, hero panels/dialogs — matches the existing `rounded-[1.75rem]` already in use, formalized rather than replaced).
- **Elevation / shadow** — four levels, named by *purpose* not by size: `shadow-resting` (cards at rest — a whisper, `0 1px 2px`), `shadow-raised` (hover/focus), `shadow-overlay` (dialogs/dropdowns), `shadow-hero` (the one dramatic, colored shadow reserved for hero-moment CTAs — formalizing the existing `shadow-[0_40px_110px_-45px_rgba(79,70,229,0.4)]` pattern already used ad hoc across several components).
- **Animation** — `06-motion.md`. Durations, easings, and the specific product moments motion is assigned to.
- **Component library** — `05-components.md`. The full inventory: Buttons, Cards, Forms, Tables, Dialogs, Notifications, Command Palette (new), Charts (new), Empty States, Loading States.
- **Iconography** — Lucide, unchanged (the audit's highest-scoring category) — formalized sizing tokens (`icon-xs` 12px through `icon-lg` 24px) so "which size for which context" stops being decided per-instance.
- **Illustration style** — no illustrated character or scene-based illustration anywhere in the product today, and none is recommended. ClouDonna's "illustration" is data itself — the decision graph, score visualizations, evidence traces — rendered beautifully, per Databricks/Dremio's example, rather than decorative artwork standing in for content.

## Design tokens — illustrative shape (full values in 03/04)

```css
/* Replacing globals.css's unused shadcn grayscale defaults */
:root {
  --color-neutral-950: #0a0e17;   /* replaces oklch(0.145 0 0) with a
                                      deliberately-chosen, slightly cool-
                                      biased near-black, not pure gray */
  --color-primary: #6d28d9;        /* violet-700 anchor — see 04-colors.md
                                      for why violet, not blue, is primary */
  --color-brand-gradient: linear-gradient(135deg, #2563eb, #6d28d9);

  --space-1: 0.25rem;  --space-2: 0.5rem;  --space-3: 0.75rem;
  --space-4: 1rem;     --space-6: 1.5rem;  --space-8: 2rem;
  --space-12: 3rem;    --space-16: 4rem;   --space-24: 6rem;

  --radius-sm: 0.25rem; --radius-md: 0.5rem;
  --radius-lg: 1rem;    --radius-xl: 1.75rem;

  --shadow-resting: 0 1px 2px rgb(15 23 42 / 0.06);
  --shadow-raised: 0 8px 24px -8px rgb(15 23 42 / 0.12);
  --shadow-overlay: 0 24px 64px -16px rgb(15 23 42 / 0.24);
  --shadow-hero: 0 40px 110px -45px rgb(109 40 217 / 0.4);
}
```

This is a genuine replacement of `globals.css`'s current content, not an addition alongside it — the whole point is collapsing two systems into one. Migration mechanics are in `10-design-roadmap.md`.

## Accessibility rules (binding across every document in this set)

- Every color pairing meets WCAG AA (4.5:1 body text, 3:1 large text/UI components) — verified per-token in `04-colors.md`, not asserted in general.
- Every interactive element has a visible focus state — never removed for aesthetic reasons, only restyled.
- Every animation respects `prefers-reduced-motion` (already correctly handled once, globally, in today's `globals.css` — this system keeps that global rule and extends it to every new Framer Motion animation individually, since the CSS-level override does not reach JS-driven motion).
- Dark mode, once built, is a first-class target for every token — not a grayscale invert applied after the fact.

## Responsive rules

Five breakpoints, matching Tailwind's own defaults exactly (`sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px) — no custom breakpoint scale, since the audit found no evidence today's ad hoc breakpoint usage needs one. What's new: a documented container-width rule (`max-w-3xl` for reading content, `max-w-6xl` for application UI, `max-w-7xl` for marketing) replacing the current per-page improvisation.
