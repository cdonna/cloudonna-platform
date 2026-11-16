# ADR-0001 — Apache Iceberg as the long-term analytical table format

**Status:** Accepted as architectural direction. **Not deployed.** No
Iceberg table, catalog or cluster exists; this records the format choice so
that the schemas designed in `docs/intelligence-fabric/` have a target.

**Date:** 2026-11-16

## Context

ClouDonna needs to answer historical questions it cannot answer today: what
evidence existed when a decision was made, what has changed since, and
whether a recommendation would still hold. These require large, append-only,
time-ordered data that is cheap to retain for years and cheap to scan
analytically — a different access pattern from the single-row,
transactional, RLS-protected reads Postgres serves well.

Options considered:

1. **Keep everything in Postgres.** Simplest. History grows without bound in
   the same database that serves the request path; point-in-time queries
   become hand-rolled temporal SQL; retention and vacuum pressure land on the
   operational store.
2. **A proprietary warehouse** (Snowflake, BigQuery, Databricks-only). Strong
   tooling, fast to start. The data model becomes the vendor's, and querying
   it elsewhere means exporting it. For a product whose public position is
   vendor neutrality and whose Decision Skills include "single vendor vs.
   best-of-breed", that is an uncomfortable dependency to take on silently.
3. **Plain Parquet on object storage.** Cheap and open. No snapshot
   isolation, no schema evolution, no time travel — all three of which this
   use case needs specifically.
4. **Apache Iceberg on object storage.** Open spec, multiple independent
   engine implementations, snapshot isolation, time travel as a primitive,
   schema evolution without rewriting data, hidden partitioning.

## Decision

Apache Iceberg is the long-term analytical table format. Data lives in object
storage; tables are Iceberg tables; the logical model is
`docs/intelligence-fabric/architecture.md` §4.

## Consequences

**Gained.** Time travel is a first-class operation, which matters because the
product's central question ("would this still hold?") *is* a point-in-time
question — `queryAsOf` is a feature of the format rather than something to
build. Schema evolution is safe, which matters for an evidence model expected
to change. The format is open, so the engine choice stays reversible
(ADR-0006).

**Cost.** A second storage system to understand, with a maintenance surface
Postgres does not have — compaction, snapshot expiry, orphan file cleanup.
Mitigated by it being strictly off the request path: if the Fabric is
unavailable, ClouDonna still produces recommendations (architecture.md §3
rule 4), so this is a maintenance burden rather than an availability risk.

**Accepted risk.** Iceberg with Trino does not have an equivalent of
Postgres RLS. A missing predicate in Postgres returns nothing; in Trino it
can return everything. This is why private tenant evidence is physically
separated by storage prefix and catalog grant rather than filtered by a
`tenant_id` column (architecture.md §5). Treating RLS as available here
would be the dangerous mistake.

## Alternatives rejected, and when to revisit

Option 1 if history stays small enough that Postgres never notices — revisit
if the first year of production history is measured in megabytes. Option 2 if
analytical tooling velocity ever outweighs format neutrality; the Iceberg
model is loadable into any of them, so this stays reversible. Option 3 is
rejected outright: it lacks the three properties the use case needs.
