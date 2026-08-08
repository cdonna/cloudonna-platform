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
      className={`rounded-full border px-4 py-2 text-sm font-medium outline-none transition duration-200 active:scale-95 focus-visible:ring-3 focus-visible:ring-nova-accent/40 ${
        selected
          ? "border-transparent bg-nova-accent text-white shadow-[0_0_0_1px_var(--color-nova-accent-strong)]"
          : "border-titanium bg-carbon text-nova-ink-muted hover:border-titanium-strong hover:text-nova-ink"
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
    <div className="w-24 rounded-2xl border border-titanium bg-carbon px-3 py-3.5 text-center">
      <div className={`font-mono text-2xl font-bold tabular-nums ${emphasize ? "text-nova-accent-strong" : "text-nova-ink"}`}>{value}%</div>
      <div className="mt-1 text-[10px] font-medium tracking-[0.06em] text-nova-ink-faint uppercase">{label}</div>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold tracking-[0.14em] text-nova-ink-faint uppercase">{children}</div>;
}
