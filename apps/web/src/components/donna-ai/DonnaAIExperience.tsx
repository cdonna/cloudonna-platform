"use client";

import { useState } from "react";
import { ArrowRight, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysingState } from "./AnalysingState";
import { buildDecisionOutput } from "./engine";
import { IntakeWizard } from "./IntakeWizard/IntakeWizard";
import { WizardProgress } from "./IntakeWizard/WizardProgress";
import { ResultPanel } from "./ResultPanel/ResultPanel";
import { ANALYSIS_STEP_INDEX, type DecisionOutput, type WizardState } from "./types";

type Phase = "intro" | "wizard" | "analysing" | "results";

export function DonnaAIExperience() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [wizardState, setWizardState] = useState<WizardState | null>(null);
  const [output, setOutput] = useState<DecisionOutput | null>(null);

  function handleWizardComplete(state: WizardState) {
    setWizardState(state);
    setPhase("analysing");
  }

  function handleAnalysisComplete() {
    if (!wizardState) return;
    setOutput(buildDecisionOutput(wizardState));
    setPhase("results");
  }

  function handleStartNew() {
    setWizardState(null);
    setOutput(null);
    setPhase("intro");
  }

  return (
    <section className="relative overflow-hidden bg-white px-6 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-20 h-96 w-96 rounded-full bg-blue-200/40 blur-[130px]" />
        <div className="absolute right-[-8rem] top-10 h-[28rem] w-[28rem] rounded-full bg-violet-200/45 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {phase === "intro" && (
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 shadow-sm">
              <Sparkles size={14} />
              Donna AI · Public Alpha
            </div>

            <div className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-xl shadow-violet-200">
              <Bot size={34} />
            </div>

            <h1 className="mt-7 text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">
              Your Enterprise Decision Assistant
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Not a chatbot — a structured, six-step consulting process. Tell
              Donna about your company, landscape, goals and constraints, and
              she&apos;ll produce an evidence-based recommendation with a
              full executive dashboard.
            </p>

            <Button
              size="lg"
              onClick={() => setPhase("wizard")}
              className="mt-9 h-12 bg-gradient-to-r from-blue-600 to-violet-600 px-7 text-white shadow-xl shadow-indigo-200"
            >
              Start your assessment
              <ArrowRight size={17} />
            </Button>

            <p className="mt-4 text-xs text-slate-400">
              Takes about two minutes · deterministic preview, no account needed
            </p>
          </div>
        )}

        {phase === "wizard" && wizardState === null && (
          <IntakeWizard onComplete={handleWizardComplete} />
        )}

        {phase === "analysing" && wizardState && (
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white/75 p-5 shadow-sm backdrop-blur-xl">
              <WizardProgress stepIndex={ANALYSIS_STEP_INDEX} />
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-[0_40px_110px_-45px_rgba(79,70,229,0.4)] backdrop-blur-2xl">
              <AnalysingState state={wizardState} onComplete={handleAnalysisComplete} />
            </div>
          </div>
        )}

        {phase === "results" && wizardState && output && (
          <ResultPanel state={wizardState} output={output} onStartNew={handleStartNew} />
        )}
      </div>
    </section>
  );
}
