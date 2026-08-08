# ClouDonna DNA

**Purpose of this document:** the small set of traits that should still be recognizably true in year 20, regardless of who's writing the code, closing the deals, or sitting in the CEO chair by then. Everything below is written to be checked against a real decision, not admired in a slide.

## Company DNA

**We sell defensibility, not software.** Restated from `16-founder-questions.md` because it should govern how the company describes itself long before it governs any product decision — a buyer is purchasing the ability to answer "why did we do this" credibly, permanently, and without spin.

**Disclosed gaps are not embarrassing; hidden gaps are.** This trait already exists in the codebase's own documentation practice (`08-founding-culture.md`) more consistently than in almost any comparable early-stage company's internal writing. It must survive the transition from "a founder writing honestly because no one else is reading yet" to "a company writing honestly to investors and customers who have every incentive to prefer the polished version." That transition is where this trait is most likely to be lost, and losing it would cost more than any short-term communications benefit of hiding a gap could ever return.

**We are slower than a hype-driven competitor by design, and that is the point.** Every sprint in this codebase's history required an explicit scope document and founder approval before starting the next one — a real cost, paid deliberately, because the credibility this company is selling cannot be built any faster than it's actually earned.

## Product DNA

**Deterministic first, narrated second, always in that order.** The single load-bearing architectural fact underneath every other DNA trait in this document: a score is never something an AI model produced, and never will be, regardless of how good models get.

**Every recommendation must survive being handed to a skeptic.** Not a design guideline — a literal test applied to every new output type before it ships: could an experienced enterprise architect, actively looking for a reason to distrust this, find one? If yes, it doesn't ship as presented.

**Memory is a feature, not an afterthought.** A recommendation that isn't saved, versioned, and explainable eighteen months later isn't a lesser version of the product — by this company's own definition of the category (`02-category-definition.md`), it isn't decision intelligence at all yet. This should bias every future roadmap debate toward System of Record and Trust maturity over new System of Intelligence features, whenever the two compete for the same engineering quarter.

## Decision Intelligence DNA

**Evidence is a first-class citizen with its own lifecycle, never a citation bolted onto an AI paragraph.** `docs/sprint-6/14-product-knowledge-layer.md`'s fact-verification model — sourced, dated, reviewed, revalidated, disputable — is not a Sprint 6.4 feature. It's the definition of what separates this company from every AI-narrated competitor, and should be treated as non-negotiable core architecture for as long as the company exists, not a nice-to-have that got prioritized once.

**Confidence is decomposed, never a bare number.** Independently reinvented three separate times across this codebase's own documents (`docs/sprint-6/24-confidence-model.md`, `15-evidence-engine.md`, `docs/company/12-founder-dashboard.md`) without anyone naming it as one principle — it should be named as one now: **no summary statistic ships without the structure that produced it, in the product, in the founder dashboard, in an investor deck, anywhere.** This is the sharpened, more general version of "trust before monetization," and probably the more useful one to keep close.

**Outcomes inform, never silently retrain.** The single most important sentence in the entire existing documentation set, repeated here because a DNA document exists specifically to make sure the most important things survive being repeated one more time than feels necessary.

## Commercial DNA

**High-trust-risk revenue always gets its own gate, never rides along with something else's approval.** Named as its own pattern for the first time in `15-critical-review-v2.md`, elevated here to DNA status because it is the concrete, checkable version of "trust before monetization" — a principle is only real if it changes what gets approved and when.

**We are not in the implementation or staffing business, ever, at meaningful scale.** The moment ClouDonna profits from *which* vendor a customer chooses because ClouDonna also delivers the implementation, the company has rebuilt Accenture's conflict of interest from the inside, and every neutrality claim made up to that point becomes retroactively suspect.

**Price the record, not the query.** Enterprise decisions are infrequent and high-stakes, not high-volume — a commercial model that implicitly treats them like API calls misunderstands what's actually being sold (see Company DNA, above).

## Engineering DNA

**Architecture review before implementation, every time, without exception.** Already a proven, load-bearing practice (`docs/roadmap/02-engineering-operating-model.md`'s fifteen-step process) — the DNA claim is narrower and harder: that this discipline survives the arrival of a team that didn't personally live through the incidents that taught it, which is the actual test of whether a practice is culture or just one era's habit.

**Immutability is a database property, not a promise.** History that can be edited is not history — enforced by the schema, not by a code-review checklist, everywhere it matters (`decision_versions`, and eventually `product_facts`, `decision_outcomes`).

**No AI process verifies its own output.** `product_facts_ai_never_self_verifies` (`docs/sprint-6/14-product-knowledge-layer.md`) is presented as a database constraint in one document today; it should be understood company-wide as the general engineering law it actually is — nothing generated by a model becomes authoritative without a named human accountable for that specific judgment.

## Design DNA

**Confidence before complexity.** Already stated in `docs/design/01-design-philosophy.md` — the most important number on any screen never competes visually with a dozen equally-weighted secondary elements, which is a design principle and a trust principle wearing the same clothes.

**Enterprise does not have to look boring, and calm is not the same as quiet.** The product's visual identity should read as a confident advisor, not a compliance form — real whitespace, real typographic hierarchy, motion that explains a state change rather than decorating a screen (`docs/design/06-motion.md`).

**One system, everywhere, or it isn't a system.** The design audit's own finding (`docs/design/01-design-philosophy.md`: two design systems that don't talk to each other, one of them dead code) is a preview of exactly what will happen to every other DNA trait in this document if it's stated once and not enforced structurally. The fix pattern is the same in both cases: name it as a token, a constraint, or a gate — never leave it as a convention someone is trusted to remember.

## How these six sections reinforce each other

Company DNA states what's actually being sold; Product DNA states the architecture that makes that claim true; Decision Intelligence DNA states the specific disciplines that make the architecture trustworthy rather than merely functional; Commercial DNA states which revenue is compatible with all of the above; Engineering DNA states how the company keeps that compatibility real under pressure rather than promised; Design DNA states how all of it is allowed to *feel* to the person using it. Remove any one section and the others stop making sense on their own — which is the actual test of whether this is one company's DNA or six disconnected values statements wearing one document's title.
