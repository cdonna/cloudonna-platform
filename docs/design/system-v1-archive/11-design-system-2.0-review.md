# Design Excellence Sprint — Critical Review

**Status: proposal only. Nothing in this document or its companion (`12-design-system-2.0-proposal.md`) has been implemented. No functionality changes, no new product features — this is a visual and interaction elevation pass on top of what already exists.**

## A naming collision, surfaced rather than silently resolved

`docs/design/02-design-system.md` is already titled **"ClouDonna Design System v2."** It is thorough, well-reasoned, and entirely unimplemented (`docs/design/10-design-roadmap.md`'s Design Sprints 1–3 haven't started). Calling this pass "Design System 2.0" would create the same silently-overwritten-version-number problem this codebase has already been caught out by twice (`docs/roadmap/sprint-6.2.md` vs. `docs/roadmap/04-sprint-6-2-history-and-versioning.md`; the Sprint 4 vs. Sprint 6 knowledge-graph designs). This pass is **not a replacement** of the existing v2 system — it's an elevation of it toward a more cinematic, premium register the existing system deliberately under-built. It's referred to throughout this review and its companion proposal as **the Cinematic Layer**, built on top of the existing v2 token system, not instead of it.

## Method

Every area below states what the existing design documents (`01`–`10`) already got right, what they left un-built or under-ambitious relative to this brief, and where this brief's own request needs pushback rather than compliance. Nothing here is invented from a blank page — the existing system is a strong, specific foundation, not a false start.

## Typography

**Already right, keep:** Geist Sans + Geist Mono, rejected in favor of Inter specifically to avoid "the single most common typeface in AI-product UI today" (`03-typography.md`) — this instinct is exactly correct for a premium-enterprise brief and should not be revisited. The twelve-step scale, tabular-nums discipline, and the `text-hero`/`text-display` split are all sound.

**Under-ambitious for this brief:** `text-hero` tops out at 72px. Apple and SpaceX both routinely run display type well past 96–120px on hero moments precisely because the confidence of large type *is* the premium signal — 72px reads as "large for a SaaS product," not "cinematic." The existing scale needs a `text-cinematic` step above `text-hero`, reserved even more rarely (the homepage's single most important sentence, full stop) — see the proposal's visual identity section.

## Spacing scale

**Already right:** the 8px-based scale with six semantic aliases (`02-design-system.md`) is sound and needs no structural change — Apple- and Linear-caliber whitespace is a discipline of *application*, not a different scale.

**Gap:** no documented "cinematic" spacing tier for full-bleed hero sections — today's `py-24 sm:py-32` (per `08-homepage.md`) is generous for a SaaS page and modest for the kind of section SpaceX or Apple would ship. The scale itself doesn't need new tokens; it needs explicit permission to use the existing large steps (`space-24` and beyond) far more aggressively on marketing surfaces than the application ever should.

## Color system

**Already right, and worth defending against this brief's own instinct:** `04-colors.md`'s violet-primary decision, the four domain-specific scales (Decision Score, Confidence, Evidence, Risk), and the explicit refusal to reuse the Decision Score palette for Confidence bands ("conflating 'how good' with 'how sure' is exactly the false-precision risk" the Confidence Model warns against) are all correct and should not be diluted by a blanket "deep dark palette" mandate — see "Where this review pushes back," below.

**Real gap:** dark mode is currently a *rule* ("recompose, don't invert," `04-colors.md`) with no actual palette — deferred to "Design Sprint 2" and never executed (`01-design-philosophy.md` scores dark-mode readiness 2/10: "CSS exists, nothing else does"). This is the single biggest concrete gap between what exists and what this brief asks for, and the proposal treats it as the priority, not an afterthought.

## Elevation

**Already right:** the four-level, purpose-named shadow system (`resting`/`raised`/`overlay`/`hero`) in `02-design-system.md` is a real, working idea — `shadow-hero`'s dramatic, colored shadow is already the correct instinct for a premium moment, just under-used (reserved for "the one dramatic... CTA," per spec, but not yet extended to glass/depth treatments generally).

**Gap:** no elevation token accounts for translucency/blur depth (a glass surface's "elevation" isn't just a shadow, it's a blur radius and a background-opacity value working together) — the existing system has shadow tokens but no `blur-*` or `surface-opacity-*` tokens at all. Real gap, addressed in the proposal.

## Cards

**Already right:** the three-size radius resolution (`Compact`/`Standard`/`Hero` — `05-components.md`) correctly closes the audit's radius-inconsistency finding and should not change.

**Gap for this brief:** every card in the current system is opaque (`bg-white` or equivalent). A glass-surface treatment needs a fourth card *material*, not a fourth size — see the proposal.

## Buttons

**Already right:** the diagnosis in `05-components.md` — the Button component is token-wired but "almost every real usage overrides it with a hardcoded gradient className" — is the correct finding and the correct fix (`gradient-hero` becomes a real, disciplined `variant="hero"`, used once per screen). Nothing here needs to change for this brief; it needs to actually be *built*, which it hasn't been.

## Motion

**Already right and unusually mature:** `06-motion.md`'s duration/easing token system (`instant`/`fast`/`base`/`slow`/`narrative`) and its explicit rejection of "trendy effects without purpose" already embodies "motion with purpose" almost word for word. This is the one area where the existing spec already speaks this brief's exact language.

**Real gap:** every duration in the existing system tops out at "narrative" (800ms+, for orchestrated sequences like Donna's thinking state) — nothing in the existing scale is built for a slow, cinematic, scroll-driven reveal in the SpaceX/Apple sense, which routinely runs into multiple seconds, tied to scroll position rather than a fixed timer. This is a genuinely new motion category, not an extension of an existing one — addressed in the proposal's motion language section.

## Page transitions

**Under-specified today:** `06-motion.md` names a "subtle 200ms cross-fade + 8px vertical settle on route change" — functional, invisible, correct for an application context. This brief's cinematic ambition has no natural home in that spec, because page transitions inside the *application* should stay exactly this restrained (an enterprise tool that "transitions dramatically" between a dashboard and a table reads as a toy, not a premium instrument) — the ambition belongs on the marketing surface's scroll narrative, not the app shell's route changes. This is a place this review pushes back on applying the brief uniformly — see below.

## Loading states

**Already excellent, correctly identified as excellent:** `AnalysingState`'s five-step sequence scores as "the best single loading experience in the app" in the original audit, and `06-motion.md` already generalizes it into a reusable `<SequencedLoader>` pattern (`05-components.md`). Nothing to add here beyond actually building the generalized version.

## Dashboard hierarchy

**Already well-specified, not yet built:** `07-dashboard.md`'s target layout (Recent Decisions / Decision Confidence / Run a new assessment as the three top cards, a real Decision Timeline, Workspaces, a static Knowledge Graph preview) is a genuinely good, Stripe/Linear-caliber information architecture, already reasoned from real inspiration ("large cards over dense tables on the landing view," "Snowflake-caliber honesty about data" for confidence-as-distribution). This review's only addition: the dashboard is exactly the surface where this brief's "deep dark palette" instinct should be applied with the most caution, not the least — see below.

## Iconography

**Already the strongest category in the whole system** (8/10 in the original audit) — Lucide, consistent, appropriately sized. This brief changes nothing here; formalized sizing tokens (already specified in `02-design-system.md`) are the only remaining work, and it's execution, not design.

## Illustrations

**Already a strong, deliberate, correct decision, and this brief should not override it:** "no illustrated character or scene-based illustration anywhere... ClouDonna's 'illustration' is data itself" (`02-design-system.md`, `09-donna-experience.md`). SpaceX's cinematic quality comes from real photography and real hardware, not illustration — the equivalent move for ClouDonna is treating the Decision Graph, the Score reveal, and real evidence visualizations as the "cinematic" content, exactly as already planned, just executed with more craft and more motion budget than currently specified.

## Background treatment

**The real, undernamed gap.** No existing document specifies an ambient background system at all — today's homepage has "decorative blurred-circle background shapes... already restrained, low-opacity" (`08-homepage.md`), which is a start, not a system. "Soft ambient lighting" and "glass surfaces with subtle depth" both live here, and this is where this review's proposal does the most genuinely new work rather than formalizing something already specified.

## Where this review pushes back on the brief itself

Two of the brief's own listed principles need a scoped answer, not a blanket yes, because applying them uniformly would contradict decisions this codebase has already made carefully and for good, specific reasons:

1. **"Deep dark color palette," applied everywhere.** ClouDonna's own product philosophy (`docs/founder/06-product-philosophy.md`) already commits to the product being "the artifact an executive could screenshot into a board deck without editing it first" — a dark-mode dashboard screenshotted into a light PowerPoint slide is a real, concrete, ordinary failure mode, not a hypothetical one. Snowflake and Linear, both named inspirations, both ship the dense working product predominantly light (or fully adaptive), reserving true darkness for marketing and code-adjacent surfaces. **Recommendation, detailed in the proposal: dark is the primary register for the marketing site and Donna's narrative "thinking/analysis" moments; light remains the primary register for the dense application (dashboard, decision detail, evidence, tables) — with a genuinely first-class, fully-designed dark mode available as a real option, not the current 2/10 afterthought.** This isn't rejecting the brief; it's refusing to apply it somewhere it would quietly undercut a different, already-committed promise.
2. **Full cinematic motion/page-transition treatment applied inside the application shell.** Correct and wanted on the homepage and the Donna narrative experience; wrong inside `/app` for the same reason enterprise software with theatrical UI reads as less trustworthy, not more — restated from `docs/design/01-design-philosophy.md`'s own "AI should feel calm" principle, which this brief's "confident simplicity" and "calm over noisy" principles already independently agree with. The cinematic register and the calm-instrument register are not in tension if each is deliberately scoped to the surface it serves — they are in tension only if applied identically everywhere.

Full proposal, with these distinctions made concrete: `12-design-system-2.0-proposal.md`.
