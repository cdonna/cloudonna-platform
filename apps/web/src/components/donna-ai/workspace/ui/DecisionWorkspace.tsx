"use client";

/**
 * Decision Workspace (brief §1-§3/§89) — the single top-level
 * orchestrator for the canonical UNDERSTAND -> EVIDENCE -> COMPARE ->
 * SIMULATE -> CHALLENGE -> DECIDE -> ALIGN -> REMEMBER lifecycle. This
 * is what `/app/decisions/[id]` renders for its current-version view;
 * every leaf panel it composes (ResearchPanel, ScenarioWorkbench,
 * BusinessCasePanel, ChallengerPanel, VendorKnowledgePanel,
 * ExecutiveRecommendationBlock, HumanDecisionPanel, DecisionTimeline,
 * ...) already existed before this sprint — nothing here recomputes a
 * score, a constraint, or a financial figure. The only genuinely new
 * logic is the composition: readiness/next-action/activity/stage-
 * completion, each a pure function over data these panels already
 * trusted individually.
 */
import { useMemo, useState } from "react";
import { SectionLabel } from "../../shared";
import type { DecisionOutput } from "../../types";
import type { DecisionInput } from "../../intelligence/types";
import type { HumanOverride, DecisionVersionSummary } from "../../persistence/decisions-repository";
import type { WeightOverrides } from "../../engine/scenario";
import type { BusinessCaseOptionInput, EconomicScenarioName, TimeHorizonYears } from "../../engine/business-case/types";
import type { ResearchEvidence } from "../../research/types";
import type { DecisionImpact } from "../../vendor-intelligence/evidence-graph/types";
import type { VersionDiff } from "../../persistence/version-diff";
import type { ScoreChangeExplanation } from "../../persistence/score-explanation";
import type { DecisionEvent } from "../../engine/decision-events";
import type { DecisionOutcomeSummary, BusinessCaseActualsSummary, AssumptionValidationSummary } from "../../../../lib/decision-outcomes/repository";
import type { DecisionStakeholder } from "../stakeholders-repository";
import type { DecisionActionItem } from "../action-items-repository";

import { computeDecisionReadiness } from "../decision-readiness";
import { computeNextBestAction } from "../next-best-action";
import { computeStageCompletion, computeCurrentStage, LIFECYCLE_STAGES, type LifecycleStage } from "../lifecycle-stage";
import { deriveWorkspaceStatus } from "../workspace-status";
import { computeRecentActivity } from "../recent-activity";

import { WorkspaceHeader } from "./WorkspaceHeader";
import { LifecycleNav } from "./LifecycleNav";
import { UnderstandStage } from "../stages/UnderstandStage";
import { EvidenceStage } from "../stages/EvidenceStage";
import { CompareStage } from "../stages/CompareStage";
import { SimulateStage } from "../stages/SimulateStage";
import { ChallengeStage } from "../stages/ChallengeStage";
import { DecideStage } from "../stages/DecideStage";
import { AlignStage } from "../stages/AlignStage";
import { RememberStage } from "../stages/RememberStage";

interface ResearchConflictRow {
  id: string;
  claimAEvidenceId: string;
  claimBEvidenceId: string;
  severity: "low" | "medium" | "high";
  explanation: string;
  status: "open" | "resolved" | "dismissed";
}

export type WorkspaceMode = "executive" | "analyst";

export interface DecisionWorkspaceProps {
  decisionId: string;
  title: string;
  humanReadableId: string;
  decisionStatus: string;
  organizationName: string | null;
  ownerEmail: string | null;
  lastUpdatedAt: string;
  decisionInput: DecisionInput;
  output: DecisionOutput;
  humanOverride: HumanOverride | null;
  editable: boolean;
  researchEvidence: ResearchEvidence[];
  researchConflicts: ResearchConflictRow[];
  decisionImpacts: DecisionImpact[];
  stakeholders: DecisionStakeholder[];
  actionItems: DecisionActionItem[];
  versions: DecisionVersionSummary[];
  currentVersionNumber: number;
  displayedVersionNumber: number;
  diff?: VersionDiff | null;
  diffExplanation?: ScoreChangeExplanation | null;
  diffEvents?: DecisionEvent[];
  outcome: DecisionOutcomeSummary | null;
  actuals: BusinessCaseActualsSummary | null;
  assumptions: AssumptionValidationSummary[];
}

/** Same fetch-to-/api/decisions/[id]/versions pattern
 * DecisionCommandCenter.tsx already uses — a plain client-side POST,
 * not a Server Action, since this is a "use client" component tree
 * and the page.tsx that renders it is a server component (functions
 * cannot cross that boundary as props). */
async function appendVersion(decisionId: string, body: { decisionInput: DecisionInput; changeReason: string; humanOverride?: HumanOverride | null }): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/decisions/${decisionId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decisionInput: body.decisionInput,
        enrichment: null,
        provider: { providerId: "deterministic-v2", model: null },
        fallback: { status: "ok", reason: null },
        changeReason: body.changeReason,
        humanOverride: body.humanOverride ?? null,
      }),
    });
    const data: { error?: string } = await response.json();
    if (!response.ok) return { ok: false, error: data.error ?? "The request could not be processed." };
    return { ok: true };
  } catch {
    return { ok: false, error: "The request could not be processed. Check your connection and try again." };
  }
}

function ExecutiveSummaryCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-3 text-sm leading-6 text-nova-ink-muted">{children}</div>
      <p className="mt-3 text-xs text-nova-ink-faint">Switch to Analyst mode for the full detail behind this summary.</p>
    </div>
  );
}

export function DecisionWorkspace(props: DecisionWorkspaceProps) {
  const engineResult = props.output.engineResult;
  const [mode, setMode] = useState<WorkspaceMode>("executive");

  const baseRanked = useMemo(() => [props.output.recommendation, ...props.output.alternatives], [props.output]);

  const openResearchConflictCount = props.researchConflicts.filter((c) => c.status === "open").length;

  const stakeholderAlignmentCounts = useMemo(() => {
    const counts: Partial<Record<DecisionStakeholder["alignmentStatus"], number>> = {};
    for (const s of props.stakeholders) counts[s.alignmentStatus] = (counts[s.alignmentStatus] ?? 0) + 1;
    return counts;
  }, [props.stakeholders]);

  const economicBuyer = props.stakeholders.find((s) => (s.role ?? "").toLowerCase().includes("economic buyer"));
  const hasEconomicBuyerAligned = economicBuyer ? economicBuyer.alignmentStatus === "aligned" || economicBuyer.alignmentStatus === "approved" : null;

  // Both useState calls below must run on every render regardless of
  // whether engineResult exists (Rules of Hooks) — the lazy
  // initializer handles the null case inline rather than skipping the
  // hook call via an early return above it.
  const [activeStage, setActiveStage] = useState<LifecycleStage>(() => {
    if (!engineResult) return "understand";
    const hasScenarioOverridesInitial = Boolean(props.decisionInput.scenarioOverrides && Object.keys(props.decisionInput.scenarioOverrides).length > 0);
    const allStakeholdersReviewedInitial = props.stakeholders.length > 0 && props.stakeholders.every((s) => s.alignmentStatus !== "not_reviewed");
    const initialCompletion = computeStageCompletion({
      isContextComplete: engineResult.confidence.level === "HIGH",
      evidenceCoverage: engineResult.evidenceDiagnostics.coverage,
      hasResearchEvidence: props.researchEvidence.length > 0,
      optionCount: baseRanked.length,
      hasBusinessCase: Boolean(engineResult.businessCase),
      hasScenarioOverrides: hasScenarioOverridesInitial,
      hasChallengerRun: engineResult.challenges !== undefined,
      hasHumanDecision: props.humanOverride !== null,
      hasStakeholders: props.stakeholders.length > 0,
      allStakeholdersReviewed: allStakeholdersReviewedInitial,
      hasOutcomeRecorded: Boolean(props.outcome && (props.outcome.implementationStarted || props.outcome.realizedOutcomeKnown)),
    });
    return computeCurrentStage(initialCompletion);
  });

  if (!engineResult) {
    return <p className="text-sm text-nova-ink-faint">This decision has no computed result to display.</p>;
  }

  const readiness = computeDecisionReadiness({
    confidenceLevel: engineResult.confidence.level,
    evidenceDiagnostics: engineResult.evidenceDiagnostics,
    constraints: engineResult.constraints,
    challenges: engineResult.challenges,
    businessCase: engineResult.businessCase,
    optionCount: baseRanked.length,
    scenarioRobust: engineResult.scenarios.robust,
    openResearchConflictCount,
    stakeholderAlignmentCounts,
    hasEconomicBuyerAligned,
  });

  const nextBestAction = computeNextBestAction(readiness, props.humanOverride !== null);

  const hasScenarioOverrides = Boolean(props.decisionInput.scenarioOverrides && Object.keys(props.decisionInput.scenarioOverrides).length > 0);
  const allStakeholdersReviewed = props.stakeholders.length > 0 && props.stakeholders.every((s) => s.alignmentStatus !== "not_reviewed");

  const stageCompletion = computeStageCompletion({
    isContextComplete: engineResult.confidence.level === "HIGH",
    evidenceCoverage: engineResult.evidenceDiagnostics.coverage,
    hasResearchEvidence: props.researchEvidence.length > 0,
    optionCount: baseRanked.length,
    hasBusinessCase: Boolean(engineResult.businessCase),
    hasScenarioOverrides,
    hasChallengerRun: engineResult.challenges !== undefined,
    hasHumanDecision: props.humanOverride !== null,
    hasStakeholders: props.stakeholders.length > 0,
    allStakeholdersReviewed,
    hasOutcomeRecorded: Boolean(props.outcome && (props.outcome.implementationStarted || props.outcome.realizedOutcomeKnown)),
  });

  const displayStatus = deriveWorkspaceStatus({
    decisionStatus: props.decisionStatus,
    hasEngineResult: true,
    readinessLevel: readiness.level,
    hasHumanDecision: props.humanOverride !== null,
    implementationStarted: props.outcome?.implementationStarted ?? false,
    realizedOutcomeKnown: props.outcome?.realizedOutcomeKnown ?? false,
  });

  const recentActivity = computeRecentActivity(
    props.versions.map((v) => ({ versionNumber: v.versionNumber, changeReason: v.changeReason, createdAt: v.createdAt })),
    props.decisionImpacts,
  );

  async function handleSaveScenario(overrides: WeightOverrides, changeReason: string) {
    return appendVersion(props.decisionId, { decisionInput: { ...props.decisionInput, scenarioOverrides: overrides }, changeReason: `Scenario saved: ${changeReason}` });
  }

  async function handleSaveBusinessCase(input: { options: BusinessCaseOptionInput[]; horizonYears: TimeHorizonYears; discountRatePercent: number; economicScenario: EconomicScenarioName }) {
    return appendVersion(props.decisionId, {
      decisionInput: { ...props.decisionInput, businessCaseInputs: input.options, horizonYears: input.horizonYears, discountRatePercent: input.discountRatePercent, economicScenario: input.economicScenario },
      changeReason: "Business case saved",
    });
  }

  async function handleRecordOverride(selectedOptionId: string, rationale: string) {
    return appendVersion(props.decisionId, { decisionInput: props.decisionInput, changeReason: "Final human decision recorded", humanOverride: { selectedOptionId, rationale } });
  }

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title={props.title}
        humanReadableId={props.humanReadableId}
        displayStatus={displayStatus}
        organizationName={props.organizationName}
        ownerEmail={props.ownerEmail}
        deadline={props.decisionInput.enterpriseContext?.migrationDeadline ?? null}
        investmentAtStakeChf={engineResult.businessCase?.options[0]?.summary.tco ?? null}
        currentStage={activeStage}
        lastUpdated={props.lastUpdatedAt}
        confidenceLevel={engineResult.confidence.level}
        readinessLevel={readiness.level}
        nextBestAction={nextBestAction}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <LifecycleNav activeStage={activeStage} onChange={setActiveStage} completion={stageCompletion} />
        <div role="group" aria-label="View mode" className="flex shrink-0 rounded-full border border-titanium bg-carbon-2 p-0.5 text-xs">
          {(["executive", "analyst"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              aria-pressed={mode === option}
              className={`rounded-full px-3 py-1 font-medium capitalize transition duration-150 ${mode === option ? "bg-nova-accent text-white" : "text-nova-ink-faint hover:text-nova-ink"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel">
        {activeStage === "understand" && (
          <UnderstandStage title={props.title} decisionInput={props.decisionInput} ranked={baseRanked} businessCase={engineResult.businessCase} />
        )}

        {activeStage === "evidence" &&
          (mode === "executive" ? (
            <ExecutiveSummaryCard label="Evidence">
              <p>
                {Math.round(engineResult.evidenceDiagnostics.coverage * 100)}% of scoring dimensions have supporting evidence.{" "}
                {openResearchConflictCount > 0 ? `${openResearchConflictCount} evidence conflict(s) remain open.` : "No open evidence conflicts."}
              </p>
            </ExecutiveSummaryCard>
          ) : (
            <EvidenceStage
              decisionId={props.decisionId}
              ranked={baseRanked}
              evidence={engineResult.evidence}
              evidenceDiagnostics={engineResult.evidenceDiagnostics}
              researchEvidence={props.researchEvidence}
              researchConflicts={props.researchConflicts}
              decisionImpacts={props.decisionImpacts}
              editable={props.editable}
            />
          ))}

        {activeStage === "compare" && <CompareStage engineResult={engineResult} ranked={baseRanked} />}

        {activeStage === "simulate" &&
          (mode === "executive" ? (
            <ExecutiveSummaryCard label="Economics">
              {engineResult.businessCase ? (
                <p>
                  Modeled TCO {new Intl.NumberFormat("en-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(engineResult.businessCase.options[0]?.summary.tco ?? 0)}, NPV{" "}
                  {new Intl.NumberFormat("en-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(engineResult.businessCase.options[0]?.summary.npv ?? 0)}.{" "}
                  {engineResult.scenarios.robust ? "The recommendation is robust under sensitivity." : "The recommendation changes under at least one sensitivity scenario."}
                </p>
              ) : (
                <p>No business case has been modeled yet.</p>
              )}
            </ExecutiveSummaryCard>
          ) : (
            <SimulateStage engineResult={engineResult} baseRanked={baseRanked} onSaveScenario={props.editable ? handleSaveScenario : undefined} onSaveBusinessCase={props.editable ? handleSaveBusinessCase : undefined} />
          ))}

        {activeStage === "challenge" &&
          (mode === "executive" ? (
            <ExecutiveSummaryCard label="Challenger">
              <p>{engineResult.challenges === undefined ? "The Challenger has not reviewed this decision yet." : `${engineResult.challenges.length} finding(s), ${engineResult.challenges.filter((c) => c.status === "open").length} still open.`}</p>
            </ExecutiveSummaryCard>
          ) : (
            <ChallengeStage decisionId={props.decisionId} />
          ))}

        {activeStage === "decide" && (
          <DecideStage
            output={props.output}
            engineResult={engineResult}
            humanOverride={props.humanOverride}
            readiness={readiness}
            nextBestAction={nextBestAction}
            editable={props.editable}
            onRecordOverride={props.editable ? handleRecordOverride : undefined}
          />
        )}

        {activeStage === "align" && (
          <AlignStage decisionId={props.decisionId} editable={props.editable} initialStakeholders={props.stakeholders} initialActionItems={props.actionItems} />
        )}

        {activeStage === "remember" && (
          <RememberStage
            decisionId={props.decisionId}
            editable={props.editable}
            recentActivity={recentActivity}
            initialOutcome={props.outcome}
            initialActuals={props.actuals}
            initialAssumptions={props.assumptions}
            versions={props.versions}
            currentVersionNumber={props.currentVersionNumber}
            displayedVersionNumber={props.displayedVersionNumber}
            diff={props.diff}
            diffExplanation={props.diffExplanation}
            diffEvents={props.diffEvents}
          />
        )}
      </div>
    </div>
  );
}

export { LIFECYCLE_STAGES };
