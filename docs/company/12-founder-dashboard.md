# Founder Dashboard — Design Only

**Not implemented. This document specifies what a future internal dashboard should measure; it does not build one, and no metric below is currently instrumented anywhere in this codebase.**

## Product

- **Active decisions** — decisions currently in progress (saved but not yet at a terminal status).
- **Completed decisions** — decisions that reached a terminal lifecycle status (approved/rejected/archived, once Sprint 6.2's fuller lifecycle exists).
- **Decision replay/version-viewer usage** — how often a saved decision's history is actually revisited, not just created — the clearest available signal that the System of Record is providing real, ongoing value rather than being a write-once archive nobody returns to.
- **Evidence coverage** — the fraction of scored dimensions backed by verified or vendor-provided evidence versus inferred/absent, per `docs/sprint-6/15-evidence-engine.md`'s own definition — reused directly rather than inventing a dashboard-specific variant.
- **Confidence distribution** — the spread of `High`/`Medium`/`Low`/`Insufficient Evidence` bands (`docs/sprint-6/24-confidence-model.md`) across real recommendations. A distribution skewing toward `Insufficient Evidence` is an early warning the knowledge graph isn't keeping pace with real usage — a genuinely actionable signal, not vanity.

## Knowledge

- **Verified facts** — count of `product_facts` at `verification_status = 'verified'`, the only status requiring a named human reviewer (`docs/sprint-6/14-product-knowledge-layer.md`).
- **Stale facts** — count past `revalidation_due`, a direct measure of whether knowledge maintenance is keeping pace with knowledge growth.
- **Disputed facts** — count of unresolved contradictions (`15-evidence-engine.md`'s contradiction detection) — a rising count without a corresponding review-throughput increase is a real early-warning signal of knowledge-quality debt accumulating.
- **Vendors / products tracked** — raw coverage of the knowledge graph, reported honestly alongside whether each entry is `verified` versus still illustrative/inferred, so this number is never allowed to imply more rigor than actually backs it.
- **Architecture patterns catalogued** — same caveat as above.

## Moat

- **Unique decision patterns observed** — a proxy for how much real variety of enterprise decision-making the platform has actually seen, distinct from raw decision count (100 near-identical decisions teach far less than 20 genuinely varied ones).
- **Outcome-linked decisions** — the count of decisions with a real, reviewed outcome record attached (`docs/sprint-6/25-outcome-intelligence.md`) — the single most direct measure of the compounding moat (`04-decision-intelligence-moat.md`) actually accumulating, not just architected for.
- **Evidence graph depth** — average corroboration count per claim (how many independent sources support the average fact), a real signal of evidence robustness distinct from raw fact count.
- **Reusable lessons** — count of `Lesson Learned` nodes that have actually informed a subsequent recommendation (traceable, not just recorded) — reusability is the part that matters, not the raw count of lessons written down.
- **Benchmark coverage** — the fraction of the beachhead decision category for which a genuine, anonymized, minimum-cohort-eligible benchmark exists — reported as a fraction against the addressable category, never as a raw count that could be misread as completeness.

## Customer

- **Design partners / customers** — headcount, segmented by stage (design partner, paid pilot, production) per the Gates in `11-commercialization-gates.md`, never blended into one undifferentiated "customer" number.
- **Decision types observed** — the diversity of `06-go-to-market.md`'s beachhead-versus-adjacent decision categories actually being brought to the platform — the primary signal for validating or revising the ICP.
- **Repeat usage** — customers returning for a second, third, or later decision, not just their first — the clearest evidence the product is becoming a habit rather than a one-time evaluation.
- **Executive engagement** — whether usage is reaching beyond the initial champion persona (`06-go-to-market.md`'s Enterprise Architect / Head of Data & AI) up to CTO/CIO-level engagement — an expansion-motion health signal.
- **Time to decision** — elapsed time from a decision's creation to a terminal status, tracked as a distribution, not an average alone (an average hides whether most decisions are fast with a few very slow outliers, or uniformly moderate).

## Commercial

- **Pilots** — count and stage, mapped to `11-commercialization-gates.md`.
- **Conversion** — design partner → paid pilot → production, tracked as a real funnel with real drop-off visibility, not a single blended conversion rate.
- **Expansion** — existing customers' growth in usage/seats/decisions over time.
- **ARR** — *later.* Not tracked meaningfully before real paid revenue exists; listing a target here today would be inventing a number this document's own stated constraint forbids.

## Trust

- **Unsupported claims caught** — how often the existing claim-validation machinery (`findUnsupportedNumericClaims`/`findUnsupportedVendorMentions`, extended per `docs/sprint-6/23-explainability-layer.md`) actually rejects something — a *healthy* dashboard shows this number is not zero; zero would suggest the validator isn't being exercised, not that nothing was ever wrong.
- **Disputed evidence rate** — the fraction of claims that end up in a genuine, unresolved dispute state — tracked as a quality signal, not something to be minimized artificially by relaxing the definition of "dispute."
- **Security findings, open vs. closed, by severity** — the same discipline this codebase's own review passes already practice (disclosing gaps explicitly, e.g. `docs/sprint-6/21-security-review.md`), formalized as a standing dashboard rather than a one-off document.
- **Audit coverage** — the fraction of state-changing actions that actually produce an audit-log entry — directly measuring closure of the audit-logging gap named repeatedly across this codebase's own documentation (`docs/roadmap/10-release-sequencing.md`).

## On the proposed "Decision Intelligence Index"

**Rejected, explicitly, not adopted.** A single blended score combining product usage, knowledge depth, moat strength, customer health, commercial traction, and trust into one number would be exactly the "arbitrary single confidence number" the product's own Confidence Model document refuses to build for customers (`docs/sprint-6/24-confidence-model.md`: "never a bare number without this structure alongside it... a direct, literal response to the explicit instruction not to invent an arbitrary single confidence number"). Applying a lower standard internally than the product applies externally would be a real inconsistency, not a convenience — six categories with genuinely different units, reliability, and time horizons (a decision count and an ARR figure and a trust-incident count do not combine into one meaningful number without inventing arbitrary weights that would themselves need justifying). If a single-glance summary is genuinely needed, the honest version is a **qualitative status band per category** — `Foundation` / `Emerging` / `Compounding` — mirroring the product's own `High`/`Medium`/`Low`/`Insufficient Evidence` banding discipline, never collapsed further into one composite number.
