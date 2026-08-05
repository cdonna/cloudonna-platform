"use client";

import { useEffect, useState } from "react";
import { Check, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRovingTabs } from "@/hooks/use-roving-tabs";
import { downloadReport } from "../engine";
import type { DecisionOutput, WizardState } from "../types";
import { AlternativesTab } from "./AlternativesTab";
import { ArchitectureTab } from "./ArchitectureTab";
import { OverviewTab } from "./OverviewTab";
import { RisksOpportunitiesTab } from "./RisksOpportunitiesTab";
import { RoadmapTab } from "./RoadmapTab";
import { TcoTab } from "./TcoTab";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "alternatives", label: "Comparison" },
  { value: "risks", label: "Risks & Opportunities" },
  { value: "roadmap", label: "Roadmap" },
  { value: "architecture", label: "Architecture" },
  { value: "tco", label: "TCO analysis" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export function ResultPanel({
  state,
  output,
  onStartNew,
}: {
  state: WizardState;
  output: DecisionOutput;
  onStartNew: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  const [saved, setSaved] = useState(false);
  const [exported, setExported] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const { registerTab, handleTabKeyDown } = useRovingTabs(TABS.length);

  useEffect(() => {
    if (!exported) return;
    const timer = window.setTimeout(() => setExported(false), 1800);
    return () => window.clearTimeout(timer);
  }, [exported]);

  function selectTabByIndex(index: number) {
    setActiveTab(TABS[index].value);
  }

  function handleToggleSave() {
    setSaved((current) => {
      const next = !current;
      setLiveMessage(next ? "Decision saved for this session." : "Decision unsaved.");
      return next;
    });
  }

  function handleExport() {
    downloadReport(state, output);
    setExported(true);
    setLiveMessage("Report downloaded.");
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Analysis complete
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
          Your recommendation is ready
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-xs leading-5 text-slate-400">
          Illustrative alpha output based on curated mock data. No live market data was used, no
          AI model was called, and this assessment is not saved or persisted anywhere.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-[0_40px_110px_-45px_rgba(79,70,229,0.4)] backdrop-blur-2xl">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-8">
          <div role="tablist" aria-label="Donna AI result view" className="flex flex-wrap gap-2">
            {TABS.map((tab, index) => {
              const selected = activeTab === tab.value;

              return (
                <button
                  key={tab.value}
                  ref={registerTab(index)}
                  type="button"
                  role="tab"
                  id={`result-tab-${tab.value}`}
                  aria-selected={selected}
                  aria-controls={`result-panel-${tab.value}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.value)}
                  onKeyDown={(event) => handleTabKeyDown(event, index, selectTabByIndex)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
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
          id={`result-panel-${activeTab}`}
          aria-labelledby={`result-tab-${activeTab}`}
          tabIndex={0}
          key={activeTab}
          className="animate-in fade-in duration-200 p-6 sm:p-8"
        >
          {activeTab === "overview" && <OverviewTab output={output} />}
          {activeTab === "alternatives" && <AlternativesTab output={output} />}
          {activeTab === "risks" && <RisksOpportunitiesTab output={output} />}
          {activeTab === "roadmap" && <RoadmapTab output={output} />}
          {activeTab === "architecture" && <ArchitectureTab />}
          {activeTab === "tco" && <TcoTab />}
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
              onClick={onStartNew}
              className="ml-auto text-sm font-medium text-violet-700"
            >
              Start new analysis
            </button>
          </div>

          <div role="status" aria-live="polite" className="sr-only">
            {liveMessage}
          </div>
        </div>
      </div>
    </div>
  );
}
