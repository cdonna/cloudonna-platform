import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ScenarioLab, ScenarioTimeline } from "@/components/scenario-lab/ScenarioLab";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.scenarioLabPage.metaTitle}: ClouDonna`;
  const description = dict.scenarioLabPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/scenario-lab"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

export default async function ScenarioLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const s = dict.scenarioLabPage;

  return (
    <div className="min-h-dvh bg-void">
      <div className="mx-auto max-w-3xl px-6 pt-14 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong shadow-sm">
          {s.badge}
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-balance text-nova-ink sm:text-5xl">{s.h1}</h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-nova-ink-muted">{s.sub}</p>
      </div>

      <div className="mx-auto mt-14 max-w-4xl px-6">
        <ScenarioLab />
      </div>

      <div className="mx-auto mt-20 max-w-5xl px-6 pb-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-nova-ink sm:text-3xl">{s.timelineHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-nova-ink-muted">{s.timelineSub}</p>
        </div>

        <div className="mt-8">
          <ScenarioTimeline />
        </div>

        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/cost-value-lab`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-nova-accent-strong transition duration-control hover:text-nova-ink"
          >
            {dict.costValueLabPage.badge}
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-8 rounded-3xl border border-titanium bg-carbon-2 p-8 text-center">
          <h2 className="text-xl font-semibold text-nova-ink">{s.ctaHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-nova-ink-muted">{s.ctaBody}</p>
          <Link
            href={`/${locale}/donna-ai`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-nova-accent to-sunset-coral px-6 py-3 text-sm font-semibold text-white shadow-nova-glow transition hover:brightness-110"
          >
            {s.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
