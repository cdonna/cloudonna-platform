"use client";

/**
 * Simulate stage (brief §23-§26) — Scenario and Business Case brought
 * together under one stage, never feeling like a separate Scenario
 * Lab (brief §24). Assumption visibility (brief §25) is read directly
 * from EngineResult.assumptions plus the Challenger's
 * ASSUMPTION_CHALLENGE findings when present — no separate assumption
 * store exists for the deterministic engine's own assumptions text.
 */
import { SectionLabel } from "../../shared";
import { ScenarioWorkbench } from "../../ResultPanel/ScenarioWorkbench";
import { BusinessCasePanel } from "../../ResultPanel/BusinessCasePanel";
import type { RankedPlatform } from "../../scoring/types";
import type { EngineResult } from "../../engine/recommendation";
import type { WeightOverrides } from "../../engine/scenario";
import type { BusinessCaseOptionInput, EconomicScenarioName, TimeHorizonYears } from "../../engine/business-case/types";

export function SimulateStage({
  engineResult,
  baseRanked,
  onSaveScenario,
  onSaveBusinessCase,
}: {
  engineResult: EngineResult;
  baseRanked: RankedPlatform[];
  onSaveScenario?: (overrides: WeightOverrides, changeReason: string) => Promise<{ ok: boolean; error?: string }>;
  onSaveBusinessCase?: (input: { options: BusinessCaseOptionInput[]; horizonYears: TimeHorizonYears; discountRatePercent: number; economicScenario: EconomicScenarioName }) => Promise<{ ok: boolean; error?: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-titanium bg-carbon p-5">
        <SectionLabel>Assumptions</SectionLabel>
        {engineResult.assumptions.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {engineResult.assumptions.map((assumption) => (
              <li key={assumption} className="text-sm leading-6 text-nova-ink-muted">
                {assumption}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-nova-ink-faint">No assumptions recorded for this result.</p>
        )}
        <div className="mt-4 border-t border-titanium pt-4">
          <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Sensitivity</p>
          <p className="mt-2 text-sm leading-6 text-nova-ink-muted">
            {engineResult.scenarios.robust
              ? "The recommendation is robust — it did not change under any modeled sensitivity scenario."
              : `The recommendation changed under: ${engineResult.scenarios.winnerChangedUnder.join(", ")}.`}
          </p>
          {engineResult.scenarios.pivotalDimensions.length > 0 && (
            <p className="mt-2 text-xs text-nova-ink-faint">
              Most pivotal: {engineResult.scenarios.pivotalDimensions.slice(0, 3).map((p) => p.label).join(", ")}.
            </p>
          )}
        </div>
      </div>

      <ScenarioWorkbench baseRanked={baseRanked} onSaveScenario={onSaveScenario} />
      <BusinessCasePanel baseRanked={baseRanked} businessCase={engineResult.businessCase ?? null} onSaveBusinessCase={onSaveBusinessCase} />
    </div>
  );
}
