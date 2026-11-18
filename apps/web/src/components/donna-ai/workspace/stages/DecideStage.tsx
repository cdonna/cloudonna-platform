"use client";

/**
 * Decide stage (brief §30-§35) — the Executive Recommendation,
 * Decision Readiness, and the one human action that actually commits
 * the enterprise: Record Decision. HumanDecisionPanel already
 * enforces that Donna never silently records a decision — a human
 * always explicitly picks an option and states a rationale.
 */
import { useState } from "react";
import { SectionLabel } from "../../shared";
import { ExecutiveRecommendationBlock } from "../../ResultPanel/ExecutiveRecommendationBlock";
import { HumanDecisionPanel } from "../../persistence/HumanDecisionPanel";
import { ExecutiveBrief } from "../../ResultPanel/ExecutiveBrief";
import type { EngineResult } from "../../engine/recommendation";
import type { HumanOverride } from "../../persistence/decisions-repository";
import type { DecisionOutput } from "../../types";
import type { DecisionReadiness } from "../decision-readiness";
import type { NextBestAction } from "../next-best-action";

const READINESS_STYLES: Record<DecisionReadiness["level"], string> = {
  HIGH: "border-nova-success/30 bg-nova-success/10 text-nova-success",
  MEDIUM: "border-nova-warning/30 bg-nova-warning/10 text-nova-warning",
  LOW: "border-red-400/30 bg-red-400/10 text-red-400",
};

export function DecideStage({
  output,
  engineResult,
  humanOverride,
  readiness,
  nextBestAction,
  editable,
  onRecordOverride,
}: {
  output: DecisionOutput;
  engineResult: EngineResult;
  humanOverride: HumanOverride | null;
  readiness: DecisionReadiness;
  nextBestAction: NextBestAction | null;
  editable: boolean;
  onRecordOverride?: (selectedOptionId: string, rationale: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [briefOpen, setBriefOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-5 ${READINESS_STYLES[readiness.level]}`}>
        <div className="flex items-center justify-between gap-3">
          <SectionLabel>Decision readiness: {readiness.level}</SectionLabel>
          <button type="button" onClick={() => setBriefOpen(true)} className="rounded-full border border-current px-3 py-1 text-xs font-medium">
            Open Executive Brief
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {readiness.dimensions.map((d) => (
            <div key={d.key} className="rounded-lg bg-black/10 px-3 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span>{d.label}</span>
                <span className="font-mono font-semibold uppercase">{d.status}</span>
              </div>
            </div>
          ))}
        </div>
        {readiness.blockers.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {readiness.blockers.map((b) => (
              <li key={b.code}>
                <span className="font-mono text-[0.625rem] font-semibold uppercase">{b.severity}</span> — {b.message}
              </li>
            ))}
          </ul>
        )}
        {nextBestAction && (
          <p className="mt-3 text-sm font-medium">
            Next best action: {nextBestAction.label} ({nextBestAction.stage})
          </p>
        )}
      </div>

      <ExecutiveRecommendationBlock recommendation={engineResult.executiveRecommendation} />

      <HumanDecisionPanel engineResult={engineResult} humanOverride={humanOverride} onRecordOverride={editable ? onRecordOverride : undefined} />

      <div className="rounded-2xl border border-titanium bg-carbon p-5">
        <SectionLabel>Conditions to reconsider</SectionLabel>
        {engineResult.conditionsToReconsider.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {engineResult.conditionsToReconsider.map((condition) => (
              <li key={condition} className="text-sm leading-6 text-nova-ink-muted">
                {condition}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-nova-ink-faint">No conditions identified that would currently change this recommendation.</p>
        )}
      </div>

      {briefOpen && <ExecutiveBrief output={output} onClose={() => setBriefOpen(false)} />}
    </div>
  );
}
