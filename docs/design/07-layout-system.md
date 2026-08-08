# Layout System

## Spacing

The archived 8px-based scale (`system-v1-archive/02-design-system.md`) is unchanged and correct. What Project NOVA adds is permission and a rule for *where the large end of that scale gets used*: the Cinematic register uses `space-24` and above routinely; the Calm register almost never does. Spacing isn't getting a new scale — it's getting an explicit register-aware policy for how aggressively the existing scale is applied.

## Grid

Three container widths, matching the archived system's `max-w-3xl`/`max-w-6xl`/`max-w-7xl` convention, unchanged. New: the homepage's cinematic chapters (`09-homepage-story.md`) are permitted true full-bleed (100vw) sections for the first time — the one place this system breaks its own container discipline, deliberately, because a chapter's opening frame is meant to feel boundless in a way application content never should.

## Rhythm

A page reads as considered when its vertical spacing follows a repeating pattern the eye can predict without consciously noticing it — the same section-to-section gap, the same card-to-card gap, never a one-off value chosen to make something "fit." Rhythm is broken exactly once, on purpose, at the transition from the homepage's dark opening chapter to its light detail chapters (`09-homepage-story.md`) — the single deliberate break is what makes the rest of the rhythm legible as intentional, not the absence of any break at all.

## Density

Two explicit settings, never blended within one screen: **spacious** (the Calm register's landing views — a dashboard's top-level cards, per `08-dashboard-philosophy.md`) and **dense** (evidence tables, dimension breakdowns, anything an architect is meant to scan quickly for a specific fact). A screen that's uniformly spacious hides real data an expert user wants fast; a screen that's uniformly dense feels like a spreadsheet, not an instrument. Both densities exist on most real screens, in clearly separated zones, never gradually blended into each other.

## Information hierarchy

One rule above every other layout decision: **the most important fact on a screen occupies the position a reader's eye reaches first (top-left to top-center, in left-to-right reading contexts) and is never sized smaller than the second-most-important fact.** Sounds obvious; the archived audit's own finding — no consistent treatment yet establishes "this is the most important number on the screen" — proves it wasn't previously enforced. This rule is now binding, checked per `10-design-review-checklist.md`.

## How dashboards should breathe

Breathing is a rhythm, not a constant — inhale (a spacious top zone: the Decision Score, the headline recommendation) then exhale into density (the evidence, the dimension table) as the reader's own attention naturally narrows from "what's the answer" to "let me verify it." A dashboard that's spacious all the way down never lets the reader get to verification without excessive scrolling; a dashboard that's dense all the way down never gives the answer room to land first. `08-dashboard-philosophy.md` builds directly on this rhythm.
