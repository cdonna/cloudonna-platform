export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition outline-none active:scale-95 focus-visible:ring-3 focus-visible:ring-violet-500/30 ${
        selected
          ? "border-transparent bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
      }`}
    >
      {label}
    </button>
  );
}

export function ScoreRing({
  value,
  label,
  emphasize = false,
}: {
  value: number;
  label: string;
  emphasize?: boolean;
}) {
  return (
    <div className="w-24 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3.5 text-center">
      <div
        className={`font-mono text-2xl font-bold tabular-nums ${
          emphasize
            ? "bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent"
            : "text-slate-950"
        }`}
      >
        {value}%
      </div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.06em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
      {children}
    </div>
  );
}
