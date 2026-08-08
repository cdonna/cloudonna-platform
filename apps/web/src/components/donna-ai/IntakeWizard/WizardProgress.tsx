import { REVIEW_STEP_INDEX } from "../types";

const STAGE_LABELS = ["Context", "Priorities", "Constraints", "Review"];

/** Maps the wizard's real internal stepIndex (0=company, 1=landscape,
 * 2=goals, 3=constraints, 4=review, 5=analysis) onto the four stages
 * shown to the user — company and landscape render as one merged
 * "Context" stage in the UI (see IntakeWizard.tsx), so the underlying
 * state/reducer contract stays exactly as it was. Index 5 (analysis)
 * reads as "Review" complete, since AnalysingState is its own distinct
 * screen immediately after. */
function stageIndexFor(stepIndex: number): number {
  if (stepIndex <= 1) return 0;
  if (stepIndex === 2) return 1;
  if (stepIndex === 3) return 2;
  return 3;
}

export function WizardProgress({ stepIndex }: { stepIndex: number }) {
  const stage = stageIndexFor(stepIndex);
  const percent = Math.round(((stage + 1) / STAGE_LABELS.length) * 100);
  const isAnalysing = stepIndex > REVIEW_STEP_INDEX;

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-nova-ink-faint">
        <span className="font-mono tabular-nums">
          Stage {stage + 1} of {STAGE_LABELS.length}
        </span>
        <span className="text-nova-accent-strong">{isAnalysing ? "Analysing" : STAGE_LABELS[stage]}</span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-carbon-2">
        <div
          className="h-full rounded-full bg-nova-accent transition-[width] duration-500 ease-nova-settle"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        Stage {stage + 1} of {STAGE_LABELS.length}: {isAnalysing ? "Analysing" : STAGE_LABELS[stage]}
      </div>

      <ol className="mt-4 hidden flex-col gap-1.5 lg:flex">
        {STAGE_LABELS.map((label, index) => (
          <li
            key={label}
            className={`flex items-center gap-2 text-xs ${
              index === stage && !isAnalysing
                ? "font-semibold text-nova-ink"
                : index < stage || isAnalysing
                  ? "text-nova-success"
                  : "text-nova-ink-faint"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] transition-colors duration-200 ${
                index === stage && !isAnalysing
                  ? "border-nova-accent bg-nova-accent text-white"
                  : index < stage || isAnalysing
                    ? "border-nova-success bg-nova-success text-white"
                    : "border-titanium text-nova-ink-faint"
              }`}
            >
              {index < stage || isAnalysing ? "✓" : index + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
