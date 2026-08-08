"use client";

import { useEffect, useState } from "react";
import { Bot, Check, LoaderCircle } from "lucide-react";
import { INDUSTRY_OPTIONS } from "./data";
import type { WizardState } from "./types";

/** Five stages, in the order the deterministic engine actually runs
 * them (see buildDecisionOutput) — context first, then priorities,
 * then the platform comparison itself, then risk/opportunity, then the
 * narrative. Not decorative copy: each label names a real phase of
 * what's computing, per the brief's own "do not fake work" rule. */
function buildAnalysisSteps(state: WizardState): string[] {
  const industryLabel =
    INDUSTRY_OPTIONS.find((option) => option.value === state.company.industry)?.label ??
    "your landscape";

  return [
    `Understanding ${industryLabel.toLowerCase()}`,
    "Testing your priorities",
    "Comparing viable platforms",
    "Checking trade-offs",
    "Building your recommendation",
  ];
}

export function AnalysingState({
  state,
  onComplete,
}: {
  state: WizardState;
  onComplete: () => void;
}) {
  const [steps] = useState(() => buildAnalysisSteps(state));
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep >= steps.length - 1) {
      const finalTimer = window.setTimeout(onComplete, 750);
      return () => window.clearTimeout(finalTimer);
    }

    const timer = window.setTimeout(() => {
      setCurrentStep((current) => current + 1);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [currentStep, steps.length, onComplete]);

  return (
    <div className="flex min-h-[38rem] flex-col justify-center p-8 sm:p-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-nova-accent text-white">
            <Bot size={25} />
            <span className="absolute inset-0 rounded-2xl border border-nova-accent-strong motion-safe:animate-nova-breathe" />
          </div>

          <div>
            <div className="text-xs font-semibold tracking-[0.16em] text-nova-accent-strong uppercase">Donna is thinking</div>
            <div className="mt-1 font-semibold text-nova-ink">Analysing your decision</div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {steps.map((step, index) => {
            const completed = index < currentStep;
            const active = index === currentStep;

            return (
              <div
                key={step}
                className={`flex items-center gap-4 rounded-xl border px-4 py-4 transition-colors duration-panel ease-nova-settle ${
                  active
                    ? "border-nova-accent/40 bg-nova-accent/10"
                    : completed
                      ? "border-nova-success/25 bg-nova-success/10"
                      : "border-titanium bg-carbon opacity-45"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    completed ? "bg-nova-success text-white" : active ? "bg-nova-accent text-white" : "bg-carbon-2 text-nova-ink-faint"
                  }`}
                >
                  {completed ? <Check size={16} /> : active ? <LoaderCircle size={16} className="animate-spin" /> : <span className="text-xs">{index + 1}</span>}
                </div>
                <span className="text-sm font-medium text-nova-ink-muted">{step}</span>
              </div>
            );
          })}
        </div>

        <div role="status" aria-live="polite" className="sr-only">
          {currentStep >= steps.length - 1 ? "Analysis complete" : steps[currentStep]}
        </div>
      </div>
    </div>
  );
}
