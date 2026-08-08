# Dashboard Philosophy

## The feeling an executive dashboard must produce

Never crowded. Never playful. Never noisy. Three refusals stated first because a dashboard is defined more by what it declines to do than by what it includes — almost every dashboard that fails does so by adding, not by omitting.

**Never crowded.** If a dashboard needs a legend to explain itself, it has already failed — every element should be self-evident from its position and label alone. Crowding isn't a density problem (`07-layout-system.md`'s "dense" zones are allowed to be dense); it's a hierarchy problem, elements competing for attention with nothing establishing who wins.

**Never playful.** No mascot, no celebratory animation, no cute empty-state illustration, no exclamation-point microcopy. Playfulness signals "consumer product" the instant it appears, and an instant is all it takes to undo every other premium signal on the screen.

**Never noisy.** Noise is any element present for a reason other than helping this specific reader make this specific decision faster — a promotional banner, a "did you know" tip, a badge celebrating usage streaks. If it doesn't serve the decision, it doesn't belong on the screen where the decision is being made.

## Focus

One primary question per screen, answered before anything else is legible. The Decision Detail page's primary question is "what's the recommendation and how sure should I be." The Decision History page's primary question is "which of my decisions needs my attention." A dashboard that tries to answer two primary questions on one screen has actually built two dashboards sharing a URL, and should be reviewed as such.

## Decision hierarchy

Three tiers, always in this order of visual weight: **the answer** (the Decision Score, the recommendation — largest, first) → **the confidence** (how sure, shown as a band with its own decomposition, never buried) → **the evidence** (why, available on demand, collapsed by default). A reader who leaves after tier one still got the headline. A reader who stays through tier three gets a defensible board-ready case. No tier is ever visually louder than the tier above it.

## Information density

Governed entirely by `07-layout-system.md`'s spacious/dense split, applied specifically here: the top of a dashboard (the answer) is spacious, almost sparse; the deeper a reader scrolls toward evidence and history, the denser the layout is permitted to become. Density increasing with scroll depth is itself an information-hierarchy signal — the reader learns, without being told, that they're moving from "the headline" to "the proof."

## Executive scanning

Designed for someone who will spend four seconds on this screen before deciding whether to spend four more minutes on it. The four-second version must be complete and honest on its own — a real number, a real confidence band, a real one-line reason — never a teaser withholding the actual fact to encourage a click. An executive who scans and leaves with an accurate four-second impression is a dashboard succeeding, not a dashboard failing to hold attention.

## What this rules out, concretely

Streaks, gamified progress bars, notification badges designed to pull a reader back in, auto-refreshing "live" counters with no real-time need behind them, any element whose real purpose is engagement rather than decision quality — the same "engagement is not a goal in itself" principle already established at the constitutional level (`docs/constitution/13-anti-roadmap.md`), now enforced specifically at the pixel.
