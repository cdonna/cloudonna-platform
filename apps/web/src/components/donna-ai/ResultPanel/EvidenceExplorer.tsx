"use client";

import { useMemo, useState } from "react";
import { SectionLabel } from "../shared";
import type { EngineEvidence } from "../engine/evidence";
import type { EvidenceDiagnostics } from "../engine/evidence";
import type { ScoreDimensionKey } from "../types";

/** Deliberately NOT reusing the public marketing site's EvidenceTag —
 * that component's colors are register-relative (sig-* and accent and
 * rule tokens that flip with a light/dark ancestor class) and this
 * authenticated surface uses the separate, always-dark nova-* token
 * system instead. Reusing it here would silently render with the
 * light-register palette on a dark nova background for any viewer
 * whose OS isn't in dark mode. Same six types, same "AI_INTERPRETATION
 * and ASSUMPTION never look verified" rule (brief §13), new-but-
 * consistent dark-safe colors. */
const TYPE_LABEL: Record<EngineEvidence["type"], string> = {
  "official-source": "Official source",
  "customer-input": "Customer input",
  "observed-data": "Observed data",
  calculated: "Calculated",
  "ai-interpretation": "AI interpretation",
  assumption: "Assumption",
};

const TYPE_STYLE: Record<EngineEvidence["type"], string> = {
  "official-source": "border-nova-accent/30 bg-nova-accent/10 text-nova-accent-strong",
  "customer-input": "border-nova-success/30 bg-nova-success/10 text-nova-success",
  "observed-data": "border-titanium-strong bg-carbon-2 text-nova-ink-muted",
  calculated: "border-nova-accent-strong/30 bg-nova-accent-strong/10 text-nova-accent-strong",
  "ai-interpretation": "border-dashed border-titanium-strong bg-transparent text-nova-ink-faint",
  assumption: "border-dashed border-nova-warning/40 bg-nova-warning/5 text-nova-warning",
};

function EvidenceTypeBadge({ type }: { type: EngineEvidence["type"] }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${TYPE_STYLE[type]}`}>{TYPE_LABEL[type]}</span>
  );
}

type GroupBy = "type" | "criterion";

/**
 * Evidence Explorer (brief §13/§14) — groups the engine's real evidence
 * list, never raw JSON. Grouping is a client-side toggle over data
 * already fetched/computed once; nothing here re-derives evidence.
 */
export function EvidenceExplorer({
  evidence,
  diagnostics,
  dimensionLabels,
}: {
  evidence: EngineEvidence[];
  diagnostics: EvidenceDiagnostics;
  dimensionLabels: Partial<Record<ScoreDimensionKey, string>>;
}) {
  const [groupBy, setGroupBy] = useState<GroupBy>("type");

  const groups = useMemo(() => {
    const map = new Map<string, EngineEvidence[]>();
    for (const item of evidence) {
      const key = groupBy === "type" ? TYPE_LABEL[item.type] : item.relatedDimension ? (dimensionLabels[item.relatedDimension] ?? item.relatedDimension) : "General";
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return Array.from(map.entries());
  }, [evidence, groupBy, dimensionLabels]);

  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel>Evidence explorer</SectionLabel>
        <div role="group" aria-label="Group evidence by" className="flex rounded-full border border-titanium bg-carbon-2 p-0.5 text-xs">
          {(["type", "criterion"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setGroupBy(option)}
              aria-pressed={groupBy === option}
              className={`rounded-full px-3 py-1 font-medium capitalize transition duration-150 ${
                groupBy === option ? "bg-nova-accent text-white" : "text-nova-ink-faint hover:text-nova-ink"
              }`}
            >
              By {option}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence coverage diagnostics (brief §14) — real numbers from
          computeEvidenceDiagnostics, never a vanity percentage. */}
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-b border-titanium pb-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-nova-ink-faint">Coverage</dt>
          <dd className="font-mono text-lg font-semibold tabular-nums text-nova-ink">{Math.round(diagnostics.coverage * 100)}%</dd>
        </div>
        <div>
          <dt className="text-xs text-nova-ink-faint">Assumption ratio</dt>
          <dd className="font-mono text-lg font-semibold tabular-nums text-nova-ink">{Math.round(diagnostics.assumptionRatio * 100)}%</dd>
        </div>
        <div>
          <dt className="text-xs text-nova-ink-faint">Source diversity</dt>
          <dd className="font-mono text-lg font-semibold tabular-nums text-nova-ink">{diagnostics.sourceDiversity} / 6 types</dd>
        </div>
        <div>
          <dt className="text-xs text-nova-ink-faint">Freshness</dt>
          <dd className={`font-mono text-lg font-semibold tabular-nums ${diagnostics.freshnessWarnings.length > 0 ? "text-nova-warning" : "text-nova-success"}`}>
            {diagnostics.freshnessWarnings.length > 0 ? `${diagnostics.freshnessWarnings.length} warning(s)` : "Current"}
          </dd>
        </div>
      </dl>
      {diagnostics.missingCriticalEvidence.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-nova-warning">
          No supporting evidence found for: {diagnostics.missingCriticalEvidence.join(", ")}.
        </p>
      )}

      <div className="mt-5 space-y-6">
        {groups.map(([groupLabel, items]) => (
          <div key={groupLabel}>
            <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">{groupLabel}</p>
            <ul className="mt-2 space-y-2.5">
              {items.map((item, index) => (
                <li key={`${groupLabel}-${index}`} className="flex items-start gap-3 text-sm leading-6 text-nova-ink-muted">
                  <EvidenceTypeBadge type={item.type} />
                  <span>{item.claim}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
