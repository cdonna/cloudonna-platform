# Enterprise Ontology v0.1

**Status:** Design only. No graph database, no new tables, no runtime
dependency. This is a vocabulary, versioned so it can be argued with.

---

## 1. This extends the EIG, it does not replace it

`docs/platform/enterprise-intelligence-graph.md` is the existing source of
truth for what ClouDonna models, and it already has a node catalog, a
relationship catalog, and a working relational projection in
`supabase/migrations/`. Writing a second, parallel model would create exactly
the ambiguity an ontology exists to remove.

So v0.1 is the EIG **plus** the entities the brief names that the EIG
genuinely lacks, with an explicit mapping column. The third column is the
honest part: most of this already exists.

## 2. Entities

| Entity | Status | Maps to today |
|---|---|---|
| **Company** | exists | `organizations` (tenant) + an unmodelled external-company notion |
| **Strategy** | **new** | — nothing models strategy as an object; `business_goals` is the closest and is narrower |
| **BusinessCapability** | exists | `capabilities` (global taxonomy) |
| **Application** | **new** | — `products` covers purchasable products, not *a customer's installed instance* |
| **DataProduct** | **new** | — exists as public page content (`data-economy/catalog.ts`), not as a modelled entity |
| **Architecture** | exists | `architecture_patterns`, `technology_patterns` |
| **Vendor** | exists | `vendors` |
| **Product** | exists | `products` |
| **Capability** | exists | `capabilities` (same table as BusinessCapability — see §4) |
| **Contract** | **new** | — no commercial-agreement entity exists |
| **PricingModel** | **new** | — qualitative exposure bands exist in page content only |
| **Cost** | **new** | — deliberately absent today; see §5 |
| **Risk** | exists | `risks` |
| **Regulation** | exists | `regulations`, `product_regulations`, `requirement_regulations` |
| **AIUseCase** | partial | `use_cases` + `ai-portfolio/catalog.ts` content; not the same thing |
| **Evidence** | exists | `vendor_evidence`, `evidence_sources`, `decision_score_evidence_sources` |
| **Claim** | partial | `vendor_evidence.fact` is a claim *and* its evidence in one row — see §3 |
| **Assumption** | partial | lives inside `deterministic_output_json`; not separately addressable |
| **Decision** | exists | `decisions`, `decision_sessions` |
| **DecisionOption** | exists | `recommendations` + the shortlist in `deterministic_output_json` |
| **Criterion** | exists | `decision_framework_dimensions` |
| **Recommendation** | exists | `recommendations` |
| **Scenario** | **new** | — exists as the public Scenario Lab's in-memory model only |
| **Stakeholder** | partial | `organization_members` covers users; not a decision role |

**Count: 10 genuinely new, 5 partial, 10 already modelled.** An ontology
document that claimed all 25 were new would be easier to write and would
have misrepresented the codebase.

## 3. The one structural change v0.1 actually asks for

**Separate `Claim` from `Evidence`.**

`vendor_evidence` today stores a `fact` together with its source,
reliability and verification status in a single row. That conflates two
different things:

- a **Claim** is an assertion about the world ("SAP BDC ships governed data
  products for core SAP objects without custom modelling")
- a **piece of Evidence** is a source that *supports or contradicts* a claim

One claim can have several pieces of evidence, and they can disagree. In the
current shape, two sources disagreeing produces two rows that look like two
independent facts rather than one contested claim. A product whose entire
promise is "claims connect to evidence" cannot leave that conflation in
place. This is the first thing the Evidence Graph needs, and it is why
`evidence-model.md` treats `Claim` as a first-class entity.

Nothing changes in the database this sprint. It is recorded here as the
known gap.

## 4. Deliberate modelling choices

**`Capability` and `BusinessCapability` are one table.** The brief lists both.
A product capability ("row-level security") and a business capability
("order-to-cash") are different *levels* of the same concept, and `capabilities`
already carries a hierarchy. Two tables would create a mapping problem with no
reader asking for it. One table, a `level` discriminator if it is ever needed.

**`Application` is not `Product`.** This matters more than it looks.
`products` is the global catalog of things a vendor sells. An `Application`
is *this customer's running instance*, with its own version, owner,
criticality and integration points. The entire Understand step on the
homepage is about a customer's landscape, and the landscape is made of
Applications, not Products. Tenant-scoped, private, never global.

**`Cost` stays abstract on purpose.** No entity in v0.1 holds a currency
amount. The Cost & Value Lab is qualitative because ClouDonna has no path
to real contract data, and the public page says so. `Cost` enters the
ontology as a *type* so `PricingModel` and `Contract` have somewhere to
point; it acquires values when a customer provides them, not before.

**`Stakeholder` is a role on a decision, not a user.** The Align step shows
one decision read four ways. That requires `Stakeholder` to be
`(person | role) × decision × concern`, which `organization_members` cannot
express. New.

## 5. Relationships

Named in the EIG's existing style (`SUPPORTS`, `IMPLEMENTS`, `COMPETES_WITH`).

**Decision**
```
Decision          USES              Evidence
Decision          COMPARES          DecisionOption
Decision          HAS_CRITERION     Criterion
Decision          HAS_ASSUMPTION    Assumption
Decision          AFFECTS           BusinessCapability
Decision          SUPERSEDES        Decision
Decision          HAS_STAKEHOLDER   Stakeholder
Decision          PRODUCED          Recommendation
```

**Options and architecture**
```
DecisionOption    DEPENDS_ON        Architecture
DecisionOption    SCORED_ON         Criterion
Architecture      USES              Product
Architecture      REALIZES          BusinessCapability
```

**Vendor and product**
```
Product           PROVIDED_BY       Vendor
Product           HAS_CAPABILITY    Capability
Product           HAS_PRICING_MODEL PricingModel
Product           GOVERNED_BY       Regulation
Vendor            COMPETES_WITH     Vendor          (exists: vendor_competitors)
Contract          COVERS            Product
Contract          HELD_BY           Company
```

**Evidence and claims — the load-bearing set**
```
Evidence          SUPPORTS          Claim
Evidence          CONTRADICTS       Claim
Claim             ABOUT             Product | Vendor | Capability | Architecture
Assumption        SUPPORTS          Recommendation
Assumption        STANDS_IN_FOR     Claim           ← an assumption is a claim with no evidence
Scenario          VARIES            Assumption
Scenario          RE_EVALUATES      Decision
```

**Customer landscape**
```
Company           RUNS              Application
Company           PURSUES           Strategy
Application       INSTANCE_OF       Product
Application       SUPPORTS          BusinessCapability
DataProduct       DERIVED_FROM      Application
DataProduct       ENABLES           Decision | AIUseCase
Strategy          REQUIRES          BusinessCapability
```

`Assumption STANDS_IN_FOR Claim` is the edge that makes the Trust Center's
promise checkable: an assumption is structurally a claim that has no
evidence yet, so when evidence arrives the assumption resolves rather than
quietly persisting.

## 6. Why no graph database

The relationships above are a *design* constraint, not a storage decision.
Today every one of them is expressible as a foreign key or a join table, the
EIG document already demonstrates that projection, and no query in the
product traverses more than two hops. A graph database would add an
operational dependency, a second consistency model and a second security
model to serve queries SQL answers today.

What the design does commit to: **ontology-shaped read ports**, so the
consuming code asks `evidenceSupporting(claimId)` rather than writing a join.
When a real traversal-depth problem appears, the store behind the port can
change without the callers changing. See
[ADR-0006](../adr/0006-keep-compute-engines-replaceable.md).

## 7. Version

**v0.1.** Expected to change. The most likely revisions, in order:
`Claim`/`Evidence` separation (§3), `Application` vs `Product` (§4), and
whether `Strategy` is an entity or a property of `Company`.
