export function TcoTab() {
  const costs = [
    ["Subscription", 820000, 39],
    ["Implementation", 540000, 26],
    ["Infrastructure", 360000, 17],
    ["Operations", 380000, 18],
  ] as const;

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-nova-accent-strong">
        Three-year cost model
      </div>

      <p className="mt-2 max-w-2xl text-sm text-nova-ink-faint">
        Illustrative cost model — not yet generated per recommended platform.
      </p>

      <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="text-4xl font-semibold text-nova-ink">CHF 2.1M</div>
          <div className="mt-2 text-sm text-nova-success">
            Estimated 18% below the reference scenario
          </div>
        </div>

        <div className="rounded-xl bg-nova-accent/10 px-4 py-3 text-sm font-medium text-nova-accent-strong">
          Medium confidence
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {costs.map(([label, amount, share]) => (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-nova-ink-muted">{label}</span>
              <span className="font-mono font-semibold tabular-nums text-nova-ink">
                CHF {amount.toLocaleString("de-CH")}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-carbon-2">
              <div
                className="h-full rounded-full bg-nova-accent"
                style={{ width: `${share}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Time to value", "9–15 months"],
          ["Implementation risk", "Medium"],
          ["Expected ROI", "24–36 months"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-titanium bg-carbon-2 p-5">
            <div className="text-xs text-nova-ink-faint">{label}</div>
            <div className="mt-2 font-semibold text-nova-ink">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
