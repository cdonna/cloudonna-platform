# Decision Memory

**Status:** Product design proposal. Unlike `donna-explain.md` and
`donna-trust-framework.md`, most of what this document describes is
**not yet built** — this is the honest exception in this documentation
set, and it's marked that way throughout rather than blurred.

## Why decision memory is the difference between a tool and a system of record

A tool that produces one recommendation and forgets it the moment the
session ends is, at best, a very good calculator. A system of record
remembers what was decided, why, under what conditions, and — critically —
whether it turned out to be right. This is the single mechanism that
makes the last step of `product-evolution.md`'s arc ("System of Record for
Enterprise Technology Decisions") more than an aspirational label. Without
it, ClouDonna is a very well-explained recommendation engine and nothing
more.

## What already exists to build on

| Concept | Existing foundation | Gap |
|---|---|---|
| Persisting a decision | `decision_reports` table (Sprint 4) — explicitly designed as an **append-only history**, not a single mutable "current report" field | No write path exists yet — Sprint 5.1 is fully in-memory, by design (no auth to scope writes safely) |
| Grouping decisions | `decision_sessions` → `projects` → `workspaces` → `organizations` hierarchy (Sprint 4) | No UI; nothing populates it |
| Versioned methodology | `decision_frameworks` with a `version` column (Sprint 4) — a framework's weights can change over time without losing what a past decision was actually scored against, because `decision_scores.weight` is copied at generation time, not looked up live | Solid foundation, unused |
| Who changed what | `audit_logs` (Sprint 4) — structured, metadata-only, no prose | Not wired to anything yet |

The database foundation, in other words, was already built with decision
memory in mind — `decision_reports`' append-only design and
`decision_scores`' weight-copying behavior are both decisions that make
no sense for a single-shot tool and make complete sense for a system that
expects to be asked "what did we decide, and why, six months ago."

## The five capabilities

### 1. Decision Replay

**What it is:** viewing a past `DecisionReport` exactly as it was
generated — same scores, same evidence, same narrative (if any),
unaffected by later changes to the vendor catalog, scoring weights, or
Donna's own model.

**Why it needs the database boundary as designed:** `decision_scores.weight`
is copied at generation time specifically so this is possible — see the
Sprint 4 schema's own comment on that column. Replay is not "re-run the
assessment" (which could produce a different answer); it's "show me
exactly what was shown then."

**Not yet built:** the read path, and any UI at all. The write path is
also unbuilt (Sprint 5.1 is in-memory-only).

### 2. Decision Timeline

**What it is:** a chronological view of every decision session within a
project or organization — not just the latest one.

**Why it matters:** most enterprise technology decisions are not one
event; they're a sequence (an initial platform choice, a scope-narrowing
six months later, a vendor renewal decision two years after that). A
timeline is what lets a new stakeholder joining a project understand the
decision history without archaeology through old emails and slide decks.

**Foundation:** `decision_sessions.project_id` plus `created_at` already
gives this a natural sort order. Genuinely new UI work; no new schema
needed.

### 3. Decision Evolution

**What it is:** a direct comparison between two decision sessions for the
same underlying question — "here's what we recommended in March, here's
what changed by September, and here's specifically why the answer moved
(new constraint, updated catalog, different framework weighting)."

**Why this is hard, honestly:** this is the one capability in this
document that needs real new logic, not just new UI over existing data.
Diffing two `DecisionReport`s meaningfully (not just "the JSON is
different") means diffing at the level of *which input changed* and
*which dimension score moved because of it* — a genuinely new comparison
algorithm, proposed here, not designed in detail. Worth scoping as its
own future sprint once Decision Replay and Timeline exist to build on.

### 4. Lessons Learned

**What it is:** a place to record, after the fact, what actually happened
— "we chose Platform A, implementation took 14 months instead of the
estimated 9, and the governance capability was harder to realize than
expected."

**Why this doesn't fit anywhere in the current schema:** every table
Sprint 4 built describes the *decision*, not what happened *after* it.
This is a deliberate, honest gap, not an oversight — a "lessons learned"
capability implies a feedback loop from real project outcomes back into
the system, which is a different kind of data (subjective, delayed,
provided by humans after the fact) than anything currently modeled.
**Proposed, not designed:** a new table, tentatively `decision_outcomes`
(session-scoped, free-text + a small structured outcome-vs-expected
field), explicitly out of scope for detailed design here.

### 5. Business Outcome Tracking

**What it is:** closing the loop on `donna-workshop-mode.md`'s "Desired
Business Outcomes" stage — did the platform choice actually produce the
stated outcome? Did month-end close actually drop from 9 days to 3?

**Why this is the highest-value, hardest-to-build capability in this
document:** it's the one piece of Decision Memory that turns ClouDonna
from a recommendation record into evidence that *the recommendations
themselves are good* — real outcome data, aggregated over many decisions,
is what would let a future version of Donna Score be validated against
reality rather than just internal consistency. This is a multi-quarter
capability requiring a defined outcome-measurement process, not a
schema change, and is named here as the long-term reason Decision Memory
matters, not a near-term deliverable.

## What this document is not proposing

Not proposed here: automatic outcome detection (e.g. scraping a customer's
systems to check if an outcome was hit), any AI-generated "lessons
learned" summary (this is explicitly human-authored, first-person
reflection — see `company-constitution.md`, "Human Authority"), or a
public/cross-tenant view of any of this (every one of these five
capabilities is strictly organization-scoped, same as everything else in
the Sprint 4 data model).

## Sequencing note

Of the five, only **Decision Replay** and **Decision Timeline** can be
built directly on today's schema once persistence and authentication
exist. **Decision Evolution** needs new comparison logic. **Lessons
Learned** and **Business Outcome Tracking** need new schema and a defined
outcome-capture process respectively. This is not a sprint plan — it's an
honest ordering of "foundation exists" to "foundation doesn't exist yet,"
so that whichever of these gets scoped first isn't scoped as if the
others were equally close.
