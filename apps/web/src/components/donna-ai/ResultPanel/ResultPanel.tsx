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

// "Overview" carries the executive hierarchy the brief asks for —
// Recommendation, Confidence, Why, Evidence — and is visually primary
// below (see the tab bar markup). Everything after it is a "go deeper"
// tab, styled and framed as secondary, not seven equal peers competing
// for the same attention. "Trade-offs" is the brief's own term for
// what this tab already contained as risks/opportunities.
const PRIMARY_TAB = { value: "overview", label: "Overview" } as const;
const SECONDARY_TABS = [
  { value: "intelligence", label: "AI Insights" },
  { value: "alternatives", label: "Alternatives" },
  { value: "risks", label: "Trade-offs" },
  { value: "roadmap", label: "Roadmap" },
  { value: "architecture", label: "Architecture" },
  { value: "tco", label: "TCO analysis" },
] as const;
const TABS = [PRIMARY_TAB, ...SECONDARY_TABS] as const;

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
    <div className="motion-safe:animate-in motion-safe:fade-in duration-reveal ease-nova-settle">
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
          <div role="tablist" aria-label="Donna AI result view" className="flex flex-wrap items-center gap-2">
            <TabButton tab={PRIMARY_TAB} index={0} selected={activeTab === PRIMARY_TAB.value} registerTab={registerTab} onSelect={setActiveTab} onKeyDown={(e, i) => handleTabKeyDown(e, i, selectTabByIndex)} primary />

            <span className="mx-1 hidden h-5 w-px bg-titanium sm:block" aria-hidden="true" />
            <span className="hidden text-xs font-medium tracking-[0.08em] text-nova-ink-faint uppercase sm:inline">Go deeper</span>

            {SECONDARY_TABS.map((tab, index) => (
              <TabButton
                key={tab.value}
                tab={tab}
                index={index + 1}
                selected={activeTab === tab.value}
                registerTab={registerTab}
                onSelect={setActiveTab}
                onKeyDown={(e, i) => handleTabKeyDown(e, i, selectTabByIndex)}
                showBadge={tab.value === "intelligence" && report.fallback.status !== "ok"}
              />
            ))}
          </div>
        </div>

        <div
          role="tabpanel"
          id={`result-panel-${activeTab}`}
          aria-labelledby={`result-tab-${activeTab}`}
          tabIndex={0}
          key={activeTab}
          className="motion-safe:animate-in motion-safe:fade-in duration-panel ease-nova-settle p-6 sm:p-8"
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

function TabButton({
  tab,
  index,
  selected,
  registerTab,
  onSelect,
  onKeyDown,
  primary = false,
  showBadge = false,
}: {
  tab: { value: TabValue; label: string };
  index: number;
  selected: boolean;
  registerTab: (index: number) => (element: HTMLButtonElement | null) => void;
  onSelect: (value: TabValue) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => void;
  primary?: boolean;
  showBadge?: boolean;
}) {
  return (
    <button
      ref={registerTab(index)}
      type="button"
      role="tab"
      id={`result-tab-${tab.value}`}
      aria-selected={selected}
      aria-controls={`result-panel-${tab.value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => onSelect(tab.value)}
      onKeyDown={(event) => onKeyDown(event, index)}
      className={`rounded-xl font-medium transition-colors duration-control ${primary ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"} ${
        selected
          ? primary
            ? "bg-nova-accent text-white shadow-nova-glow"
            : "bg-carbon-2 text-nova-ink"
          : "text-nova-ink-faint hover:bg-carbon-2 hover:text-nova-ink-muted"
      }`}
    >
      {tab.label}
      {showBadge && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-nova-ink-faint" aria-hidden="true" />}
    </button>
  );
}
