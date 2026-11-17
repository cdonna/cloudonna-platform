import { GOAL_LABELS, type VersionDiff } from "./version-diff";
import type { ScoreChangeExplanation } from "./score-explanation";
import { SectionLabel } from "../shared";
import type { DecisionEvent } from "../engine/decision-events";

/**
 * Sprint 6.2 — a deliberately plain rendering of the Version Diff
 * Engine's structured output. Per docs/roadmap/sprint-6.2.md, "Version
 * Diff Engine ... do not build a visual UI yet": this is a functional
 * list, not a designed diff visualization (no side-by-side columns, no
 * color-coded field highlighting) — it exists so the Diff button in
 * VersionControls/DecisionTimeline has somewhere real to navigate to,
 * not as the polished diff experience a future pass would build.
 */
export function VersionDiffPanel({
  diff,
  explanation,
  events,
}: {
  diff: VersionDiff;
  explanation: ScoreChangeExplanation;
  /** Decision Engine V1.1 (brief §19/§20) — named product events for
   * this diff, from engine/decision-events.ts. Optional so this
   * component keeps working for any caller that hasn't been updated to
   * pass them. */
  events?: DecisionEvent[];
}) {
  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <SectionLabel>
        Diff — version {diff.fromVersion} → version {diff.toVersion}
      </SectionLabel>

      {events && events.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {events.map((event) => (
            <span key={event.type} className="inline-flex rounded-full border border-nova-accent/30 bg-nova-accent/10 px-2.5 py-1 text-xs font-medium text-nova-accent-strong">
              {event.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <span className="text-xs font-medium text-nova-ink-muted">Donna Score</span>
        <span className="font-mono text-lg font-semibold tabular-nums text-nova-ink">
          {explanation.fromScore} → {explanation.toScore}
        </span>
        <span className={`text-sm font-medium ${explanation.delta > 0 ? "text-nova-success" : explanation.delta < 0 ? "text-red-400" : "text-nova-ink-faint"}`}>
          {explanation.delta > 0 ? "+" : ""}
          {explanation.delta}
        </span>
      </div>

      {explanation.reasons.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-nova-ink-muted">
          {explanation.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-nova-ink-faint">No detected input changes explain the score.</p>
      )}

      {!diff.hasChanges && <p className="mt-3 text-sm text-nova-ink-faint">No differences detected between these versions.</p>}

      {diff.changedRecommendations.primary.changed && (
        <div className="mt-5">
          <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Recommendation</p>
          <p className="mt-1 text-sm text-nova-ink-muted">
            {diff.changedRecommendations.primary.from?.name ?? "None"} → {diff.changedRecommendations.primary.to?.name ?? "None"}
          </p>
        </div>
      )}

      {diff.changedConstraints.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Changed constraints</p>
          <ul className="mt-1 space-y-1 text-sm text-nova-ink-muted">
            {diff.changedConstraints.map((change) => (
              <li key={change.field}>
                {change.label}: {change.from} → {change.to}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(diff.changedPriorities.added.length > 0 || diff.changedPriorities.removed.length > 0) && (
        <div className="mt-5">
          <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Changed priorities</p>
          <ul className="mt-1 space-y-1 text-sm text-nova-ink-muted">
            {diff.changedPriorities.added.map((goal) => (
              <li key={`added-${goal}`} className="text-nova-success">
                + {GOAL_LABELS[goal]}
              </li>
            ))}
            {diff.changedPriorities.removed.map((goal) => (
              <li key={`removed-${goal}`} className="text-red-400">
                − {GOAL_LABELS[goal]}
              </li>
            ))}
          </ul>
        </div>
      )}

      {diff.changedVendors.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Changed vendors / landscape</p>
          <ul className="mt-1 space-y-1 text-sm text-nova-ink-muted">
            {diff.changedVendors.map((change) => (
              <li key={change.field}>
                {change.label}: {change.from} → {change.to}
              </li>
            ))}
          </ul>
        </div>
      )}

      {diff.changedScores.dimensions.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Changed dimension scores</p>
          <ul className="mt-1 space-y-1 font-mono text-sm tabular-nums text-nova-ink-muted">
            {diff.changedScores.dimensions.map((dimension) => (
              <li key={dimension.key}>
                {dimension.label}: {dimension.from} → {dimension.to} ({dimension.delta > 0 ? "+" : ""}
                {dimension.delta})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
