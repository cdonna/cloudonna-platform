# Homepage

## Current state

`Hero.tsx` already has real bones worth keeping: a goal-first headline (not vendor-first — correctly matching the product's own stated principles), a blue→violet gradient identity, working navigation. The audit's finding applies here specifically: zero `animate-` usage in the current hero at all — the "beautiful spacing, modern gradients, minimalism" the brief asks for exist in outline, not yet with the craft or motion to feel premium.

## Hero — target

**Large typography.** `text-hero` (72px, `03-typography.md`) for the headline — larger than today's `text-4xl`/`text-5xl` — with `text-wrap: balance` so it never breaks into an orphaned line. The headline stays goal-first (today's actual copy is already correctly business-first, e.g. leading with an outcome, not a vendor name — kept, not rewritten).

**Beautiful spacing.** Hero section padding moves from the current `py-16 sm:py-20` to a genuinely generous `py-24 sm:py-32` — "the interface should breathe" applied literally at the first, highest-leverage screen a visitor sees.

**Animated illustration — the Decision Chain, not a stock illustration.** Rather than any illustrated scene (rejected in `02-design-system.md` — this product's "illustration" is its own data made beautiful), the hero's visual anchor is a live, ambient animation of the authoritative chain itself: `Business Goal → Capability → ... → Decision`, rendered small, abstract, and continuously (slowly) flowing — not the full interactive Decision Graph (`09-donna-experience.md`, reserved for the decision page), a quieter ambient version that establishes the product's core idea (a *chain of reasoning*, not a chat box) in the first three seconds, wordlessly.

**Modern gradients, used once.** The `gradient-hero` token (`04-colors.md`) appears exactly once on this page — the primary CTA button — not smeared across every card and badge, which is the current pattern's overuse. Everything else on the page is neutral + a single violet accent, so the one gradient moment actually reads as a moment.

**Minimalism.** No more than one supporting visual element competing with the headline at any scroll position — the current page's decorative blurred-circle background shapes are kept (they're already restrained, low-opacity, and correctly non-competing) but the ambient chain animation replaces the current static/absent secondary visual.

**Premium CTA.** One primary action ("Start your assessment," unchanged copy — already correctly specific, not a generic "Get Started"), styled with `gradient-hero` and `shadow-hero`; one secondary, text-only action, never two equally-weighted buttons competing for the same click.

## Below the fold — unchanged in structure, restyled onto tokens

The existing Ecosystem/Stats/FeatureCards/Discovery sections (from the earlier Web Presence sprint) keep their current information architecture — the audit found no structural problem with what's *said* on the homepage, only with the token/consistency layer underneath it. Every card, badge, and heading in these sections gets restyled onto `02-design-system.md`'s tokens (radius, spacing, color) as part of Design Sprint 1's migration (`10-design-roadmap.md`), not rewritten.

## What this section explicitly does not add

A product demo video, an animated 3D scene, a customer-logo marquee (no real customers exist yet — a placeholder marquee would be exactly the "hype over truth" this product's own manifesto rules out), or a chatbot-style interactive widget on the homepage itself (the real interactive experience is one click away at `/donna-ai`, correctly not duplicated on the landing page).
