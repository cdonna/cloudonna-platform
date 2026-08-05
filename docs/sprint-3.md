# Sprint 3 — Donna Intelligence Foundation

**Branch:** `worktree-sprint-3`
**Status:** Implemented, not yet committed

**Sprint 3B addendum:** the vendor intelligence catalog described below was subsequently
expanded from ~14 fields per platform to ~30 — executive narrative fields, integration-depth
bands (SAP/ERP/CRM/data warehouse/multi-cloud), AI/ML/GenAI bands, data-platform capability
bands (lakehouse, virtualization, sharing, metadata, MDM, streaming), and migration scenarios.
Full detail in `docs/vendor-intelligence-model.md`. The scoring engine's formulas and weights
were not changed — only three field references were renamed to match, and the 12 new bands are
not yet consumed by any score (deliberately deferred). OpenAI integration remains undone by
design — see `docs/future-ai-integration.md`.

## Mission

Evolve Donna from a deterministic alpha demo into the foundation of a real Enterprise Decision
Intelligence Platform — without shipping a chatbot, and without introducing a backend,
authentication, database, external API, or LLM. Every requirement in this sprint was satisfiable
with structured data and pure functions; nothing needed those things, so nothing was added.

## Architecture

Five new modules under `components/donna-ai/`, alongside the wizard shell and result panel from
Sprint 2 (both reused, not rewritten):

```
vendor-intelligence/   10-platform catalog, rich structured fields — see vendor-intelligence-model.md
scoring/                 10-dimension Donna Score v2 engine — see donna-score-v2.md
comparison/                ComparisonMatrix component (up to 4 platforms)
decision-engine.ts           RecommendationProvider/DecisionEngine seam — see future-ai-integration.md
persistence/types.ts           SavedAssessment/Project/Workspace interfaces (unused, unimplemented)
```

`DecisionOutput` (the stable contract every `ResultPanel` tab consumes) was extended, not
replaced: `dimensions`, `currentSituation`, `decisionDrivers`, `positiveEvidence`, `concerns` are
new; `risks`, `opportunities`, `assumptions`, `nextSteps`, `workshops` are unchanged from Sprint
2. `buildDecisionOutput()` now runs behind `decisionEngine.run()` — a one-line indirection in
`DonnaAIExperience` that makes the Phase 7 seam real rather than a document describing an
aspiration.

## What was reused vs. refactored (Phase 1 findings, confirmed correct in hindsight)

**Reused unchanged**: the entire wizard (`IntakeWizard/`), the phase state machine,
`useRovingTabs`, the wizard's input types. None of this sprint's ten phases touched what data the
user provides.

**Refactored, not patched**: the v1 scoring formula and 4-platform catalog were genuinely
insufficient for a 10-platform, 10-dimension model — replacing them was the right call, confirmed
by how cleanly the new `scoring/engine.ts` slotted in behind the same `buildDecisionOutput()`
entry point.

**Kept and extended**: the `Trait`/`activateTraits` mechanism from v1 survives as the concrete
basis for Architecture Fit specifically, extended with 7 new traits for the 6 new platforms
rather than discarded.

## Self-review findings (fixed before this report)

- `decision-engine.ts` was built but never called — `DonnaAIExperience` still called
  `buildDecisionOutput` directly, which would have made `docs/future-ai-integration.md`'s claims
  false. Fixed by wiring `DonnaAIExperience` through `decisionEngine.run()`.
- `ComparisonMatrix.tsx` used an `as never` cast to work around a type mismatch instead of typing
  the field correctly. Fixed by typing `Row`'s `trait`/`dimensionKey` fields against the real
  `Trait`/`ScoreDimensionKey` unions.
- `CATEGORY_LABELS` was defined identically in both `AlternativesTab.tsx` and
  `ComparisonMatrix.tsx`. Consolidated into `vendor-intelligence/catalog.ts`, both components now
  import it.

## Quality gates

`npx tsc --noEmit`, `npm run lint`, and `npm run build` were run after Phase 2/3 (vendor +
scoring), after Phase 5 (comparison matrix integration), after Phase 6 (executive report), and
once more after the self-review fixes above — clean at every checkpoint, no errors carried
forward.

## Known limitations

- Small catalog (10 platforms, 15 traits) — several valid wizard inputs still produce zero
  Architecture Fit signal (handled honestly, not silently).
- Architecture and TCO tabs remain generic/illustrative, clearly labeled as such.
- No persistence, no AI call, no live market data — by design this sprint, see the three
  companion docs for exactly how each seam is meant to be extended later.
- `persistence/types.ts` is genuinely unused right now — it exists only so future work has a
  shape to build against, not because anything imports it yet.

## Next sprint candidates

- A second `RecommendationProvider` is the natural next real test of the Phase 7 seam.
- Per-platform Architecture/TCO content, replacing the current generic placeholders.
- Revisit `SCORE_WEIGHTS` once there's real usage data to reason from instead of first-pass
  judgment.
