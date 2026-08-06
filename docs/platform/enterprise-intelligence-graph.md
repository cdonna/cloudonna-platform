# ClouDonna Enterprise Intelligence Graph (EIG)

**Status:** Design, derived into the relational schema below. Not implemented as a
graph database — see "Why Postgres is still the persistence layer" at the end.

The graph, not the table list, is the source of truth for what ClouDonna
models. `supabase/migrations/` is one persistence layer for it — a
relational projection chosen for pragmatic reasons (Supabase, RLS, a team
that already knows SQL), not because the domain is naturally tabular. This
document is written the other way around from `database-architecture.md`:
start from business entities and named relationships, then show what each
becomes in Postgres.

---

## 1. Why graph-first changes the design

Thinking in tables first tends to produce whatever's easiest to query, not
the truest shape of the thing being modeled. Thinking in nodes and labeled
edges surfaces missing relationships that a table list quietly hides.
Concretely, doing this exercise found four real gaps in the migration set
already written for this sprint, now fixed in migration 11:

- **`products` had no link to `technology_patterns` at all** — a product
  could belong to a `platform_category` but nothing said which technology
  patterns it actually implements. Added `product_technology_patterns`.
- **No product-to-product relationship existed** — "does this integrate
  with that" (a real, frequently-asked question) had nowhere to live.
  Added `product_integrations`.
- **No vendor-to-vendor relationship existed** — "who competes with whom"
  had nowhere to live. Added `vendor_competitors`.
- **`products` had no link to `use_cases`** — only `customer_references`
  connected a product to real-world usage; the more general "this product
  is a typical fit for this use case" had no home. Added
  `product_use_cases`.

Three node types named in this exercise had no table at all: **Regulation**,
**Risk**, **Opportunity**. All three are added in migration 11.

Two node types named in the brief — **Platform** and **Service** — are
deliberately *not* new tables. See §4.

---

## 2. Node catalog

| Node | Postgres table | Scope |
|---|---|---|
| Organization | `organizations` | Tenant |
| Workspace | `workspaces` | Tenant (supporting node, not in the brief's list, structurally required) |
| Project | `projects` | Tenant (same) |
| Business Goal | `business_goals` | Tenant |
| Capability | `capabilities` | Global taxonomy |
| Requirement | `requirements` | Tenant |
| Constraint | `session_constraints` | Tenant |
| Architecture Pattern | `architecture_patterns` | Global taxonomy |
| Technology Pattern | `technology_patterns` | Global taxonomy |
| Vendor | `vendors` | Global |
| Platform / Product | `products` | Global — see §4 |
| Service | *(no table — see §4)* | — |
| Partner (Consulting/Implementation) | `partner_companies` | Global |
| Implementation Partner (the certification) | `implementation_partners` | Global |
| Industry | `industries` | Global taxonomy |
| Regulation | `regulations` *(new, migration 11)* | Global taxonomy |
| Use Case | `use_cases` | Global taxonomy |
| Reference Customer | `customer_references` | Global |
| Analyst Report | `analyst_reports` | Global |
| Knowledge Article | `knowledge_articles` | Hybrid global/tenant |
| Decision Session | `decision_sessions` | Tenant |
| Decision Framework | `decision_frameworks` + `decision_framework_dimensions` | Hybrid global/tenant |
| Decision Recommendation | `recommendations` | Tenant |
| Score | `decision_scores` | Tenant |
| Decision Report | `decision_reports` | Tenant |
| Risk | `risks` *(new, migration 11)* | Tenant |
| Opportunity | `opportunities` *(new, migration 11)* | Tenant |

---

## 3. Relationship catalog

Every edge below is directional (`FROM --EDGE_TYPE--> TO`) and semantically
named, matching the vocabulary in the brief. "Persistence" shows how the
edge is currently realized in Postgres — either a foreign key (a node
"owns" a pointer to the node it relates to) or a join table (a genuine
many-to-many).

| Edge | From → To | Meaning | Persistence |
|---|---|---|---|
| `BELONGS_TO` | Workspace → Organization, Project → Workspace, DecisionSession → Project | Tenant containment | FK (`organization_id`/`workspace_id`/`project_id`) |
| `STARTS_FROM` | DecisionSession → BusinessGoal | A session's starting point | FK (`business_goals.decision_session_id`) |
| `REQUIRES` | BusinessGoal → Capability, Requirement → Capability | A goal/requirement implies a needed capability | `decision_session_capabilities`, `requirements.capability_id` |
| `SUPPORTS` | Product → Capability | A product provides a capability, at some maturity | `product_capabilities` (carries `maturity_band`) |
| `IMPLEMENTS` | Product → TechnologyPattern, TechnologyPattern → ArchitecturePattern | A product realizes a technology pattern; a technology pattern realizes an architecture pattern | `product_technology_patterns` *(new)*, `technology_patterns.architecture_pattern_id` |
| `COMPETES_WITH` | Vendor ↔ Vendor | Market competition, symmetric | `vendor_competitors` *(new, self-referential)* |
| `INTEGRATES_WITH` | Product ↔ Product | Interoperates with, symmetric | `product_integrations` *(new, self-referential)* |
| `OFFERED_BY` | Product → Vendor | Which vendor sells this product | FK (`products.vendor_id`) |
| `PARTNER_OF` | PartnerCompany → Product | A consultancy delivers this product | `implementation_partners` |
| `CERTIFIED_BY` | ImplementationPartner → Product | The certification itself, with a level and verification status | `implementation_partners.certification_level`/`verification_status` |
| `FITS` | Product → Industry, Product → UseCase | Typical industry/use-case fit | `product_industries`, `product_use_cases` *(new)* |
| `COMPLIES_WITH` | Product → Regulation, Requirement → Regulation | A product helps meet a regulation; a requirement is driven by one | `product_regulations` *(new)*, `requirement_regulations` *(new)* |
| `EVIDENCED_BY` | Product → ReferenceCustomer, DecisionScore → EvidenceSource | What backs a claim | `customer_references.product_id`, `decision_score_evidence_sources` |
| `CITES` | EvidenceSource → AnalystReport | A citation's source, when it's an analyst publication | `evidence_sources.analyst_report_id` |
| `SCORED_BY` | DecisionSession → DecisionFramework | Which methodology produced the scores | FK (`decision_sessions.framework_id`) |
| `WEIGHTS` | DecisionFramework → ScoreDimension | A framework's dimension weights | `decision_framework_dimensions` |
| `RECOMMENDED_FOR` | Product → DecisionSession | The outcome of scoring — never the input | `recommendations` |
| `BROKEN_DOWN_BY` | Recommendation → Score | Per-dimension detail behind a recommendation | `decision_scores.recommendation_id` |
| `CARRIES` | Recommendation → Risk, Recommendation → Opportunity | What could go right/wrong with this option | `risks.recommendation_id` *(new)*, `opportunities.recommendation_id` *(new)* |
| `GENERATES` | DecisionSession → DecisionReport | The final synthesis | `decision_reports.decision_session_id` |
| `USED_BY` | Product → ReferenceCustomer | Inverse framing of `EVIDENCED_BY`, kept as one table not two directions | `customer_references` |
| `DISCUSSED_IN` | DecisionSession → AiConversation | Optional link from a session to an AI thread about it | `ai_conversations.decision_session_id` |

Every edge that is genuinely many-to-many is a join table; every edge that
is naturally one-to-many from the child's perspective is a foreign key on
the child. No edge in this catalog is modeled both ways — the direction
chosen is whichever side has at most one owner (e.g. a product has exactly
one vendor, so `OFFERED_BY` is `products.vendor_id`, not a join table).

---

## 4. Two deliberate non-additions

**Platform vs. Product.** The brief lists both. In this domain they are the
same underlying thing looked at from two angles — Snowflake is a "platform"
in marketing language and a "product" in the catalog's structural sense.
Splitting them into two tables would mean every query about "what can this
platform do" needs a join that a single `products` table already answers
directly, for a distinction that carries no different data. `platform_category`
(the enum already on `products`) is what actually needs to vary; the noun
used to describe the row doesn't.

**Service.** A vendor- or partner-delivered service (e.g. "Managed Migration
Service") doesn't yet have fields that don't already belong somewhere else:
a *product* offered as a managed service is `products.deployment_models
@> '{managed-service}'`; a *partner's* delivery service is exactly what
`implementation_partners` already describes. Adding a standalone `services`
table now, with no distinguishing field of its own, is the "empty table to
fill the node list" trap the Web Presence Sprint's route-architecture
decision explicitly avoided — noted here rather than done, so the reasoning
isn't lost if it comes up again once a real, distinct service offering
(e.g. a paid ClouDonna advisory engagement, not a vendor's) needs modeling.

---

## 5. Why Postgres is still the persistence layer

Nothing about choosing Postgres denies the graph. Every edge above is
either a foreign key or a join table specifically *because* Postgres can
express "a node points to another node, with an optional label and
properties on the edge itself" (a join table's extra columns —
`product_capabilities.maturity_band`, `implementation_partners.certification_level`
— are edge properties, not row properties) perfectly well at this graph's
actual size. A dedicated graph database earns its cost when traversal depth
and query patterns Postgres can't express efficiently (arbitrary-length
path queries, e.g. "every product reachable from this one through
`INTEGRATES_WITH` within 3 hops") become a real product requirement — not
before. RLS, transactional consistency with the rest of the tenant data,
and the team's existing SQL fluency all favor staying relational for as
long as that holds. If ClouDonna outgrows it, `match_products`/
`match_knowledge_articles` (semantic search) and this document's edge
catalog are exactly the parts that would migrate to a graph engine with
the least rework — everything else stays.
