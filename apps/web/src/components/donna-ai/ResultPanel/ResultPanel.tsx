"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRovingTabs } from "@/hooks/use-roving-tabs";
import { downloadReport } from "../engine";
import type { DecisionReport } from "../intelligence/types";
import { SaveDecisionDialog } from "../persistence/SaveDecisionDialog";
import type { WizardState } from "../types";
import { AlternativesTab } from "./AlternativesTab";
import { ArchitectureTab } from "./ArchitectureTab";
import { IntelligenceTab } from "./IntelligenceTab";
import { OverviewTab } from "./OverviewTab";
import { RisksOpportunitiesTab } from "./RisksOpportunitiesTab";
import { RoadmapTab } from "./RoadmapTab";
import { TcoTab } from "./TcoTab";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "intelligence", label: "AI Insights" },
  { value: "alternatives", label: "Comparison" },
  { value: "risks", label: "Risks & Opportunities" },
  { value: "roadmap", label: "Roadmap" },
  { value: "architecture", label: "Architecture" },
  { value: "tco", label: "TCO analysis" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export function ResultPanel({
  state,
  report,
  onStartNew,
  isSignedIn,
}: {
  state: WizardState;
  report: DecisionReport;
  onStartNew: () => void;
  isSignedIn: boolean;
}) {
  const output = report.output;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
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

  function handleSaveClick() {
    // Signed-out: navigate to sign-in — never silently persist, never
    // open the save dialog without a real session behind it (the API
    // route re-checks this regardless, but the UI should not pretend a
    // save is possible when it isn't). Signed-in: open the real dialog.
    if (!isSignedIn) {
      router.push("/login");
      return;
    }
    setSaveDialogOpen(true);
  }

  function handleExport() {
    downloadReport(state, output);
    setExported(true);
    setLiveMessage("Report downloaded.");
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-nova-success/30 bg-nova-success/10 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-nova-success uppercase">
          Analysis complete
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-nova-ink sm:text-4xl">Your recommendation is ready</h2>
        <p className="mx-auto mt-4 max-w-xl text-xs leading-5 text-nova-ink-faint">
          Illustrative alpha output based on curated mock data. No live market data was used
          {report.fallback.status === "ok"
            ? ", and the AI Insights tab below is an AI-enriched narrative that did not affect any score"
            : ", no AI model was called for this result"}
          , and this assessment is only saved if you explicitly choose to save it below.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-titanium bg-obsidian shadow-nova-glow">
        <div className="border-b border-titanium px-4 py-4 sm:px-8">
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
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition duration-200 ${
                    selected ? "bg-nova-accent text-white shadow-md" : "text-nova-ink-muted hover:bg-carbon-2 hover:text-nova-ink"
                  }`}
                >
                  {tab.label}
                  {tab.value === "intelligence" && report.fallback.status !== "ok" && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-nova-ink-faint" aria-hidden="true" />
                  )}
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
          {activeTab === "intelligence" && <IntelligenceTab report={report} />}
          {activeTab === "alternatives" && <AlternativesTab output={output} />}
          {activeTab === "risks" && <RisksOpportunitiesTab output={output} />}
          {activeTab === "roadmap" && <RoadmapTab output={output} />}
          {activeTab === "architecture" && <ArchitectureTab />}
          {activeTab === "tco" && <TcoTab />}
        </div>

        <div className="border-t border-titanium px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={handleSaveClick} className="border-titanium bg-carbon-2 text-nova-ink hover:border-titanium-strong">
              <Save size={16} />
              Save decision
            </Button>

            <Button
              variant="outline"
              onClick={handleExport}
              className={exported ? "border-nova-success/30 bg-nova-success/10 text-nova-success" : "border-titanium bg-carbon-2 text-nova-ink hover:border-titanium-strong"}
            >
              {exported ? <Check size={16} /> : <Download size={16} />}
              {exported ? "Downloaded" : "Export report"}
            </Button>

            <button type="button" onClick={onStartNew} className="ml-auto text-sm font-medium text-nova-accent-strong">
              Start new analysis
            </button>
          </div>

          <div role="status" aria-live="polite" className="sr-only">
            {liveMessage}
          </div>
        </div>
      </div>

      {isSignedIn && saveDialogOpen && (
        <SaveDecisionDialog onClose={() => setSaveDialogOpen(false)} wizardState={state} report={report} />
      )}
    </div>
  );
}
