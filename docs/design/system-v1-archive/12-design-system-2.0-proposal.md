# The Cinematic Layer — Design Proposal

**Status: proposal only, not implemented.** Extends `docs/design/02-design-system.md`'s existing token system (not a replacement — see `11-design-system-2.0-review.md`'s naming note). Every new token below is additive to that system; nothing existing is renamed or removed.

## 1. New visual identity

**The core move: two registers, one brand, governed by one token system.** A **Cinematic register** (dark, ambient, spacious — the marketing site and Donna's narrative moments) and a **Calm register** (light-primary with a genuine dark option — the working application). Both use the same violet/blue brand hues, the same Geist typography, the same restraint principles; they differ in *depth and darkness*, not in *identity*. This is the Apple pattern exactly: apple.com's product pages are often near-black and cinematic; iOS/macOS themselves are adaptive, mostly light-leaning tools. Two registers, one company.

**New color tokens — the dark palette (Cinematic register default, Calm register's dark-mode option):**

```css
--dark-bg-void: #05070d;      /* full-bleed cinematic backgrounds only — deeper than neutral-950 */
--dark-bg-base: #0a0e17;      /* = existing --color-neutral-950, reused deliberately for continuity */
--dark-surface-1: #10141f;    /* cards, panels */
--dark-surface-2: #1a2030;    /* raised / nested surfaces, hover states */
--dark-border: rgba(255,255,255,0.08);
--dark-border-emphasis: rgba(255,255,255,0.14);
--dark-text-primary: #f4f6fb;   /* recomposed, not pure white — a whisper of the brand's cool bias */
--dark-text-secondary: #9aa4b8;
--dark-primary: #8b5cf6;         /* violet-500 — one step lighter than light mode's primary-700,
                                    to hold the same relative contrast against a near-black surface */
--dark-gradient-hero: linear-gradient(135deg, #3b82f6, #8b5cf6);
```

**New tokens — glass material** (the fourth card material named in the review, elevation's missing dimension):

```css
--glass-blur-sm: 12px;   /* nav bars, small floating controls */
--glass-blur-md: 24px;   /* cards over ambient backgrounds */
--glass-blur-lg: 40px;   /* full hero panels */
--glass-surface: rgba(16, 20, 31, 0.6);   /* dark-surface-1 at 60% — lets the ambient glow behind it read through */
--glass-border: rgba(255, 255, 255, 0.08);
--glass-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.06);   /* the top-edge catch-light that makes glass read as a real material, not a tinted rectangle */
```

**New tokens — ambient lighting:**

```css
--ambient-glow-primary: radial-gradient(circle at 30% 20%, rgba(124, 58, 237, 0.14), transparent 60%);
--ambient-glow-secondary: radial-gradient(circle at 75% 65%, rgba(37, 99, 235, 0.10), transparent 55%);
```

Two soft, large, low-opacity glows per cinematic surface — never more than two, per Apple/SpaceX's own restraint: ambient light suggests depth precisely because it's subtle enough to feel like environment, not decoration.

**Typography addition:** one new step, `text-cinematic` — `clamp(3.5rem, 4vw + 2rem, 7rem)` (fluid 56–112px), weight 600, letter-spacing −0.035em, `text-wrap: balance`. Used for exactly one sentence per site: the homepage's opening line. Never a second use — the review's finding that `text-hero` (72px) under-delivers on cinematic scale is solved here, without inflating the whole scale.

## 2. New homepage concept

**Structure, building directly on `docs/design/08-homepage.md`'s existing plan, not replacing it:**

1. **Opening frame.** `dark-bg-void`, full viewport height, both ambient glows active, centered. `text-cinematic` headline (the existing goal-first copy, unchanged — this is a register change, not a rewrite). The ambient Decision Chain animation already planned (`08-homepage.md`) becomes the frame's sole secondary element, rendered larger and slower than originally specified, tracing continuously at `duration-cinematic` pace (below) rather than the base motion system's faster narrative tier.
2. **The chain, made cinematic.** As the page scrolls, the authoritative chain (`Business Goal → Capability → ... → Decision`) redraws itself stage by stage, pinned to scroll position rather than a fixed timer — each stage's node and connecting line trace in proportional to scroll progress, so the reader controls the pace, not a clock. This is the single most SpaceX-coded moment in the whole redesign: the product's actual reasoning chain, treated as the hero footage.
3. **Transition to light.** The page recomposes from `dark-bg-void` to the Calm register's light surface at the section boundary where real product content begins (feature detail, ecosystem, proof points) — one deliberate, single transition, not a repeated toggle. This mirrors Apple's own product pages: dark, cinematic opening; practical, legible, mostly-light detail below it.
4. **One CTA, one gradient moment** — unchanged from the existing plan (`gradient-hero` used exactly once), now `--dark-gradient-hero` specifically because it sits on the dark opening frame.

## 3. New dashboard aesthetic

**The Calm register, deliberately not cinematic — per the review's pushback.** `/app` stays light-primary by default: `neutral-0`/`neutral-50` surfaces, the existing `07-dashboard.md` layout (Recent Decisions / Decision Confidence / Run a new assessment, the real Decision Timeline, a static Knowledge Graph preview) unchanged in structure. What's new:

- **A genuine dark mode**, using the dark tokens above, selectable and persisted — not the current 2/10 "CSS exists, nothing renders it" state. Recomposed per `04-colors.md`'s existing rule: `dark-surface-1` is the card background, not an inverted white; the Decision Score palette (critical/weak/moderate/strong/exceptional) keeps its exact hues in both modes, since a red-to-green score meaning must never shift between light and dark.
- **Glass used exactly once, deliberately:** the Decision Score card on the decision detail page — `glass-surface` + `glass-blur-md` + `glass-highlight`, floating fractionally above the page with `shadow-hero` beneath it, specifically because this is "the single most important number in the product" (`04-colors.md`) and earns the one moment of material drama the dense screens around it don't get. Every other card stays the existing opaque `Standard` material — glass as a rare accent, never a default, or it stops meaning anything.
- **The "exceptional" score band's existing glow treatment** (`90–100`, already specified in `04-colors.md`) becomes the dashboard's other sanctioned moment of visual drama — expressed as a soft `success-500`-hued version of `--ambient-glow-primary`, contained tightly behind the score ring only, never bleeding across the card.

## 4. Motion language

**A new tier, added above the existing system (`docs/design/06-motion.md`), not replacing it:**

```
duration-cinematic   1200–2400ms, or scroll-linked          the homepage chain reveal,
                                                              the opening-frame-to-light transition
ease-cinematic        cubic-bezier(0.16, 1, 0.3, 1)          a slow, confident settle — the
                                                              "arriving with weight" feel Apple
                                                              product pages use, distinct from
                                                              the existing ease-decelerate's
                                                              faster UI-entrance curve
```

**The hard boundary, stated once so it can't drift:** `duration-cinematic`/`ease-cinematic` are used **only** on the marketing site and Donna's own narrative "thinking/analysis" sequence — never inside `/app`'s dashboard, tables, or forms. The existing system's `instant`/`fast`/`base`/`slow`/`narrative` tiers already correctly serve the application; this tier does not extend or replace them there. A future PR introducing a cinematic-tier animation inside `/app` is a design regression, not a stylistic choice, and should be reviewed as one.

## 5. Premium interaction principles

- **One focal animation per viewport, always.** If the ambient glow, the chain trace, and a hover state could all be moving at once, at most one is — the others hold still. Simultaneous motion is what makes cheaper AI-product sites feel busy; restraint is what makes Linear's and Stripe's interactions feel considered.
- **Hover states settle, they don't bounce.** Every hover/press interaction uses `ease-standard` or `ease-decelerate` from the existing motion system — no spring overshoot, no elastic easing, anywhere. A calm advisor's interface does not have a springy button.
- **Cursor-following subtlety, used once.** Stripe's own signature move — a soft glow or gradient that tracks the cursor within a bounded container — is worth one real instance: the homepage's primary CTA button only, at low intensity, never applied to more than one element per page or it reads as a gimmick rather than a signature.
- **Focus states are never removed, only re-themed per register.** The existing rule (`02-design-system.md`) holds in both the Calm and Cinematic registers — the Cinematic register's focus ring uses `dark-primary` at full opacity against `dark-bg-void`, verified for contrast (§6), never simply inherited unchecked from the light-mode ring color.
- **Every glass surface stays legible without its blur.** Test rule, not a token: disable `backdrop-filter` entirely (as some browsers/GPUs will effectively do) and confirm text over a glass surface is still readable against the flat `glass-surface` fill color alone — glass is a depth *enhancement*, never the only thing making text legible.

## 6. Accessibility considerations

- **Contrast, checked for every new pairing, not assumed:** `dark-text-primary` (`#f4f6fb`) on `dark-bg-base` (`#0a0e17`) = 17.1:1; `dark-text-secondary` (`#9aa4b8`) on `dark-bg-base` = 7.4:1 (passes AA body text); `dark-primary` (`#8b5cf6`) on `dark-bg-base` = 5.8:1 (passes AA for UI components/large text; verify per-use for body-sized text). `dark-text-primary` on `glass-surface`'s effective fill = checked against the flat, non-blurred fallback color specifically, per the interaction-principles rule above.
- **`prefers-reduced-motion` extended to every new cinematic behavior, individually** — the existing global CSS rule doesn't reach Framer-Motion-driven or scroll-linked animation. Concretely: the scroll-linked chain reveal renders fully drawn-in immediately (no animation, not a slowed one) when reduced motion is requested; the ambient glows render as static gradients with zero drift; the cursor-following CTA glow is disabled entirely (not slowed — a moving glow is the exact thing this preference exists to remove).
- **Dark mode is not the accessibility answer for everyone, and isn't treated as one.** A user's OS-level `prefers-color-scheme` is respected as the default in the Calm register; the choice remains manually overridable and persisted, never forced by the marketing site's own register choice bleeding into the application.
- **Glass surfaces get a non-glass fallback path**, not just a contrast check — on `prefers-reduced-transparency` (a real, standard media feature), `backdrop-filter` is dropped entirely in favor of the flat `glass-surface` fill, same rule as the interaction-principle test above, now also triggered automatically for users who've asked for it at the OS level.

## 7. Performance impact

- **`backdrop-filter: blur()` is real GPU cost, budgeted explicitly.** Limit to a maximum of two simultaneously-visible blurred surfaces per viewport (the review's "glass used exactly once, deliberately" rule doubles as a performance budget, not just a taste rule) — stacking many blurred layers is a known cause of scroll jank on mid-tier mobile GPUs.
- **All new motion animates `transform`/`opacity` only**, never `width`/`top`/`left`/box-shadow-spread — the existing motion system already follows this discipline; the cinematic tier inherits it without exception, since scroll-linked animation is the least forgiving case for layout-triggering properties.
- **The ambient glow is CSS `radial-gradient`, not a JS-driven blur canvas or an image asset** — zero additional network payload, zero main-thread cost beyond a GPU-composited gradient layer.
- **The scroll-linked chain reveal loads its interaction logic only when the hero section is near viewport** (code-split, not part of the initial bundle) — the homepage's actual LCP element (the headline, already static text) must paint before any scroll-linked JavaScript is even fetched, so the cinematic layer never delays the metric that most affects real-world perceived load speed.
- **Cinematic-tier assets are marketing-page-only in the bundle graph** — `/app` must never ship the homepage's scroll-linked reveal code, verified the same way this codebase already verifies secret isolation: a build-output check confirming the chunk containing the cinematic reveal logic isn't reachable from any `/app/*` route.

## 8. Implementation roadmap

**Slots into the existing `docs/design/10-design-roadmap.md` sequencing — not a parallel roadmap.**

- **Design Sprint 1 (Foundation)** gains: the dark palette, glass tokens, and ambient-glow tokens added to the token layer alongside the already-planned light-mode token replacement — cheapest to add at the same time the token system is first wired, since it's the same `globals.css` change.
- **Design Sprint 2 (Application Experience)** gains: the dashboard's real dark mode (toggle + persistence, finally executing the rule `04-colors.md` already specified but never built) and the one deliberate glass moment on the Decision Score card — both application-surface work, correctly sequenced here, not earlier.
- **Design Sprint 3 (Signature Moments)** gains: the cinematic homepage (scroll-linked chain reveal, opening frame, dark-to-light transition) and the cursor-following CTA glow — already the sprint reserved for "where the system becomes distinctive," and already dependent on Framer Motion being a real dependency, exactly as this proposal's motion work requires.

No new sprint, no reordering of the existing three — this proposal is additive scope inside a sequence that was already correctly designed, per the existing roadmap's own reasoning that foundation and consistency have to exist before distinctiveness is built on top of them.
