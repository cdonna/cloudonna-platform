# Product Strategy: The Five-System Model

**Note on scope:** the manifesto and existing roadmap (`docs/manifesto/cloudonna-manifesto-v1.md`, `docs/roadmap/01-product-principles.md`) define four systems — Intelligence, Record, Trust, Learning. This document adds a fifth, **System of Action**, at this sprint's explicit direction. It is defined narrowly and deliberately below, in a way that does not contradict the manifesto's "not an autonomous decision maker" commitment — action in this system means *structured, trackable, human-executed* follow-through, and later, *bounded, human-approved* agent assistance (Sprint 8), never autonomous execution. Reconciling this fifth system into the manifesto itself is a founder decision, not made unilaterally here — see `14-founder-decisions.md`.

## System of Intelligence

**Customer problem:** "I need a defensible, evidence-based answer to which option is right for us — not a vendor's pitch, not an analyst's generic ranking, not an AI's confident-sounding guess."

**Product capabilities:** the deterministic Donna Score v2 engine (10 platforms, 10 weighted dimensions, live today); an AI narrative layer that explains but never computes a score (Sprint 5, live today); confidence decomposition and sensitivity analysis (designed, `docs/sprint-6/23-24`, not built).

**Proprietary assets:** the scoring methodology itself (weights, dimension model) and, once built, the structured knowledge graph the engine reasons over instead of a hardcoded catalog.

**Moat contribution:** weak alone. A scoring formula and a prompt are both copyable in isolation. This system's real contribution to the moat is that it's the *anchor* the other four systems attach proprietary data to — see `04-decision-intelligence-moat.md`.

**Dependencies:** none upstream — this is the foundation everything else is built on.

**Non-goals:** becoming a general-purpose AI assistant; answering questions outside the enterprise-decision domain; letting the AI narrative layer influence the score, ever.

## System of Record

**Customer problem:** "The reasoning behind our last platform decision left the company when the person who made it did. I need this decision to still make sense to my successor in three years."

**Product capabilities:** explicit, authenticated save (implemented, not yet approved/deployed — `docs/roadmap/03-sprint-6-1-auth-and-save.md`); immutable, append-only versioning (implemented at the schema level; version history UI implemented as a narrower slice this sprint — see `docs/roadmap/sprint-6.2.md`); human-readable decision IDs; full provenance (engine version, knowledge-base version) on every saved record.

**Proprietary assets:** the actual corpus of real decisions, once real customers are saving real ones — today, zero. This is the single most important row in this document to not romanticize: the System of Record is architecturally real and functionally empty.

**Moat contribution:** medium today (the architecture is a genuine, hard-to-copy discipline — see `04`), **compounding** once populated with real customer decisions, because a competitor starting later can copy the schema in a week but cannot copy three years of decision history.

**Dependencies:** System of Intelligence must exist first (nothing to record without a recommendation).

**Non-goals:** storing raw prompts or raw AI provider responses (structurally impossible today, by design); editable history of any kind, ever.

## System of Trust

**Customer problem:** "I need to know this recommendation wasn't influenced by who paid for placement, that only the right people in my company can see it, and that no one — including ClouDonna — quietly rewrote it after the fact."

**Product capabilities:** tenant isolation via RLS (implemented, verified by code review, **not yet verified against a live Postgres instance** — a real, disclosed gap, not a completed capability); structural vendor-neutrality (the scoring engine has no field a commercial relationship could occupy — true since Sprint 3); disclosure of AI-generated content versus deterministic output; immutability enforced at the database level, not by convention.

**Proprietary assets:** none directly — Trust is not itself a data asset. It is the precondition that makes every other system's assets *usable* commercially. A knowledge graph or a decision history nobody trusts is worthless regardless of its size.

**Moat contribution:** medium, and asymmetric — trust is slow and expensive to build, and a single public breach of vendor neutrality or a single tenant-isolation failure would cost far more than years of careful operation earned. Trust behaves like a moat that takes years to fill and one incident to drain.

**Dependencies:** cuts across all other systems; is not a stage, it's a constraint every other system must satisfy continuously.

**Non-goals:** compliance theater (no GDPR or SOC 2 claim is made anywhere in this codebase today, and none should be implied commercially until it's actually true — `docs/sprint-6/08-security.md`).

## System of Learning

**Customer problem:** "Tell me whether decisions like this one actually worked — not just whether the reasoning sounded good at the time."

**Product capabilities:** none live. Fully designed (`docs/sprint-6/25-outcome-intelligence.md`, `docs/roadmap/09-outcome-intelligence.md`), zero lines of implementation.

**Proprietary assets:** outcome data linked to decisions — the single hardest-to-copy asset in the entire platform, because it requires real customers, real time elapsed, and real honesty about what happened, none of which a competitor can shortcut by writing better code.

**Moat contribution:** the **strongest long-run compounding asset the company has**, and also the furthest away. This is a three-plus-year asset, not a this-year one — see `04-decision-intelligence-moat.md`'s flywheel.

**Dependencies:** System of Record (an outcome needs a decision to attach to) and enough elapsed time for outcomes to actually materialize.

**Non-goals — the single most important non-goal in this entire document:** outcomes automatically retraining or adjusting the deterministic scoring engine. This is a named, explicit, non-negotiable constraint across three separate documents already (`docs/roadmap/09-outcome-intelligence.md`, `docs/sprint-6/25-outcome-intelligence.md`), restated here because it is the constraint most tempting to quietly relax under commercial pressure ("just weight the score slightly by historical success rate" is exactly how deterministic authority erodes one plausible increment at a time).

## System of Action

**Customer problem:** "Now that we've decided, what do we actually do next — and can something trustworthy help us do it, without taking the decision out of our hands?"

**Product capabilities:** next-steps and workshop recommendations exist today as narrative output of the deterministic engine (Sprint 3). Everything beyond that — implementation tracking, partner matching, bounded agent assistance — is roadmap only (Sprint 7, Sprint 8).

**Proprietary assets:** implementation lessons and partner-performance data, once Sprint 7/8 exist and enough implementations have run through the platform to observe them.

**Moat contribution:** currently negligible (almost nothing built); potentially significant later, but also the system with the highest risk of compromising System of Trust if built carelessly — see "Where monetization could destroy trust" in the critical review.

**Dependencies:** System of Intelligence, Record, and Trust must all be solid first. Sprint 7 (marketplace) is explicitly blocked on Sprint 6.4 in the existing roadmap for exactly this reason — action without a credible knowledge graph behind it has "no structured answer to point to, only prose" (`docs/roadmap/07-sprint-7-marketplace.md`).

**Non-goals:** autonomous purchasing, autonomous contracting, autonomous customer communication, any irreversible action without explicit human approval — restated from `docs/roadmap/08-sprint-8-agent-orchestration.md`'s own non-negotiable list, because System of Action is precisely the system where "autonomous decision maker" could accidentally get built if this boundary isn't held explicitly.

## How the five systems reinforce one another

```
Intelligence produces a recommendation
    → Record makes it permanent
        → Trust makes the permanent record actually believable
            → Learning checks whether the believed recommendation was right
                → Action turns a trusted, checked recommendation into real-world change
                    → Action's outcomes become new input to Learning
                        → Learning's validated lessons refine Intelligence's knowledge (never its scoring formula)
```

The loop closes back into Intelligence's *knowledge* (the evidence and facts the engine reasons over), never into Intelligence's *scoring logic* — the same dashed-arrow distinction the existing architecture already draws (`docs/roadmap/01-product-principles.md`'s own diagram). This is what separates a compounding platform from five disconnected features: each system is close to worthless alone (a scoring engine with no memory, a record with no trust, a trust framework with nothing to protect) and increasingly valuable in combination — which is also exactly why a competitor copying any single system in isolation does not reproduce the moat. See `04-decision-intelligence-moat.md`.
