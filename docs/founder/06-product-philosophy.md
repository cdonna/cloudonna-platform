# Product Philosophy — How ClouDonna Should Feel

## The premise

A product whose entire value proposition is *defensibility* (`docs/company/16-founder-questions.md` #1) has to feel defensible to use, not just be architecturally defensible underneath. An executive who feels rushed, confused, or performed-at while getting a recommendation will not trust that recommendation in a board meeting, regardless of how rigorous the evidence actually is. Product feel is not decoration on top of the architecture — it's part of the trust claim.

## Calm

Donna never performs urgency, excitement, or uncertainty theatrically (`docs/design/09-donna-experience.md`). A confident advisor sounds calm even delivering complicated or unwelcome news — the interface holds that same register in every state: loading, a low-confidence result, an error. **The test:** if a screenshot of any product state, shown to someone with no context, reads as anxious, hype-driven, or apologetic, it fails this principle regardless of what it's technically communicating correctly.

## Clarity

Every screen answers, in order: what is the recommendation, how confident should you be in it, and why — never buried under a dozen equally-weighted secondary facts (`docs/design/01-design-philosophy.md`'s "confidence before complexity"). Clarity is not the same as simplicity of *content* — the underlying evidence and reasoning can be genuinely deep — it's simplicity of *hierarchy*: a reader always knows what matters most on the screen without hunting for it.

## Executive confidence

The product should feel like it was built for the person who has to defend this decision to a board, not for the person doing the data entry. Concretely: the most important artifact in the entire product is the thing an executive could screenshot into a board deck without editing it first — the executive summary, the confidence band, the evidence trace. Every other screen exists in service of making that one artifact defensible, not the other way around.

## Simplicity

Restated from `01-founder-principles.md` #7 as a product commitment, not just a decision-making filter: the product should never require an explanation before a first-time user understands what they're looking at. This is a genuinely hard commitment given the domain's real complexity (ten scoring dimensions, an evidence graph, a confidence decomposition) — the discipline is pushing that complexity into structure and progressive disclosure (`docs/design/07-dashboard.md`'s "collapsed by default, expandable on request" pattern for evidence) rather than either hiding it dishonestly or dumping all of it on the screen at once.

## Premium experience

Enterprise does not have to look boring, and premium does not mean decorated (`docs/design/01-design-philosophy.md`). A premium feel comes from whitespace used deliberately, typography with a real hierarchy, motion that only ever explains a state change, and the absence of anything that looks like it was left in by default rather than chosen. The product should read as expensive the way a well-made instrument reads as expensive — through precision and restraint, not through visual noise.

## How these five reinforce the actual business, not just the aesthetic

| Feel | What it protects |
|---|---|
| Calm | Trust — a system that panics is a system you stop believing under pressure |
| Clarity | Decision Quality — a hierarchy that hides the important fact is a hierarchy that gets the wrong thing acted on |
| Executive confidence | Enterprise Value — the product's actual purchasable value is the artifact an executive can stake their name on |
| Simplicity | Long-term Moat — a product that stays learnable as it grows sophisticated is a product that survives its own success; one that doesn't gets replaced by whatever explains itself faster |
| Premium | Category leadership — a product that looks like a commodity tool cannot credibly claim to be the trusted operating system for decisions this consequential |

## The one line this document exists to protect

**If a user ever feels like the product is trying to impress them instead of help them decide, this philosophy has already failed** — regardless of how good the underlying deterministic engine and evidence graph are. Feel is not the last 10% of the product. For a company selling confidence, it is one of the first things being sold.
