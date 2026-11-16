# ADR-0002 — Keep Supabase/Postgres as the operational transactional store

**Status:** Accepted. **In force today** — this ratifies existing behaviour
rather than proposing a change.

**Date:** 2026-11-16

## Context

Introducing an analytical layer (ADR-0001) raises the obvious question of
whether it should absorb the operational database too. It should not, and
writing down why prevents the question being re-litigated as the Fabric grows.

Postgres today holds ~60 tables: tenancy and auth, the global vendor and
taxonomy catalog, the decision engine's operational tables, `decision_versions`
(append-only), `audit_logs`, `business_events`, billing and `inquiries` — all
under Row Level Security with `organization_id` denormalized onto tenant
tables for single-join policies.

## Decision

Supabase/Postgres remains the system of record for everything currently true:
users, organizations, auth, permissions, sessions, current workflow state,
comments, notifications, transactional application data, operational
decisions, and the live global catalog. **Nothing migrates out of it.**

Iceberg becomes the system of record for everything that was *ever* true.
The boundary is current state vs. history, not small vs. big.

## Consequences

**Gained.** RLS that **fails closed** stays the enforcement mechanism for
every access path a user can reach — the single most valuable security
property in the system, and the one the analytical layer cannot replicate.
Foreign keys, transactions and single-row latency stay where the request path
needs them. And the migration risk of this entire sprint is zero, because no
existing data moves.

**Cost.** Two stores means a projection step and the possibility of skew
between them. Mitigated by one hard rule: **one writer per fact** — a fact is
authored in Postgres and projected into Iceberg, or authored in Iceberg and
never contradicted by Postgres, never both.

**Explicitly rejected.** Recreating `decisions`, `recommendations`,
`decision_scores`, `risks` or `session_constraints` as live Iceberg tables.
The brief's proposed `decision.*` namespace would have done exactly that, and
it is why architecture.md §4.3 collapses eight tables into one: two sources
of truth for the same live fact is bad, and two sources of truth with
*different security models* is worse.

## When to revisit

If Postgres becomes the bottleneck for analytical reads, the answer is to
move more *history* out, not to move *state* in.
