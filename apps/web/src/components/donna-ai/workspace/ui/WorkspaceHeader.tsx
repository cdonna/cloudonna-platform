"use client";

/**
 * Persistent Decision Workspace header (brief §3) — deliberately a
 * fixed, small field set (title, org, status, owner, deadline, value
 * at stake, lifecycle stage, last updated, evidence confidence,
 * readiness, next action), never a dashboard of every available
 * number. Every field traces to a real, already-computed value —
 * nothing here is a placeholder.
 */
import type { ConfidenceLevel } from "../../engine/confidence";
import type { ReadinessLevel } from "../decision-readiness";
import type { NextBestAction } from "../next-best-action";
import { LIFECYCLE_STAGE_LABELS, type LifecycleStage } from "../lifecycle-stage";

function formatChf(value: number | null): string {
  if (value === null) return "Not yet modeled";
  return new Intl.NumberFormat("en-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(value);
}

const READINESS_DOT: Record<ReadinessLevel, string> = { HIGH: "bg-nova-success", MEDIUM: "bg-nova-warning", LOW: "bg-red-400" };
const CONFIDENCE_DOT: Record<ConfidenceLevel, string> = { HIGH: "bg-nova-success", MEDIUM: "bg-nova-warning", LOW: "bg-red-400" };

export function WorkspaceHeader({
  title,
  humanReadableId,
  displayStatus,
  organizationName,
  ownerEmail,
  deadline,
  investmentAtStakeChf,
  currentStage,
  lastUpdated,
  confidenceLevel,
  readinessLevel,
  nextBestAction,
}: {
  title: string;
  humanReadableId: string;
  displayStatus: string;
  organizationName: string | null;
  ownerEmail: string | null;
  deadline: string | null;
  investmentAtStakeChf: number | null;
  currentStage: LifecycleStage;
  lastUpdated: string;
  confidenceLevel: ConfidenceLevel;
  readinessLevel: ReadinessLevel;
  nextBestAction: NextBestAction | null;
}) {
  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-titanium bg-carbon-2 px-2.5 py-0.5 text-xs font-medium text-nova-ink-muted">{displayStatus}</span>
            <span className="font-mono text-xs text-nova-ink-faint">{humanReadableId}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-nova-ink">{title}</h1>
          {organizationName && <p className="mt-1 text-sm text-nova-ink-faint">{organizationName}</p>}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-titanium bg-carbon-2 px-3 py-1 text-xs text-nova-ink-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${CONFIDENCE_DOT[confidenceLevel]}`} />
            Evidence confidence: {confidenceLevel}
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-titanium bg-carbon-2 px-3 py-1 text-xs text-nova-ink-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${READINESS_DOT[readinessLevel]}`} />
            Readiness: {readinessLevel}
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-titanium pt-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-nova-ink-faint">Owner</dt>
          <dd className="text-nova-ink">{ownerEmail ?? "Unknown"}</dd>
        </div>
        <div>
          <dt className="text-xs text-nova-ink-faint">Deadline</dt>
          <dd className="text-nova-ink">{deadline ?? "Not set"}</dd>
        </div>
        <div>
          <dt className="text-xs text-nova-ink-faint">Value at stake</dt>
          <dd className="text-nova-ink">{formatChf(investmentAtStakeChf)}</dd>
        </div>
        <div>
          <dt className="text-xs text-nova-ink-faint">Last updated</dt>
          <dd className="text-nova-ink">{new Date(lastUpdated).toLocaleDateString()}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-titanium pt-4">
        <p className="text-sm text-nova-ink-muted">
          Current stage: <span className="font-medium text-nova-ink">{LIFECYCLE_STAGE_LABELS[currentStage]}</span>
        </p>
        {nextBestAction && <p className="text-sm font-medium text-nova-accent-strong">Next: {nextBestAction.label}</p>}
      </div>
    </div>
  );
}
