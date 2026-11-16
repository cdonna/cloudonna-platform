# ClouDonna Intelligence Fabric — Overview

**Status:** Architecture design only. Nothing in this directory is deployed,
provisioned, or wired to a running system. No migration, no infrastructure,
no cluster, no credential.

**Scope of this sprint:** the design of the long-term analytical foundation
underneath ClouDonna, plus the agent-runtime and evidence contracts that
foundation has to satisfy. Deliberately *not* in scope: building it. See
[§5 Deliberately deferred](#5-deliberately-deferred).

---

## 1. What this is for

ClouDonna today answers one question well: *given this context, which
platform fits, and why?* The deterministic engine scores, the knowledge
layer assembles evidence, the LLM narrates, and `decision_versions` keeps an
append-only record of what was decided.

The questions it cannot yet answer are all **historical**:

- Why did we make this recommendation?
- What evidence existed at the time?
- Which assumptions were we relying on?
- What has changed since?
- **Would the recommendation still hold today?**

Each of those requires something the operational database is the wrong shape
for: large, immutable, time-ordered history that is cheap to keep forever and
cheap to scan analytically. That is what the Intelligence Fabric is — an
analytical layer *alongside* Supabase/Postgres, not a replacement for it.

> The product claim this enables is already on the public site: "A decision
> is not a document. It is a living asset." The Fabric is what makes that
> claim true rather than aspirational.

## 2. The one-sentence version

**Supabase/Postgres stays the system of record for everything that is
currently true; Apache Iceberg on object storage becomes the system of
record for everything that was *ever* true.**

## 3. Layering

```
                       ClouDonna UX  (apps/web)
                              │
                     Donna Orchestrator          ← agent-runtime.md
                              │
                    Agent Control Plane
                              │
                      Decision Engine            ← exists today, deterministic
                              │
      ┌───────────────┬───────┴────────┬──────────────────┐
  Evidence Graph  Scenario Engine  Decision Memory  Enterprise Ontology
      └───────────────┴───────┬────────┴──────────────────┘
                              │
                    Semantic / Query Layer
                              │
                 Trino  (Spark optional, later)
                              │
                 Apache Polaris  (Iceberg REST Catalog)
                              │
                     Apache Iceberg tables
                              │
                        Object storage
```

Postgres sits beside this whole stack, not under it. The Decision Engine
reads current state from Postgres and history from the Fabric; it never
reaches past the Semantic/Query layer into a specific engine.

## 4. Documents in this set

| Document | Answers |
|---|---|
| [`architecture.md`](./architecture.md) | Component boundaries, the Supabase↔Iceberg split, the logical Iceberg model, tenancy |
| [`ontology-v0.1.md`](./ontology-v0.1.md) | Entities and relationships, and how they map onto what already exists |
| [`evidence-model.md`](./evidence-model.md) | The typed Evidence record, and the hard line between evidence and AI interpretation |
| [`decision-memory.md`](./decision-memory.md) | Immutable snapshots, and how "would this still hold?" is computed rather than guessed |
| [`agent-runtime.md`](./agent-runtime.md) | Orchestrator and Evidence Agent interfaces, the `AgentRun` record, what is never persisted |

Architecture Decision Records for the six choices behind all of the above
live in [`../adr/`](../adr/).

## 5. Deliberately deferred

Not built, not provisioned, not designed beyond a named seam in this sprint:

Kubernetes · Kafka or any event-streaming backbone · a graph database ·
a production Iceberg cluster · a production Polaris deployment · a production
Trino or Spark deployment · customer system connectors · web crawling ·
automated vendor watchers · the full agent swarm · any new authentication
system.

Each is listed in [`architecture.md` §8](./architecture.md#8-deferred-with-reasons)
with the specific reason and the condition that would make it worth building.

## 6. What this must not break

The Fabric is additive. Donna AI, the deterministic Decision Engine, the
existing Decision Memory (`decisions` / `decision_versions`), Supabase auth
and RLS, the OpenAI provider boundary, every existing API route, the
five-locale public site and the existing test suite all keep working
unchanged, because none of them acquire a dependency on anything described
here until it actually exists.
