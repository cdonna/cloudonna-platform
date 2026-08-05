import { Check, Minus } from "lucide-react";
import { CATEGORY_LABELS } from "../vendor-intelligence/catalog";
import type { RankedPlatform, ScoreDimensionKey, Trait } from "../types";

const COMPLEXITY_RANK: Record<string, number> = { low: 0, medium: 1, high: 2, "very-high": 3 };
const LOCK_IN_RANK: Record<string, number> = { low: 0, medium: 1, high: 2, "very-high": 3 };
const COST_TIER_RANK: Record<string, number> = { entry: 0, mid: 1, premium: 2, "enterprise-custom": 3 };

type Row =
  | { kind: "score"; label: string; dimensionKey: ScoreDimensionKey }
  | { kind: "trait"; label: string; trait: Trait }
  | { kind: "band-low-is-better"; label: string; field: "implementationComplexity" | "vendorLockInRisk" | "costTier" };

const ROWS: Row[] = [
  { kind: "score", label: "Architecture Fit", dimensionKey: "architecture" },
  { kind: "trait", label: "SAP integration", trait: "sap-native" },
  { kind: "trait", label: "Microsoft integration", trait: "azure-aligned" },
  { kind: "trait", label: "Multi-cloud", trait: "multi-cloud" },
  { kind: "score", label: "Governance Fit", dimensionKey: "governance" },
  { kind: "score", label: "AI Readiness", dimensionKey: "aiReadiness" },
  { kind: "score", label: "Security Fit", dimensionKey: "security" },
  { kind: "score", label: "Ecosystem Fit", dimensionKey: "ecosystem" },
  { kind: "score", label: "Time-to-Value Fit", dimensionKey: "timeToValue" },
  { kind: "band-low-is-better", label: "Implementation complexity", field: "implementationComplexity" },
  { kind: "band-low-is-better", label: "Vendor lock-in", field: "vendorLockInRisk" },
  { kind: "band-low-is-better", label: "Cost tier", field: "costTier" },
  { kind: "score", label: "Strategic Fit", dimensionKey: "strategic" },
];

export function ComparisonMatrix({ platforms }: { platforms: RankedPlatform[] }) {
  const compared = platforms.slice(0, 4);
  const hasCrossCategory = compared.some((p) => p.platform.category !== compared[0]?.platform.category);

  if (compared.length === 0) return null;

  return (
    <div>
      {hasCrossCategory && (
        <p className="mb-3 text-xs leading-5 text-slate-500">
          These platforms span more than one category — some solve different problems rather
          than compete directly. Read row-by-row, not as a single ranked list.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">
            Comparison of {compared.map((p) => p.platform.productName).join(", ")} across architecture,
            governance, security, cost, and strategic fit
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">
                Criterion
              </th>
              {compared.map((entry) => (
                <th key={entry.platform.id} scope="col" className="px-4 py-3 text-left">
                  <div className="font-semibold text-slate-950">{entry.platform.productName}</div>
                  <div className="text-[10px] font-normal uppercase tracking-[0.05em] text-slate-400">
                    {CATEGORY_LABELS[entry.platform.category]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <ComparisonRow key={row.label} row={row} platforms={compared} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparisonRow({ row, platforms }: { row: Row; platforms: RankedPlatform[] }) {
  let winnerId: string | null = null;

  if (row.kind === "score") {
    let best = -1;
    for (const entry of platforms) {
      const score = entry.dimensions.find((d) => d.key === row.dimensionKey)?.score ?? 0;
      if (score > best) {
        best = score;
        winnerId = entry.platform.id;
      }
    }
  } else if (row.kind === "band-low-is-better") {
    const rank = row.field === "implementationComplexity" ? COMPLEXITY_RANK : row.field === "vendorLockInRisk" ? LOCK_IN_RANK : COST_TIER_RANK;
    let best = Infinity;
    for (const entry of platforms) {
      const value = rank[entry.platform[row.field]] ?? 99;
      if (value < best) {
        best = value;
        winnerId = entry.platform.id;
      }
    }
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <th scope="row" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
        {row.label}
      </th>
      {platforms.map((entry) => {
        const isWinner = winnerId === entry.platform.id;

        if (row.kind === "score") {
          const score = entry.dimensions.find((d) => d.key === row.dimensionKey)?.score ?? 0;
          return (
            <td key={entry.platform.id} className={`px-4 py-3 font-mono tabular-nums ${isWinner ? "font-semibold text-slate-950" : "text-slate-600"}`}>
              {score}%
            </td>
          );
        }

        if (row.kind === "trait") {
          const has = entry.platform.traits.includes(row.trait);
          return (
            <td key={entry.platform.id} className="px-4 py-3">
              {has ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <Check size={14} /> Yes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <Minus size={14} /> No
                </span>
              )}
            </td>
          );
        }

        const value = entry.platform[row.field];
        return (
          <td key={entry.platform.id} className={`px-4 py-3 capitalize ${isWinner ? "font-semibold text-slate-950" : "text-slate-600"}`}>
            {value.replace(/-/g, " ")}
          </td>
        );
      })}
    </tr>
  );
}
