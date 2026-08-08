import { Clock3, Eye, ShieldAlert } from "lucide-react";

const symptoms = [
  {
    icon: Clock3,
    label: "Slow",
    body: "Months of workshops and vendor calls to reach a decision that should take weeks.",
  },
  {
    icon: Eye,
    label: "Opaque",
    body: "Recommendations arrive without the reasoning behind them — a name, not an argument.",
  },
  {
    icon: ShieldAlert,
    label: "Biased",
    body: "Advice shaped by who sponsors the report, not by what fits your landscape.",
  },
];

export default function Problem() {
  return (
    <section className="relative overflow-hidden bg-obsidian px-6 py-28 sm:py-32">
      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">
          The problem
        </div>

        <h2 className="mt-8 text-4xl font-semibold tracking-[-0.035em] text-balance text-nova-ink sm:text-5xl lg:text-6xl">
          Enterprise technology decisions are made on trust,<br className="hidden sm:block" /> not evidence.
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-nova-ink-muted">
          Every major platform decision still runs on analyst decks, vendor demos and whoever spoke last in the room.
        </p>

        <div className="mt-16 grid gap-5 text-left sm:grid-cols-3">
          {symptoms.map((symptom) => {
            const Icon = symptom.icon;
            return (
              <div key={symptom.label} className="rounded-2xl border border-titanium bg-carbon p-6">
                <Icon size={20} className="text-nova-ink-faint" />
                <h3 className="mt-5 text-sm font-semibold tracking-[0.1em] text-nova-ink uppercase">{symptom.label}</h3>
                <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{symptom.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
