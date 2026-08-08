import { GraduationCap } from "lucide-react";
import { SectionLabel } from "../shared";
import type { DecisionOutput, NextStepItem } from "../types";

const HORIZON_META: Record<NextStepItem["horizon"], { label: string; window: string }> = {
  now: { label: "Now", window: "0–30 days" },
  next: { label: "Next", window: "30–90 days" },
  later: { label: "Later", window: "90+ days" },
};

export function RoadmapTab({ output }: { output: DecisionOutput }) {
  const horizons: NextStepItem["horizon"][] = ["now", "next", "later"];

  return (
    <div>
      <SectionLabel>Suggested roadmap</SectionLabel>
      <h3 className="mt-2 text-2xl font-semibold text-nova-ink">
        From recommendation to rollout
      </h3>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {horizons.map((horizon) => {
          const items = output.nextSteps.filter((step) => step.horizon === horizon);
          if (items.length === 0) return null;

          return (
            <div key={horizon} className="rounded-2xl border border-titanium p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-nova-ink">
                  {HORIZON_META[horizon].label}
                </span>
                <span className="text-xs text-nova-ink-faint">{HORIZON_META[horizon].window}</span>
              </div>

              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item.text} className="flex items-start gap-2.5 text-sm leading-6 text-nova-ink-muted">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-accent-strong" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-titanium bg-nova-accent/10/40 p-5">
        <div className="flex items-center gap-2">
          <GraduationCap size={15} className="text-nova-accent-strong" />
          <SectionLabel>Suggested workshops</SectionLabel>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {output.workshops.map((workshop) => (
            <div key={workshop.title} className="rounded-xl border border-titanium bg-carbon p-4">
              <h5 className="text-sm font-semibold text-nova-ink">{workshop.title}</h5>
              <p className="mt-1.5 text-xs leading-5 text-nova-ink-faint">{workshop.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
