"use client";

/**
 * Compare stage (brief §19-§22) — the strongest vendor-neutral
 * comparison experience: the Option Matrix first, detailed
 * constraint-eligibility underneath. Never reduces the experience to
 * one total score (brief §19) — every option's own dimension
 * breakdown remains reachable, not collapsed away.
 */
import { ConstraintsView } from "../../ResultPanel/ConstraintsView";
import { OptionMatrix } from "./OptionMatrix";
import type { RankedPlatform } from "../../scoring/types";
import type { EngineResult } from "../../engine/recommendation";

export function CompareStage({ engineResult, ranked }: { engineResult: EngineResult; ranked: RankedPlatform[] }) {
  return (
    <div className="space-y-6">
      <OptionMatrix ranked={ranked} ranking={engineResult.ranking} recommendedOptionId={engineResult.recommendedOption.id} businessCase={engineResult.businessCase} />
      <ConstraintsView engineResult={engineResult} />
    </div>
  );
}
