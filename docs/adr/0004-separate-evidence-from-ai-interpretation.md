# ADR-0004 — Separate evidence from AI interpretation structurally

**Status:** Accepted. **Partly in force today** — the decision layer already
enforces it; the storage layer is designed, not built.

**Date:** 2026-11-16

## Context

ClouDonna states publicly, on the Trust Center: *"AI interpretation is never
promoted to verified evidence. It is labeled as interpretation wherever it
appears, it cannot change a score, and it cannot become the source another
claim cites."*

That is a promise about a mechanism. The failure mode it guards against is
specific and well-documented across this product category: a model's
plausible reading of two sources gets stored next to those sources, is later
read as a third source, and compounds. Once it has compounded, the system
cannot distinguish what it observed from what it inferred — and neither can
its users.

A convention ("don't do that") is not sufficient. Conventions erode under
delivery pressure, and the erosion is silent.

## Decision

Evidence and AI interpretation are separated by **three independent
mechanisms**, any one of which would fail alone:

1. **Different relation.** `AGENT_INFERENCE` records cannot participate in
   `Evidence SUPPORTS Claim`. They participate only in
   `AgentInference INTERPRETS Evidence[]`. No edge connects an inference to a
   Claim, so no query that assembles supporting evidence can return one — this
   is enforced by the edge types, not by a filter someone must remember.
2. **Different write path and different type.** Agent output is an
   `AgentFinding`, written to `agents.agent_findings` by the agent runtime.
   Evidence is an `EvidenceRecord`, written by the projection job or a
   reviewed human action. Promotion from finding to evidence is an explicit,
   audited human action — there is no implicit conversion, because the two are
   unrelated types in different tables.
3. **Different visual treatment.** `EvidenceTag` renders `ai-interpretation`
   with no colour of its own and a dashed border, while every real evidence
   type gets a solid, coloured treatment. A reader sees the distinction
   without reading any document.

## Consequences

**Gained.** The published promise is checkable. A reviewer can ask "by what
code path could an inference become a cited source?" and the answer is "none"
rather than "we're careful."

**Cost.** Agent output is less immediately useful: a finding requires a human
to promote it before it strengthens a claim. That is the intended cost — the
alternative is an evidence base that silently cites itself.

**Already in force.** The strongest version of this already ships at the
decision layer: the deterministic engine computes the score, and the
`IntelligenceProvider` only narrates an `EvidencePackage` it had no part in
assembling. `decision_versions` stores validated domain payloads only, never
a raw model response. This ADR extends an existing boundary rather than
introducing a new one.

**Known gap.** `vendor_evidence` currently stores a `fact` and its source in
one row, conflating Claim with Evidence — so two disagreeing sources read as
two independent facts rather than one contested claim. Recorded in
`ontology-v0.1.md` §3 and `evidence-model.md` §5; not fixed this sprint.
