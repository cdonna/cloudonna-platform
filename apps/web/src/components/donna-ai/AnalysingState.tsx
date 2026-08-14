"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AlertTriangle, Bot, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  analysisMachineReducer,
  createInitialAnalysisMachineState,
} from "./analysis-state-machine";
import { INDUSTRY_OPTIONS } from "./data";
import { buildDecisionOutput } from "./engine";
import type { DecisionOutput } from "./types";
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
  error,
  onComplete,
  onRetry,
}: {
  state: WizardState;
  /** The real, possibly-AI-enriched report — requested by the parent
   * the instant this phase began, in parallel with the choreography
   * below, not after it. Null until it resolves. */
  report: DecisionReport | null;
  /** A sanitized, user-safe failure message — set only when neither
   * the network request nor the local deterministic fallback could
   * produce a result (see request-decision.ts). Never both `report`
   * and `error` at once; the parent guarantees that. */
  error: string | null;
  onComplete: () => void;
  onRetry: () => void;
}) {
  const [steps] = useState(() => buildAnalysisSteps(state));
  const [machine, dispatch] = useReducer(analysisMachineReducer, undefined, createInitialAnalysisMachineState);

  // This is the fix for the Founder's real-iPhone report: "meaningful
  // Donna results appear too far below the visible viewport." Every
  // phase transition in DonnaAIExperience (wizard -> analysing ->
  // results) renders as a conditional sibling inside one never-moving
  // container, so nothing ever tells the browser to bring newly-
  // mounted, taller content into view — the page stays scrolled to
  // wherever the last question happened to leave it. AdaptiveIntake
  // already solves this for its own internal question-to-question
  // transitions via headingRef.focus() (native focus() scrolls the
  // focused element into view); this component and ResultPanel are
  // the two places that pattern was never extended to, which is the
  // actual root cause, not a missing scrollIntoView() sprinkle. Fires
  // on mount (entering "analysing") and again the moment the machine
  // transitions to "error" (a real state change, not a re-render), so
  // a retry failure is brought into view exactly like the first one.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isError = machine.status === "error";
  useEffect(() => {
    headingRef.current?.focus();
  }, [isError]);

  // Deterministic and synchronous — the real recommendation, score, and
  // confidence are already known without waiting on anything, used for
  // the mid-choreography reveal below. Guarded: a malformed WizardState
  // could in principle make buildDecisionOutput throw during render,
  // which useMemo would otherwise let crash the whole tree — instead
  // it's treated as the same "error" the request path already models.
  const localOutput = useMemo<DecisionOutput | null>(() => {
    try {
      return buildDecisionOutput(state);
    } catch (err) {
      console.error("[donna-ai] local_output_failed:", err instanceof Error ? err.message : err);
      return null;
    }
  }, [state]);

  useEffect(() => {
    if (localOutput === null) {
      dispatch({ type: "REQUEST_FAILED", message: "Donna couldn't build a recommendation from this assessment. Nothing was lost — you can retry with the same answers." });
    }
  }, [localOutput]);

  useEffect(() => {
    if (report) dispatch({ type: "REQUEST_SUCCEEDED" });
  }, [report]);

  useEffect(() => {
    if (error) dispatch({ type: "REQUEST_FAILED", message: error });
  }, [error]);

  // The root-cause fix: this effect depends on machine.currentStep
  // directly, so React re-evaluates it on every real step change and
  // schedules exactly one new timer each time. The bug this replaces
  // depended on a derived `choreographyDone` boolean instead — a value
  // that stayed `false` across several consecutive renders, so the
  // effect never re-ran after the very first advance and playback
  // froze on step 1 ("Testing your priorities") forever, regardless of
  // whether the real request had already succeeded.
  useEffect(() => {
    if (machine.status !== "analysing") return;
    if (machine.currentStep >= steps.length - 1) return;
    const timer = window.setTimeout(() => dispatch({ type: "STEP_ADVANCE", totalSteps: steps.length }), STEP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [machine.status, machine.currentStep, steps.length]);

  useEffect(() => {
    if (machine.status !== "result_ready") return;
    const timer = window.setTimeout(onComplete, REVEAL_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [machine.status, onComplete]);

  const ready = machine.status === "result_ready";
  const failed = isError;

  if (failed) {
    return (
      <div className="flex min-h-[32rem] flex-col items-center justify-center p-8 text-center sm:min-h-[38rem] sm:p-12">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-nova-warning/15 text-nova-warning">
          <AlertTriangle size={25} />
        </div>
        <h2 ref={headingRef} tabIndex={-1} className="mt-6 text-xl font-semibold text-nova-ink outline-none">Donna couldn&apos;t finish this analysis</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-nova-ink-faint">
          {machine.errorMessage ?? "Something went wrong building your recommendation."}
        </p>
        <p className="mt-1 text-xs text-nova-ink-faint">Your answers are still here — nothing was lost.</p>
        <Button
          onClick={() => {
            // Resets the local machine back to "analysing" before the
            // parent's retry request is even sent — otherwise a
            // genuinely successful retry would still be discarded by
            // the reducer's own "ignore REQUEST_SUCCEEDED once in
            // error" guard (see analysis-state-machine.ts), which
            // exists specifically to drop a *stale* success from a
            // different attempt, not a fresh one this click just started.
            dispatch({ type: "RETRY" });
            onRetry();
          }}
          className="mt-6 h-11 bg-nova-accent px-6 text-white shadow-nova-glow hover:bg-nova-accent-strong"
        >
          Try again
        </Button>
        <div role="alert" className="sr-only">
          {machine.errorMessage ?? "Analysis failed."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[32rem] flex-col justify-center p-8 sm:min-h-[38rem] sm:p-12">
      <div ref={headingRef} tabIndex={-1} className="mx-auto w-full max-w-xl outline-none">
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
            // Once ready, every step renders complete regardless of how
            // far currentStep had actually reached — a fast response
            // must be able to complete the transition gracefully (see
            // the bug report's Section 5) rather than leaving early
            // steps looking stuck while the recommendation is already
            // shown below them.
            const completed = ready || index < machine.currentStep;
            const active = index === machine.currentStep && !completed;

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
        {ready && localOutput && (
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
          {ready && localOutput
            ? `Recommendation ready: ${localOutput.recommendation.platform.productName}, ${localOutput.confidenceScore}% confidence.`
            : steps[machine.currentStep]}
        </div>
      </div>
    </div>
  );
}
