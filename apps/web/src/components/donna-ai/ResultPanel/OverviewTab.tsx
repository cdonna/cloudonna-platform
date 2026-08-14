import { AlertTriangle, Check, Scale } from "lucide-react";
import { interpolate } from "@/i18n/interpolate";
import { useLocale } from "@/i18n/LocaleProvider";
import { ScoreRing, SectionLabel } from "../shared";
import type { DecisionOutput } from "../types";
import { assessResultCredibility } from "./result-credibility";

export function OverviewTab({ output }: { output: DecisionOutput }) {
  const { dict } = useLocale();
  const allRanked = [output.recommendation, ...output.alternatives];
  const topScore = allRanked[0]?.overallScore ?? 1;
  const { scoreGap, isNarrowMargin, decisionHinges } = assessResultCredibility(output);
  const r = dict.resultOverview;

  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon-2 px-4 py-1.5 text-xs font-semibold text-nova-accent-strong">
        {r.previewBadge}
      </span>

      {/* 1. Recommendation, 2. how close it is, 3. confidence — the
          three things a reader needs in the first ten seconds, before
          any explanation. */}
      <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div>
          <SectionLabel>{r.recommendationLabel}</SectionLabel>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight text-nova-ink">{output.recommendation.platform.productName}</h3>
          <p className="mt-1 text-xs text-nova-ink-faint">{output.recommendation.platform.vendor}</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-nova-ink-muted">{output.executiveSummary}</p>
        </div>

        <div className="flex shrink-0 gap-3">
          <ScoreRing value={output.donnaScore} label={r.donnaScoreLabel} emphasize />
          <ScoreRing value={output.confidenceScore} label={r.confidenceLabel} />
        </div>
      </div>

      {/* Never claim an obvious winner when the numbers don't back
          that up — a 1-2 point gap is well within the model's own
          noise, and hiding that isn't more confident, it's less
          honest. */}
      {isNarrowMargin && output.alternativeRecommendation && scoreGap !== null && (
        <div className="mt-5 rounded-2xl border border-nova-warning/30 bg-nova-warning/10 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nova-warning/15 text-nova-warning">
              <Scale size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-nova-ink">{r.closeHeading}</p>
              <p className="mt-1 text-sm leading-6 text-nova-ink-muted">
                {interpolate(scoreGap === 1 ? r.closeBodyOne : r.closeBodyMany, {
                  leader: output.recommendation.platform.productName,
                  trailer: output.alternativeRecommendation.platform.productName,
                  gap: scoreGap,
                })}
              </p>
              {decisionHinges.length > 0 && (
                <p className="mt-3 text-xs text-nova-ink-faint">
                  <span className="font-semibold uppercase tracking-[0.06em]">{r.decisionHingesLabel}</span> {decisionHinges.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* 4. Why. */}
        <div className="rounded-2xl border border-titanium p-5">
          <h4 className="font-semibold text-nova-ink">{r.whyHeading}</h4>
          <div className="mt-5 space-y-4">
            {output.positiveEvidence.length > 0 ? (
              output.positiveEvidence.map((evidence) => (
                <div key={`${evidence.dimension}-${evidence.text}`} className="flex items-start gap-3 text-sm leading-6 text-nova-ink-muted">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nova-success/10 text-nova-success">
                    <Check size={14} />
                  </span>
                  {evidence.text}
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-nova-ink-faint">{r.noEvidence}</p>
            )}
          </div>

          {/* 5. Key trade-offs. */}
          {output.concerns.length > 0 && (
            <div className="mt-5 border-t border-titanium pt-4">
              <div className="text-xs font-semibold tracking-[0.1em] text-nova-ink-faint uppercase">{r.tradeOffsHeading}</div>
              <div className="mt-3 space-y-3">
                {output.concerns.slice(0, 3).map((evidence) => (
                  <div key={`${evidence.dimension}-${evidence.text}`} className="flex items-start gap-3 text-sm leading-6 text-nova-ink-muted">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nova-warning/10 text-nova-warning">
                      <AlertTriangle size={13} />
                    </span>
                    {evidence.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 6. Best alternative. */}
        <div className="rounded-2xl border border-titanium p-5">
          <h4 className="font-semibold text-nova-ink">{r.bestAlternativeHeading}</h4>
          {output.alternativeRecommendation ? (
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-nova-ink">{output.alternativeRecommendation.platform.productName}</span>
                <span className="font-mono font-semibold tabular-nums text-nova-ink">{output.alternativeRecommendation.overallScore}%</span>
              </div>
              <p className="mt-1 text-xs text-nova-ink-faint">{output.alternativeRecommendation.platform.vendor}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-carbon-2">
                <div
                  className="h-full rounded-full bg-nova-ink-faint"
                  style={{ width: `${(output.alternativeRecommendation.overallScore / topScore) * 100}%` }}
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-nova-ink-muted">
                {scoreGap !== null
                  ? interpolate(scoreGap === 1 ? r.pointsBehindOne : r.pointsBehindMany, { gap: scoreGap, name: output.recommendation.platform.productName })
                  : r.evaluatedSameCriteria}
              </p>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-nova-ink-faint">{r.onlyOneMatched}</p>
          )}
        </div>
      </div>

      {/* 7. Evidence — the full score breakdown, positioned as
          supporting detail underneath the conclusion, not as the
          conclusion itself. */}
      <div className="mt-6 rounded-2xl border border-titanium p-5">
        <h4 className="font-semibold text-nova-ink">{r.evidenceHeading}</h4>
        <div className="mt-5 space-y-4">
          {output.dimensions.map((dimension) => (
            <div key={dimension.key}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-nova-ink-muted">{dimension.label}</span>
                <span className="font-mono font-semibold tabular-nums text-nova-ink">{dimension.score}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-carbon-2">
                <div className="h-full rounded-full bg-nova-accent" style={{ width: `${dimension.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-titanium bg-carbon-2 p-5">
        <SectionLabel>{r.currentSituationHeading}</SectionLabel>
        <p className="mt-2 text-sm leading-6 text-nova-ink-muted">{output.currentSituation}</p>
        {output.decisionDrivers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {output.decisionDrivers.map((driver) => (
              <span key={driver} className="rounded-full border border-titanium bg-carbon px-2.5 py-1 text-xs text-nova-ink-muted">
                {driver}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-titanium bg-carbon-2 p-5">
        <SectionLabel>{r.fullComparisonHeading}</SectionLabel>
        <div className="mt-5 space-y-4">
          {allRanked.map((entry) => {
            const isRecommended = entry.platform.id === output.recommendation.platform.id;
            const isAlternative = output.alternativeRecommendation !== null && entry.platform.id === output.alternativeRecommendation.platform.id;

            return (
              <div key={entry.platform.id}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className={isRecommended ? "font-semibold text-nova-ink" : "text-nova-ink-muted"}>
                    {entry.platform.productName}
                    {isRecommended && (
                      <span className="ml-2 rounded-full bg-nova-success/10 px-2 py-0.5 text-xs font-medium text-nova-success">{r.recommendedBadge}</span>
                    )}
                    {isAlternative && (
                      <span className="ml-2 rounded-full bg-nova-accent/15 px-2 py-0.5 text-xs font-medium text-nova-accent-strong">
                        {r.alternativeBadge}
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-nova-ink">{entry.overallScore}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-carbon">
                  <div
                    className={`h-full rounded-full ${isRecommended ? "bg-nova-accent" : "bg-nova-ink-faint"}`}
                    style={{ width: `${(entry.overallScore / topScore) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
