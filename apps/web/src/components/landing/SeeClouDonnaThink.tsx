import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EXAMPLE_DECISIONS } from "@/components/showcase/example-decisions";
import { DecisionShowcase } from "@/components/showcase/DecisionShowcase";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";

const FEATURED_DECISION = EXAMPLE_DECISIONS[0];

export default function SeeClouDonnaThink({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const s = dict.showcase;

  return (
    <section className="relative overflow-hidden bg-void px-6 py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden motion-safe:animate-aurora-drift">
        <div className="absolute top-[-6rem] right-[10%] h-[26rem] w-[26rem] rounded-full bg-neon-pink/10 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold tracking-[0.16em] text-nova-accent-strong uppercase">
            {s.seeThinkBadge}
          </div>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-balance text-nova-ink sm:text-5xl">{s.seeThinkHeading}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-nova-ink-muted">{s.seeThinkSub}</p>
        </div>

        <div className="mt-14">
          <DecisionShowcase decision={FEATURED_DECISION} />
        </div>

        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/examples`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-nova-accent-strong transition duration-control hover:text-nova-ink"
          >
            {s.exploreMoreLabel}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
