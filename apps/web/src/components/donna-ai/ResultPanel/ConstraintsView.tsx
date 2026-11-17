import { CheckCircle2, CircleHelp, XCircle } from "lucide-react";
import { SectionLabel } from "../shared";
import type { EngineResult } from "../engine/recommendation";

const STATUS_STYLE = {
  PASS: { icon: CheckCircle2, className: "text-nova-success" },
  FAIL: { icon: XCircle, className: "text-red-400" },
  UNKNOWN: { icon: CircleHelp, className: "text-nova-ink-faint" },
} as const;

const ELIGIBILITY_LABEL = {
  eligible: "Eligible",
  conditionally_eligible: "Conditionally eligible",
  ineligible: "Ineligible",
} as const;

const ELIGIBILITY_STYLE = {
  eligible: "border-nova-success/30 bg-nova-success/10 text-nova-success",
  conditionally_eligible: "border-nova-warning/30 bg-nova-warning/10 text-nova-warning",
  ineligible: "border-red-400/30 bg-red-400/10 text-red-400",
} as const;

/**
 * Hard Constraints view (brief §16) — every ranked option against
 * every hard constraint, so a FAIL reads as "ineligible," never as a
 * quietly low score. One table, not one card per option: the point is
 * to let a reader scan down a constraint and across the options at
 * once, which a card grid can't do.
 */
export function ConstraintsView({ engineResult }: { engineResult: EngineResult }) {
  const constraintIds = engineResult.ranking[0]?.constraints.map((c) => c.id) ?? [];
  const constraintLabels = new Map(engineResult.ranking[0]?.constraints.map((c) => [c.id, c.label]) ?? []);

  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <SectionLabel>Hard constraints</SectionLabel>
      <p className="mt-2 text-sm leading-6 text-nova-ink-muted">
        A FAIL makes an option ineligible outright — never folded into its score. An UNKNOWN means the input needed to check
        it wasn&apos;t provided, not that the option passed.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-titanium">
              <th scope="col" className="py-2 pr-4 font-medium text-nova-ink-faint">
                Option
              </th>
              <th scope="col" className="py-2 pr-4 font-medium text-nova-ink-faint">
                Eligibility
              </th>
              {constraintIds.map((id) => (
                <th key={id} scope="col" className="py-2 pr-4 font-medium text-nova-ink-faint">
                  {constraintLabels.get(id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {engineResult.ranking.map((entry) => (
              <tr key={entry.id} className="border-b border-titanium/60 last:border-0">
                <td className="py-2.5 pr-4 font-medium text-nova-ink">{entry.name}</td>
                <td className="py-2.5 pr-4">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${ELIGIBILITY_STYLE[entry.eligibility]}`}>
                    {ELIGIBILITY_LABEL[entry.eligibility]}
                  </span>
                </td>
                {entry.constraints.map((c) => {
                  const { icon: Icon, className } = STATUS_STYLE[c.status];
                  return (
                    <td key={c.id} className="py-2.5 pr-4">
                      <span className={`inline-flex items-center gap-1.5 ${className}`} title={c.explanation}>
                        <Icon size={14} />
                        {c.status}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {engineResult.ranking.some((e) => e.eligibility === "ineligible") && (
        <div className="mt-4 space-y-1.5 border-t border-titanium pt-4">
          {engineResult.ranking
            .filter((e) => e.eligibility === "ineligible")
            .map((e) => (
              <p key={e.id} className="text-xs leading-5 text-nova-ink-muted">
                <span className="font-medium text-red-400">{e.name}</span> is ineligible:{" "}
                {e.constraints
                  .filter((c) => c.status === "FAIL")
                  .map((c) => c.explanation)
                  .join(" ")}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
