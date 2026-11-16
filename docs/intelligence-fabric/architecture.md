# Intelligence Fabric — Architecture

**Status:** Design only. Nothing here is deployed. Read
[`overview.md`](./overview.md) first.

---

## 1. Current architecture, as discovered

Established by reading the repository, not from memory:

**Application**
- Next.js 16 / React 19 / TypeScript, npm workspaces (`apps/web`, `packages/database`)
- Two independent root layouts (`(localized)/[locale]` and `(default)`), so
  `<html lang>` is correct at the first byte
- Tailwind CSS v4, tokens in `apps/web/src/app/globals.css`
- Vercel for hosting; `src/proxy.ts` for the session-refresh/locale proxy

**Decision intelligence (all in `apps/web/src/components/donna-ai/`)**
- `scoring/engine.ts` — deterministic scoring. Same input → same score.
- `intelligence/` — a provider boundary (`provider.ts`,
  `providers/deterministic-provider.ts`, `providers/openai-provider.ts`,
  `select-provider.ts`) with a validated `EvidencePackage` as the *only*
  thing a provider sees, a Zod-checked output schema, and a deterministic
  fallback when no LLM is configured
- `persistence/` — save/append-version handlers, repository, version diff
- 42 test files, 396 passing tests

**Persistence (Supabase/Postgres, `supabase/migrations/`)**
- ~60 tables. Tenancy (`organizations`, `organization_members`, `profiles`),
  a global taxonomy and vendor catalog, the decision engine
  (`decision_sessions`, `recommendations`, `decision_scores`,
  `decision_score_evidence_sources`, `risks`, `opportunities`), knowledge and
  AI (`knowledge_articles`, `ai_conversations`), `audit_logs`,
  `business_events`, billing, `inquiries`
- **A provenance layer already exists**: `vendor_sources`, `vendor_evidence`
  (fact + source + `observed_at` + `published_at` + `reliability` +
  `verification_status` + `confidence`), `vendor_source_change_log`
- **Decision Memory already exists and is already immutable**:
  `decision_versions` is append-only by design — no `updated_at`, no
  `deleted_at`, and no UPDATE or DELETE policy for any regular role. It
  carries `decision_input_json`, `deterministic_output_json`,
  `validated_enrichment_json`, `evidence_references_json`, and critically
  `schema_version`, `scoring_engine_version`, `knowledge_base_version`
- Row Level Security throughout, with `organization_id` denormalized onto
  tenant tables for single-join policies

**Existing design documents that already own part of this domain**
- `docs/platform/enterprise-intelligence-graph.md` — the Enterprise
  Intelligence Graph (EIG): nodes and semantically-named relationships. **This
  is the existing source of truth for what ClouDonna models.**
- `docs/platform/database-architecture.md` — the relational projection of it
- `docs/intelligence/evidence-package.md`, `provider-boundaries.md`,
  `security-and-privacy.md`, `donna-intelligence-architecture.md`
- `docs/operations/03-vendor-intelligence-architecture.md`

**Consequence for this design.** The ontology in
[`ontology-v0.1.md`](./ontology-v0.1.md) is *not* a new model. It is the EIG
extended with the entities the brief names that the EIG genuinely lacks, and
it says explicitly which existing table each entity already maps to. Three
things the brief asks for already exist in some form —
immutable decision versions, typed evidence with provenance, and an
engine-version stamp that makes replay well-defined. Designing them again
would have been the easier and worse outcome.

---

## 2. Component boundaries

| Component | Responsibility | Must not |
|---|---|---|
| **Donna Orchestrator** | Decompose an objective into agent tasks, dispatch, reconcile, gate on human approval | Score anything; write evidence directly |
| **Agent Control Plane** | Run registry, concurrency, budget, timeout, retry, audit | Contain domain logic |
| **Decision Engine** | Deterministic scoring and ranking | Consume an LLM output as an input |
| **Evidence Graph** | Resolve claims ↔ evidence ↔ assumptions, with provenance | Hold interpretation as evidence |
| **Scenario Engine** | Re-evaluate a decision under changed assumptions | Invent a value for an unknown |
| **Decision Memory** | Immutable history and replay | Mutate a historical snapshot, ever |
| **Enterprise Ontology** | The shared vocabulary all of the above speak | Become a runtime dependency with its own store (this sprint) |
| **Semantic / Query layer** | The single port to analytical storage | Leak engine-specific SQL upward |

### The analytical port

Exactly one interface is allowed to know that Trino or Iceberg exist:

```ts
/** Design sketch. Not implemented in this sprint — the point is that the
 *  application depends on this shape, never on an engine. */
export interface AnalyticalStore {
  /** Read-only, parameterized, tenant-scoped by construction. */
  query<T>(spec: AnalyticalQuery): Promise<AnalyticalResult<T>>;
  /** Point-in-time read. The whole reason Iceberg is the format. */
  queryAsOf<T>(spec: AnalyticalQuery, asOf: IsoTimestamp): Promise<AnalyticalResult<T>>;
}

export interface AnalyticalQuery {
  /** Always explicit. There is no "current tenant" ambient state. */
  tenantId: TenantId | "PUBLIC";
  namespace: string;
  table: string;
  select: readonly string[];
  where?: readonly Predicate[];
  limit: number;
}
```

This mirrors the existing `IntelligenceProvider` boundary (see
`docs/intelligence/provider-boundaries.md`), which is the pattern this
codebase already uses successfully to keep a vendor replaceable.

---

## 3. Supabase vs Iceberg — the boundary

The split is **current state vs. history**, not "small vs. big".

### Supabase/Postgres — system of record for what is true now

users · organizations · auth · permissions · sessions · current workflow
state · comments · notifications · transactional application data ·
operational decisions · the live global catalog (vendors, products,
capabilities) · `decisions` and `decision_versions` as the authoritative
decision record · `audit_logs` · `inquiries` · billing

Postgres keeps these because they need: RLS that **fails closed**, foreign
keys, single-row latency, transactions, and `UPDATE` semantics.

### Iceberg — system of record for what was ever true

historical evidence · vendor intelligence history · architecture knowledge
history · pricing history · decision version snapshots · economic models ·
agent run history · large analytical datasets · enterprise telemetry ·
point-in-time snapshots

Iceberg gets these because they need: append-only at volume, schema
evolution without rewrites, time travel as a first-class operation, scan
cost proportional to the query rather than the table, and retention measured
in years at object-storage prices.

### The rules that keep the boundary honest

1. **Postgres is never replaced.** Nothing migrates out of it in this design.
2. **One writer per fact.** A fact is authored in Postgres and *projected*
   into Iceberg, or authored in Iceberg and never contradicted by Postgres.
   Never both.
3. **Iceberg is append-only from the application's perspective.** Compaction
   and expiry are maintenance operations, not application writes.
4. **No request-path dependency.** If the Fabric is down, ClouDonna still
   produces a recommendation. History becomes unavailable; deciding does not.
5. **Projection is explicit and versioned.** Every Iceberg row carries the
   `scoring_engine_version` / `knowledge_base_version` / `schema_version` it
   was produced under — the stamps `decision_versions` already records.

---

## 4. Logical Iceberg model — and where the brief's list is wrong

The brief proposes 39 tables across six namespaces and invites challenge.
Challenging it is the work, so: **24 of the 39 are right, 11 should not exist
as Iceberg tables, and 4 should be deferred.**

### 4.1 `raw.*` — keep all four

```
raw.vendor_documents        raw.pricing_sources
raw.customer_documents      raw.architecture_sources
```
A landing zone of immutable, hashed, un-parsed source material. Cheap, and
the only way `content_hash` provenance means anything later: you can prove
what a document said because you still have the bytes.

`raw.customer_documents` is tenant-private — see §5.

### 4.2 `core.*` — keep, but they are **historized projections**, not masters

```
core.vendors            core.products         core.capabilities
core.architectures      core.pricing_models   core.claims
core.evidence           core.assumptions
```

Keep all eight, with one renaming of intent: `core.vendors`,
`core.products` and `core.capabilities` are **not** a second copy of the live
catalog. Postgres owns the current row; these are slowly-changing
(valid-from / valid-to) histories, which is the only reason to have them —
"what did we believe about this product in March?" is a Decision Memory
question and it has no answer today.

`core.claims` / `core.evidence` / `core.assumptions` are the analytical
history of the provenance layer that `vendor_evidence` already holds
operationally.

### 4.3 `decision.*` — **collapse eight tables into one**

The brief lists:
```
decision.decisions   decision.options       decision.criteria
decision.scores      decision.recommendations
decision.scenarios   decision.risks         decision.stakeholders
```

Every one of these already exists in Postgres as live, mutable, RLS-protected
operational state: `decisions`, `recommendations`, `decision_scores`,
`decision_frameworks` + `decision_framework_dimensions`, `risks`,
`session_constraints`. Recreating them in Iceberg produces two sources of
truth for the same live fact, which is the specific failure mode §3 rule 2
exists to prevent. Worse, it would be two sources of truth with *different
security models* — one with RLS, one without.

**What is actually needed analytically** is one flattened, append-only fact
table for cross-decision analysis:

```
decision.decision_facts   -- one row per (decision_version, option, criterion)
```

Everything else the brief lists is reachable from
`memory.decision_versions` (§4.4), which already carries the full input,
output, enrichment and evidence references as validated JSON.

**Verdict: 8 tables → 1.** `decision.scenarios` moves to §4.4 as
`memory.scenario_runs`, because a scenario *is* a historical what-if, not
current state.

### 4.4 `memory.*` — keep all five, this is the centre of the design

```
memory.decision_versions      memory.evidence_snapshots
memory.assumption_changes     memory.recommendation_changes
memory.outcomes
```
Plus `memory.scenario_runs`, moved here from `decision.*`.

These are the tables that answer the five historical questions in
`overview.md` §1. `memory.evidence_snapshots` is the load-bearing one: it
pins, by `content_hash`, the exact evidence set a decision was made against,
so "what did we know then" is a lookup and not an argument. See
[`decision-memory.md`](./decision-memory.md).

### 4.5 `economics.*` — keep three, defer one

```
economics.cost_models      keep
economics.commitments      keep
economics.business_value   keep
economics.consumption      DEFER
```

`economics.consumption` requires metered usage telemetry from a customer's
own platforms. No connector exists, none is in scope, and designing a table
for data we have no path to obtain is how schemas rot. Deferred until a real
customer integration exists. The Cost & Value Lab works today on
qualitative exposure bands precisely because this data does not exist — and
the public page says so rather than inventing figures.

### 4.6 `agents.*` — keep three, move two to Postgres

```
agents.agent_runs       keep
agents.agent_findings   keep
agents.tool_calls       keep
agents.conflicts        → Postgres
agents.approvals        → Postgres
```

A conflict between two agents and a pending human approval are both **live
workflow state a person has to act on**. They need RLS, low-latency reads,
notifications and `UPDATE`. That is Postgres' job, and putting them in an
append-only analytical store would mean modelling "approved" as a second
append — a worse version of a status column. Their *history* lands in
`agents.agent_runs` like everything else.

### 4.7 Resulting model

| Namespace | Tables | Change from brief |
|---|---|---|
| `raw` | 4 | — |
| `core` | 8 | intent clarified: histories, not masters |
| `decision` | 1 | −7 (duplicated Postgres state) |
| `memory` | 6 | +1 (`scenario_runs` moved in) |
| `economics` | 3 | −1 deferred |
| `agents` | 3 | −2 (moved to Postgres) |
| **Total** | **25** | from 39 |

Every table carries, without exception: `tenant_id`, `valid_from`,
`recorded_at`, `source_system`, and the three version stamps.

---

## 5. Security and tenancy

**Tenant isolation is not a `WHERE` clause.**

Postgres RLS fails closed: forget the predicate and you get nothing. A
Trino query over a shared Iceberg table fails *open*: forget the predicate
and you get everything. Designing private customer evidence into one global
table with a `tenant_id` column, guarded only by application-added
predicates, would be the single most dangerous thing in this architecture.
So the design does not do that.

### Two classes, physically separated

| | PUBLIC INTELLIGENCE | PRIVATE CUSTOMER INTELLIGENCE |
|---|---|---|
| Examples | Vendor documentation, published pricing, architecture patterns, analyst material | A customer's landscape, contracts, constraints, decisions, uploaded documents |
| Namespace | `public_intel.<namespace>.<table>` | `tenant.<tenant_id>.<namespace>.<table>` |
| Storage | One shared prefix | **One prefix per tenant** |
| Credentials | Read-wide | Per-tenant, scoped to that prefix |
| Catalog grants | Readable by all authenticated principals | Grantable only to that tenant's principal |

Four rules on top:

1. **`tenant_id` on every row anyway.** Defence in depth, and it makes an
   accidental cross-prefix read detectable in audit.
2. **No cross-tenant join.** There is no query path that reads two tenant
   prefixes at once. Benchmarks across customers require an explicit,
   reviewed aggregation job with a minimum-cohort threshold, writing to
   `public_intel`, and only with contractual consent.
3. **Private evidence never becomes public intelligence implicitly.** A fact
   learned from one customer's contract is that customer's, permanently,
   unless a human explicitly promotes it through a reviewed path.
4. **Credentials are vended per query, short-lived**, by the catalog — never
   a long-lived key in the application.

### What the application never holds
Raw LLM prompts and responses, and chain-of-thought. The existing
`decision_versions` comment is explicit that `*_json` columns hold validated
domain payloads only. The Fabric inherits that rule verbatim — see
[`agent-runtime.md`](./agent-runtime.md) §5.

---

## 6. Why Iceberg, Polaris, Trino specifically

**Iceberg** for the table format: snapshot isolation and **time travel as a
primitive** (the product's core question is a point-in-time question),
schema evolution without rewriting data, hidden partitioning, and an open
spec with multiple independent engine implementations — which is what makes
the engine replaceable rather than nominally replaceable.

**Iceberg REST Catalog** as the *interface*, and **Polaris** as one
implementation of it. The distinction matters: the application targets the
REST spec, so Polaris can be replaced by any conforming catalog without an
application change. See [ADR-0003](../adr/0003-iceberg-rest-catalog-abstraction.md).

**Trino** first, because the workload is interactive SQL over history and
Trino does not require a cluster to be warm for a question to be asked.
**Spark optional, later**, only when a batch job genuinely needs it.
Neither appears above the `AnalyticalStore` port.

---

## 7. Future integration boundaries

Each is a named seam with nothing behind it yet:

| Boundary | Shape | Status |
|---|---|---|
| `AnalyticalStore` | §2 | Designed, not implemented |
| Postgres → Iceberg projection | A batch job reading `decision_versions` / `vendor_evidence` and appending snapshots | Designed, not implemented |
| `IntelligenceProvider` | Exists today | **Live** |
| `AgentRuntime` | `agent-runtime.md` §2–3 | Designed, not implemented |
| Customer system connectors | Per-source adapters landing in `raw.customer_documents` | Deferred |
| Vendor source watchers | `vendor_sources` already registers the sources | Schema exists, no ingestion |
| Graph query | An ontology-shaped read port over Iceberg/Postgres | Designed as a port only |

---

## 8. Deferred, with reasons

| Deferred | Why now | What would change it |
|---|---|---|
| Kubernetes | Vercel + managed services carry current load with no orchestration layer to operate | Self-hosted Trino/Polaris with real SLOs |
| Kafka / event streaming | `business_events` + `audit_logs` in Postgres already cover the event volume; a broker is an operational burden with no current consumer | A second real-time consumer of the same event stream |
| Graph database | The EIG is already a *design* with a working relational projection; no query today needs multi-hop traversal that SQL can't serve | Real multi-hop questions ("which decisions depend on evidence that just changed?") at depth > 2 |
| Production Iceberg / Polaris / Trino / Spark | There is no history to query yet. Building the warehouse before the data exists means operating an empty warehouse | First tenant with a year of decision history |
| Customer connectors, crawling, vendor watchers | Each has legal, rate-limit and trust consequences; `vendor_sources` is deliberately populated by reviewed, manual entry today | A reviewed ingestion policy and a real source agreement |
| Full agent swarm | Two agent interfaces plus a run record is enough to prove the contract. Thirteen agents is thirteen ways to be wrong at once | The Evidence Agent demonstrably working end to end |
| New authentication system | Supabase auth + RLS works, is tested, and is the thing most likely to break a product if replaced speculatively | Nothing currently foreseen |
