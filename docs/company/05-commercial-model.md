# Commercial Model

**Framing constraint:** every model below is evaluated against one non-negotiable filter first — does this model create any path, direct or indirect, for money to influence a score, a ranking, or a recommendation? If yes, it is disqualified or requires an explicit architectural wall before it can be considered at all (`docs/manifesto/cloudonna-manifesto-v1.md` §6). This document does not optimize for near-term revenue; it optimizes for which models are compatible with the category claim ClouDonna is actually making.

## Enterprise SaaS (platform seat/usage licensing)

- **Buyer:** CIO/CDO office or an enterprise architecture team, budget-holder for the platform itself.
- **Value proposition:** a trusted, permanent system of record for the organization's own technology decisions — the System of Record and Trust value, sold directly, with no commercial entanglement in the recommendation itself.
- **Pricing unit:** per-organization or per-seat, likely tiered by decision volume/history depth rather than per-query — a poor fit for per-query pricing given decisions are infrequent, high-stakes events, not high-volume transactions.
- **Gross-margin characteristics:** strong once built (software margins), though AI narrative generation carries a real, non-trivial per-decision compute cost that must be modeled honestly, not assumed away.
- **Trust risk:** low — this is the cleanest model relative to the neutrality principle, since the customer is the direct beneficiary, not a third party seeking influence over the recommendation.
- **Neutrality risk:** none inherent to the model itself.
- **Implementation complexity:** requires Gates 2–3 (`11-commercialization-gates.md`) — a real paid-pilot-ready and enterprise-production-ready product, further away than it may feel today given Sprint 6.1 is not yet even committed.
- **Recommended timing:** the primary, first commercial model — everything else in this document is secondary to getting this one right.

## Enterprise Intelligence / Research subscription

- **Buyer:** the same CIO/CDO office, or a broader strategy/transformation function, buying access to structured market and vendor intelligence (the knowledge graph, benchmark corpus) independent of any specific decision they're actively making.
- **Value proposition:** "your own private Gartner, evidenced and continuously current, without the analyst-report staleness problem."
- **Pricing unit:** subscription, likely seat- or org-tiered.
- **Gross-margin characteristics:** strong, but entirely dependent on the knowledge graph (`Sprint 6.4`, not started) actually containing real, maintained, non-illustrative data — selling this today would be selling the current mock catalog, which is a trust-destroying move this document explicitly warns against.
- **Trust risk:** low.
- **Neutrality risk:** low, same reasoning as SaaS above.
- **Implementation complexity:** high — depends on the knowledge graph and evidence engine being real, which is a Year 2 capability at earliest (`10-three-year-roadmap.md`).
- **Recommended timing:** Year 2+, after Sprint 6.4 is real, not illustrative.

## API (decision intelligence as infrastructure)

- **Buyer:** a technical buyer embedding ClouDonna's scoring/evidence logic into their own internal tooling (a large enterprise's internal platform-decision tool, or a partner ISV).
- **Value proposition:** decision intelligence as a callable capability rather than a standalone application.
- **Pricing unit:** usage-based (calls, or decisions scored).
- **Gross-margin characteristics:** good, but risks commoditizing the product experience that actually carries the brand and trust story — an API-only relationship has a much weaker path to accumulating the System of Record/Learning moat, since the caller may not persist anything back into ClouDonna's own decision history at all.
- **Trust risk:** medium — once decision intelligence is embedded inside someone else's UI, ClouDonna loses direct visibility into whether it's being presented honestly (e.g., a reseller silently reordering results).
- **Neutrality risk:** medium, for the same reason.
- **Implementation complexity:** medium technically, but requires a contractual answer to the trust risk above before it should ship.
- **Recommended timing:** not before Year 2, and only after the direct SaaS relationship has proven the model works when ClouDonna controls the full experience.

## Benchmark subscriptions

- **Buyer:** likely the same CIO/CDO buyer, purchasing access to cross-tenant, anonymized outcome and benchmark data ("how do decisions like mine typically play out").
- **Value proposition:** the single most differentiated, hardest-to-copy offering in this entire document, because it requires the compounding moat (`04-decision-intelligence-moat.md`) to already exist.
- **Pricing unit:** subscription or report-based.
- **Gross-margin characteristics:** excellent once the underlying data exists — near-zero marginal cost to serve an aggregate query.
- **Trust risk:** high if done early or carelessly — see the anonymization/consent requirements already specified in `docs/sprint-6/25-outcome-intelligence.md` (tenant consent, minimum cohort thresholds, no customer-identifying output). Shipping this before those controls are real would be a trust-destroying shortcut, not a monetization win.
- **Neutrality risk:** low, if built on genuinely anonymized, consented data; high if the anonymization/consent discipline is skipped under revenue pressure.
- **Implementation complexity:** high — explicitly described in the existing architecture docs as "a later, dedicated Outcome Intelligence release... not Sprint 6.2 or 6.4... deserves its own scoped review" (`docs/sprint-6/25-outcome-intelligence.md`).
- **Recommended timing:** Year 3 at the earliest — this is the model that should be the reward for the compounding moat existing, not a shortcut to revenue before it does.

## Premium executive intelligence

- **Buyer:** a CEO/board-level buyer wanting synthesized, cross-functional decision briefings rather than raw platform access.
- **Value proposition:** "Executive Brain"-style synthesis (`docs/sprint-6/26-donna-brains.md`) — a future concept, not built.
- **Pricing unit:** likely a premium tier on top of core SaaS, or a services-adjacent offering.
- **Gross-margin characteristics:** unclear until the underlying synthesis capability exists.
- **Trust risk:** low, structurally similar to SaaS.
- **Neutrality risk:** low.
- **Implementation complexity:** high — depends on Sprint 8-era orchestration existing.
- **Recommended timing:** Year 3+, speculative even then; not a near-term priority.

## Marketplace / partner matching

- **Buyer:** vendors and implementation partners paying for qualified introduction to enterprises already using ClouDonna.
- **Value proposition:** for ClouDonna, potentially high-margin, high-volume commercial revenue; for the vendor/partner, warm, evidenced leads.
- **Pricing unit:** commission, lead fee, or subscription for partner-side access.
- **Gross-margin characteristics:** potentially excellent — this is the model most likely to look attractive to a board wanting revenue growth, which is exactly why it is also the model most likely to be prematurely pushed.
- **Trust risk:** **the highest in this entire document.** This is the one commercial model sitting directly adjacent to the manifesto's central promise (no vendor buys influence over a recommendation). The existing architecture already treats this with real seriousness — `docs/roadmap/07-sprint-7-marketplace.md`'s explicit "Analytical and commercial systems require separate services and data contracts... not a suggestion" and its blocking dependency on Sprint 6.4 being credible first.
- **Neutrality risk:** the same — highest in the document, requires the wall described in `docs/roadmap/07-sprint-7-marketplace.md` to be real and independently reviewed before a single dollar of commission revenue is taken.
- **Implementation complexity:** high, and the complexity that matters most here is organizational/governance complexity, not engineering complexity — the hard part is the discipline to keep it walled off once it exists.
- **Recommended timing:** not before Sprint 6.4 is real (per existing roadmap dependency) and not before the neutrality architecture has its own explicit, separate founder-level approval gate — never bundled into a general "Sprint 7 is approved."

## Implementation ecosystem (certified partners delivering on ClouDonna recommendations)

- **Buyer:** implementation partners paying for certification/ecosystem access; indirectly, enterprises benefiting from vetted delivery partners.
- **Value proposition:** closes the loop from recommendation to actual implementation, feeding real implementation-lesson data back into the moat.
- **Pricing unit:** certification fee, or a lighter-weight version of the marketplace commission model above.
- **Gross-margin characteristics:** moderate.
- **Trust risk / neutrality risk:** same category as marketplace, somewhat lower magnitude since certification is about delivery quality, not recommendation placement — but still adjacent enough to need the same wall.
- **Implementation complexity:** high, dependent on marketplace infrastructure existing first.
- **Recommended timing:** after marketplace, not before — Year 3+.

## Data products (aggregated, anonymized market intelligence sold externally)

- **Buyer:** market research firms, investors, or enterprises not otherwise customers, wanting aggregate insight ("which platforms enterprises are actually choosing, and why").
- **Value proposition:** monetizing the compounding moat's aggregate shape without exposing any individual customer's data.
- **Pricing unit:** report or subscription.
- **Gross-margin characteristics:** excellent, near-zero marginal cost.
- **Trust risk:** high if the anonymization discipline isn't airtight and independently verifiable — this is literally selling insights derived from customer trust, which makes any failure here maximally damaging.
- **Neutrality risk:** low if genuinely anonymized and aggregated; this model doesn't touch any specific recommendation.
- **Implementation complexity:** highest in this document — requires real anonymization engineering, a real minimum-cohort policy, and genuine scale of underlying data.
- **Recommended timing:** Year 3+, and only after the benchmark-subscription model above has already proven the anonymization/consent machinery works at smaller scale internally.

## Summary: sequencing by trust-compatibility, not by revenue potential

```
Now → Year 1:     Enterprise SaaS only
Year 2:           + Enterprise Intelligence/Research subscription, cautious API pilots
Year 3:           + Benchmark subscriptions, marketplace (with independent neutrality review), data products
```

The models with the highest apparent revenue ceiling (marketplace, data products) are also the models with the highest trust risk — this is not a coincidence, and it means the obvious growth-stage temptation ("the marketplace could be huge, let's pull it forward") is precisely the temptation this document exists to name and resist. See `11-commercialization-gates.md` for the objective, checkable criteria before any of these move from "designed" to "live."
