import { Check } from "lucide-react";
import { ScoreRing, SectionLabel } from "../shared";
import type { DecisionOutput } from "../types";

export function OverviewTab({ output }: { output: DecisionOutput }) {
  const allRanked = [output.recommendation, ...output.alternatives];
  const topScore = allRanked[0]?.score ?? 1;

  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-violet-700">
        Preview recommendation · Public Alpha
      </span>

      <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div>
          <SectionLabel>Executive summary</SectionLabel>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {output.recommendation.platform.name}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            {output.executiveSummary}
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <ScoreRing value={output.donnaScore} label="Donna Score" emphasize />
          <ScoreRing value={output.confidenceScore} label="Confidence" />
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-950">Why this recommendation?</h4>
          <div className="mt-5 space-y-4">
            {output.reasons.length > 0 ? (
              output.reasons.map((reason) => (
                <div key={reason.trait} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check size={14} />
                  </span>
                  {reason.text}
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-500">
                Your inputs didn&apos;t strongly differentiate between platforms. Add more
                detail in Landscape, Goals or Constraints for a sharper recommendation.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-950">Score breakdown</h4>
          <div className="mt-5 space-y-4">
            {output.fitBreakdown.map((fit) => (
              <div key={fit.category}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{fit.label}</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-950">
                    {fit.score}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                    style={{ width: `${fit.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <SectionLabel>Score comparison</SectionLabel>
        <div className="mt-5 space-y-4">
          {allRanked.map((entry) => {
            const isRecommended = entry.platform.id === output.recommendation.platform.id;
            const isAlternative =
              output.alternativeRecommendation !== null &&
              entry.platform.id === output.alternativeRecommendation.platform.id;

            return (
              <div key={entry.platform.id}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className={isRecommended ? "font-semibold text-slate-950" : "text-slate-600"}>
                    {entry.platform.name}
                    {isRecommended && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Recommended
                      </span>
                    )}
                    {isAlternative && (
                      <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                        Alternative recommendation
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-slate-950">
                    {entry.score}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      isRecommended
                        ? "bg-gradient-to-r from-blue-500 to-violet-500"
                        : "bg-slate-400"
                    }`}
                    style={{ width: `${(entry.score / topScore) * 100}%` }}
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
