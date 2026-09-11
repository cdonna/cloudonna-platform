# The ClouDonna Evolution

**Status:** Product strategy. Written from the vantage point of "why does
each stage exist," not "what features are in each stage" — features are
already itemized elsewhere in this repository's release notes and sprint
docs. This document is the argument connecting them.

## The arc

```
Software Comparison
   ↓
Recommendation Engine
   ↓
Decision Intelligence
   ↓
Enterprise Decision Platform
   ↓
System of Record for Enterprise Technology Decisions
```

Each arrow represents a real limitation of the stage before it — not a
marketing upgrade, a structural one. This document explains what breaks
at each stage if you stop there, and what has to be true for the next
stage to be real rather than aspirational.

---

## Stage 1 → Stage 2: Software Comparison → Recommendation Engine

**What Stage 1 was:** the original Public Alpha positioning — an
ecosystem of named products (Donna Compare, Donna Marketplace, Donna
Intelligence) organized around what a visitor could *look at*: a
comparison matrix, a catalog, a benchmark. This is where nearly every
enterprise software discovery product still lives today, ClouDonna's own
earliest form included.

**Why it breaks:** comparison answers "how do these differ" but never
"which one, for me, and why." A side-by-side matrix with fifteen rows and
four columns is not a decision — it's homework the user still has to do
themselves. The more thorough the comparison, the more homework. Depth
and usefulness diverge instead of reinforcing each other.

**What had to be true to move on:** a real, deterministic, defensible way
to go from "here are the differences" to "here is the answer, and here is
exactly why" — without that mechanism, "recommendation" is just an
opinion wearing a comparison matrix's credibility. This is what Sprint 2
and Sprint 3 built: Donna Score, ten weighted dimensions, a real ranking
with per-dimension evidence.

**What Stage 2 actually is:** the deterministic scoring engine —
`scoring/engine.ts`, `SCORE_WEIGHTS`, `RankedPlatform[]`. A single
authoritative number per platform, computed the same way every time, with
evidence attached. The comparison matrix didn't disappear (it's still
there, Sprint 3) — it stopped being the product's center of gravity and
became a supporting view underneath a real recommendation.

---

## Stage 2 → Stage 3: Recommendation Engine → Decision Intelligence

**What Stage 2 was:** a number and a ranking, explainable in the narrow
sense (evidence strings existed) but not in the sense a board member
actually needs — no trade-off framing, no challenge questions, no
explicit missing-information callout, no confidence explanation beyond a
number.

**Why it breaks:** a score without an argument is still not something a
decision-maker can defend to a skeptical stakeholder. "94%" is a number.
"94%, because of these four specific things, with these two risks to
validate, and here's what we don't yet know" is a decision someone can
stand behind in a room. The gap between those two is exactly the gap a
recommendation engine can't close by getting more accurate — it needs a
different kind of output, not a better score.

**What had to be true to move on:** a way to add that argument *without*
letting it become a second, independent source of truth that could drift
from the actual computed evidence — the exact risk any naive "add an AI
summary" feature runs into. This is what Sprint 5.1 built: a narrative
layer (`IntelligenceEnrichment`) that is validated against the evidence
package that produced it, structurally incapable of holding a score, and
that degrades to the deterministic result the instant it can't be
verified.

**What Stage 3 actually is:** `donna-explain.md`'s eight-question
standard, backed by real fields, most of them already populated as of
Sprint 5.1. Decision Intelligence is not "we added AI" — it's "every
recommendation now carries a defensible argument, and the argument can
never outrun the evidence."

---

## Stage 3 → Stage 4: Decision Intelligence → Enterprise Decision Platform

**What Stage 3 was:** an excellent single assessment — one workshop, one
session, one report, run by one person, with no memory of who else in the
organization ran a similar assessment last quarter, and no structural
reason technology gets discussed before the business case does (the
wizard *can* be filled out goal-first, but nothing stops a rushed user
from treating it as "which platform is best," full stop).

**Why it breaks:** enterprise decisions are not made by one person in one
sitting. They involve a project, a team, prior context, and — critically
— an organization's standing architecture posture that shouldn't be
re-litigated from scratch every time someone opens Donna. A tool that
resets to zero context every session doesn't scale past the first
impressed user; it stays a personal utility, never becomes the place a
company works.

**What had to be true to move on:** real tenancy (organizations,
workspaces, projects — Sprint 4's multi-tenant schema, RLS-isolated) and a
flow that is *structurally* business-first, not just capable of being
used that way (`donna-workshop-mode.md`'s ten-stage journey, where vendor
names are unreachable before business context). Both exist now, one as
shipped infrastructure and one as an approved architecture.

**What Stage 4 actually is:** the Discovery Center, the Workshop Mode
redesign, and the tenancy model, combined — a place teams work inside,
not a form they fill out once. This is the stage this document's own
sprint belongs to: the conceptual redesign in `donna-workshop-mode.md` is
Stage 4's defining move, not a feature addition to Stage 3.

---

## Stage 4 → Stage 5: Enterprise Decision Platform → System of Record

**What Stage 4 is, honestly, at the time of writing:** a platform capable
of running many well-structured decision workshops for many teams — and
forgetting every one of them the moment the session ends, exactly like
Stage 1 through 3 did. Nothing yet persists. This is not a criticism of
the work done so far; it's the actual, stated boundary of Sprint 5.1
("no persistence yet, by design, because auth doesn't exist to scope it
safely").

**Why it breaks:** a platform you visit to get an answer is a tool. A
system of record is something an organization would notice losing —
something that holds institutional memory a spreadsheet or a slide deck
currently holds badly. The difference isn't a feature; it's whether the
thing survives the person who used it moving to a different team. Every
enterprise system that has ever become genuinely hard to replace (a CRM,
an ERP, a ticketing system) became hard to replace because of the history
inside it, not because of what it does on a single, stateless run.

**What has to be true to get there:** Decision Replay, Decision Timeline,
Decision Evolution, Lessons Learned, and Business Outcome Tracking
(`decision-memory.md`) — real persistence built on the append-only
`decision_reports`/`decision_scores` design Sprint 4 already anticipated,
plus, further out, a genuine outcome-tracking discipline that closes the
loop between "we recommended this" and "did it actually work." This is
the least-built stage in this entire arc, named honestly as a proposal,
not a shipped capability.

**What Stage 5 actually is, when real:** the point where deleting
ClouDonna doesn't just lose a tool — it loses the organization's record of
why it made the technology decisions it made, what it expected, and
whether reality agreed. That's the only kind of product moat this company
should be trying to build, because it's the only kind that can't be
cloned by a competitor with a better UI in six months.

---

## Why this is one arc, not five products

Every stage in this document is the *same* engine, with a widening
circle of responsibility, not five separate rebuilds:

- The deterministic scoring engine built at Stage 2 is unchanged at Stage
  5 — still the sole source of numbers.
- The neutrality guarantees built at Stage 2 are load-bearing at every
  later stage, including ones (Decision Memory) that don't exist yet.
- The explainability standard from Stage 3 is what a Stage 5 "lessons
  learned" entry would eventually be checked against — did the
  explanation given at decision time hold up against what actually
  happened.

A company that rebuilt its core engine at every stage would have shipped
five different products under one name. ClouDonna's actual differentiator
is that it hasn't — Article IX and Article X of `company-constitution.md`
exist specifically to keep it that way as the platform grows.
