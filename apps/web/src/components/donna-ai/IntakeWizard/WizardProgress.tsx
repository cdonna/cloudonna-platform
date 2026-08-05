import { TOTAL_WIZARD_STEPS } from "../types";

const STEP_LABELS = ["Company", "Landscape", "Goals", "Constraints", "Review", "Analysis"];

export function WizardProgress({ stepIndex }: { stepIndex: number }) {
  const percent = Math.round(((stepIndex + 1) / TOTAL_WIZARD_STEPS) * 100);

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span className="font-mono tabular-nums">
          Step {stepIndex + 1} of {TOTAL_WIZARD_STEPS}
        </span>
        <span className="text-violet-700">{STEP_LABELS[stepIndex]}</span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        Step {stepIndex + 1} of {TOTAL_WIZARD_STEPS}: {STEP_LABELS[stepIndex]}
      </div>

      <ol className="mt-4 hidden flex-col gap-1.5 lg:flex">
        {STEP_LABELS.map((label, index) => (
          <li
            key={label}
            className={`flex items-center gap-2 text-xs ${
              index === stepIndex
                ? "font-semibold text-slate-950"
                : index < stepIndex
                  ? "text-emerald-600"
                  : "text-slate-400"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${
                index === stepIndex
                  ? "border-violet-600 bg-violet-600 text-white"
                  : index < stepIndex
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 text-slate-400"
              }`}
            >
              {index < stepIndex ? "✓" : index + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
