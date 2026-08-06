import { ComparisonMatrix } from "../comparison/ComparisonMatrix";
import { SectionLabel } from "../shared";
import { CATEGORY_LABELS } from "../vendor-intelligence/catalog";
import type { DecisionOutput } from "../types";

export function AlternativesTab({ output }: { output: DecisionOutput }) {
  const allRanked = [output.recommendation, ...output.alternatives];
  const recommendedCategory = output.recommendation.platform.category;
  const hasCrossCategoryComparison = allRanked.some((entry) => entry.platform.category !== recommendedCategory);

  return (
    <div>
      <SectionLabel>Comparison matrix</SectionLabel>
      <h3 className="mt-2 text-2xl font-semibold text-slate-950">
        {allRanked.length} platforms compared
      </h3>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        Every score below comes directly from the same scoring engine that produced your Donna
        Score — nothing here is a separate or fabricated rating.
      </p>

      <div className="mt-6">
        <ComparisonMatrix platforms={allRanked} />
      </div>

      <div className="mt-8">
        <SectionLabel>Platform detail</SectionLabel>
      </div>

      {hasCrossCategoryComparison && (
        <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
          Note: these platforms span more than one category — some solve different problems
          rather than competing directly. Category is shown on each card so you can read the
          comparison accordingly.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {allRanked.map((entry) => {
          const isRecommended = entry.platform.id === output.recommendation.platform.id;

          return (
            <div
              key={entry.platform.id}
              className={`rounded-2xl border p-5 ${
                isRecommended ? "border-violet-300 bg-violet-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-semibold text-slate-950">{entry.platform.productName}</h4>
                    {isRecommended && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Recommended
                      </span>
                    )}
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                      {CATEGORY_LABELS[entry.platform.category]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{entry.platform.vendor}</p>
                  <p className="mt-2 max-w-xl text-sm text-slate-600">{entry.platform.shortDescription}</p>
                </div>

                <div className="text-right">
                  <div className="font-mono text-2xl font-bold tabular-nums text-slate-950">{entry.overallScore}%</div>
                  <div className="text-[10px] uppercase tracking-[0.06em] text-slate-400">Donna Score</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {entry.dimensions.map((dimension) => (
                  <span
                    key={dimension.key}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"
                    title={`${dimension.label}: ${dimension.score}% (weight ${Math.round(dimension.weight * 100)}%)`}
                  >
                    {dimension.label} <span className="font-mono font-semibold text-slate-900">{dimension.score}%</span>
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>Cost tier: {entry.platform.costTier}</span>
                <span>Lock-in risk: {entry.platform.vendorLockInRisk}</span>
                <span>Time to value: {entry.platform.timeToValue}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
