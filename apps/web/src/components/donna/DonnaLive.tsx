"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRovingTabs } from "@/hooks/use-roving-tabs";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  Database,
  Download,
  GitCompareArrows,
  Layers3,
  LoaderCircle,
  Network,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { deriveDemoRecommendation, type DemoDecisionResult } from "./demo-decision-engine";

const exampleQuestions = [
  "We use SAP S/4HANA, BW 7.5 and Azure. Which modern data platform fits us?",
  "Compare SAP Business Data Cloud, Snowflake and Databricks for 3,000 users.",
  "Create a target architecture for SAP, Microsoft Fabric and Power BI.",
];

const analysisSteps = [
  "Structuring business and technology requirements",
  "Evaluating landscape compatibility",
  "Comparing architecture and governance",
  "Estimating cost and implementation effort",
  "Generating evidence-based recommendation",
];

type ResultView = "recommendation" | "architecture" | "tco";

const resultTabs: Array<{ value: ResultView; label: string }> = [
  { value: "recommendation", label: "Recommendation" },
  { value: "architecture", label: "Architecture" },
  { value: "tco", label: "TCO analysis" },
];

function buildReportText(question: string, recommendation: DemoDecisionResult) {
  const { reasoningChain, primary, alternatives, rationale, risks, confidenceExplanation } = recommendation;

  const lines = [
    "ClouDonna — Donna AI Recommendation (Public Alpha preview)",
    "",
    "Requirement",
    `"${question}"`,
    "",
    "Reasoning chain",
    `Goal: ${reasoningChain.goal}`,
    `Capability: ${reasoningChain.capability}`,
    `Solution pattern: ${reasoningChain.solutionPattern}`,
    `Technology pattern: ${reasoningChain.technologyPattern}`,
    "",
    `Recommendation: ${primary.name} — ${primary.score}% illustrative fit`,
    rationale,
    confidenceExplanation,
    "",
    "Risks to validate",
    ...risks.map((risk) => `- ${risk}`),
    "",
    "Alternatives considered",
    ...alternatives.map((alternative) => `- ${alternative.name} — ${alternative.score}%`),
    "",
    "This is illustrative demo output from the ClouDonna Public Alpha, derived deterministically from your input using curated mock data — not live analysis, not real AI, and not a certified recommendation.",
  ];

  return lines.join("\n");
}

function downloadReport(question: string, recommendation: DemoDecisionResult) {
  const text = buildReportText(question, recommendation);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const slug = recommendation.primary.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const link = document.createElement("a");
  link.href = url;
  link.download = `donna-ai-${slug || "recommendation"}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function DonnaLive() {
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [status, setStatus] = useState<
    "idle" | "analysing" | "answering" | "complete"
  >("idle");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [typedSummary, setTypedSummary] = useState("");
  const [activeView, setActiveView] = useState<ResultView>("recommendation");
  const [saved, setSaved] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [exported, setExported] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const { registerTab, handleTabKeyDown } = useRovingTabs(resultTabs.length);

  const recommendation = useMemo(
    () => deriveDemoRecommendation(submittedQuestion),
    [submittedQuestion],
  );

  useEffect(() => {
    if (status !== "analysing") {
      return;
    }

    if (analysisStep >= analysisSteps.length - 1) {
      const finalTimer = window.setTimeout(() => {
        setStatus("answering");
      }, 750);

      return () => window.clearTimeout(finalTimer);
    }

    const timer = window.setTimeout(() => {
      setAnalysisStep((current) => current + 1);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [analysisStep, status]);

  useEffect(() => {
    if (status !== "answering") {
      return;
    }

    if (typedSummary.length >= recommendation.rationale.length) {
      const completionTimer = window.setTimeout(() => {
        setStatus("complete");
      }, 350);

      return () => window.clearTimeout(completionTimer);
    }

    const timer = window.setTimeout(() => {
      setTypedSummary(
        recommendation.rationale.slice(0, typedSummary.length + 2),
      );
    }, 18);

    return () => window.clearTimeout(timer);
  }, [
    recommendation.rationale,
    status,
    typedSummary,
  ]);

  useEffect(() => {
    if (!exported) {
      return;
    }

    const timer = window.setTimeout(() => {
      setExported(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [exported]);

  function submitQuestion() {
    const cleanedQuestion = question.trim();

    if (!cleanedQuestion) {
      return;
    }

    setSubmittedQuestion(cleanedQuestion);
    setAnalysisStep(0);
    setTypedSummary("");
    setActiveView("recommendation");
    setStatus("analysing");
    setSaved(false);
    setComparisonOpen(false);
    setExported(false);
    setLiveMessage("");
  }

  function resetDonna() {
    setQuestion("");
    setSubmittedQuestion("");
    setStatus("idle");
    setAnalysisStep(0);
    setTypedSummary("");
    setSaved(false);
    setComparisonOpen(false);
    setExported(false);
    setLiveMessage("");
  }

  function selectTabByIndex(index: number) {
    setActiveView(resultTabs[index].value);
  }

  function handleToggleSave() {
    setSaved((current) => {
      const next = !current;
      setLiveMessage(
        next ? "Decision saved for this session." : "Decision unsaved.",
      );
      return next;
    });
  }

  function handleToggleComparison() {
    setComparisonOpen((current) => {
      const next = !current;
      setLiveMessage(
        next ? "Comparison view expanded." : "Comparison view collapsed.",
      );
      return next;
    });
  }

  function handleExport() {
    downloadReport(submittedQuestion, recommendation);
    setExported(true);
    setLiveMessage("Report downloaded.");
  }

  return (
    <section
      id="donna"
      className="relative scroll-mt-8 overflow-hidden bg-obsidian px-6 py-28"
    >
      <div className="pointer-events-none absolute inset-0 motion-safe:animate-aurora-drift">
        <div className="absolute left-[-10rem] top-20 h-96 w-96 rounded-full bg-aurora-secondary/20 blur-[130px]" />
        <div className="absolute right-[-8rem] top-10 h-[28rem] w-[28rem] rounded-full bg-aurora-primary/25 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-nova-accent-strong">
            <Sparkles size={14} />
            Donna AI Live
          </div>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-nova-ink sm:text-5xl">
            Turn complex requirements into a clear decision
          </h2>

          <p className="mt-5 text-lg leading-8 text-nova-ink-muted">
            Describe your landscape and what you&apos;re trying to do. Donna compares real alternatives against it and builds a
            recommendation — with the reasoning attached.
          </p>

          <Link
            href="/donna-ai"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-nova-accent-strong transition duration-control hover:text-nova-ink"
          >
            Try the full Donna AI assessment
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="rounded-[2rem] border border-titanium bg-carbon p-6 shadow-nova-resting">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-nova-accent text-white shadow-nova-glow">
                <Bot size={21} />
              </div>

              <div>
                <div className="font-semibold text-nova-ink">Donna AI</div>
                <div className="text-xs text-nova-ink-faint">
                  Enterprise decision architect
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2 text-xs text-nova-success">
                <span className="h-2 w-2 animate-pulse rounded-full bg-nova-success" />
                Online
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-titanium bg-carbon-2 p-4">
              <div className="flex items-start gap-3">
                <Search
                  size={18}
                  className="mt-1 shrink-0 text-nova-accent-strong"
                />

                <label htmlFor="donna-question" className="sr-only">
                  Describe your enterprise landscape and the decision you
                  need to make
                </label>

                <textarea
                  id="donna-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      submitQuestion();
                    }
                  }}
                  rows={6}
                  placeholder="Describe your enterprise landscape and the decision you need to make..."
                  className="w-full resize-none bg-transparent text-sm leading-6 text-nova-ink outline-none placeholder:text-nova-ink-faint"
                />
              </div>

              <Button
                onClick={submitQuestion}
                disabled={!question.trim() || status === "analysing"}
                className="mt-4 h-11 w-full bg-nova-accent text-white hover:bg-nova-accent-strong"
              >
                {status === "analysing" ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                    Analysing
                  </>
                ) : (
                  <>
                    Ask Donna
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>

            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-nova-ink-faint">
                Try an example
              </div>

              <div className="mt-3 space-y-2">
                {exampleQuestions.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setQuestion(example)}
                    className="group flex w-full items-start justify-between gap-3 rounded-xl border border-transparent px-3 py-3 text-left text-sm leading-5 text-nova-ink-muted transition duration-control hover:border-titanium hover:bg-carbon-2"
                  >
                    <span>{example}</span>
                    <ChevronRight
                      size={15}
                      className="mt-1 shrink-0 text-nova-ink-faint transition duration-control group-hover:translate-x-1 group-hover:text-nova-accent-strong"
                    />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-h-[38rem] overflow-hidden rounded-[2rem] border border-titanium bg-obsidian shadow-nova-glow">
            {status === "idle" && (
              <EmptyDonnaState />
            )}

            {status === "analysing" && (
              <AnalysingState
                question={submittedQuestion}
                currentStep={analysisStep}
              />
            )}

            {(status === "answering" ||
              status === "complete") && (
              <div>
                <div className="border-b border-titanium px-6 py-5 sm:px-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-carbon-2 text-nova-accent-strong">
                      <UserRound size={19} />
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-nova-ink-faint">
                        Your requirement
                      </div>
                      <p className="mt-1 text-sm leading-6 text-nova-ink-muted">
                        {submittedQuestion}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-b border-titanium px-6 py-4 sm:px-8">
                  <div
                    role="tablist"
                    aria-label="Donna AI result view"
                    className="flex flex-wrap gap-2"
                  >
                    {resultTabs.map((tab, index) => {
                      const selected = activeView === tab.value;

                      return (
                        <button
                          key={tab.value}
                          ref={registerTab(index)}
                          type="button"
                          role="tab"
                          id={`donna-tab-${tab.value}`}
                          aria-selected={selected}
                          aria-controls={`donna-panel-${tab.value}`}
                          tabIndex={selected ? 0 : -1}
                          onClick={() => setActiveView(tab.value)}
                          onKeyDown={(event) => handleTabKeyDown(event, index, selectTabByIndex)}
                          className={`flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-medium transition duration-control ${
                            selected
                              ? "bg-nova-accent text-white shadow-md"
                              : "text-nova-ink-muted hover:bg-carbon-2 hover:text-nova-ink"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  role="tabpanel"
                  id={`donna-panel-${activeView}`}
                  aria-labelledby={`donna-tab-${activeView}`}
                  tabIndex={0}
                  className="p-6 sm:p-8"
                >
                  {activeView === "recommendation" && (
                    <RecommendationView
                      recommendation={recommendation}
                      typedSummary={typedSummary}
                      complete={status === "complete"}
                    />
                  )}

                  {activeView === "architecture" && (
                    <ArchitectureView recommendation={recommendation} />
                  )}

                  {activeView === "tco" && (
                    <TcoView recommendation={recommendation} />
                  )}
                </div>

                <div className="border-t border-titanium px-6 py-5 sm:px-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="outline"
                      aria-pressed={saved}
                      onClick={handleToggleSave}
                      className={`h-11 ${
                        saved
                          ? "border-nova-success/30 bg-nova-success/10 text-nova-success"
                          : "border-titanium bg-carbon-2 text-nova-ink hover:border-titanium-strong"
                      }`}
                    >
                      {saved ? <Check size={16} /> : <Save size={16} />}
                      {saved ? "Saved" : "Save decision"}
                    </Button>

                    <Button
                      variant="outline"
                      aria-expanded={comparisonOpen}
                      aria-controls="donna-comparison-panel"
                      onClick={handleToggleComparison}
                      className={`h-11 ${
                        comparisonOpen
                          ? "border-nova-accent/40 bg-nova-accent/10 text-nova-accent-strong"
                          : "border-titanium bg-carbon-2 text-nova-ink hover:border-titanium-strong"
                      }`}
                    >
                      <GitCompareArrows size={16} />
                      {comparisonOpen ? "Hide comparison" : "Compare alternatives"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleExport}
                      className={`h-11 ${
                        exported
                          ? "border-nova-success/30 bg-nova-success/10 text-nova-success"
                          : "border-titanium bg-carbon-2 text-nova-ink hover:border-titanium-strong"
                      }`}
                    >
                      {exported ? <Check size={16} /> : <Download size={16} />}
                      {exported ? "Downloaded" : "Export report"}
                    </Button>

                    <button
                      type="button"
                      onClick={resetDonna}
                      className="ml-auto flex min-h-11 items-center px-2 text-sm font-medium text-nova-accent-strong"
                    >
                      Start new analysis
                    </button>
                  </div>

                  {comparisonOpen && (
                    <div id="donna-comparison-panel">
                      <AlternativesComparison recommendation={recommendation} />
                    </div>
                  )}

                  <div role="status" aria-live="polite" className="sr-only">
                    {liveMessage}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyDonnaState() {
  return (
    <div className="flex min-h-[38rem] items-center justify-center p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-nova-accent text-white shadow-nova-glow">
          <Bot size={34} />
        </div>

        <h3 className="mt-7 text-2xl font-semibold text-nova-ink">
          Your enterprise decision starts here
        </h3>

        <p className="mt-4 text-sm leading-7 text-nova-ink-muted">
          The full picture — architecture, cost, risk and fit.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 text-left">
          {[
            ["Architecture", Layers3],
            ["Cost & value", CircleDollarSign],
            ["Risk & security", ShieldCheck],
            ["Platform fit", Database],
          ].map(([label, Icon]) => {
            const ItemIcon = Icon as typeof Layers3;

            return (
              <div
                key={label as string}
                className="flex items-center gap-3 rounded-xl border border-titanium bg-carbon px-4 py-3 text-sm text-nova-ink-muted"
              >
                <ItemIcon
                  size={17}
                  className="text-nova-accent-strong"
                />
                {label as string}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AnalysingState({
  question,
  currentStep,
}: {
  question: string;
  currentStep: number;
}) {
  return (
    <div className="flex min-h-[38rem] flex-col justify-center p-8 sm:p-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-nova-accent text-white">
            <Bot size={25} />
            <span className="absolute inset-0 rounded-2xl border border-nova-accent-strong motion-safe:animate-nova-breathe" />
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-nova-accent-strong">
              Donna is thinking
            </div>
            <div className="mt-1 font-semibold text-nova-ink">
              Analysing your technology decision
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-titanium bg-carbon-2 p-5">
          <p className="text-sm leading-6 text-nova-ink-muted">
            “{question}”
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {analysisSteps.map((step, index) => {
            const completed = index < currentStep;
            const active = index === currentStep;

            return (
              <div
                key={step}
                className={`flex items-center gap-4 rounded-xl border px-4 py-4 transition duration-panel ${
                  active
                    ? "border-nova-accent/40 bg-nova-accent/10"
                    : completed
                      ? "border-nova-success/25 bg-nova-success/10"
                      : "border-titanium bg-carbon opacity-45"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    completed
                      ? "bg-nova-success text-white"
                      : active
                        ? "bg-nova-accent text-white"
                        : "bg-carbon-2 text-nova-ink-faint"
                  }`}
                >
                  {completed ? (
                    <Check size={16} />
                  ) : active ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>

                <span className="text-sm font-medium text-nova-ink-muted">
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReasoningChain({ chain }: { chain: DemoDecisionResult["reasoningChain"] }) {
  const steps = [
    { label: "Goal", value: chain.goal },
    { label: "Capability", value: chain.capability },
    { label: "Solution pattern", value: chain.solutionPattern },
    { label: "Technology pattern", value: chain.technologyPattern },
  ];

  return (
    <ol
      aria-label="Donna's reasoning chain from goal to vendor recommendation"
      className="flex flex-wrap items-stretch gap-2"
    >
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-stretch gap-2">
          <div className="rounded-xl border border-titanium bg-carbon-2 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-nova-ink-faint">
              {index + 1}. {step.label}
            </div>
            <div className="mt-0.5 max-w-[14rem] text-xs font-medium text-nova-ink-muted">
              {step.value}
            </div>
          </div>
          <ChevronRight size={16} aria-hidden="true" className="mt-4 shrink-0 text-nova-ink-faint" />
        </li>
      ))}
      <li className="flex items-stretch">
        <div className="rounded-xl border border-nova-accent/30 bg-nova-accent/10 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-nova-accent-strong">
            5. Vendor recommendation
          </div>
          <div className="mt-0.5 text-xs font-semibold text-nova-accent-strong">Illustrative shortlist below</div>
        </div>
      </li>
    </ol>
  );
}

function RecommendationView({
  recommendation,
  typedSummary,
  complete,
}: {
  recommendation: DemoDecisionResult;
  typedSummary: string;
  complete: boolean;
}) {
  return (
    <div>
      <div className="mb-6 overflow-x-auto">
        <ReasoningChain chain={recommendation.reasoningChain} />
      </div>

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-nova-accent-strong">
              Donna recommendation
            </span>
            <span className="rounded-full border border-titanium bg-carbon-2 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-nova-ink-faint">
              Illustrative example
            </span>
          </div>

          <h3 className="mt-2 text-3xl font-semibold tracking-tight text-nova-ink">
            {recommendation.primary.name}
          </h3>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-nova-ink-muted">
            {typedSummary}
            {!complete && (
              <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-nova-accent-strong" />
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-nova-success/25 bg-nova-success/10 px-5 py-4 text-center">
          <div className="text-3xl font-semibold text-nova-success">
            {recommendation.primary.score}%
          </div>
          <div className="mt-1 text-xs font-medium text-nova-success">
            Illustrative fit
          </div>
        </div>
      </div>

      {complete && (
        <>
          <div className="mt-6 rounded-2xl border border-titanium bg-carbon-2 p-4 text-xs leading-5 text-nova-ink-faint">
            {recommendation.confidenceExplanation}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-titanium p-5">
              <h4 className="font-semibold text-nova-ink">
                Why this fits the pattern above
              </h4>

              <p className="mt-4 text-sm leading-6 text-nova-ink-muted">{recommendation.rationale}</p>
            </div>

            <div className="rounded-2xl border border-titanium p-5">
              <h4 className="font-semibold text-nova-ink">
                Risks to validate
              </h4>

              <div className="mt-5 space-y-4">
                {recommendation.risks.map((risk) => (
                  <div
                    key={risk}
                    className="flex items-start gap-3 text-sm leading-6 text-nova-ink-muted"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-nova-warning" />
                    {risk}
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-titanium pt-5">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-nova-ink-faint">
                  Alternatives
                </div>

                <div className="mt-3 space-y-3">
                  {recommendation.alternatives.map((alternative) => (
                    <div
                      key={alternative.name}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-nova-ink-muted">
                        {alternative.name}
                      </span>
                      <span className="text-sm font-semibold text-nova-ink">
                        {alternative.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AlternativesComparison({
  recommendation,
}: {
  recommendation: DemoDecisionResult;
}) {
  const entries = [
    {
      name: recommendation.primary.name,
      score: recommendation.primary.score,
      primary: true,
    },
    ...recommendation.alternatives.map((alternative) => ({
      ...alternative,
      primary: false,
    })),
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="mt-5 rounded-2xl border border-titanium bg-carbon-2 p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-nova-ink-faint">
        Score comparison
      </div>

      <div className="mt-5 space-y-4">
        {entries.map((entry) => (
          <div key={entry.name}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span
                className={
                  entry.primary
                    ? "font-semibold text-nova-ink"
                    : "text-nova-ink-muted"
                }
              >
                {entry.name}
                {entry.primary && (
                  <span className="ml-2 rounded-full bg-nova-success/15 px-2 py-0.5 text-xs font-medium text-nova-success">
                    Recommended
                  </span>
                )}
              </span>
              <span className="font-semibold text-nova-ink">
                {entry.score}%
              </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-carbon">
              <div
                className={`h-full rounded-full ${entry.primary ? "bg-nova-accent" : "bg-nova-ink-faint"}`}
                style={{ width: `${entry.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureView({ recommendation }: { recommendation: DemoDecisionResult }) {
  const { reasoningChain, primary } = recommendation;

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-nova-accent-strong">
        Target architecture
      </div>

      <h3 className="mt-2 text-2xl font-semibold text-nova-ink">
        {reasoningChain.solutionPattern}
      </h3>

      <div className="mt-8 overflow-x-auto rounded-3xl border border-titanium bg-carbon-2 p-8">
        <div className="mx-auto min-w-[40rem] max-w-3xl">
          <ArchitectureNode
            icon={Database}
            label="Existing systems"
            subtitle="Systems of record"
          />

          <ArchitectureConnection />

          <div className="grid grid-cols-3 gap-4">
            <ArchitectureNode
              icon={Network}
              label="Integration layer"
              subtitle="APIs and data products"
            />
            <ArchitectureNode
              icon={Cloud}
              label={primary.name}
              subtitle={reasoningChain.technologyPattern}
              primary
            />
            <ArchitectureNode
              icon={ShieldCheck}
              label={reasoningChain.capability}
              subtitle="Capability this fulfils"
            />
          </div>

          <ArchitectureConnection />

          <div className="grid grid-cols-3 gap-4">
            <ArchitectureNode
              icon={BarChart3}
              label="Analytics"
              subtitle="Reporting and dashboards"
            />
            <ArchitectureNode
              icon={Bot}
              label="Donna AI"
              subtitle="Decision intelligence"
              primary
            />
            <ArchitectureNode
              icon={Layers3}
              label={reasoningChain.goal}
              subtitle="Business goal this serves"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchitectureNode({
  icon: Icon,
  label,
  subtitle,
  primary = false,
}: {
  icon: typeof Database;
  label: string;
  subtitle: string;
  primary?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center ${
        primary
          ? "border-nova-accent-strong/40 bg-nova-accent text-white shadow-nova-glow"
          : "border-titanium bg-carbon text-nova-ink"
      }`}
    >
      <Icon
        size={21}
        className={`mx-auto ${primary ? "text-white" : "text-nova-accent-strong"}`}
      />
      <div className="mt-3 text-sm font-semibold">{label}</div>
      <div
        className={`mt-1 text-xs ${primary ? "text-white/70" : "text-nova-ink-faint"}`}
      >
        {subtitle}
      </div>
    </div>
  );
}

function ArchitectureConnection() {
  return (
    <div className="flex h-14 items-center justify-center">
      <div className="h-full w-px bg-titanium-strong" />
    </div>
  );
}

function TcoView({ recommendation }: { recommendation: DemoDecisionResult }) {
  const { score } = recommendation.primary;

  // Deterministic, not fabricated-precise: derived from the same score
  // shown on the Recommendation tab so the two tabs never contradict each
  // other, scaled within a clearly illustrative CHF 1.6M–2.5M band.
  const totalCost = Math.round((2_500_000 - (score - 55) * 15_000) / 10_000) * 10_000;
  const belowReference = Math.max(0, Math.min(30, score - 55));
  const confidenceLabel = score >= 80 ? "Higher confidence" : score >= 65 ? "Medium confidence" : "Lower confidence";

  const costs = [
    ["Subscription", Math.round((totalCost * 0.39) / 1000) * 1000, 39],
    ["Implementation", Math.round((totalCost * 0.26) / 1000) * 1000, 26],
    ["Infrastructure", Math.round((totalCost * 0.17) / 1000) * 1000, 17],
    ["Operations", Math.round((totalCost * 0.18) / 1000) * 1000, 18],
  ] as const;

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-nova-accent-strong">
        Three-year cost model
      </div>

      <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="text-4xl font-semibold text-nova-ink">
            CHF {(totalCost / 1_000_000).toFixed(1)}M
          </div>
          <div className="mt-2 text-sm text-nova-success">
            Illustrative estimate, {belowReference}% below the reference scenario
          </div>
        </div>

        <div className="rounded-xl border border-nova-accent/30 bg-nova-accent/10 px-4 py-3 text-sm font-medium text-nova-accent-strong">
          {confidenceLabel}
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {costs.map(([label, amount, share]) => (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-nova-ink-muted">{label}</span>
              <span className="font-semibold text-nova-ink">
                CHF {amount.toLocaleString("de-CH")}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-carbon-2">
              <div
                className="h-full rounded-full bg-nova-accent"
                style={{ width: `${share}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Time to value", "9–15 months"],
          ["Implementation risk", "Medium"],
          ["Expected ROI", "24–36 months"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-titanium bg-carbon-2 p-5"
          >
            <div className="text-xs text-nova-ink-faint">{label}</div>
            <div className="mt-2 font-semibold text-nova-ink">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
