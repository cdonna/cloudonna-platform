# Commercialization Playbook — Protecting Trust While Monetizing

Full model-by-model analysis: `docs/company/05-commercial-model.md`. This document is the operating rule, stated once, precisely, so it never has to be re-derived under revenue pressure.

## The rule

**A business model is compatible with ClouDonna if a skeptical customer, shown exactly how it works, would still trust the recommendation. It is incompatible if explaining it honestly would make a customer trust the recommendation less.** This single test outranks every other consideration — growth rate, margin, investor expectation — in every commercialization decision this company ever makes.

## Which models strengthen trust

- **Direct enterprise SaaS.** The customer pays ClouDonna directly for ClouDonna's own value; there is no third party whose interest could bend toward. The cleanest model in the entire set, and correctly the first and primary one (`docs/company/14-founder-decisions.md` #4).
- **Enterprise Intelligence / Research subscriptions.** Same shape — the buyer and the beneficiary of neutrality are the same party.
- **Benchmark subscriptions, done on genuinely anonymized, consented data.** Strengthens trust *if and only if* the anonymization and consent machinery (`docs/sprint-6/25-outcome-intelligence.md`) is real and independently verifiable before a dollar is taken — otherwise this model quietly moves to the list below.

## Which models weaken trust — by default, unless walled off and independently proven otherwise

- **Marketplace / partner commissions.** The highest-risk model in the entire commercial menu, precisely because it sits closest to the recommendation itself. Not rejected outright — `docs/roadmap/07-sprint-7-marketplace.md`'s architecture (separate services, separate data contracts, disclosure) is a real, thoughtful design for how this *could* stay compatible — but it starts every conversation on the "weakens trust" side of the ledger and has to earn its way to the other side with a separate, explicit review before it ships, never inherited from a general roadmap-stage approval.
- **Implementation/staffing revenue at meaningful scale.** Rejected as a permanent principle (`01-founder-principles.md` is silent on it directly, but `docs/company/16-founder-questions.md` Q8 names it explicitly) — the moment ClouDonna profits from which vendor a customer chooses because ClouDonna also delivers the implementation, it has recreated the exact conflict of interest the whole company exists to be an alternative to.
- **API access without a contractual answer to reseller honesty.** Weakens trust by default because ClouDonna loses direct visibility into how its output is presented once it's embedded elsewhere — compatible only with real, specific contractual guarantees, not just careful API design.
- **Data products sold externally.** Same category as benchmark subscriptions, higher stakes — requires the highest bar of anonymization proof in the entire menu before it's compatible at all.

## The sequencing discipline, restated as an operating rule

Every model in the "weakens trust by default" list requires, before it generates a single dollar of revenue: (1) its own named, written trust-risk analysis, (2) an explicit, separate approval — never bundled into approving an adjacent roadmap stage, (3) independent verification that the specific safeguard it depends on (the marketplace wall, the anonymization pipeline, the reseller contract) is actually built and actually holding, not just designed. This is `docs/company/14-founder-decisions.md` #7 and #9 made procedural rather than aspirational.

## The uncomfortable trade-off, named directly

This playbook deliberately makes ClouDonna slower to reach the highest-margin revenue models than a less principled competitor would be, and deliberately forfeits revenue a looser company would take without hesitation (`docs/company/20-investor-critique.md`, Objection 9). The bet this entire company is built on is that the forfeited revenue is smaller than the value of remaining the one credible, neutral option in the category once every competitor's shortcuts have caught up with them. That bet is unproven today. Holding this playbook's line anyway, before it's proven, is what makes the eventual proof possible at all.
