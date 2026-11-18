"use client";

/**
 * Challenge stage (brief §27-§29) — the dedicated Challenger
 * experience. ChallengerPanel already runs and displays every
 * required field (challenge, why it matters, affected recommendation,
 * evidence, severity, response, resolved/unresolved) — this stage
 * just gives it its own place in the lifecycle rather than being
 * buried inside an Analyst-only flat list.
 */
import { ChallengerPanel } from "../../ResultPanel/ChallengerPanel";

export function ChallengeStage({ decisionId }: { decisionId: string }) {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-6 text-nova-ink-muted">
        Donna actively tests this recommendation for bias, missing evidence, weak assumptions, unmodeled risk, constraint violations, vendor
        concentration, and timeline or financial optimism — a Red Team review of the current recommendation, not a rubber stamp.
      </p>
      <ChallengerPanel decisionId={decisionId} />
    </div>
  );
}
