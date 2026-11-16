# ClouDonna Documentation

This directory contains all product, architecture and business documentation.

## Sections

- Product
- UX
- Architecture
- Data Model
- API
- AI
- Security
- Infrastructure

## Architecture entry points

Read in this order when picking up the platform architecture:

1. [`platform/enterprise-intelligence-graph.md`](./platform/enterprise-intelligence-graph.md)
   — the Enterprise Intelligence Graph. **The source of truth for what
   ClouDonna models.** Nodes and semantically-named relationships, designed
   before any table existed.
2. [`platform/database-architecture.md`](./platform/database-architecture.md)
   — the relational projection of that graph into `supabase/migrations/`.
3. [`intelligence/`](./intelligence/) — the Donna intelligence layer as
   built: the provider boundary, the evidence package, prompt architecture,
   the fallback and failure model, security and privacy.
4. [`intelligence-fabric/`](./intelligence-fabric/) — the **design** of the
   long-term analytical foundation (Apache Iceberg, an Iceberg REST catalog,
   Trino) alongside Supabase/Postgres, plus the enterprise ontology, the
   typed evidence model, Decision Memory replay, and the agent runtime.
   Nothing in that directory is deployed.
5. [`adr/`](./adr/) — Architecture Decision Records: the six decisions
   behind the Intelligence Fabric, each with its alternatives and its costs.

## Design system

[`design/`](./design/) is the design constitution. Note that `design/`
documents 01–10 describe the earlier "Project NOVA — Deep Space" dark
material system; the public product now runs on the warm-paper editorial
register implemented in `apps/web/src/app/globals.css`, whose own header
block is authoritative for the current token system until these documents
are revised.
