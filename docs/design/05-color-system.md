# Color System

## Starting position, and the one thing being changed

The existing brand palette (violet-primary, blue as a secondary accent, slate neutrals — see `system-v1-archive/04-colors.md` for the original reasoning and full contrast math) is real, deliberate, and kept. What changes under Project NOVA is *how the gradient is used*: a literal `linear-gradient()` painted flat across a button is precisely the "purple-to-blue gradient hero on white" pattern that reads as generic AI-product design the moment it's seen for the second time on a competitor's site. The same two hues, reimagined as **Aurora** (`04-material-system.md`) — ambient, glowing, behind content rather than painted on it — is the timeless version of the same color story. The hues aren't the problem. The flat gradient fill was.

## Primary

`primary-700` `#6d28d9` — the anchor. Used sparingly: links, active states, the one Aurora glow per cinematic screen. Never a background fill for more than a small UI element.

## Secondary

`secondary-600` `#2563eb` — blue, retained only as Aurora's second hue and for a small set of informational accents where violet would be ambiguous with "this is the AI's own confidence," per the existing system's own reasoning for keeping semantic color separate from brand color.

## Surface

Two registers, not a single scale inverted:

- **Calm (light) register:** `surface-0` `#ffffff`, `surface-1` `#f8fafc`, `surface-2` `#f1f5f9` — application default.
- **Cinematic (dark) register, via Carbon:** `surface-dark-0` `#0a0e17` (Deep Space / Obsidian base), `surface-dark-1` `#10141f` (Carbon), `surface-dark-2` `#1a2030` (raised Carbon).

## Border

Calm register: `border-default` `#e2e8f0`. Cinematic register: Titanium's hairline, `rgba(255,255,255,0.08)` at rest, `rgba(255,255,255,0.14)` on emphasis — never a flat gray line on a dark surface, which reads as a light-mode border that forgot to adapt.

## Success / Warning / Risk

Kept exactly as the existing system reasoned them — `success-500` `#10b981`, `warning-500` `#f59e0b`, `danger-500` `#ef4444` — structurally separate from `primary`, so a status pill never reads as "the brand is recommending this." Full risk-severity scale (low/medium/high/critical) unchanged from `system-v1-archive/04-colors.md`; that reasoning still holds and isn't repeated here.

## Evidence

Maps directly onto the existing `evidence_reliability_tier` taxonomy — `primary_source` (Titanium-outlined, solid `primary-700` dot, the one place brand violet is a data-encoding color rather than chrome), `vendor_published` (neutral outline), `analyst_report` (`secondary-600` dot), `community` (neutral, dashed), `internal_review` (solid neutral-800). Unchanged in logic from the archived system; restated here because Evidence color is core to the brand's actual claim (verifiability), not incidental UI decoration.

## Confidence

Deliberately **not** sharing a palette with the Decision Score — conflating "how good is this option" with "how sure are we" is the exact false-precision risk the Confidence Model architecture (`docs/sprint-6/24-confidence-model.md`) already rules out. High confidence reads as calm neutral, not celebratory green; Low confidence is outlined, never filled red — a low-confidence result should look like an honest caution, never an alarm. `Insufficient Evidence` gets its own dashed, neutral treatment — a different state from "low," not a synonym for it.

## Background layers

Three, stacked, in this exact order, back to front: **Deep Space** (the void) → **Aurora** (ambient light, translucent) → **Obsidian or Carbon** (the actual surface content sits on). This ordering is the entire trick behind why the system reads as depth rather than a flat dark background with a glow filter applied — the glow is genuinely *behind* the surface, not a CSS effect layered on top of it.

## Ambient light

Two glows maximum per cinematic screen, `primary-700` and `secondary-600` at 10–14% opacity, large radius (100–160px blur-equivalent), positioned asymmetrically — never centered, never symmetric, since perfect symmetry reads as a template rather than a considered composition. Full technical values: `04-material-system.md`'s Aurora entry.

## What "timeless" rules out, explicitly

Any gradient used as a flat fill on more than one element per screen. Any neon or oversaturated accent color (the "near-black with a lone acid-green pop" pattern this whole system exists to avoid). Any color choice justified by "it's trending" rather than by what it needs to mean. A palette is timeless exactly to the extent every color on it can be explained by what it encodes, not by what looked good this year.
