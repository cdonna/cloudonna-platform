# Donna Workshop Mode

**Status:** Product architecture and design principles. No code changes in this document.
**Relationship to what exists today:** reframes the existing six-step wizard
(`Company → Landscape → Goals → Constraints → Review → Analysis`, Sprint 2)
and the Sprint 5.1 intelligence pipeline conceptually — around a ten-stage
journey, not a form.

## The one-sentence version

ClouDonna must never feel like a search box that returns a vendor name. It
must feel like sitting down with a senior consultant who won't let you
skip to the answer before the reasoning is on the table.

## Why "workshop," specifically

A comparison site optimizes for speed to an answer. A workshop optimizes
for the *quality of the question* before it optimizes for the answer. The
word is chosen deliberately over "assessment," "wizard," or "questionnaire"
— all three imply the user is being processed by a form. A workshop implies
a facilitator is in the room, thinking alongside the user, and is allowed
to push back.

## The ten-stage flow

```
1. Business Goals
2. Desired Business Outcomes
3. Required Business Capabilities
4. Requirements
5. Constraints
6. Architecture Principles
7. Solution Patterns
8. Technology Patterns
9. Vendor Options
10. Executive Recommendation
```

Three properties define this flow, and all three are testable — a real
build against this design can be checked against them, not just judged by
feel:

1. **Vendor and product names are structurally unreachable before stage 9.**
   Not "discouraged" — unreachable. Nothing earlier in the flow has a slot
   for a product name. This is the same structural-not-instructional
   discipline already used in the scoring engine (a `Trait` can't hold a
   score; an `IntelligenceEnrichment` field can't hold a number) applied
   to the *sequence* of the experience itself.
2. **Every stage's output is the explicit input to the next stage**, never
   skipped, never inferred silently. A user who hasn't stated a Required
   Business Capability shouldn't see Solution Patterns that assume one.
3. **The user can always see which stage they're in and why it comes next.**
   The reasoning-chain UI already shipped on the homepage demo (Web
   Presence Sprint — Goal → Capability → Solution Pattern → Technology
   Pattern → Vendor) is the visual precedent for this at small scale; this
   document extends the same idea to the full ten-stage journey.

### Mapping to what's already built

| Stage | Exists today as | Gap to close |
|---|---|---|
| 1. Business Goals | `GoalsInput.goals` (8 fixed tags) + free text | No explicit "desired outcome" separate from goal |
| 2. Desired Business Outcomes | Not collected | New — see "Desired Outcomes are not Goals" below |
| 3. Required Business Capabilities | Implicit in scoring (`capabilities` taxonomy, Sprint 4 schema) | Not surfaced to the user as its own stage yet |
| 4. Requirements | `requirements` table (Sprint 4), no UI | Not collected in the wizard at all yet |
| 5. Constraints | `ConstraintsInput` (budget, timeline, risk, etc.) | Already solid |
| 6. Architecture Principles | Not modeled anywhere yet | New concept — see below |
| 7. Solution Patterns | `architecture_patterns`/`technology_patterns` (Sprint 4 schema, unwired) | Schema exists, no UI, no matching logic |
| 8. Technology Patterns | Same as above | Same as above |
| 9. Vendor Options | `RankedPlatform[]` (Sprint 3 scoring engine) | Already solid — this is what exists most completely |
| 10. Executive Recommendation | `DecisionOutput`/`DecisionReport` | Already solid |

Reading this table honestly: **stages 9 and 10 are the most mature part of
the product, and stages 2, 4, and 6 barely exist.** That asymmetry is
exactly the problem this document exists to name. ClouDonna today is very
good at the last 20% of a workshop and has almost nothing for the first
50%. Closing that gap — not adding more vendor-comparison polish — is the
actual product work implied by "Enterprise Decision Workshop."

### Desired Outcomes are not Goals

A goal is a category ("Modernization," "Cost Reduction" — today's
`GoalTag` enum). An outcome is a measurable business result ("reduce
month-end close from 9 days to 3," "cut integration maintenance headcount
by half"). The distinction matters because it's the difference between
Donna asking "what do you want to work on" and Donna asking "how will you
know this worked" — and the second question is what makes Business
Outcome Tracking (`decision-memory.md`) possible later. A goal without a
stated outcome can't be checked against reality after the fact; an outcome
can.

### Architecture Principles is new, and deliberately thin

Not "Architecture Options" — *Principles*. Before naming a pattern
("Centralized Governed Data Foundation") or a technology ("lakehouse with
integrated ML"), the workshop should surface the handful of standing
constraints that shape everything downstream: build vs. buy posture,
single-cloud vs. multi-cloud tolerance, centralize vs. federate governance,
buy-for-scale vs. buy-for-speed. These are usually *already decided*
somewhere in the organization (an architecture review board, a CTO's
standing position) — the workshop's job is to surface and respect them,
not invent new ones. This stage should be short: 3-5 questions, not a
questionnaire of its own.

## Facilitator mindset

A form collects data. A facilitator does three things a form does not:

1. **Asks a clarifying question when an answer is ambiguous**, rather than
   silently picking a default. Today's wizard silently proceeds with
   "Other / None" when a field isn't filled — that's a form's behavior.
   A facilitator would ask "you selected no data warehouse — is that
   because there genuinely isn't one, or because it's not listed?"
2. **Names the assumption out loud** rather than burying it in scoring
   logic. The deterministic engine already does this partially
   (`AssumptionItem[]` in `DecisionOutput`) — the workshop framing means
   assumptions should be surfaced *during* the flow, not only in the final
   report, so the user can correct one before it propagates.
3. **Is allowed to say "I don't have enough to go on yet"** rather than
   forcing a recommendation. This already exists in embryonic form — the
   low-signal branch in `buildExecutiveSummary` (Sprint 2) and the
   `knownInformationGaps`/`confidenceExplanation` fields (Sprint 5.1) are
   exactly this instinct, expressed today only in the final report. A true
   facilitator would say it earlier, mid-workshop, not just caveat the
   ending.

What a facilitator explicitly does **not** do: rush, oversell, or fill a
silence with a vendor name. Every one of the neutrality mechanisms already
built (no organization_id on vendor tables, no vendor write access,
weighted deterministic scoring) protects the *outcome* from bias. Workshop
Mode is the same discipline applied to *pacing* — protecting the
*process* from being rushed toward an outcome.

## Information gathering

Three information-gathering postures, one per zone of the flow:

- **Stages 1-5 (Business):** structured selection plus free text, same
  pattern as today's wizard. Low friction, mostly closed-form. The
  facilitator's job here is completeness-checking, not challenge — this
  is where the workshop is closest to today's form.
- **Stage 6 (Architecture Principles):** short, closed-form, few
  questions, explicitly optional to skip with a stated default ("assume
  no strong architectural preference") rather than blocking progress.
- **Stages 7-9 (Patterns and Vendors):** no user input at all — this is
  where the deterministic engine and evidence retrieval do the work. The
  user is a reader here, not a respondent. This asymmetry (heavy input
  early, zero input late) is itself the tell that the product has moved
  from "form" to "workshop": the system earns the right to go quiet and
  do the reasoning once it has enough to reason with.

## Reasoning stages

Stages 6 through 9 are where "technology recommendations are an outcome"
either holds or breaks. The reasoning must be **visibly staged**, not
computed all at once and revealed as a single block:

```
Architecture Principles (user input)
   → Solution Patterns (deterministic match against principles + capabilities)
      → Technology Patterns (deterministic match against solution patterns)
         → Vendor Options (deterministic scoring — today's Donna Score v2)
```

Each arrow is a real, inspectable transformation — never a single opaque
jump from "here's what you told me" to "here's the vendor." The
reasoning-chain UI pattern from the homepage demo is the right visual
precedent to extend across all four stages, not just the last one.

## Recommendation timing

The Executive Recommendation (stage 10) is the only stage where a specific
product name is allowed to appear as a *conclusion*. Product names may
appear earlier only as *evidence* — e.g. a Solution Pattern's description
referencing "platforms like X typically implement this pattern" is
acceptable as illustrative context; a Solution Pattern *recommending* X is
not. This is a fine but real distinction, and it's the same one already
drawn correctly in `docs/intelligence/provider-boundaries.md`: narration
of a fact is fine, a conclusion is earned only at the end of the chain.

## Explainability

See `docs/product/donna-explain.md`. Workshop Mode and Explainability are
two sides of one requirement: a workshop that can't explain its own
reasoning isn't a workshop, it's a form with better pacing.
