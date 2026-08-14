"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/LocaleProvider";
import { AnalysingState } from "./AnalysingState";
import { AdaptiveIntake } from "./intake/AdaptiveIntake";
import { WizardProgress } from "./IntakeWizard/WizardProgress";
import type { DecisionReport } from "./intelligence/types";
import { requestDecision } from "./request-decision";
import { ResultPanel } from "./ResultPanel/ResultPanel";
import {
  clearSessionStorage,
  persistToSessionStorage,
  pushDonnaHistoryState,
  readCurrentDonnaHistoryState,
  readDonnaHistoryState,
  restoreFromSessionStorage,
} from "./session-history";
import { ANALYSIS_STEP_INDEX, type WizardState } from "./types";

type Phase = "intro" | "wizard" | "analysing" | "results";

interface ExperienceSnapshot {
  phase: Phase;
  wizardState: WizardState | null;
  report: DecisionReport | null;
}

const HISTORY_NAMESPACE = "donna-experience";
const SESSION_KEY = "donna-experience-session";

function loadInitialSnapshot(): ExperienceSnapshot {
  const fromHistory = readCurrentDonnaHistoryState<ExperienceSnapshot>(HISTORY_NAMESPACE);
  const fromSession = fromHistory ?? restoreFromSessionStorage<ExperienceSnapshot>(SESSION_KEY);
  return fromSession ?? { phase: "intro", wizardState: null, report: null };
}

export function DonnaAIExperience({ isSignedIn }: { isSignedIn: boolean }) {
  const { dict } = useLocale();
  const [{ phase, wizardState, report }, setSnapshot] = useState<ExperienceSnapshot>(loadInitialSnapshot);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  // Bumped on every new analysis attempt (including retry) so a
  // response from a superseded attempt can never overwrite fresher
  // state — the guard against the "React state race" / "stale
  // closure" failure classes: nothing here ever unmounts between
  // phases (DonnaAIExperience is one long-lived component instance
  // throughout intro -> wizard -> analysing -> results), so a stray
  // late response from an earlier attempt is a real, reachable case,
  // not a hypothetical one.
  const requestGenerationRef = useRef(0);
  const hasRestoredRef = useRef(false);

  /** The one place phase/wizardState/report actually change — every
   * caller below goes through this so persistence (sessionStorage, for
   * "reload during/after the assessment") and history (pushState, for
   * Back/Forward) never drift out of sync with what's on screen.
   * `recordHistory: false` is used only when *responding* to a
   * popstate event, so restoring from Back/Forward never pushes a new,
   * redundant entry on top of itself. */
  function applySnapshot(next: ExperienceSnapshot, options: { recordHistory?: boolean } = {}) {
    const { recordHistory = true } = options;
    setSnapshot(next);
    persistToSessionStorage(SESSION_KEY, next);
    if (recordHistory) pushDonnaHistoryState(HISTORY_NAMESPACE, next);
  }

  // The actual request — shared by every caller below. Deliberately
  // does not touch `analysisError` itself; callers that might be
  // superseding a *visible* error reset it explicitly (see
  // handleRetryAnalysis), and the mount-time recovery effect below
  // fires this against a fresh `analysisError` (already null by its
  // own useState default) rather than resetting it — resetting an
  // already-null value synchronously inside that effect is exactly the
  // "adjust state in an effect" anti-pattern this was rewritten to avoid.
  function fireAnalysisRequest(state: WizardState) {
    const generation = ++requestGenerationRef.current;
    requestDecision(state).then((result) => {
      if (requestGenerationRef.current !== generation) return; // superseded — ignore
      if (result.ok) applySnapshot({ phase: "analysing", wizardState: state, report: result.report }, { recordHistory: false });
      else setAnalysisError(result.message);
    });
  }

  function runAnalysis(state: WizardState) {
    setAnalysisError(null);
    fireAnalysisRequest(state);
  }

  // Runs once, only to cover the one gap persistence alone can't: a
  // reload (or a Back landing) that restores into "analysing" with no
  // report and no error yet — meaning a real request was genuinely
  // in-flight when the page was left, and nothing will ever complete
  // it unless it's re-fired here.
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    if (phase === "analysing" && wizardState && !report) {
      fireAnalysisRequest(wizardState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const restored = readDonnaHistoryState<ExperienceSnapshot>(event, HISTORY_NAMESPACE);
      if (!restored) return; // a different namespace, or before Donna's own history began
      applySnapshot(restored, { recordHistory: false });
      if (restored.phase === "analysing" && restored.wizardState && !restored.report) {
        runAnalysis(restored.wizardState);
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleWizardComplete(state: WizardState) {
    // Started the instant analysis begins, not after the choreographed
    // sequence finishes — AnalysingState paces its own visual steps in
    // parallel and only calls handleAnalysisComplete once both this has
    // resolved and its sequence has run. Total wait is max(real,
    // choreographed), never real + choreographed on top of it.
    applySnapshot({ phase: "analysing", wizardState: state, report: null });
    runAnalysis(state);
  }

  function handleAnalysisComplete() {
    applySnapshot({ phase: "results", wizardState, report }, { recordHistory: false });
  }

  function handleRetryAnalysis() {
    // Preserves wizardState exactly as answered — retry re-runs the
    // same request, it never sends the user back through intake.
    if (!wizardState) return;
    runAnalysis(wizardState);
  }

  function handleStartNew() {
    clearSessionStorage(SESSION_KEY);
    setAnalysisError(null);
    applySnapshot({ phase: "intro", wizardState: null, report: null });
  }

  function handleStartAssessment() {
    applySnapshot({ phase: "wizard", wizardState: null, report: null });
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
              {dict.donnaExperience.introBadge}
            </div>

            <div className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-nova-accent text-white shadow-nova-glow">
              <Bot size={34} />
            </div>

            <h1 className="mt-7 text-4xl font-semibold tracking-[-0.035em] text-nova-ink sm:text-5xl">{dict.donnaExperience.h1}</h1>

            <p className="mt-5 text-lg leading-8 text-nova-ink-muted">{dict.donnaExperience.sub}</p>

            <Button size="lg" onClick={handleStartAssessment} className="mt-9 h-12 bg-nova-accent px-7 text-white shadow-nova-glow hover:bg-nova-accent-strong">
              {dict.donnaExperience.startCta}
              <ArrowRight size={17} />
            </Button>

            <p className="mt-4 text-xs text-nova-ink-faint">{dict.donnaExperience.aboutMinute}</p>
          </div>
        )}

        {phase === "wizard" && wizardState === null && <AdaptiveIntake onComplete={handleWizardComplete} />}

        {phase === "analysing" && wizardState && (
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 rounded-2xl border border-titanium bg-carbon p-5">
              <WizardProgress stepIndex={ANALYSIS_STEP_INDEX} />
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-titanium bg-obsidian shadow-nova-glow">
              <AnalysingState
                state={wizardState}
                report={report}
                error={analysisError}
                onComplete={handleAnalysisComplete}
                onRetry={handleRetryAnalysis}
              />
            </div>
          </div>
        )}

        {phase === "results" && wizardState && report && (
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 duration-reveal ease-nova-settle">
            <ResultPanel state={wizardState} report={report} onStartNew={handleStartNew} isSignedIn={isSignedIn} />
          </div>
        )}
      </div>
    </section>
  );
}
