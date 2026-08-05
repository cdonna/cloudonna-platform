import { Info } from "lucide-react";
import { SectionLabel } from "../shared";
import type { DecisionOutput } from "../types";

export function RisksOpportunitiesTab({ output }: { output: DecisionOutput }) {
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-950">Risks to validate</h4>
          <div className="mt-5 space-y-4">
            {output.risks.map((risk) => (
              <div key={risk.text} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                {risk.text}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-950">Opportunities</h4>
          <div className="mt-5 space-y-4">
            {output.opportunities.map((opportunity) => (
              <div
                key={opportunity.text}
                className="flex items-start gap-3 text-sm leading-6 text-slate-600"
              >
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                {opportunity.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-2">
          <Info size={15} className="text-slate-400" />
          <SectionLabel>Assumptions behind this preview</SectionLabel>
        </div>
        <div className="mt-4 space-y-2">
          {output.assumptions.map((assumption) => (
            <p key={assumption.text} className="text-sm leading-6 text-slate-500">
              {assumption.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
