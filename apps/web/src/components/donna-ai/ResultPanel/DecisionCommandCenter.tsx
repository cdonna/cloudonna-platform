"use client";

import { useState } from "react";
import { SectionLabel } from "../shared";
import type { DecisionOutput } from "../types";
import type { DecisionInput } from "../intelligence/types";
import type { HumanOverride } from "../persistence/decisions-repository";
import { HumanDecisionPanel } from "../persistence/HumanDecisionPanel";
import { ConstraintsView } from "./ConstraintsView";
import { EvidenceExplorer } from "./EvidenceExplorer";
import { RiskCockpit } from "./RiskCockpit";
import { ScenarioWorkbench } from "./ScenarioWorkbench";
import { SCORE_DIMENSION_LABELS } from "../scoring/weights";
import type { WeightOverrides } from "../engine/scenario";

type Mode = "executive" | "analyst";

/**
 * Decision Engine V1.1 — Interactive Decision Command Center (brief
 * §1-§22). The single client-side orchestrator for every new V1.1
 * surface, so there is one place (not one per tab) that decides what
 * Executive Mode hides and Analyst Mode shows. Every number rendered
 * anywhere inside this component traces back to `output.engineResult`
 * — nothing here recomputes a score, a constraint, or a ranking; this
 * file only lays the existing engine's output out.
 *
 * `editable` gates both Scenario-saving and Human-decision-recording —
 * false for a historical version view (consistent with
 * AppendVersionAction's own isHistorical rule) and for the live,
 * unsaved wizard result (no decisionId to append a version to yet).
 */
export function DecisionCommandCenter({
  output,
  decisionId,
  decisionInput,
  humanOverride,
  editable,
}: {
  output: DecisionOutput;
  decisionId?: string;
  decisionInput?: DecisionInput;
  humanOverride?: HumanOverride | null;
  editable: boolean;
}) {
  const [mode, setMode] = useState<Mode>("executive");
  const engineResult = output.engineResult;
  if (!engineResult) return null;

  const baseRanked = [output.recommendation, ...output.alternatives];

  async function appendVersion(body: { decisionInput: DecisionInput; changeReason: string; humanOverride?: HumanOverride | null }) {
    if (!decisionId) return { ok: false, error: "This decision has not been saved yet." };
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

  async function handleSaveScenario(overrides: WeightOverrides, changeReason: string) {
    if (!decisionInput) return { ok: false, error: "This decision has not been saved yet." };
    return appendVersion({ decisionInput: { ...decisionInput, scenarioOverrides: overrides }, changeReason: `Scenario saved: ${changeReason}` });
  }

  async function handleRecordOverride(selectedOptionId: string, rationale: string) {
    if (!decisionInput) return { ok: false, error: "This decision has not been saved yet." };
    return appendVersion({
      decisionInput,
      changeReason: "Final human decision recorded",
      humanOverride: { selectedOptionId, rationale },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>Decision Command Center</SectionLabel>
        <div role="group" aria-label="View mode" className="flex rounded-full border border-titanium bg-carbon-2 p-0.5 text-xs">
          {(["executive", "analyst"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              aria-pressed={mode === option}
              className={`rounded-full px-3 py-1 font-medium capitalize transition duration-150 ${
                mode === option ? "bg-nova-accent text-white" : "text-nova-ink-faint hover:text-nova-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <HumanDecisionPanel engineResult={engineResult} humanOverride={humanOverride ?? null} onRecordOverride={editable ? handleRecordOverride : undefined} />

      <ConstraintsView engineResult={engineResult} />

      {mode === "analyst" && (
        <>
          <ScenarioWorkbench baseRanked={baseRanked} onSaveScenario={editable ? handleSaveScenario : undefined} />
          <EvidenceExplorer evidence={engineResult.evidence} diagnostics={engineResult.evidenceDiagnostics} dimensionLabels={SCORE_DIMENSION_LABELS} />
          <RiskCockpit risks={engineResult.risks} />
        </>
      )}

      {mode === "executive" && (
        <div className="rounded-2xl border border-titanium bg-carbon p-5">
          <SectionLabel>Conditions to reconsider</SectionLabel>
          {engineResult.conditionsToReconsider.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {engineResult.conditionsToReconsider.map((condition) => (
                <li key={condition} className="text-sm leading-6 text-nova-ink-muted">
                  {condition}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-nova-ink-faint">No conditions identified that would currently change this recommendation.</p>
          )}
        </div>
      )}
    </div>
  );
}
