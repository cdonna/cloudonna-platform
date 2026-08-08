# ClouDonna Design Philosophy — Part I: Audit, Part II: Principles

## Part I — Full Design Audit

This audit is grounded in the actual codebase (`apps/web/src/app/globals.css`, `layout.tsx`, `components/ui/button.tsx`, and every landing/donna-ai/app component read in full), not a generic impression of what an enterprise app "usually" needs. Every finding below is checkable against a specific file.

### The one finding that explains most of the others

**ClouDonna currently has two design systems that don't talk to each other, and only one of them is actually used.**

`globals.css` defines a complete shadcn/ui token system — `--primary`, `--secondary`, `--background`, `--foreground`, `--muted`, `--accent`, `--destructive`, a full `.dark` class, five chart colors — entirely in grayscale `oklch()` values, unmodified from shadcn's own scaffolding defaults. Grepping the entire codebase for who actually uses these tokens (`bg-primary`, `text-foreground`, `bg-background`) returns exactly **one file: `components/ui/button.tsx`.** Every other component — the homepage, the wizard, the result screen, every card, every badge — is styled with hardcoded Tailwind palette classes (`text-slate-950`, `bg-gradient-to-r from-blue-600 to-violet-600`, `border-emerald-200`) written directly at the call site, never through a token. The `.dark` class exists in CSS and is never toggled anywhere in the application — dead code, not a feature in progress.

This means: there is no single place to change "the brand color" today. It's a search-and-replace across dozens of files, not a variable. That's not a polish problem — it's the reason a genuine design system doesn't exist yet, and it's the single highest-leverage fix this review recommends (`02-design-system.md`).

### Scores by category (0–10, evidence-based)

| Category | Score | Finding |
|---|---|---|
| Typography | 6/10 | Geist Sans/Mono are already loaded and are a genuinely good, distinctive choice — but no formal type scale exists; heading sizes are chosen ad hoc per component (`text-3xl`, `text-4xl`, `text-5xl` mixed without a rule for which context gets which). |
| Color palette | 4/10 | A real, consistent-*by-convention* palette exists in practice (slate neutrals, blue→violet brand gradient, emerald for positive/success) — but it's convention, not a system. Zero domain-specific tokens exist for the data this product is actually about: no formalized Decision Score scale, no confidence-band colors, no evidence-reliability colors, no risk-severity colors. |
| Spacing | 5/10 | Roughly 8px-multiple Tailwind spacing throughout (consistent at the *token* level, since that's just Tailwind's default scale) but inconsistent at the *usage* level — card padding varies between `p-6`, `p-7`, `p-8`, `p-10` with no evident rule for when each applies. |
| Grid | 6/10 | `max-w-2xl`/`max-w-6xl`/`max-w-7xl` containers used reasonably, but no documented breakpoint or column system — every page invents its own container width. |
| Icons | 8/10 | Consistently `lucide-react` throughout, appropriately sized, no mixing with a second icon set. The strongest, most consistent visual-language element in the app today. |
| Buttons | 6/10 | The one component actually wired to the token system (ironically, the one place tokens are invisible in practice since almost every real CTA overrides the variant with a hardcoded gradient className instead of using a `variant`). |
| Forms | 5/10 | Functional, accessible (real `<label>`s, focus rings) but visually generic — standard bordered inputs with no distinguishing character, indistinguishable from any shadcn starter template. |
| Cards | 6/10 | Consistent rounded-corner-plus-border-plus-shadow language, but radius values are inconsistent (`rounded-xl`, `rounded-2xl`, `rounded-[1.75rem]`, `rounded-[2rem]` all appear across different cards with no evident rule). |
| Navigation | 5/10 | Functional and accessible (roving tabindex on the result tabs is genuinely well done) but visually minimal — no distinct navigation "chrome" that reads as premium enterprise software rather than a marketing site. |
| Information hierarchy | 7/10 | Generally strong within individual screens (the result panel's tab structure, the decision detail page's metadata grid) — the weakest hierarchy is at the *page* level: nothing yet establishes a consistent "this is the most important number on the screen" treatment for the Donna Score itself. |
| Accessibility | 7/10 | Real, substantive work exists (roving tabs, `aria-live` regions, real labels, `role="dialog"`/`aria-modal`) — better than most products at this stage. Gaps: no verified color-contrast audit, no documented focus-order testing beyond the tab component. |
| Responsiveness | 6/10 | `sm:`/`lg:` breakpoints used throughout, functional on mobile — but several data-dense screens (the decision detail metadata grid, the comparison table) haven't been verified to degrade gracefully below tablet width. |
| Motion | 3/10 | The weakest category. A handful of decorative `animate-pulse`/`animate-ping` blurs and one `animate-in fade-in` transition library (`tw-animate-css`, CSS-only) — no orchestrated motion system, no Framer Motion (not even installed), no purposeful motion tied to product moments (Donna "thinking," a score revealing itself, a decision graph animating). |
| Dark mode readiness | 2/10 | CSS exists, nothing else does — no toggle, no persistence, no component has been checked against it since nothing ever renders it. |
| Loading states | 5/10 | `AnalysingState`'s five-step sequence is genuinely good — the best single loading experience in the app. Everywhere else (dialogs, list fetches) is a bare spinner icon with no personality. |
| Empty states | 4/10 | Decision History's empty state exists and is reasonable; most other list/fetch surfaces have no considered empty state at all. |
| Charts | 3/10 | None exist yet as real chart components — dimension scores are rendered as a `ScoreRing` and bars, functional but not data-visualization-grade. |
| Tables | 5/10 | One real table (Decision History) — clean, functional, unstyled beyond default borders. |
| Dashboard quality | 4/10 | `/app` exists as a minimal two-card landing page — functional, not yet a "dashboard" in the Linear/Stripe/Snowflake sense the brief asks for. |
| Consistency | 4/10 | The core finding above — a real, felt visual consistency exists *by convention* (a careful eye would recognize "this looks like ClouDonna"), but it's undocumented and unenforced, which is why radius/padding/heading-size drift has already crept in across a codebase this young. |
| Overall visual identity | 6/10 | The existing blue→violet gradient, slate neutrals, and Geist typography already read as calm and credible — real brand equity worth keeping, not discarding. It just isn't yet a *system* someone else could extend consistently without guessing. |

**Overall current-state score: 5.1/10** — a genuinely promising foundation with real strengths (icons, accessibility groundwork, a likable existing palette) undermined by the absence of the one thing that turns a look into a system: tokens that are actually used everywhere they're defined.

## Part II — Design Principles

> Less, but significantly better.

- **Evidence before animation.** Every motion this system introduces exists to make a real fact easier to understand faster — never decoration for its own sake. If a reviewer can't say what a specific animation communicates, it doesn't ship.
- **Whitespace creates trust.** A cramped enterprise UI reads as either immature or overloaded with liability disclaimers. ClouDonna's whitespace is a deliberate signal: *we have nothing to hide and nothing to rush you through.*
- **Motion has meaning.** Every animation in `06-motion.md` is tied to a specific state change a user needs to track — a score resolving, a step completing, a graph traversing. No motion exists purely because it looks alive.
- **Enterprise does not have to look boring.** SAP-level trust does not require SAP-level visual flatness. Snowflake and Linear both prove an enterprise product can be confident *and* beautiful.
- **AI should feel calm.** Donna never performs urgency, excitement, or uncertainty theatrically. A confident advisor sounds calm even when the answer is complicated — the interface should too.
- **Confidence before complexity.** The most important number on any screen (the Donna Score, a confidence band) is never competing visually with a dozen equally-weighted secondary elements.
- **One system, everywhere.** If a color, radius, or spacing value isn't a named token in `02-design-system.md`, it doesn't belong in a new component — the single rule that would have prevented every inconsistency finding above.
