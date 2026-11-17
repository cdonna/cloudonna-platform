"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "../shared";
import type { RankedPlatform } from "../scoring/types";
import {
  BENEFIT_CATEGORY_LABELS,
  COST_CATEGORY_LABELS,
  type BenefitCategory,
  type BenefitLineItem,
  type BusinessCaseOptionInput,
  type BusinessCaseOutput,
  type CostCategory,
  type CostLineItem,
  type EconomicScenarioName,
  type FinancialProvenance,
  type TimeHorizonYears,
} from "../engine/business-case/types";

const SCENARIO_LABEL: Record<EconomicScenarioName, string> = { base: "Base", upside: "Upside", downside: "Downside", custom: "Custom" };
const PROVENANCE_OPTIONS: FinancialProvenance[] = ["customer-input", "official-source", "observed-data", "calculated", "ai-interpretation", "assumption"];
const PROVENANCE_LABEL: Record<FinancialProvenance, string> = {
  "customer-input": "Customer input",
  "official-source": "Official source",
  "observed-data": "Observed data",
  calculated: "Calculated",
  "ai-interpretation": "AI interpretation",
  assumption: "Assumption",
};

function currency(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

interface DraftState {
  costs: CostLineItem[];
  benefits: BenefitLineItem[];
}

function emptyDraft(): DraftState {
  return { costs: [], benefits: [] };
}

/**
 * Enterprise Business Case Engine UI (brief §15/§18). Scoped to the
 * current winner and runner-up — a "should we do A or B" business
 * case is the realistic unit of comparison, not a 10-way simultaneous
 * cost model. Every number below the entry form is read directly from
 * `engineResult.businessCase` (attach-business-case.ts), computed
 * server-side by pure functions in engine/business-case/calculations.ts
 * — nothing here recomputes TCO, ROI, NPV, or payback inline.
 */
export function BusinessCasePanel({
  baseRanked,
  businessCase,
  onSaveBusinessCase,
}: {
  baseRanked: RankedPlatform[];
  businessCase: BusinessCaseOutput | null;
  onSaveBusinessCase?: (input: {
    options: BusinessCaseOptionInput[];
    horizonYears: TimeHorizonYears;
    discountRatePercent: number;
    economicScenario: EconomicScenarioName;
  }) => Promise<{ ok: boolean; error?: string }>;
}) {
  const candidates = baseRanked.slice(0, 2);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>(() => Object.fromEntries(candidates.map((c) => [c.platform.id, emptyDraft()])));
  const [horizonYears, setHorizonYears] = useState<TimeHorizonYears>(3);
  const [discountRatePercent, setDiscountRatePercent] = useState(10);
  const [economicScenario, setEconomicScenario] = useState<EconomicScenarioName>("base");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const totalLineItems = useMemo(
    () => Object.values(drafts).reduce((sum, d) => sum + d.costs.length + d.benefits.length, 0),
    [drafts],
  );

  function addLine(optionId: string, kind: "costs" | "benefits") {
    setDrafts((current) => {
      const draft = current[optionId] ?? emptyDraft();
      const base = { label: "", year: 1, estimate: { kind: "point" as const, value: 0 }, provenance: "customer-input" as FinancialProvenance, note: null };
      const next: DraftState =
        kind === "costs"
          ? { ...draft, costs: [...draft.costs, { ...base, category: "implementation" as CostCategory }] }
          : { ...draft, benefits: [...draft.benefits, { ...base, category: "runCostReduction" as BenefitCategory }] };
      return { ...current, [optionId]: next };
    });
  }

  function removeLine(optionId: string, kind: "costs" | "benefits", index: number) {
    setDrafts((current) => {
      const draft = current[optionId] ?? emptyDraft();
      const next = { ...draft, [kind]: draft[kind].filter((_, i) => i !== index) };
      return { ...current, [optionId]: next };
    });
  }

  function updateLine(optionId: string, kind: "costs" | "benefits", index: number, patch: Record<string, unknown>) {
    setDrafts((current) => {
      const draft = current[optionId] ?? emptyDraft();
      if (kind === "costs") {
        const costs = draft.costs.map((item, i) => (i === index ? ({ ...item, ...patch } as CostLineItem) : item));
        return { ...current, [optionId]: { ...draft, costs } };
      }
      const benefits = draft.benefits.map((item, i) => (i === index ? ({ ...item, ...patch } as BenefitLineItem) : item));
      return { ...current, [optionId]: { ...draft, benefits } };
    });
  }

  async function handleSave() {
    if (!onSaveBusinessCase || totalLineItems === 0) return;
    setSaveState("saving");
    setSaveError(null);
    const options: BusinessCaseOptionInput[] = candidates.map((c) => ({
      optionId: c.platform.id,
      costs: drafts[c.platform.id]?.costs ?? [],
      benefits: drafts[c.platform.id]?.benefits ?? [],
      costOfDelay: null,
    }));
    const result = await onSaveBusinessCase({ options, horizonYears, discountRatePercent, economicScenario });
    if (result.ok) {
      setSaveState("saved");
    } else {
      setSaveState("error");
      setSaveError(result.error ?? "The business case could not be saved.");
    }
  }

  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <SectionLabel>Business case</SectionLabel>
      <p className="mt-2 text-sm leading-6 text-nova-ink-muted">
        Enter year-by-year costs and benefits for the current winner and its closest challenger. Every total below (TCO, ROI,
        NPV, payback) is computed deterministically — nothing here is estimated by AI.
      </p>

      {onSaveBusinessCase && (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Horizon</span>
              <select
                value={horizonYears}
                onChange={(e) => setHorizonYears(Number(e.target.value) as TimeHorizonYears)}
                className="h-9 rounded-lg border border-titanium bg-carbon-2 px-2 text-nova-ink"
              >
                {[1, 3, 5].map((y) => (
                  <option key={y} value={y}>
                    {y} year{y > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Discount rate</span>
              <input
                type="number"
                min={0}
                max={100}
                value={discountRatePercent}
                onChange={(e) => setDiscountRatePercent(Number(e.target.value))}
                className="h-9 w-20 rounded-lg border border-titanium bg-carbon-2 px-2 text-nova-ink"
              />
              <span className="text-nova-ink-faint">%</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Economic scenario</span>
              <select
                value={economicScenario}
                onChange={(e) => setEconomicScenario(e.target.value as EconomicScenarioName)}
                className="h-9 rounded-lg border border-titanium bg-carbon-2 px-2 text-nova-ink"
              >
                {(["base", "upside", "downside"] as const).map((s) => (
                  <option key={s} value={s}>
                    {SCENARIO_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {candidates.map((candidate) => (
              <div key={candidate.platform.id} className="rounded-xl border border-titanium bg-carbon-2 p-4">
                <p className="text-sm font-medium text-nova-ink">{candidate.platform.vendor} {candidate.platform.productName}</p>
                {(["costs", "benefits"] as const).map((kind) => (
                  <div key={kind} className="mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">{kind === "costs" ? "Costs" : "Benefits"}</span>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addLine(candidate.platform.id, kind)}
                        className="h-7 border-titanium bg-carbon px-2 text-xs text-nova-ink hover:border-titanium-strong"
                      >
                        <Plus size={12} />
                        Add
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {(drafts[candidate.platform.id]?.[kind] ?? []).map((item, index) => (
                        <div key={index} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-titanium bg-carbon p-2">
                          <select
                            value={item.category}
                            onChange={(e) => updateLine(candidate.platform.id, kind, index, { category: e.target.value })}
                            className="h-8 min-w-0 flex-1 rounded border border-titanium bg-carbon-2 px-1.5 text-xs text-nova-ink"
                          >
                            {Object.entries(kind === "costs" ? COST_CATEGORY_LABELS : BENEFIT_CATEGORY_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <input
                            placeholder="Label"
                            value={item.label}
                            onChange={(e) => updateLine(candidate.platform.id, kind, index, { label: e.target.value })}
                            className="h-8 w-24 rounded border border-titanium bg-carbon-2 px-1.5 text-xs text-nova-ink"
                          />
                          <input
                            type="number"
                            min={1}
                            max={horizonYears}
                            value={item.year}
                            onChange={(e) => updateLine(candidate.platform.id, kind, index, { year: Number(e.target.value) })}
                            aria-label="Year"
                            className="h-8 w-14 rounded border border-titanium bg-carbon-2 px-1.5 text-xs text-nova-ink"
                          />
                          <input
                            type="number"
                            value={item.estimate.kind === "point" ? item.estimate.value : 0}
                            onChange={(e) => updateLine(candidate.platform.id, kind, index, { estimate: { kind: "point", value: Number(e.target.value) } })}
                            aria-label="Amount"
                            className="h-8 w-24 rounded border border-titanium bg-carbon-2 px-1.5 text-xs text-nova-ink"
                          />
                          <select
                            value={item.provenance}
                            onChange={(e) => updateLine(candidate.platform.id, kind, index, { provenance: e.target.value as FinancialProvenance })}
                            className="h-8 rounded border border-titanium bg-carbon-2 px-1.5 text-xs text-nova-ink"
                          >
                            {PROVENANCE_OPTIONS.map((p) => (
                              <option key={p} value={p}>
                                {PROVENANCE_LABEL[p]}
                              </option>
                            ))}
                          </select>
                          <button type="button" onClick={() => removeLine(candidate.platform.id, kind, index)} aria-label="Remove line item" className="text-nova-ink-faint hover:text-red-400">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div>
            {saveState === "saved" ? (
              <p className="text-sm font-medium text-nova-success">Business case saved as a new decision version.</p>
            ) : (
              <>
                {saveState === "error" && saveError && (
                  <p role="alert" className="mb-2 text-xs text-red-400">
                    {saveError}
                  </p>
                )}
                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={totalLineItems === 0 || saveState === "saving"}
                  className="h-10 bg-nova-accent text-sm text-white hover:bg-nova-accent-strong"
                >
                  {saveState === "saving" ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                  Save business case as new version
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {businessCase && (
        <div className="mt-6 space-y-5 border-t border-titanium pt-5">
          <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">
            {SCENARIO_LABEL[businessCase.scenario]} scenario · {businessCase.horizonYears}-year horizon · {businessCase.discountRatePercent}% discount rate
          </p>
          {businessCase.options.map((option) => {
            const platform = baseRanked.find((r) => r.platform.id === option.optionId)?.platform;
            return (
              <div key={option.optionId} className="rounded-xl border border-titanium bg-carbon-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-nova-ink">{platform ? `${platform.vendor} ${platform.productName}` : option.optionId}</p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                      option.confidence.level === "high"
                        ? "border-nova-success/30 text-nova-success"
                        : option.confidence.level === "medium"
                          ? "border-nova-warning/30 text-nova-warning"
                          : "border-titanium text-nova-ink-faint"
                    }`}
                  >
                    {option.confidence.level} confidence
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <Metric label="TCO" value={currency(option.summary.tco)} />
                  <Metric label="Total benefits" value={currency(option.summary.totalBenefits)} />
                  <Metric label="Net benefit" value={currency(option.summary.netBenefit)} />
                  <Metric label="ROI" value={option.summary.roiPercent === null ? "—" : `${Math.round(option.summary.roiPercent)}%`} />
                  <Metric label="Payback" value={option.summary.paybackYears === null ? "Beyond horizon" : `${option.summary.paybackYears.toFixed(1)} yrs`} />
                </div>
                <p className="mt-2 text-xs text-nova-ink-faint">NPV {currency(option.summary.npv)}</p>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <thead>
                      <tr className="text-nova-ink-faint">
                        <th className="py-1 pr-3 font-medium">Year</th>
                        <th className="py-1 pr-3 font-medium">Cost</th>
                        <th className="py-1 pr-3 font-medium">Benefit</th>
                        <th className="py-1 pr-3 font-medium">Net</th>
                        <th className="py-1 font-medium">Cumulative</th>
                      </tr>
                    </thead>
                    <tbody>
                      {option.cashFlows.map((cf) => (
                        <tr key={cf.year} className="border-t border-titanium text-nova-ink">
                          <td className="py-1.5 pr-3 font-mono">{cf.year}</td>
                          <td className="py-1.5 pr-3 font-mono">{currency(cf.totalCost)}</td>
                          <td className="py-1.5 pr-3 font-mono">{currency(cf.totalBenefit)}</td>
                          <td className={`py-1.5 pr-3 font-mono ${cf.netCashFlow >= 0 ? "text-nova-success" : "text-red-400"}`}>{currency(cf.netCashFlow)}</td>
                          <td className={`py-1.5 font-mono ${cf.cumulativeCashFlow >= 0 ? "text-nova-success" : "text-red-400"}`}>{currency(cf.cumulativeCashFlow)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {option.confidence.reasons.length > 0 && <p className="mt-2 text-xs leading-5 text-nova-ink-faint">{option.confidence.reasons[0]}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-[0.06em] text-nova-ink-faint uppercase">{label}</p>
      <p className="mt-0.5 font-mono text-sm tabular-nums text-nova-ink">{value}</p>
    </div>
  );
}
