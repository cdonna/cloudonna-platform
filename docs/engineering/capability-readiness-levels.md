# Capability Readiness Levels (CRL)

**The permanent standard.** Every future capability at ClouDonna is described against this scale, not against "done"/"not done" or a sprint number. Adapted from the same underlying idea as NASA's Technology Readiness Level scale — a discipline for refusing to let "we built something" collapse into "it works," "it's verified," "it's live," and "customers rely on it," which are five different, independently-checkable claims this codebase has already learned (the hard way, more than once this project's history) not to conflate.

## The nine levels

**CRL 0 — Concept.** The capability is named and motivated by a real, specific customer problem. Nothing is designed yet. Exit criteria: a one-paragraph mission statement exists, and it names who needs this and why, not just what it is.

**CRL 1 — Architecture Designed.** A written architecture document exists — data model, trust boundaries, dependencies, non-goals — reviewed against the company's own non-negotiables (`docs/constitution/04-non-negotiables.md`). No code exists. Exit criteria: the design has been challenged, not just written (per this codebase's own "architecture before implementation" practice), and a domain model is named even if not yet implemented.

**CRL 2 — Domain Model Defined.** Core types, schema shape, and function signatures exist, reviewed, possibly stubbed — but not yet implemented with real logic. Exit criteria: someone other than the author could implement against this design without further clarification.

**CRL 3 — Core Logic Implemented.** Pure domain functions and/or schema are built and unit-tested *in isolation* — no live database, no wiring into a route or UI. Exit criteria: the logic has direct test coverage and passes, but has never been exercised through a real request path.

**CRL 4 — Integrated.** Wired end-to-end through the real application — routes, UI, repository layer — against the real (even if not yet executed) schema. All standard quality gates (typecheck, lint, test, build) are green. Exit criteria: a person could use the feature by clicking through the running application, even if the underlying database has never actually run the relevant migration for real.

**CRL 5 — Verified.** Security-reviewed with specific, checkable claims (not general assurance), and — where the capability touches a database — RLS/isolation behavior has been executed and passed against a **live** database instance, not merely designed and code-reviewed. Every known limitation is disclosed explicitly, by name, not implied by silence. Exit criteria: a skeptical outside reviewer, given the verification artifacts, would sign off.

**CRL 6 — Production-Deployed.** Committed, approved by the founder as a discrete checkpoint, and running in a real, monitored production environment against real infrastructure. Exit criteria: the capability is reachable by a real URL, and its failure would be noticed by monitoring, not discovered by a support ticket.

**CRL 7 — Customer-Validated.** At least one real customer or design partner has used the capability on a real task of their own and confirmed, specifically, that it delivered the value it was built for — not a demo reaction, an actual usage outcome captured through the structured learning process (`docs/company/07-customer-learning-system.md`). Exit criteria: a named, dated account of real usage exists, including what didn't work, not just what did.

**CRL 8 — Commercially Proven / Compounding.** The capability is generating real, repeatable value across more than one customer relationship, and is contributing measurably to the compounding moat (`docs/founder/04-moat-playbook.md`) — real accumulated data, real retained usage, not a one-time validation. Exit criteria: the capability would be missed, concretely, if it were removed from a paying or seriously-committed customer's workflow.

## Rules governing how this scale is used

- **A capability's CRL is the level of its least-mature required component, not the level of its most impressive one.** A capability with a beautifully implemented core (CRL 4) and a completely missing differentiating feature (CRL 1) is reported at the lower number, with the breakdown shown — never averaged, never rounded up. This is the same "never a bare number without decomposition" discipline the product itself applies to a Decision Score (`docs/sprint-6/24-confidence-model.md`) — a capability's own maturity claim gets no exemption from the standard it holds the product to.
- **CRL 5 and above require live verification, not code review alone.** This is deliberately the hardest step on the scale, because it's the exact point this codebase has repeatedly gotten stuck at (RLS designed and code-reviewed but never executed against a real Postgres instance, more than once, across more than one capability) — naming it as its own explicit gate is meant to stop that pattern from being invisible.
- **CRL 6 requires an explicit founder approval event, not just a green quality-gate run.** Matches the existing engineering operating model's own rule (`docs/roadmap/02-engineering-operating-model.md`): "a stage that fails its own quality gates... is not ready for approval regardless of how much work went into it" — restated here as "gates passing is necessary for CRL 6, never sufficient on its own."
- **No capability is described as "done."** "Done" is not a level on this scale, on purpose — every capability keeps a CRL, forever, because CRL 8 itself is not a terminal state a capability graduates out of and stops being measured against; it's an ongoing claim that has to keep being true.
- **Regression is real.** A capability can move backward — a security finding drops a CRL 6 capability back to CRL 4 until re-verified; a churned customer whose usage was the sole evidence for CRL 7 drops the capability back to CRL 6 until a new one exists. The scale is not a ratchet.
