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

type Recommendation = {
  product: string;
  score: number;
  summary: string;
  reasons: string[];
  risks: string[];
  alternatives: Array<{
    name: string;
    score: number;
  }>;
};

const demoRecommendation: Recommendation = {
  product: "SAP Business Data Cloud",
  score: 94,
  summary:
    "The strongest fit for an SAP-centric enterprise seeking governed data products, BW modernization and integrated analytics.",
  reasons: [
    "Native alignment with SAP S/4HANA, BW and Datasphere",
    "Lower transformation complexity for the existing SAP landscape",
    "Strong governance and semantic business-data foundation",
    "Integrated path toward analytics and enterprise AI scenarios",
  ],
  risks: [
    "Commercial model and capacity planning require validation",
    "Non-SAP workloads may need complementary platform services",
  ],
  alternatives: [
    { name: "Microsoft Fabric", score: 86 },
    { name: "Snowflake", score: 83 },
    { name: "Databricks", score: 81 },
  ],
};

function buildReportText(question: string, recommendation: Recommendation) {
  const lines = [
    "ClouDonna — Donna AI Recommendation (Public Alpha preview)",
    "",
    "Requirement",
    `"${question}"`,
    "",
    `Recommendation: ${recommendation.product} — ${recommendation.score}% confidence`,
    recommendation.summary,
    "",
    "Why this platform fits",
    ...recommendation.reasons.map((reason) => `- ${reason}`),
    "",
    "Risks to validate",
    ...recommendation.risks.map((risk) => `- ${risk}`),
    "",
    "Alternatives considered",
    ...recommendation.alternatives.map(
      (alternative) => `- ${alternative.name} — ${alternative.score}%`,
    ),
    "",
    "This is illustrative demo output from the ClouDonna Public Alpha and not a certified recommendation.",
  ];

  return lines.join("\n");
}

function downloadReport(question: string, recommendation: Recommendation) {
  const text = buildReportText(question, recommendation);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const slug = recommendation.product
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

  const recommendation = useMemo(() => demoRecommendation, []);

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

    if (typedSummary.length >= recommendation.summary.length) {
      const completionTimer = window.setTimeout(() => {
        setStatus("complete");
      }, 350);

      return () => window.clearTimeout(completionTimer);
    }

    const timer = window.setTimeout(() => {
      setTypedSummary(
        recommendation.summary.slice(0, typedSummary.length + 2),
      );
    }, 18);

    return () => window.clearTimeout(timer);
  }, [
    recommendation.summary,
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
      className="relative scroll-mt-8 overflow-hidden bg-white px-6 py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-20 h-96 w-96 rounded-full bg-blue-200/40 blur-[130px]" />
        <div className="absolute right-[-8rem] top-10 h-[28rem] w-[28rem] rounded-full bg-violet-200/45 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 shadow-sm">
            <Sparkles size={14} />
            Donna AI Live
          </div>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">
            Turn complex requirements into a clear decision
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Describe your landscape, objectives and constraints. Donna
            structures the decision, compares suitable platforms and creates
            an actionable recommendation.
          </p>

          <Link
            href="/donna-ai"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 transition hover:text-violet-800"
          >
            Try the full guided Donna AI assessment
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="rounded-[2rem] border border-slate-200/80 bg-white/75 p-6 shadow-[0_30px_90px_-45px_rgba(79,70,229,0.3)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-200">
                <Bot size={21} />
              </div>

              <div>
                <div className="font-semibold text-slate-950">Donna AI</div>
                <div className="text-xs text-slate-500">
                  Enterprise decision architect
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2 text-xs text-emerald-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Online
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <Search
                  size={18}
                  className="mt-1 shrink-0 text-violet-600"
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
                  className="w-full resize-none bg-transparent text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <Button
                onClick={submitQuestion}
                disabled={!question.trim() || status === "analysing"}
                className="mt-4 h-11 w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white"
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
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Try an example
              </div>

              <div className="mt-3 space-y-2">
                {exampleQuestions.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setQuestion(example)}
                    className="group flex w-full items-start justify-between gap-3 rounded-xl border border-transparent px-3 py-3 text-left text-sm leading-5 text-slate-600 transition hover:border-violet-200 hover:bg-violet-50"
                  >
                    <span>{example}</span>
                    <ChevronRight
                      size={15}
                      className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-600"
                    />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-h-[38rem] overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-[0_40px_110px_-45px_rgba(79,70,229,0.4)] backdrop-blur-2xl">
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
                <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                      <UserRound size={19} />
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Your requirement
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {submittedQuestion}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-b border-slate-200 px-6 py-4 sm:px-8">
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
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                            selected
                              ? "bg-slate-950 text-white shadow-md"
                              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
                    <ArchitectureView />
                  )}

                  {activeView === "tco" && (
                    <TcoView />
                  )}
                </div>

                <div className="border-t border-slate-200 px-6 py-5 sm:px-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="outline"
                      aria-pressed={saved}
                      onClick={handleToggleSave}
                      className={
                        saved
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-800"
                      }
                    >
                      {saved ? <Check size={16} /> : <Save size={16} />}
                      {saved ? "Saved" : "Save decision"}
                    </Button>

                    <Button
                      variant="outline"
                      aria-expanded={comparisonOpen}
                      aria-controls="donna-comparison-panel"
                      onClick={handleToggleComparison}
                      className={
                        comparisonOpen
                          ? "border-violet-300 bg-violet-50 text-violet-700"
                          : "border-slate-200 bg-white text-slate-800"
                      }
                    >
                      <GitCompareArrows size={16} />
                      {comparisonOpen ? "Hide comparison" : "Compare alternatives"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleExport}
                      className={
                        exported
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-800"
                      }
                    >
                      {exported ? <Check size={16} /> : <Download size={16} />}
                      {exported ? "Downloaded" : "Export report"}
                    </Button>

                    <button
                      type="button"
                      onClick={resetDonna}
                      className="ml-auto text-sm font-medium text-violet-700"
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
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-blue-100 to-violet-100 text-violet-700 shadow-xl shadow-violet-100">
          <Bot size={34} />
        </div>

        <h3 className="mt-7 text-2xl font-semibold text-slate-950">
          Your enterprise decision starts here
        </h3>

        <p className="mt-4 text-sm leading-7 text-slate-500">
          Donna will analyse requirements, existing systems, architecture,
          security, cost, implementation complexity and strategic fit.
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
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
              >
                <ItemIcon
                  size={17}
                  className="text-violet-600"
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
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
            <Bot size={25} />
            <span className="absolute inset-0 animate-ping rounded-2xl border border-violet-400 opacity-30" />
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
              Donna is thinking
            </div>
            <div className="mt-1 font-semibold text-slate-950">
              Analysing your technology decision
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm leading-6 text-slate-600">
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
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>

                <span className="text-sm font-medium text-slate-700">
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

function RecommendationView({
  recommendation,
  typedSummary,
  complete,
}: {
  recommendation: Recommendation;
  typedSummary: string;
  complete: boolean;
}) {
  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
            Donna recommendation
          </div>

          <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {recommendation.product}
          </h3>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            {typedSummary}
            {!complete && (
              <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-violet-600" />
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-center">
          <div className="text-3xl font-semibold text-emerald-700">
            {recommendation.score}%
          </div>
          <div className="mt-1 text-xs font-medium text-emerald-600">
            Confidence
          </div>
        </div>
      </div>

      {complete && (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-5">
            <h4 className="font-semibold text-slate-950">
              Why this platform fits
            </h4>

            <div className="mt-5 space-y-4">
              {recommendation.reasons.map((reason) => (
                <div
                  key={reason}
                  className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check size={14} />
                  </span>
                  {reason}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h4 className="font-semibold text-slate-950">
              Risks to validate
            </h4>

            <div className="mt-5 space-y-4">
              {recommendation.risks.map((risk) => (
                <div
                  key={risk}
                  className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                >
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  {risk}
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Alternatives
              </div>

              <div className="mt-3 space-y-3">
                {recommendation.alternatives.map((alternative) => (
                  <div
                    key={alternative.name}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-slate-600">
                      {alternative.name}
                    </span>
                    <span className="text-sm font-semibold text-slate-950">
                      {alternative.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AlternativesComparison({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const entries = [
    {
      name: recommendation.product,
      score: recommendation.score,
      primary: true,
    },
    ...recommendation.alternatives.map((alternative) => ({
      ...alternative,
      primary: false,
    })),
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Score comparison
      </div>

      <div className="mt-5 space-y-4">
        {entries.map((entry) => (
          <div key={entry.name}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span
                className={
                  entry.primary
                    ? "font-semibold text-slate-950"
                    : "text-slate-600"
                }
              >
                {entry.name}
                {entry.primary && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Recommended
                  </span>
                )}
              </span>
              <span className="font-semibold text-slate-950">
                {entry.score}%
              </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${
                  entry.primary
                    ? "bg-gradient-to-r from-blue-500 to-violet-500"
                    : "bg-slate-400"
                }`}
                style={{ width: `${entry.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureView() {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
        Target architecture
      </div>

      <h3 className="mt-2 text-2xl font-semibold text-slate-950">
        Governed enterprise data and AI foundation
      </h3>

      <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/60 p-8">
        <div className="mx-auto min-w-[40rem] max-w-3xl">
          <ArchitectureNode
            icon={Database}
            label="SAP S/4HANA & BW"
            subtitle="Systems of record"
          />

          <ArchitectureConnection />

          <div className="grid grid-cols-3 gap-4">
            <ArchitectureNode
              icon={Network}
              label="Integration Layer"
              subtitle="APIs and data products"
            />
            <ArchitectureNode
              icon={Cloud}
              label="SAP BDC"
              subtitle="Governed data foundation"
              primary
            />
            <ArchitectureNode
              icon={ShieldCheck}
              label="Governance"
              subtitle="Security and compliance"
            />
          </div>

          <ArchitectureConnection />

          <div className="grid grid-cols-3 gap-4">
            <ArchitectureNode
              icon={BarChart3}
              label="Analytics"
              subtitle="SAC and Power BI"
            />
            <ArchitectureNode
              icon={Bot}
              label="Donna AI"
              subtitle="Decision intelligence"
              primary
            />
            <ArchitectureNode
              icon={Layers3}
              label="Data Products"
              subtitle="Reusable business context"
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
      className={`rounded-2xl border p-4 text-center shadow-sm ${
        primary
          ? "border-violet-300 bg-gradient-to-br from-blue-600 to-violet-600 text-white"
          : "border-slate-200 bg-white text-slate-950"
      }`}
    >
      <Icon
        size={21}
        className={`mx-auto ${
          primary ? "text-white" : "text-violet-600"
        }`}
      />
      <div className="mt-3 text-sm font-semibold">{label}</div>
      <div
        className={`mt-1 text-xs ${
          primary ? "text-white/70" : "text-slate-400"
        }`}
      >
        {subtitle}
      </div>
    </div>
  );
}

function ArchitectureConnection() {
  return (
    <div className="flex h-14 items-center justify-center">
      <div className="h-full w-px bg-gradient-to-b from-violet-300 to-blue-400" />
    </div>
  );
}

function TcoView() {
  const costs = [
    ["Subscription", 820000, 39],
    ["Implementation", 540000, 26],
    ["Infrastructure", 360000, 17],
    ["Operations", 380000, 18],
  ] as const;

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
        Three-year cost model
      </div>

      <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="text-4xl font-semibold text-slate-950">
            CHF 2.1M
          </div>
          <div className="mt-2 text-sm text-emerald-600">
            Estimated 18% below the reference scenario
          </div>
        </div>

        <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700">
          Medium confidence
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {costs.map(([label, amount, share]) => (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-600">{label}</span>
              <span className="font-semibold text-slate-950">
                CHF {amount.toLocaleString("de-CH")}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
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
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="text-xs text-slate-400">{label}</div>
            <div className="mt-2 font-semibold text-slate-950">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
