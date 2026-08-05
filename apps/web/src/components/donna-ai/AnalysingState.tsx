"use client";

import { useEffect, useState } from "react";
import { Bot, Check, LoaderCircle } from "lucide-react";
import { INDUSTRY_OPTIONS } from "./data";
import type { WizardState } from "./types";

function buildAnalysisSteps(state: WizardState): string[] {
  const industryLabel =
    INDUSTRY_OPTIONS.find((option) => option.value === state.company.industry)?.label ??
    "your organization";

  return [
    `Analyzing ${industryLabel.toLowerCase()} landscape...`,
    "Comparing architectures...",
    "Evaluating technology fit...",
    "Calculating Donna Score...",
    "Preparing executive recommendation...",
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
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
            <Bot size={25} />
            <span className="absolute inset-0 animate-ping rounded-2xl border border-violet-400 opacity-30" />
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
              Donna is thinking
            </div>
            <div className="mt-1 font-semibold text-slate-950">
              Analysing your decision
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {steps.map((step, index) => {
            const completed = index < currentStep;
            const active = index === currentStep;

            return (
              <div
                key={step}
                className={`flex items-center gap-4 rounded-xl border px-4 py-4 transition ${
                  active
                    ? "border-violet-200 bg-violet-50"
                    : completed
                      ? "border-emerald-100 bg-emerald-50/60"
                      : "border-slate-100 bg-white opacity-45"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    completed
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "bg-violet-600 text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {completed ? (
                    <Check size={16} />
                  ) : active ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700">{step}</span>
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
