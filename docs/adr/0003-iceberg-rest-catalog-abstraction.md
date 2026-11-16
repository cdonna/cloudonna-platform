# ADR-0003 — Target the Iceberg REST Catalog spec, not a catalog product

**Status:** Accepted as architectural direction. **Not deployed.** No catalog
is running.

**Date:** 2026-11-16

## Context

Iceberg tables need a catalog: the component that resolves a table name to
its current metadata pointer, and that commits atomic metadata swaps. The
catalog is also the natural place for namespace-level access control, which
matters a great deal here because catalog grants are part of how tenant
isolation is enforced (`architecture.md` §5).

Options:

1. **Hive Metastore.** Ubiquitous, and a legacy operational burden — Thrift,
   a backing database, no modern access-control story.
2. **AWS Glue Catalog.** Managed and convenient; couples the architecture to
   one cloud.
3. **A specific product's catalog** (e.g. Unity Catalog). Strong features,
   strongest coupling.
4. **The Iceberg REST Catalog specification**, with a conforming
   implementation behind it — Apache Polaris being the obvious open candidate.

## Decision

The application targets the **Iceberg REST Catalog specification**. Apache
Polaris is the intended first implementation, and it is an implementation
detail.

Concretely: no application code names Polaris. The `AnalyticalStore` port
(`architecture.md` §2) is the only interface that knows a catalog exists, and
it speaks the REST spec.

## Consequences

**Gained.** The catalog becomes replaceable by any conforming
implementation — which is the whole point, and which is only true if the spec
rather than the product is the dependency. Credential vending is part of the
REST spec, so per-query, short-lived, prefix-scoped credentials are available
instead of a long-lived key in the application. Multiple engines can share
one catalog without engine-specific metadata handling, which is what makes
ADR-0006 real rather than aspirational.

**Cost.** The REST spec is narrower than any individual product's catalog
API. Features outside it are unavailable by construction — accepted
deliberately: a feature used outside the spec is a coupling that would make
the replaceability claim false.

**Dependency.** Polaris is a comparatively young project. The mitigation is
precisely this ADR: because the dependency is the spec, Polaris maturing
slowly or being replaced is a deployment change, not an architecture change.

## Note on terminology

"Use Apache Polaris" and "use an Iceberg REST Catalog abstraction" are
sometimes stated as two separate decisions. They are one decision with a
direction: the abstraction is the commitment, the product is the current
choice behind it.
