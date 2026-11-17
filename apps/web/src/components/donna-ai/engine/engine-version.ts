/**
 * Decision Engine V1 — single source of truth for engine/scoring
 * versioning (brief §13). Every DecisionOutput and every persisted
 * decision_versions row traces back to these two constants, so a future
 * change to either the orchestration pipeline or the scoring formula is
 * a deliberate version bump here, not a silent drift.
 *
 * `SCORING_ENGINE_VERSION` was already "donna-score-v2" in two places
 * (handle-save-decision-request.ts, handle-append-decision-version-request.ts)
 * before this module existed — kept unchanged (the weighted-dimension
 * formula itself did not change in V1) and re-exported from here so
 * there is exactly one place that owns the string, not two that must
 * agree by convention.
 */

/** The overall orchestration version — Context/Evidence/Criteria/
 * Constraint/Scoring/Scenario/Risk/Recommendation/Confidence engines
 * composed together. Bump this when any engine module's contract
 * changes, even if the scoring formula itself doesn't. */
export const ENGINE_VERSION = "decision-engine-v1";

/** The deterministic scoring formula identity. Unchanged from the
 * pre-existing Donna Score v2 model (10 weighted dimensions) — V1 adds
 * constraints, evidence typing, confidence levels and scenarios around
 * this formula, it does not change the formula itself. */
export const SCORING_ENGINE_VERSION = "donna-score-v2";

export const SCHEMA_VERSION = "decision-report/1";
export const KNOWLEDGE_BASE_VERSION = "vendor-catalog-v1";
