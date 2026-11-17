"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "../shared";
import { SCORE_DIMENSION_LABELS, SCORE_WEIGHTS } from "../scoring/weights";
import type { ScoreDimensionKey } from "../types";
import { computeRobustness, type RobustnessLevel } from "../engine/robustness";
import { findPivotalDimensions, renormalizeWeights, runScenario, type WeightOverrides } from "../engine/scenario";
import type { RankedPlatform } from "../scoring/types";

const ROBUSTNESS_LABEL: Record<RobustnessLevel, string> = {
  ROBUST: "Robust",
  MODERATELY_ROBUST: "Moderately robust",
  FRAGILE: "Fragile",
};

const ROBUSTNESS_STYLE: Record<RobustnessLevel, string> = {
  ROBUST: "border-nova-success/30 bg-nova-success/10 text-nova-success",
  MODERATELY_ROBUST: "border-nova-warning/30 bg-nova-warning/10 text-nova-warning",
  FRAGILE: "border-red-400/30 bg-red-400/10 text-red-400",
};

const DIMENSION_ORDER = Object.keys(SCORE_WEIGHTS) as ScoreDimensionKey[];

/**
 * Scenario Mode (brief §8/§9/§11/§12) — weight sliders over the real
 * Decision Engine, not a toy. Every number shown (scenario score,
 * ranking, sensitivity, robustness) comes from engine/scenario.ts and
 * engine/robustness.ts, called directly — nothing is computed inline
 * in this component. Recalculation is synchronous and local: these are
 * pure functions over already-computed dimension scores, so "debounce
 * cleanly" (brief §10) does not apply — there is nothing expensive to
 * debounce, and immediate feedback is the better experience brief §10
 * actually asks for when practical.
 *
 * The base decision is never touched: `overrides` is component-local
 * state, reset on unmount, and only ever leaves this component via the
 * optional `onSaveScenario` callback a caller explicitly wires up for a
 * decision that can actually be saved (brief §28).
 */
export function ScenarioWorkbench({
  baseRanked,
  onSaveScenario,
}: {
  baseRanked: RankedPlatform[];
  onSaveScenario?: (overrides: WeightOverrides, changeReason: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [overrides, setOverrides] = useState<WeightOverrides>({});
  const [saveReason, setSaveReason] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasOverrides = Object.keys(overrides).length > 0;
  const weights = useMemo(() => renormalizeWeights(overrides), [overrides]);
  const scenario = useMemo(() => runScenario(baseRanked, overrides), [baseRanked, overrides]);
  const pivotalDimensions = useMemo(() => findPivotalDimensions(baseRanked), [baseRanked]);
  const robustness = useMemo(() => computeRobustness(baseRanked), [baseRanked]);

  const baseWinner = baseRanked[0];
  const baseRunnerUp = baseRanked[1];

  function setWeight(key: ScoreDimensionKey, value: number) {
    setOverrides((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setOverrides({});
    setSaveState("idle");
    setSaveError(null);
  }

  async function handleSave() {
    if (!onSaveScenario || saveReason.trim().length === 0) return;
    setSaveState("saving");
    setSaveError(null);
    const result = await onSaveScenario(overrides, saveReason.trim());
    if (result.ok) {
      setSaveState("saved");
    } else {
      setSaveState("error");
      setSaveError(result.error ?? "The scenario could not be saved.");
    }
  }

  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel>Scenario mode</SectionLabel>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${ROBUSTNESS_STYLE[robustness.level]}`}>
          {ROBUSTNESS_LABEL[robustness.level]}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-nova-ink-muted">{robustness.reasons[0]}</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Weight sliders — interactive weights (brief §8). */}
        <div className="space-y-4">
          {DIMENSION_ORDER.map((key) => {
            const effectiveWeight = weights[key];
            const isOverridden = overrides[key] !== undefined;
            return (
              <div key={key}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className={isOverridden ? "font-medium text-nova-ink" : "text-nova-ink-muted"}>{SCORE_DIMENSION_LABELS[key]}</span>
                  <span className="font-mono tabular-nums text-nova-ink">{Math.round(effectiveWeight * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round((overrides[key] ?? SCORE_WEIGHTS[key]) * 100)}
                  onChange={(event) => setWeight(key, Number(event.target.value) / 100)}
                  aria-label={`${SCORE_DIMENSION_LABELS[key]} weight`}
                  className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-carbon-2 accent-nova-accent"
                />
              </div>
            );
          })}

          <div className="flex items-center gap-3 pt-1">
            <Button type="button" variant="outline" onClick={reset} disabled={!hasOverrides} className="h-9 border-titanium bg-carbon-2 text-xs text-nova-ink hover:border-titanium-strong">
              <RotateCcw size={13} />
              Reset to base
            </Button>
            <p className="text-xs text-nova-ink-faint">Weights always renormalize to 100%. The base decision is never changed here.</p>
          </div>
        </div>

        {/* Live result — base vs scenario. */}
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Scenario ranking</p>
            <div className="mt-2 space-y-2.5">
              {scenario.ranking.map((entry) => {
                const isWinner = entry.platformId === scenario.scenarioWinnerId;
                return (
                  <div key={entry.platformId} className="flex items-center justify-between gap-3 text-sm">
                    <span className={isWinner ? "font-medium text-nova-gold" : "text-nova-ink-muted"}>{entry.name}</span>
                    <span className="flex items-baseline gap-2 font-mono tabular-nums">
                      <span className="text-nova-ink">{entry.scenarioScore}</span>
                      {entry.delta !== 0 && (
                        <span className={entry.delta > 0 ? "text-nova-success" : "text-red-400"}>
                          {entry.delta > 0 ? "+" : "−"}
                          {Math.abs(entry.delta)}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            {scenario.recommendationChanged && hasOverrides && (
              <p className="mt-3 rounded-lg border border-nova-gold/30 bg-nova-gold-wash px-3 py-2 text-xs leading-5 text-nova-ink">
                {scenario.whyItChanged[0]}
              </p>
            )}
          </div>

          {/* Sensitivity map (brief §11). */}
          <div className="border-t border-titanium pt-4">
            <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Sensitivity</p>
            {baseWinner && baseRunnerUp && (
              <p className="mt-2 text-sm leading-6 text-nova-ink-muted">
                Current winner <span className="font-medium text-nova-ink">{baseWinner.platform.productName}</span> · closest challenger{" "}
                <span className="font-medium text-nova-ink">{baseRunnerUp.platform.productName}</span>
              </p>
            )}
            <ul className="mt-2 space-y-1.5">
              {pivotalDimensions
                .filter((p) => p.weightToTie !== null)
                .sort((a, b) => Math.abs(a.weightToTie! - a.currentWeight) - Math.abs(b.weightToTie! - b.currentWeight))
                .slice(0, 3)
                .map((p) => (
                  <li key={p.dimension} className="text-sm leading-6 text-nova-ink-muted">
                    Flips if <span className="font-medium text-nova-ink">{p.label}</span> weight moves {Math.round(p.currentWeight * 100)}% →{" "}
                    <span className="font-mono tabular-nums text-nova-ink">~{Math.round(p.weightToTie! * 100)}%</span>
                  </li>
                ))}
              {pivotalDimensions.every((p) => p.weightToTie === null) && (
                <li className="text-sm text-nova-ink-faint">No single dimension&apos;s weight alone can flip this ranking.</li>
              )}
            </ul>
          </div>

          {onSaveScenario && (
            <div className="border-t border-titanium pt-4">
              {saveState === "saved" ? (
                <p className="text-sm font-medium text-nova-success">Scenario saved as a new decision version.</p>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSave();
                  }}
                  className="flex flex-col gap-2"
                >
                  <label htmlFor="scenario-save-reason" className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">
                    Save this scenario
                  </label>
                  <input
                    id="scenario-save-reason"
                    value={saveReason}
                    onChange={(event) => setSaveReason(event.target.value)}
                    placeholder="e.g. CFO scenario: TCO weighted 2x"
                    disabled={!hasOverrides}
                    className="h-10 rounded-xl border border-titanium bg-carbon-2 px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30 disabled:opacity-50"
                  />
                  {saveState === "error" && saveError && (
                    <p role="alert" className="text-xs text-red-400">
                      {saveError}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={!hasOverrides || saveReason.trim().length === 0 || saveState === "saving"}
                    className="h-10 self-start bg-nova-accent text-sm text-white hover:bg-nova-accent-strong"
                  >
                    {saveState === "saving" ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                    Save scenario as new version
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
