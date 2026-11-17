import { AlertTriangle } from "lucide-react";
import { SectionLabel } from "../shared";
import type { RiskCategory, RiskItem } from "../types";

const CATEGORY_STYLE: Record<RiskCategory, string> = {
  Financial: "border-nova-warning/30 bg-nova-warning/10 text-nova-warning",
  Delivery: "border-red-400/30 bg-red-400/10 text-red-400",
  Skills: "border-nova-accent/30 bg-nova-accent/10 text-nova-accent-strong",
  Vendor: "border-titanium-strong bg-carbon-2 text-nova-ink-muted",
  General: "border-titanium-strong bg-carbon-2 text-nova-ink-faint",
};

/**
 * Risk Cockpit (brief §17) — groups the real risks the deterministic
 * engine already produces (pickRisks in engine.ts) by the condition
 * that actually triggered each one. No invented likelihood/impact/
 * severity numbers: this product doesn't have the structured input to
 * support that distinction honestly yet (every risk here is a
 * triggered-or-not boolean condition, not a graded one), so this
 * shows category and the real triggering text only — "avoid fake
 * heatmaps if data is too sparse" (brief §17), taken literally.
 */
export function RiskCockpit({ risks }: { risks: RiskItem[] }) {
  const byCategory = new Map<RiskCategory, RiskItem[]>();
  for (const risk of risks) {
    const bucket = byCategory.get(risk.category) ?? [];
    bucket.push(risk);
    byCategory.set(risk.category, bucket);
  }

  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <SectionLabel>Risk cockpit</SectionLabel>
      {risks.length === 0 ? (
        <p className="mt-3 text-sm text-nova-ink-faint">No risks were triggered by the stated inputs.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {Array.from(byCategory.entries()).map(([category, items]) => (
            <div key={category} className="flex items-start gap-3">
              <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${CATEGORY_STYLE[category]}`}>
                <AlertTriangle size={12} />
                {category}
              </span>
              <div className="space-y-1.5">
                {items.map((risk) => (
                  <p key={risk.text} className="text-sm leading-6 text-nova-ink-muted">
                    {risk.text}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
