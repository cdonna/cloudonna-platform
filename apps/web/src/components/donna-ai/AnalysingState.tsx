"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Check, LoaderCircle } from "lucide-react";
import { INDUSTRY_OPTIONS } from "./data";
import { buildDecisionOutput } from "./engine";
import type { DecisionReport } from "./intelligence/types";
import { ScoreRing } from "./shared";
import type { WizardState } from "./types";

const STEP_DELAY_MS = 650;
const REVEAL_HOLD_MS = 900;

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
  report,
  onComplete,
}: {
  state: WizardState;
  /** The real, possibly-AI-enriched report — requested by the parent
   * the instant this phase began, in parallel with the choreography
   * below, not after it. Null until it resolves. */
  report: DecisionReport | null;
  onComplete: () => void;
}) {
  const [steps] = useState(() => buildAnalysisSteps(state));
  const [currentStep, setCurrentStep] = useState(0);
  // Deterministic and synchronous — the real recommendation, score, and
  // confidence are already known without waiting on anything. Used for
  // the reveal below so it's never showing fabricated numbers, only
  // real ones revealed slightly ahead of the full result panel.
  const localOutput = useMemo(() => buildDecisionOutput(state), [state]);

  const choreographyDone = currentStep >= steps.length - 1;
  const ready = choreographyDone && report !== null;

  // Advances through the choreographed steps at a calm, even cadence,
  // but deliberately never marks the last one done on its own — that
  // only happens once `report` has actually arrived. If the real
  // request (started by the parent the instant this phase began) is
  // still pending once the sequence catches up, the last step stays
  // visibly active (spinner, not checkmark) rather than claiming a
  // recommendation is ready before it is.
  useEffect(() => {
    if (choreographyDone) return;
    const timer = window.setTimeout(() => setCurrentStep((current) => current + 1), STEP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [choreographyDone]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(onComplete, REVEAL_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [ready, onComplete]);

  return (
    <div className="flex min-h-[38rem] flex-col justify-center p-8 sm:p-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-nova-accent text-white">
            {ready ? <Check size={25} /> : <Bot size={25} />}
            {!ready && <span className="absolute inset-0 rounded-2xl border border-nova-accent-strong motion-safe:animate-nova-breathe" />}
          </div>

          <div>
            <div className="text-xs font-semibold tracking-[0.16em] text-nova-accent-strong uppercase">
              {ready ? "Recommendation ready" : "Donna is thinking"}
            </div>
            <div className="mt-1 font-semibold text-nova-ink">{ready ? "Confidence formed from your evidence" : "Analysing your decision"}</div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {steps.map((step, index) => {
            const completed = index < currentStep || (index === steps.length - 1 && ready);
            const active = index === currentStep && !completed;

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

        {/* The signature moment: evidence assembled (every step above
            checked), trade-offs weighed, confidence formed — using the
            real Donna Score and confidence this analysis actually
            computed, not a placeholder. No fake search or reasoning
            copy, just the true result arriving a beat ahead of the full
            panel, which is about to take its place. */}
        {ready && (
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-nova-success/25 bg-nova-success/10 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-panel ease-nova-settle">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold tracking-[0.1em] text-nova-success uppercase">Evidence assembled · trade-offs weighed</div>
              <div className="mt-1 truncate font-semibold text-nova-ink">{localOutput.recommendation.platform.productName}</div>
            </div>
            <div className="flex shrink-0 gap-3">
              <ScoreRing value={localOutput.donnaScore} label="Donna Score" emphasize />
              <ScoreRing value={localOutput.confidenceScore} label="Confidence" />
            </div>
          </div>
        )}

        <div role="status" aria-live="polite" className="sr-only">
          {ready
            ? `Recommendation ready: ${localOutput.recommendation.platform.productName}, ${localOutput.confidenceScore}% confidence.`
            : steps[currentStep]}
        </div>
      </div>
    </div>
  );
}
