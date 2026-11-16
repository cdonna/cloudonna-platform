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
      className={`flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium outline-none transition duration-200 active:scale-95 focus-visible:ring-3 focus-visible:ring-nova-accent/40 ${
        selected
          ? "border-transparent bg-nova-accent text-white"
          : "border-titanium bg-carbon text-nova-ink-muted hover:border-titanium-strong hover:text-nova-ink"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Decision confidence and score are the one place this product's own
 * design system names gold explicitly ("decision confidence, important
 * metrics" — docs/design/05-color-system.md). `emphasize` is the
 * Donna Score itself (the primary number a result is read by); the
 * plain state (e.g. the Confidence ring next to it) stays on the
 * everyday emerald accent, so gold still reads as the rarer, higher-
 * value signal between two rings sitting side by side.
 */
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
    <div
      className={`w-24 rounded-2xl border px-3 py-3.5 text-center ${
        emphasize ? "border-gold/30 bg-carbon shadow-gold-raised" : "border-titanium bg-carbon"
      }`}
    >
      <div className={`font-mono text-2xl font-bold tabular-nums ${emphasize ? "text-gold" : "text-nova-ink"}`}>{value}%</div>
      <div className="mt-1 text-[10px] font-medium tracking-[0.06em] text-nova-ink-faint uppercase">{label}</div>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold tracking-[0.14em] text-nova-ink-faint uppercase">{children}</div>;
}
