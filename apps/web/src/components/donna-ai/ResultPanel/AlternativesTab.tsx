import { TRAIT_LABELS } from "../data";
import { SectionLabel } from "../shared";
import type { DecisionOutput } from "../types";

export function AlternativesTab({ output }: { output: DecisionOutput }) {
  const allRanked = [output.recommendation, ...output.alternatives];

  return (
    <div>
      <SectionLabel>All evaluated platforms</SectionLabel>
      <h3 className="mt-2 text-2xl font-semibold text-slate-950">
        {allRanked.length} platforms compared
      </h3>

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
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-semibold text-slate-950">{entry.platform.name}</h4>
                    {isRecommended && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{entry.platform.tagline}</p>
                </div>

                <div className="text-right">
                  <div className="font-mono text-2xl font-bold tabular-nums text-slate-950">
                    {entry.score}%
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.06em] text-slate-400">
                    Donna Score
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {entry.matchedTraits.map((trait) => (
                  <span
                    key={trait}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"
                  >
                    {TRAIT_LABELS[trait]}
                  </span>
                ))}
                {entry.matchedTraits.length === 0 && (
                  <span className="text-xs text-slate-400">No matching traits for your inputs</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
