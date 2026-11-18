"use client";

/**
 * Option Matrix (brief §20/§21) — the executive-readable vendor-
 * neutral comparison. Every field here is read directly from
 * RankedPlatform/RankingEntry/BusinessCaseOutput, already computed —
 * nothing is recalculated here. Where a per-option signal genuinely
 * does not exist yet (Confidence and the global EvidenceDiagnostics
 * are computed for the recommended option only, Risks are decision-
 * level not option-level), the matrix says so honestly rather than
 * inventing a number to fill the cell (brief §71's "no fake data").
 */
import { useState } from "react";
import { SectionLabel } from "../../shared";
import type { RankedPlatform } from "../../scoring/types";
import type { RankingEntry } from "../../engine/recommendation";
import type { BusinessCaseOutput } from "../../engine/business-case/types";

function formatChf(value: number): string {
  return new Intl.NumberFormat("en-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(value);
}

export function OptionMatrix({
  ranked,
  ranking,
  recommendedOptionId,
  businessCase,
}: {
  ranked: RankedPlatform[];
  ranking: RankingEntry[];
  recommendedOptionId: string;
  businessCase: BusinessCaseOutput | null | undefined;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(recommendedOptionId);

  return (
    <div className="space-y-3">
      <SectionLabel>Option Matrix</SectionLabel>
      {ranked.map((option) => {
        const entry = ranking.find((r) => r.id === option.platform.id);
        const isRecommended = option.platform.id === recommendedOptionId;
        const sortedDimensions = [...option.dimensions].sort((a, b) => b.score - a.score);
        const strengths = sortedDimensions.filter((d) => d.positiveEvidence.length > 0).slice(0, 2);
        const weaknesses = [...sortedDimensions].reverse().filter((d) => d.negativeEvidence.length > 0).slice(0, 2);
        const violations = (entry?.constraints ?? []).filter((c) => c.status !== "PASS");
        const economics = businessCase?.options.find((o) => o.optionId === option.platform.id)?.summary ?? null;
        const expanded = expandedId === option.platform.id;

        return (
          <div key={option.platform.id} className="rounded-2xl border border-titanium bg-carbon p-5">
            <button type="button" onClick={() => setExpandedId(expanded ? null : option.platform.id)} className="flex w-full items-center justify-between gap-4 text-left" aria-expanded={expanded}>
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-nova-ink">{option.platform.productName}</span>
                <span className="text-xs text-nova-ink-faint">{option.platform.vendor}</span>
                {isRecommended && <span className="rounded-full bg-nova-success/10 px-2.5 py-0.5 text-xs font-medium text-nova-success">Recommended</span>}
              </div>
              <span className="font-mono text-lg font-semibold tabular-nums text-nova-ink">{option.overallScore}%</span>
            </button>

            {expanded && (
              <div className="mt-4 grid gap-5 border-t border-titanium pt-4 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Top strengths</p>
                  {strengths.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {strengths.map((d) => (
                        <li key={d.key} className="text-sm leading-6 text-nova-ink-muted">
                          {d.positiveEvidence[0]}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-nova-ink-faint">No distinguishing strengths recorded.</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Top weaknesses</p>
                  {weaknesses.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {weaknesses.map((d) => (
                        <li key={d.key} className="text-sm leading-6 text-nova-ink-muted">
                          {d.negativeEvidence[0]}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-nova-ink-faint">No weaknesses recorded.</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Constraints</p>
                  {violations.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {violations.map((c) => (
                        <li key={c.id} className="flex items-start gap-2 text-sm leading-6 text-nova-ink-muted">
                          <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.625rem] font-semibold uppercase ${c.status === "FAIL" ? "bg-nova-warning/15 text-nova-warning" : "bg-carbon-2 text-nova-ink-faint"}`}>
                            {c.status}
                          </span>
                          {c.label}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-nova-success">All stated constraints pass.</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Economic impact</p>
                  {economics ? (
                    <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm text-nova-ink-muted">
                      <dt>TCO</dt>
                      <dd className="text-right font-mono tabular-nums text-nova-ink">{formatChf(economics.tco)}</dd>
                      <dt>NPV</dt>
                      <dd className="text-right font-mono tabular-nums text-nova-ink">{formatChf(economics.npv)}</dd>
                      <dt>Payback</dt>
                      <dd className="text-right font-mono tabular-nums text-nova-ink">{economics.paybackYears !== null ? `${economics.paybackYears.toFixed(1)} yrs` : "Not within horizon"}</dd>
                    </dl>
                  ) : (
                    <p className="mt-2 text-sm text-nova-ink-faint">No business case modeled for this option yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
