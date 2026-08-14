import { Clock3, Eye, ShieldAlert } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionary";

const ICONS = [Clock3, Eye, ShieldAlert];

export default function Problem({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden bg-obsidian px-6 py-28 sm:py-32">
      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">
          {dict.problem.badge}
        </div>

        <h2 className="mt-8 text-4xl font-semibold tracking-[-0.035em] text-balance text-nova-ink sm:text-5xl lg:text-6xl">
          {dict.problem.h2First}<br className="hidden sm:block" /> {dict.problem.h2Second}
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-nova-ink-muted">{dict.problem.sub}</p>

        <div className="mt-16 grid gap-5 text-left sm:grid-cols-3">
          {dict.problem.symptoms.map((symptom, index) => {
            const Icon = ICONS[index];
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
