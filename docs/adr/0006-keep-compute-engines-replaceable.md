# ADR-0006 — Keep compute engines replaceable behind one port

**Status:** Accepted as architectural direction. **Not deployed.** No engine
is running.

**Date:** 2026-11-16

## Context

Open storage (ADR-0001) and an open catalog spec (ADR-0003) make engine
replaceability *possible*. They do not make it *true*: a codebase that
reaches into engine-specific SQL, functions or DDL is coupled regardless of
how open the format underneath is. Replaceability is a property of the
application, not of the file format.

This matters beyond engineering taste. ClouDonna's Decision Skills include
"single vendor vs. best-of-breed" and "build vs. buy," and the public
position is vendor neutrality. An architecture that quietly welds itself to
one query engine would be advising on a discipline it does not practise.

## Decision

Exactly one interface knows that a compute engine exists: the
`AnalyticalStore` port (`architecture.md` §2). Above it, no module names
Trino, Spark, or any engine.

Rules:

- No engine-specific SQL dialect, UDF or hint above the port.
- No engine-specific DDL anywhere: table creation and evolution go through
  the Iceberg REST catalog.
- Queries are expressed as a structured `AnalyticalQuery` (tenant, namespace,
  table, select, predicates, limit), not as SQL strings assembled upstream.
- `tenantId` is a required field on every query. There is no ambient
  "current tenant" state to forget.

**Trino first**, because the workload is interactive SQL over history and
Trino does not require a warm cluster for a question to be asked. **Spark
optional, later**, only when a batch job genuinely needs it.

## Consequences

**Gained.** The engine choice stays a deployment decision. Trino and Spark
can coexist against the same catalog without the application knowing. And a
structured query object rather than assembled SQL makes tenant scoping
mechanically checkable: a query without a `tenantId` does not type-check,
let alone run.

**Cost.** The port is narrower than raw SQL, so some analytical work is
harder to express through it, and a genuinely engine-specific optimisation
needs an explicit, reviewed extension rather than an inline exception. This
is the same trade the existing `IntelligenceProvider` boundary already
makes — which is a useful precedent, because that boundary has held and the
codebase is better for it.

**Precedent, not invention.** This is the same pattern used for the LLM
provider (`docs/intelligence/provider-boundaries.md`): one validated
interface, the vendor behind it replaceable, a deterministic fallback when no
provider is configured. Analytical compute gets the same treatment, for the
same reason.
