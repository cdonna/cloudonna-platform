import { Fingerprint, Lock, ScrollText } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionary";

const ICONS = [ScrollText, Fingerprint, Lock];

export default function EnterpriseIntelligence({ dict }: { dict: Dictionary }) {
  return (
    <section id="enterprise" className="scroll-mt-8 bg-void px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">
            {dict.enterpriseIntelligence.badge}
          </div>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-nova-ink sm:text-5xl">{dict.enterpriseIntelligence.h2}</h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {dict.enterpriseIntelligence.pillars.map((pillar, index) => {
            const Icon = ICONS[index];
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
