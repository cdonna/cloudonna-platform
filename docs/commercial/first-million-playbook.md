# First CHF 1M Playbook

**Status:** Sales playbook for the Commercial Engine V1 (`agent/commercial-engine-first-million`). Companion to `docs/commercial/decision-sprint-proposal.md` (what to send) and `docs/commercial/cloudonna-executive-one-pager.md` (what to hand over). No personal founder information appears anywhere in this document — every reference to who runs sales conversations says "the ClouDonna team," consistent with the standing privacy requirement.

## Target

**CHF 1,000,000 in contracted bookings.** The default planning scenario (`apps/web/src/lib/commercial/target-model.ts`'s `DEFAULT_FIRST_MILLION_SCENARIO`) is 10 Decision Sprints (CHF 25k) + 5 Team contracts (CHF 75k) + 2 Enterprise contracts (CHF 200k) = CHF 1,025,000. This is a planning scenario, not a forecast — real deal sizes and counts will differ; the arithmetic just needs to stay auditable.

## ICP (Ideal Customer Profile)

Mid-market and enterprise organizations facing a major Data, AI, Cloud, SAP, Analytics, Architecture, or Technology platform decision.

**Strongest early signals** (the more of these present, the better-qualified the opportunity):

- A genuine multi-vendor shortlist already exists (not "we're thinking about it" — an actual comparison is underway)
- A large transformation budget is attached to the decision
- Executive disagreement about the right direction
- Complex architecture (multiple systems, multiple constraints)
- Regulatory constraints (data residency, sector-specific compliance)
- A business case is explicitly required before the decision can proceed
- Vendor bias concerns — stakeholders worried a vendor-affiliated advisor would skew the recommendation
- Board or executive approval is required for the decision

## Buyer personas

Same decision, different stakeholder lenses — not ten different products. ClouDonna's own Executive Lens (strategic/architecture/economic) already reflects this structurally.

| Persona | What they care about |
|---|---|
| CIO / CTO | Architecture fit, technical risk, vendor lock-in |
| CDO / Head of Data | Data platform capability, governance, data sovereignty |
| Chief AI Officer / Head of AI | AI/ML readiness, GenAI capability, responsible deployment |
| CFO | Business case, TCO/ROI/NPV, cost of delay |
| Enterprise Architect | Architecture patterns, integration, technical constraints |
| Transformation Leader | Program sequencing, change management, stakeholder alignment |
| Technology Strategy / Procurement | Vendor neutrality, commercial terms, competitive comparison |

## Trigger events (when to reach out)

- A multi-vendor RFP or shortlist process is underway
- A board-level technology decision has been announced publicly or internally
- A transformation program budget has been approved but the specific platform choice is still open
- An executive team is visibly split on direction (conference talks, LinkedIn posts, press coverage hinting at internal debate)
- A regulatory deadline is forcing a platform decision (e.g. data residency requirements)

## Sales discovery framework (brief §27)

Ask, in roughly this order:

1. What decision must be made?
2. By when?
3. What happens if you wait?
4. How much investment is at stake? (This becomes Decision Value — see below.)
5. Which options are genuinely being considered?
6. Who must approve the decision?
7. Where is the disagreement?
8. What evidence is missing?
9. What would make the decision defensible?

**Decision Value** (brief §9) is the customer's own estimate of what's economically at stake in the decision they're bringing — never inferred by ClouDonna from company size or industry. Captured at first contact (the lead-qualification `investment_at_stake_chf` field) and refined by sales into the opportunity's `decision_value_chf` once a real conversation has happened. It is a qualification signal, not a ClouDonna deal-size estimate — a CHF 50M decision does not imply a CHF 50M ClouDonna contract.

## Decision Sprint qualification

A lead is ready for a Decision Sprint proposal when:

- The decision is real and specific (not "we're generally evaluating our data strategy")
- At least two genuinely distinct options are on the table
- There is a real decision-maker engaged, not just a researcher
- The timeframe is "this quarter" or "this year," not "exploring"

If any of these are missing, the right move is more discovery, not a proposal.

## Team expansion triggers

A Decision Sprint customer is a strong Team-expansion candidate when, during or after the Sprint:

- The same team mentions a second, unrelated decision coming up
- The Decision Record/Business Case from the Sprint gets reused or referenced by someone else internally
- The customer asks whether the evidence base "updates automatically" or whether ClouDonna can be used again without starting from scratch

The product-level answer to all three is already real: the Sprint leaves behind a saved Decision Record, an evidence base and a business case in Decision Memory (brief §23) — Team is "keep using what you already have," not a new pitch.

## Enterprise expansion triggers

A Team customer is a strong Enterprise-expansion candidate when:

- A second team at the same company independently asks about ClouDonna (organic internal pull, the strongest signal)
- The customer asks about role-based access or keeping some evidence private to one team
- Governance, audit, or security review becomes a blocker to wider adoption — the actual product answer (organization-private evidence, RBAC, enterprise reporting, a security review) is what Enterprise exists to resolve.

## Objection handling

| Objection | Response |
|---|---|
| "Why not just hire a consultancy?" | A consultancy's output is a deck. ClouDonna's output is a saved, reusable Decision Record with evidence attached — and the Decision Challenger actively looks for the weakest part of the recommendation, which most consultancies have no structural incentive to do. |
| "How do we know this isn't biased toward a vendor?" | ClouDonna takes no vendor placement fees and sells no implementation services — see the Independence page. The neutrality rules are enforced structurally (RLS, no vendor-name branching in scoring), not promised. |
| "This seems expensive for a few weeks of work." | The Decision Sprint's price is anchored to what's at stake in the decision, not to hours worked — a defensible decision about a CHF 10M+ commitment is cheap insurance against a wrong one. |
| "We already have an internal business case." | Good — the Decision Sprint's Business Case Engine and Decision Challenger can stress-test an existing case rather than starting from zero, and often that's the more valuable conversation. |
| "Can we just get a trial/pilot?" | ClouDonna is not a self-service product; there's no free trial to run against a real enterprise decision that doesn't exist yet. The Decision Sprint itself is the lowest-commitment real engagement. |

## Commercial packaging quick reference

| Package | Indicative entry point | Term | For |
|---|---|---|---|
| Decision Sprint | Starting from CHF 25,000 | One-time, 2–4 weeks | One critical decision |
| Team | From CHF 75,000 / year | Annual, recurring | A team deciding repeatedly |
| Enterprise | Talk to ClouDonna | Annual, recurring | Multiple teams, governed |
| Strategic Decision Program | CHF 300,000–750,000+ (sales-led) | Program-length | Large transformation programs made of several interconnected decisions |

The Strategic Decision Program is an internal sales positioning range, not a public price, and is never hardcoded into any deterministic product logic — see `apps/web/src/lib/commercial/packages.ts`'s own comment.

## Pipeline math

- **Bookings** — committed contract value at signing. The primary metric tracked toward the CHF 1M target.
- **ARR** — only the recurring portion (Team/Enterprise). A Decision Sprint contributes zero ARR by construction.
- **TCV** — total contract value across the committed term; equals bookings under this model's single-year-term assumption (see Known Limitations in the capability report).
- **Weighted pipeline** — open pipeline value × probability (explicit per-opportunity, or the documented stage default — see `apps/web/src/lib/commercial/opportunity-stages.ts`). Never presented as a statistical prediction.
- **Coverage ratio** — open pipeline value ÷ remaining gap to target. A conventional sales-planning reading (e.g. 3x is a common healthy rule of thumb), not a claim specific to ClouDonna's own numbers.

Track all of this in the internal Commercial Dashboard (`/app/commercial`, platform-staff only).
