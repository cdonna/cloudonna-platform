import { Fingerprint, Lock, ScrollText } from "lucide-react";

const pillars = [
  {
    icon: ScrollText,
    label: "Evidence-based",
    body: "Every recommendation cites its sources — reviews, benchmarks, market data. Not opinion.",
  },
  {
    icon: Fingerprint,
    label: "Deterministic scoring",
    body: "The same input produces the same score, every time. AI narrates the reasoning; it never decides the outcome.",
  },
  {
    icon: Lock,
    label: "Auditable",
    body: "Full audit trail. Row-level security. A decision record nobody can quietly edit.",
  },
];

export default function EnterpriseIntelligence() {
  return (
    <section id="enterprise" className="scroll-mt-8 bg-void px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">
            Enterprise Decision Intelligence
          </div>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-nova-ink sm:text-5xl">Built to be trusted, not just used</h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.label} className="rounded-2xl border border-titanium bg-carbon p-6 text-left">
                <Icon size={20} className="text-nova-accent-strong" />
                <h3 className="mt-5 text-sm font-semibold tracking-[0.06em] text-nova-ink">{pillar.label}</h3>
                <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{pillar.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
