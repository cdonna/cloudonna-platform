# Motion System

## Starting point: this is the audit's weakest category, and the one requiring a real new dependency

`01-design-philosophy.md` scored Motion 3/10 — a few decorative CSS blurs, one CSS-only transition utility (`tw-animate-css`), no Framer Motion installed. This document specifies a real system; `10-design-roadmap.md` names adding `framer-motion` (or its current package name, `motion`) as an explicit, real dependency addition, not something already quietly available.

## Motion principles

- **Evidence before animation** (`01-design-philosophy.md`) — every entry here names the specific thing a user understands *because* of the motion, not just "feels alive."
- **Never distracting.** Nothing loops indefinitely except a genuine in-progress indicator (and even those resolve, per `AnalysingState`'s existing five-step pattern — an end state, not an infinite spinner).
- **`prefers-reduced-motion` is respected by every single animation in this document**, individually — the existing global CSS rule (`globals.css`) only catches CSS transitions/animations; Framer Motion animations need the same check applied via `useReducedMotion()` at each call site.

## Duration and easing tokens

```
duration-instant   100ms   micro-interactions (button press, checkbox toggle)
duration-fast       200ms   hover states, tab switches
duration-base        320ms   dialogs opening, card entrances
duration-slow          480ms   page-level transitions, the Donna Score reveal
duration-narrative       800ms+  orchestrated multi-step sequences (Donna thinking,
                          decision graph traversal) — the only category allowed
                          to run longer, because it's narrating a real process,
                          not waiting on one

ease-standard   cubic-bezier(0.4, 0, 0.2, 1)   default for nearly everything
ease-decelerate cubic-bezier(0, 0, 0.2, 1)      entrances (something arriving)
ease-accelerate cubic-bezier(0.4, 0, 1, 1)      exits (something leaving)
```

## Assigned to specific product moments

**Page transitions.** A subtle 200ms cross-fade + 8px vertical settle on route change — enough to signal "you're somewhere new," never a full-screen wipe or anything that costs the user time.

**Card hover.** `duration-fast`, `shadow-resting` → `shadow-raised`, a 1px translate-up — the exact, minimal Linear-style hover, no scale transform (scaling text-bearing cards on hover degrades legibility mid-transition, a common overreach this system deliberately avoids).

**Navigation (command palette, org switcher).** Palette: scale from 96% + fade, `duration-base`, `ease-decelerate` — arriving with intent, not sliding in from an edge. Org switcher dropdown: `duration-fast` fade + 4px settle.

**Drawer / dialog.** Backdrop fades in `duration-fast`; the dialog itself scales from 97% + fades, `duration-base`, `ease-decelerate` — already close to what `SaveDecisionDialog` does today via CSS, formalized and given a slight scale for more perceived intentionality.

**Decision generation (the wizard → result transition).** The existing five-step `AnalysingState` sequence is kept exactly as designed (it already scored well in the audit) — this system adds one thing: as each step completes, its checkmark doesn't just appear, it draws in (`duration-base`, a stroke-path animation on the check icon) — a small, specific signal that *this specific step* just finished, reinforcing the sequence's own honesty about what's actually happening.

**Donna "thinking."** Not a generic spinner. A slow (`duration-narrative`), subtle pulse on the Bot icon's containing gradient square — already present as `animate-ping` in the current codebase, kept, but formalized to pulse at a *calm* cadence (per "AI should feel calm") rather than an attention-grabbing one; explicitly never a bouncing-dots chat-typing indicator, since that's exactly the "generic chatbot" visual language this product's own principles reject.

**Loading (general).** `<SequencedLoader>` (`05-components.md`) for anything with real discrete stages; a simple, non-spinning pulse-skeleton (matching the final content's actual layout) for single-fetch loads — never a generic spinner as the default, since a skeleton communicates *what's coming*, which a spinner doesn't.

**Graph animations (the Decision Graph, `09-donna-experience.md`).** The signature orchestrated motion of the whole system: each stage of Business Goal → Capability → Architecture → Technology → Vendor → Evidence → Decision → Outcome draws in sequentially, `duration-narrative` per stage, connected by a line that traces (stroke-dashoffset animation) rather than appearing instantly — literally showing the reasoning chain being built, the single most "Databricks/Dremio-caliber" moment in the product.

**Score animations.** The Donna Score counts up from 0 to its final value over `duration-slow`, eased with `ease-decelerate` (fast start, settling precisely on the real number) — the ring/bar fills in sync, never ahead of or behind the counting number. Counting up is used exactly once per score, on first reveal only — re-rendering the same score on a later interaction never re-animates, which would cheapen the moment into a gimmick.

## What this system explicitly avoids

Parallax scrolling, scroll-jacking, looping background animations, confetti/celebration effects, any animation whose primary purpose is "feels premium" rather than "communicates a specific state change" — all of it is the "trendy effects without purpose" the brief explicitly rules out, and all of it is common in exactly the kind of AI-product landing page this system is deliberately not imitating.
