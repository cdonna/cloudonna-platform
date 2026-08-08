# Design Philosophy

## Why enterprise software should feel premium — the actual argument, not a preference

A category-defining claim ("the operating system for enterprise decisions," `docs/company/01-company-vision.md`) has to be visually credible on first contact, before a prospect has read a single evidence trace. Enterprise buyers have spent two decades being sold utilitarian, visually flat software under the theory that "serious" means "plain" — Snowflake, Linear, and Stripe each independently proved that theory wrong, and each did it by taking craft seriously in a category that had stopped expecting it. ClouDonna's design has to clear the same bar for a harder reason than any of them: it's asking to be trusted with judgment, not just data or workflow, and a product that looks unconsidered invites the question of whether the judgment underneath it was unconsidered too.

## Principles, inspired by world-class enterprise software, never copied from it

- **Linear's instinct: a compact, keyboard-first surface that respects an expert user's time.** Not Linear's specific components or color system — the underlying belief that speed and precision are themselves a premium signal, not a concession to power users. ClouDonna's own org switcher and command-palette-style navigation (`docs/design/10-design-roadmap.md`) borrow this instinct, not this pixel.
- **Stripe's instinct: the first screen is glanceable, the detail is one click away, never both at once.** Applied to the Dashboard (`docs/design/07-dashboard.md`) as "large cards over dense tables on the landing view" — the principle, not Stripe's specific dashboard layout.
- **Snowflake's instinct: enterprise-grade data density delivered calmly, never as a wall of numbers.** Applied to the Confidence Decomposition and Evidence Trace — real complexity, presented so it never reads as overwhelming.
- **Apple's instinct: restraint as a form of confidence.** One primary visual moment per screen, everything else quiet in support of it — applied to how the Donna Score itself is the one place `text-display` scale is used, deliberately not repeated everywhere a number appears (`docs/design/07-dashboard.md`).
- **Bloomberg's instinct, taken most literally of all given the company's own positioning language:** a terminal a professional trusts precisely because it never tries to look friendly at the expense of looking precise. ClouDonna's calm register (`06-product-philosophy.md`) is this instinct applied to a much less dense, much more approachable surface — the trust comes from precision, not from density for its own sake.

None of these are named to imply ClouDonna should resemble any one of them — the point of naming five different instincts instead of one is that no single company should be the visual template. The synthesis is ClouDonna's own; the instincts are borrowed honestly, credited here rather than pretended to be invented from nothing.

## Visual language — the load-bearing rule

**One system, everywhere, or it isn't a system.** The design audit's own founding finding (`docs/design/01-design-philosophy.md`) — two design systems existing in this codebase where only one was actually used, tokens defined and ignored — is the single most important design-process lesson this company has already learned the hard way, once. The rule going forward: if a color, radius, spacing, or type value isn't a named token, it does not ship in a new component, without exception, regardless of how small the change feels in the moment. Every future inconsistency will start exactly the way the first one did — as a one-time exception that felt harmless.

## Interaction philosophy

- **Motion explains, never decorates.** Every animation ties to a specific state change a user needs to track — a score resolving, a version replaying, a step in reasoning completing (`docs/design/06-motion.md`). If a reviewer can't say what a specific animation communicates, it doesn't ship.
- **Progressive disclosure over simplification.** The domain is genuinely complex (ten scoring dimensions, an evidence graph, multi-version history) — the design commitment is not to pretend otherwise, but to default to collapsed, expandable structure (`docs/design/07-dashboard.md`'s Evidence Trace pattern) so a first-time user isn't confronted with the full depth before they've earned a reason to want it.
- **Never a chat bubble, never a typing indicator, never first-person exclamation.** Restated because it's the most concrete, checkable rule protecting `docs/design/09-donna-experience.md`'s entire positioning: Donna is a structured advisor, not a conversational interface, and every UI decision that would nudge toward "chatbot" — however small, however convenient to implement — is rejected on sight, not evaluated case by case.

## Why this matters more than it would for a typical SaaS product

Most software is judged on whether it's easy to use. ClouDonna is asking to be judged on whether its *judgment* can be trusted — which means the design isn't just a usability question, it's evidence in the same trial as the deterministic engine and the evidence graph. A beautiful interface wrapped around ungrounded claims would be actively dishonest; an ugly interface wrapped around genuinely rigorous evidence would undersell the truth. The design's actual job is to make the interface's confidence match the evidence's confidence, exactly, in both directions — never overselling, never underselling what's actually been proven.
