import { AlertTriangle, Check } from "lucide-react";
import { SectionLabel } from "../shared";
import type { ExecutiveRecommendation } from "../engine/executive-recommendation";

/**
 * Executive Recommendation (brief §19) — Strategic, Architecture and
 * Economic lenses rendered side by side, then an explicit Overall
 * verdict. When the lenses disagree, that disagreement is the
 * headline, not a footnote — `disagreementNote` already names every
 * lens (engine/executive-recommendation.ts); this component only lays
 * it out, it never re-derives or hides it.
 */
export function ExecutiveRecommendationBlock({ recommendation }: { recommendation: ExecutiveRecommendation }) {
  const lenses: Array<{ label: string; winner: { optionName: string } | null }> = [
    { label: "Strategic", winner: recommendation.strategic },
    { label: "Architecture", winner: recommendation.architecture },
    { label: "Economic", winner: recommendation.economic },
  ];

  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <SectionLabel>Executive recommendation</SectionLabel>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {lenses.map((lens) => (
          <div key={lens.label} className="rounded-xl border border-titanium bg-carbon-2 p-3">
            <p className="text-[10px] font-medium tracking-[0.06em] text-nova-ink-faint uppercase">{lens.label}</p>
            <p className="mt-1 text-sm font-medium text-nova-ink">{lens.winner ? lens.winner.optionName : "Not yet available"}</p>
            {!lens.winner && lens.label === "Economic" && <p className="mt-0.5 text-xs text-nova-ink-faint">Enter a business case to populate this lens.</p>}
          </div>
        ))}
      </div>

      <div
        className={`mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-6 ${
          recommendation.agree ? "border-nova-success/30 bg-nova-success/10 text-nova-ink" : "border-nova-warning/30 bg-nova-warning/10 text-nova-ink"
        }`}
      >
        {recommendation.agree ? <Check size={16} className="mt-0.5 shrink-0 text-nova-success" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0 text-nova-warning" />}
        <p>
          <span className="font-medium">Overall recommendation: {recommendation.overall.optionName}.</span>{" "}
          {recommendation.agree ? "Every available lens agrees." : recommendation.disagreementNote}
        </p>
      </div>
    </div>
  );
}
