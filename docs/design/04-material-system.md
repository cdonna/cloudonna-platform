# The ClouDonna Material System

Not glassmorphism. Glassmorphism is one technique (blur, translucency, a light border) applied everywhere until it means nothing — the exact "one convention, no system" failure this codebase's own earlier design audit already diagnosed in a different guise. Five real materials, each with one job, used deliberately, never interchangeably.

## Deep Space

**What it is:** not a surface — the context every other material sits inside. The canvas, not a card on it.
**Texture:** none. Perfectly smooth, no grain, no pattern.
**Light:** an almost imperceptible vignette, darkening very slightly toward the viewport's edges — the visual equivalent of shallow depth of field, so whatever sits at the center of attention feels closest, without a single hard edge suggesting it.
**Reflection:** none.
**Transparency:** n/a — this is the base layer everything else is drawn on top of.
**Depth:** zero, by design — Deep Space is the absence of depth that makes every other material's depth legible by contrast.
**Where it's used:** the full-bleed background of the homepage's opening chapter, and nowhere inside the working application, where a true near-black background would fight the "screenshot into a board deck" requirement (`docs/founder/06-product-philosophy.md`).

## Obsidian

**What it is:** the deepest true surface material — used for full-bleed cinematic panels sitting on top of Deep Space.
**Texture:** perfectly smooth, volcanic-glass-adjacent — the one material in this system allowed to feel genuinely hard and cold.
**Light:** a single, distant, soft highlight, never a broad wash — Obsidian absorbs more light than it returns, which is deliberate: it makes anything placed on it (a headline, a score) the only thing that visibly catches light, by contrast.
**Reflection:** minimal, and only ever a single point, never a gradient sheen across the whole surface (the one thing that would make it read as plastic instead of glass-adjacent stone).
**Transparency:** fully opaque.
**Depth:** implied entirely by what's placed on top of it and by Aurora glowing faintly beneath it — Obsidian itself has no internal depth cue.
**Where it's used:** the homepage's hero panel; Donna's "thinking" narrative sequence background.

## Carbon

**What it is:** the working material — panels, cards, and containers in the dark register.
**Texture:** a near-invisible fine grain (roughly 2% noise), just enough that a large flat dark area reads as a considered surface instead of a flat color swatch — the detail most AI-product dark themes skip, and the reason they read as "inverted light mode" instead of a real material.
**Light:** catches faintly along top edges only.
**Reflection:** matte, minimal.
**Transparency:** opaque.
**Depth:** Carbon panels sit visibly forward of Obsidian/Deep Space via a soft, wide, low-opacity shadow — never via blur. Depth here is a shadow property, not a transparency property, which is the specific, deliberate difference from glassmorphism.
**Where it's used:** cards, panels, and containers wherever the dark register is active — the dashboard's dark mode, Donna's evidence and reasoning panels.

## Titanium

**What it is:** not a surface — an edge material. Borders, dividers, focus rings, button outlines.
**Texture:** brushed, directional — a subtle linear gradient suggesting a metal's grain, never a literal texture image.
**Light:** a crisp, thin highlight along one edge only.
**Reflection:** sharp, small, precise — Titanium catches light, it doesn't glow.
**Transparency:** opaque, but only ever used at 1–2px — it defines a boundary, it never fills an area.
**Depth:** structural, not atmospheric — Titanium is what tells a reader "this is where one thing ends and another begins," the material equivalent of `02-brand-principles.md`'s "typography is hierarchy."
**Where it's used:** every interactive edge — button outlines, focus rings, table dividers, the hairline separating Carbon panels from each other.

## Aurora

**What it is:** the one material allowed genuine color and motion — pure ambient light, never a surface.
**Texture:** none — it is light itself, not a thing light falls on.
**Light:** IS the light source — a soft, layered glow (the existing brand violet/blue) rendered as radial gradients, drifting almost imperceptibly (`03-motion-language.md`'s camera-movement rule).
**Reflection:** n/a.
**Transparency:** always translucent, always layered behind Obsidian and Carbon, never in front of readable content.
**Depth:** the deepest conceptual layer — Aurora reads as something glowing *from beneath* the surface, the material metaphor for "there is real intelligence working underneath this calm exterior," which is the entire brand thesis rendered as light.
**Where it's used:** exactly one or two instances per cinematic screen, never more (`03-motion-language.md`'s restraint rule applies here first) — the homepage's opening frame, and the one deliberate glow behind an "exceptional" Decision Score.

## The rule that makes this a system, not five separate ideas

Every material has exactly one job, and no material does another material's job under pressure to add visual interest. A card that wants to feel more premium gets a better shadow (Carbon's own language), never a borrowed Aurora glow bolted on — the discipline of keeping five materials distinct is what makes each one still mean something after the tenth screen that uses it.
