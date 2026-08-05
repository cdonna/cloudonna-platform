export function TcoTab() {
  const costs = [
    ["Subscription", 820000, 39],
    ["Implementation", 540000, 26],
    ["Infrastructure", 360000, 17],
    ["Operations", 380000, 18],
  ] as const;

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
        Three-year cost model
      </div>

      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        Illustrative cost model — not yet generated per recommended platform.
      </p>

      <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="text-4xl font-semibold text-slate-950">CHF 2.1M</div>
          <div className="mt-2 text-sm text-emerald-600">
            Estimated 18% below the reference scenario
          </div>
        </div>

        <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700">
          Medium confidence
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {costs.map(([label, amount, share]) => (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-600">{label}</span>
              <span className="font-mono font-semibold tabular-nums text-slate-950">
                CHF {amount.toLocaleString("de-CH")}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
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
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs text-slate-400">{label}</div>
            <div className="mt-2 font-semibold text-slate-950">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
