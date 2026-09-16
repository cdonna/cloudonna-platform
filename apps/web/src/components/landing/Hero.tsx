"use client";

import { ArrowRight, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/LocaleProvider";

export default function Hero() {
  const { locale, dict } = useLocale();

  return (
    <section className="relative overflow-hidden bg-void">
      {/* Ambient background — Project NOVA (docs/design/04-material-system.md,
          "Deep Space" + "Aurora"), layered with one warm Sunset glow low in
          the frame. Three glows, asymmetric, slow drift — the violet/blue
          pair still leads; coral only ever grounds the horizon beneath it.
          The persistent GlobalNav (see components/layout/GlobalNav.tsx) now
          owns primary navigation — this section is hero content only. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden motion-safe:animate-aurora-drift">
        <div className="absolute -top-40 left-[8%] h-[34rem] w-[34rem] rounded-full bg-aurora-secondary/20 blur-[140px]" />
        <div className="absolute top-[10%] right-[5%] h-[30rem] w-[30rem] rounded-full bg-aurora-primary/25 blur-[140px]" />
        <div className="absolute top-[60%] left-1/2 h-[28rem] w-[46rem] -translate-x-1/2 rounded-full bg-sunset-coral/15 blur-[160px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold tracking-[0.14em] text-nova-accent-strong uppercase">
            {dict.hero.badge}
          </div>

          <h1 className="mt-8 text-5xl font-semibold tracking-[-0.035em] text-balance text-nova-ink sm:text-6xl lg:text-7xl">
            {dict.hero.h1}
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-nova-ink-muted">{dict.hero.sub}</p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 bg-gradient-to-r from-nova-accent to-sunset-coral px-7 text-white shadow-nova-glow transition-[filter] duration-control hover:brightness-110"
              render={<a href={`/${locale}/early-access`} />}
            >
              {dict.hero.ctaPrimary}
              <ArrowRight size={17} />
            </Button>

            <Button size="lg" variant="outline" className="h-12 border-titanium bg-transparent px-7 text-nova-ink hover:border-titanium-strong" render={<a href="#donna" />}>
              <Play size={16} />
              {dict.hero.ctaSecondary}
            </Button>
          </div>

          <p className="mt-8 text-xs tracking-wide text-nova-ink-faint uppercase">{dict.hero.tagline}</p>
        </div>
      </div>
    </section>
  );
}
