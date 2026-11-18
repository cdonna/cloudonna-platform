# First Customer Checklist

Operational checklist for taking one real opportunity from lead to Decision Memory. Companion to `decision-sprint-delivery-playbook.md` (how to run the engagement) and `first-10-customers.md` (who to run it with). No founder personal details appear here — every reference to who runs these steps says "the ClouDonna team," consistent with the standing privacy requirement.

## 1. Lead qualification

- [ ] Inquiry received via the public site (`/commercial`, `/contact`, or a dedicated form)
- [ ] Decision type, timeframe, and investment-at-stake captured at first contact (`inquiries.decision_type`/`decision_timeframe`/`investment_at_stake_chf`)
- [ ] Sales discovery questions answered: what decision, by when, what happens if they wait, who approves, where the disagreement is (see `first-million-playbook.md`'s discovery framework)
- [ ] Decision Sprint qualification criteria met: a real, specific decision; at least two genuinely distinct options; a real decision-maker engaged; a "this quarter"/"this year" timeframe
- [ ] Inquiry promoted to Account + Contact + Opportunity (`/app/inquiries` → Promote to opportunity, or `/app/commercial/accounts` → New opportunity) — a human decision every time, never automatic

## 2. Discovery

- [ ] Primary contact's buyer persona and buying role recorded (economic buyer / decision maker / technical evaluator / champion / procurement)
- [ ] Economic buyer identified for the account — pipeline hygiene flags this if missing
- [ ] Decision value (customer's own estimate of what's at stake) recorded on the opportunity
- [ ] Customer's own decision deadline recorded, distinct from ClouDonna's target close date

## 3. Decision Sprint scoping

- [ ] Scope, start date, and target completion date agreed and recorded (`decision_sprints`)
- [ ] Executive sponsor identified and linked
- [ ] Working team named
- [ ] Delivery capacity checked (`/app/commercial` shows active-sprint count against the documented concurrent-sprint assumption) before committing a start date

## 4. Security questions

- [ ] Data residency, access control, and evidence-confidentiality questions from the customer answered before the Sprint starts
- [ ] Organization-private vs. shared vendor-intelligence evidence boundary explained if asked

## 5. Commercial proposal

- [ ] Opportunity moved to `sprint_proposed`
- [ ] Forecast category set (Pipeline / Upside / Commit) — a sales judgment, not derived from stage
- [ ] Proposal reflects only shipped capability (`docs/commercial/decision-sprint-proposal.md`)

## 6. Contract

- [ ] Contract economics entered on the opportunity (`/app/commercial/opportunities/[id]` → Contract): fees, term, billing frequency, discount
- [ ] Contract status moved to SIGNED once genuinely signed — this is the only trigger for real Bookings/ARR/TCV recognition
- [ ] Non-CHF contract: an approved CHF planning value entered, or the deal is correctly excluded from CHF totals

## 7. Onboarding

- [ ] Decision Workspace created in the product
- [ ] Enterprise context captured (constraints, stakeholders, existing platforms)
- [ ] Evidence collection started

## 8. Decision execution

- [ ] Business case built
- [ ] Decision Challenger review run
- [ ] Executive Recommendation generated

## 9. Executive review

- [ ] Executive review held with the sponsor
- [ ] Final human decision recorded

## 10. Outcome capture

- [ ] Decision Sprint outcome recorded (`decision_sprints/[id]` → Outcome): recommendation delivered, final decision, whether the customer accepted it or chose differently (a normal outcome, not a failure), reasons, next step, expansion potential
- [ ] Decision-level outcome learning captured in the product (`decision_outcomes`, tenant-private): implementation started, realized outcome known, customer feedback
- [ ] Key assumptions marked CONFIRMED/INVALIDATED/PARTIALLY_TRUE/UNKNOWN as they resolve

## 11. Expansion review

- [ ] Sprint marked COMPLETED
- [ ] Expansion signals reviewed (`/app/commercial/accounts/[id]` surfaces them automatically — multiple decisions, multiple executive stakeholders, multiple completed sprints)
- [ ] Conversion outcome recorded once known (`commercial_conversions`): Sprint→Team, Team→Enterprise, no expansion, or a follow-up sprint
- [ ] Customer reference permission discussed and recorded (`/app/commercial/accounts/[id]` → Customer reference permission) — default remains no public use until the customer explicitly agrees
