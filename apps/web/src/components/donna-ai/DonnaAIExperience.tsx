"use client";

import { useState } from "react";
import { ArrowRight, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysingState } from "./AnalysingState";
import { buildDecisionOutput } from "./engine";
import type { DecisionReport } from "./intelligence/types";
import { IntakeWizard } from "./IntakeWizard/IntakeWizard";
import { WizardProgress } from "./IntakeWizard/WizardProgress";
import { ResultPanel } from "./ResultPanel/ResultPanel";
import { ANALYSIS_STEP_INDEX, type WizardState } from "./types";

type Phase = "intro" | "wizard" | "analysing" | "results";

/**
 * Used only if the API route itself is unreachable (not if AI enrichment
 * merely fails or is unconfigured — the route already returns a complete,
 * valid DecisionReport in every one of those cases). This is the last
 * line of defense: even a total network failure still produces a
 * complete deterministic result, computed locally with the same engine
 * the server would have called first. See
 * docs/intelligence/fallback-and-failure-model.md, "Client-side fallback".
 */
function buildLocalFallbackReport(state: WizardState): DecisionReport {
  return {
    output: buildDecisionOutput(state),
    enrichment: null,
    provider: { providerId: "local-fallback", model: null },
    fallback: {
      status: "unavailable",
      reason: "Could not reach the Donna AI service — showing a locally-computed deterministic result only.",
    },
    generatedAt: new Date().toISOString(),
  };
}

async function requestDecision(state: WizardState): Promise<DecisionReport> {
  try {
    const response = await fetch("/api/donna-ai/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wizardState: state }),
    });

    if (!response.ok) {
      return buildLocalFallbackReport(state);
    }

    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null || !("report" in data)) {
      return buildLocalFallbackReport(state);
    }

    return (data as { report: DecisionReport }).report;
  } catch {
    // Network entirely unreachable, request aborted, JSON parse failure —
    // all land here. Never thrown further; the UI always gets a report.
    return buildLocalFallbackReport(state);
  }
}

export function DonnaAIExperience({ isSignedIn }: { isSignedIn: boolean }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [wizardState, setWizardState] = useState<WizardState | null>(null);
  const [report, setReport] = useState<DecisionReport | null>(null);

  function handleWizardComplete(state: WizardState) {
    setWizardState(state);
    setPhase("analysing");
  }

  function handleAnalysisComplete() {
    if (!wizardState) return;
    requestDecision(wizardState).then((result) => {
      setReport(result);
      setPhase("results");
    });
  }

  function handleStartNew() {
    setWizardState(null);
    setReport(null);
    setPhase("intro");
  }

  return (
    <section className="relative overflow-hidden bg-obsidian px-6 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 motion-safe:animate-aurora-drift">
        <div className="absolute top-20 left-[-10rem] h-96 w-96 rounded-full bg-aurora-secondary/20 blur-[130px]" />
        <div className="absolute top-10 right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-aurora-primary/25 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {phase === "intro" && (
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold tracking-[0.16em] text-nova-accent-strong uppercase">
              <Sparkles size={14} />
              Donna AI · Public Alpha
            </div>

            <div className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-nova-accent text-white shadow-nova-glow">
              <Bot size={34} />
            </div>

            <h1 className="mt-7 text-4xl font-semibold tracking-[-0.035em] text-nova-ink sm:text-5xl">Your Enterprise Decision Assistant</h1>

            <p className="mt-5 text-lg leading-8 text-nova-ink-muted">
              Not a chatbot — a structured, six-step consulting process. Tell Donna about your company, landscape, goals and constraints, and
              she&apos;ll produce an evidence-based recommendation with a full executive dashboard.
            </p>

            <Button size="lg" onClick={() => setPhase("wizard")} className="mt-9 h-12 bg-nova-accent px-7 text-white shadow-nova-glow hover:bg-nova-accent-strong">
              Start your assessment
              <ArrowRight size={17} />
            </Button>

            <p className="mt-4 text-xs text-nova-ink-faint">Takes about two minutes · deterministic core, optional AI narrative, no account needed</p>
          </div>
        )}

        {phase === "wizard" && wizardState === null && <IntakeWizard onComplete={handleWizardComplete} />}

        {phase === "analysing" && wizardState && (
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 rounded-2xl border border-titanium bg-carbon p-5">
              <WizardProgress stepIndex={ANALYSIS_STEP_INDEX} />
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-titanium bg-obsidian shadow-nova-glow">
              <AnalysingState state={wizardState} onComplete={handleAnalysisComplete} />
            </div>
          </div>
        )}

        {phase === "results" && wizardState && report && (
          <ResultPanel state={wizardState} report={report} onStartNew={handleStartNew} isSignedIn={isSignedIn} />
        )}
      </div>
    </section>
  );
}
