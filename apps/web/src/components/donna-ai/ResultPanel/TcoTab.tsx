import { SectionLabel } from "../shared";
import type { DecisionOutput } from "../types";
import type { CostTier, TimeToValueBand } from "../vendor-intelligence/types";

const COST_TIER_LABEL: Record<CostTier, string> = {
  entry: "Entry",
  mid: "Mid-market",
  premium: "Premium",
  "enterprise-custom": "Enterprise / custom",
};

const COST_TIER_POSITION: Record<CostTier, number> = {
  entry: 25,
  mid: 50,
  premium: 75,
  "enterprise-custom": 100,
};

const TIME_TO_VALUE_LABEL: Record<TimeToValueBand, string> = {
  weeks: "Weeks",
  "1-3-months": "1–3 months",
  "3-6-months": "3–6 months",
  "6-plus-months": "6+ months",
};

const TIME_TO_VALUE_POSITION: Record<TimeToValueBand, number> = {
  weeks: 25,
  "1-3-months": 50,
  "3-6-months": 75,
  "6-plus-months": 100,
};

export function TcoTab({ output }: { output: DecisionOutput }) {
  const platform = output.recommendation.platform;
  const costDimension = output.dimensions.find((d) => d.key === "cost");
  const timeDimension = output.dimensions.find((d) => d.key === "timeToValue");
  const ranked = [output.recommendation, ...output.alternatives];

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-nova-accent-strong">
        Cost &amp; time-to-value profile
      </div>

      <p className="mt-2 max-w-2xl text-sm text-nova-ink-faint">
        Derived from {platform.productName}&apos;s curated cost tier and time-to-value band, scored
        against your stated budget and timeline. Qualitative, sourced bands, not a generated
        financial model.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-titanium p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-nova-ink">{COST_TIER_LABEL[platform.costTier]}</span>
            {costDimension && (
              <span className="font-mono text-sm font-semibold tabular-nums text-nova-accent-strong">
                {costDimension.score}% fit
              </span>
            )}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-carbon-2">
            <div className="h-full rounded-full bg-nova-accent" style={{ width: `${COST_TIER_POSITION[platform.costTier]}%` }} />
          </div>
          <p className="mt-4 text-sm leading-6 text-nova-ink-muted">{platform.pricingModel}</p>
          <p className="mt-2 text-sm leading-6 text-nova-ink-faint">{platform.costCharacteristics}</p>
        </div>

        <div className="rounded-2xl border border-titanium p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-nova-ink">{TIME_TO_VALUE_LABEL[platform.timeToValue]}</span>
            {timeDimension && (
              <span className="font-mono text-sm font-semibold tabular-nums text-nova-accent-strong">
                {timeDimension.score}% fit
              </span>
            )}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-carbon-2">
            <div className="h-full rounded-full bg-nova-accent" style={{ width: `${TIME_TO_VALUE_POSITION[platform.timeToValue]}%` }} />
          </div>
          <p className="mt-4 text-sm leading-6 text-nova-ink-muted">
            Typical time to value for {platform.productName} deployments.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-titanium bg-carbon-2 p-5">
          <div className="text-xs text-nova-ink-faint">Implementation complexity</div>
          <div className="mt-2 font-semibold text-nova-ink capitalize">{platform.implementationComplexity.replace(/-/g, " ")}</div>
        </div>
        <div className="rounded-2xl border border-titanium bg-carbon-2 p-5">
          <div className="text-xs text-nova-ink-faint">Vendor lock-in risk</div>
          <div className="mt-2 font-semibold text-nova-ink capitalize">{platform.vendorLockInRisk.replace(/-/g, " ")}</div>
        </div>
      </div>

      <div className="mt-8">
        <SectionLabel>How the alternatives compare on cost</SectionLabel>
        <div className="mt-4 space-y-3">
          {ranked.map((entry) => (
            <div
              key={entry.platform.id}
              className="flex items-center justify-between rounded-xl border border-titanium px-4 py-3 text-sm"
            >
              <span className={entry.platform.id === platform.id ? "font-semibold text-nova-ink" : "text-nova-ink-muted"}>
                {entry.platform.productName}
              </span>
              <span className="flex items-center gap-3 text-xs text-nova-ink-faint">
                <span>{COST_TIER_LABEL[entry.platform.costTier]}</span>
                <span aria-hidden="true">·</span>
                <span>{TIME_TO_VALUE_LABEL[entry.platform.timeToValue]}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs leading-5 text-nova-ink-faint">
        Sourced from ClouDonna&apos;s curated platform intelligence, last reviewed {platform.lastReviewedDate}.
        Not a substitute for a vendor-issued quote.
      </p>
    </div>
  );
}
