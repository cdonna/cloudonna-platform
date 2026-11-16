# Architecture Decision Records

One file per decision, numbered, append-only in spirit: a superseded ADR is
marked **Superseded by ADR-NNNN** rather than deleted, because the reasoning
that was wrong is part of the record.

**Status vocabulary**

| Status | Meaning |
|---|---|
| Proposed | Written, not yet agreed |
| **Accepted** | Agreed as the architectural direction |
| Superseded | Replaced; the replacement is named |

**Accepted is not "shipped."** Every ADR below is an architectural
direction. None of them asserts that the thing described is deployed,
provisioned, or production-ready; where that distinction matters, the ADR
says so under *Status*.

| ADR | Decision | Status |
|---|---|---|
| [0001](./0001-apache-iceberg-as-analytical-table-format.md) | Apache Iceberg as the long-term analytical table format | Accepted (design) |
| [0002](./0002-keep-supabase-postgres-as-operational-store.md) | Keep Supabase/Postgres as the operational transactional store | Accepted (in force today) |
| [0003](./0003-iceberg-rest-catalog-abstraction.md) | Target the Iceberg REST Catalog spec, not a catalog product | Accepted (design) |
| [0004](./0004-separate-evidence-from-ai-interpretation.md) | Separate evidence from AI interpretation structurally | Accepted (partly in force today) |
| [0005](./0005-immutable-decision-memory-snapshots.md) | Preserve immutable Decision Memory snapshots | Accepted (in force today) |
| [0006](./0006-keep-compute-engines-replaceable.md) | Keep compute engines replaceable behind one port | Accepted (design) |

Design context for all six: [`../intelligence-fabric/`](../intelligence-fabric/).
