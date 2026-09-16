import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DecisionShowcase } from "@/components/showcase/DecisionShowcase";
import { EXAMPLE_DECISIONS } from "@/components/showcase/example-decisions";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.examplesPage.metaTitle}: ClouDonna`;
  const description = dict.examplesPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/examples"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

export default async function ExamplesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const e = dict.examplesPage;

  return (
    <div className="min-h-dvh bg-void">
      <div className="mx-auto max-w-3xl px-6 pt-14 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong shadow-sm">
          {e.badge}
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-balance text-nova-ink sm:text-5xl">{e.h1}</h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-nova-ink-muted">{e.sub}</p>
      </div>

      <div className="mx-auto mt-14 max-w-5xl space-y-10 px-6 pb-16">
        {EXAMPLE_DECISIONS.map((decision) => (
          <div key={decision.id} id={decision.id} className="scroll-mt-24">
            <DecisionShowcase decision={decision} />
          </div>
        ))}

        <div className="text-center">
          <Link
            href={`/${locale}/case-study`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-nova-accent-strong transition duration-control hover:text-nova-ink"
          >
            {dict.caseStudyPage.badge}
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="rounded-3xl border border-titanium bg-carbon-2 p-8 text-center">
          <h2 className="text-xl font-semibold text-nova-ink">{e.ctaHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-nova-ink-muted">{e.ctaBody}</p>
          <Link
            href={`/${locale}/donna-ai`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-nova-accent to-sunset-coral px-6 py-3 text-sm font-semibold text-white shadow-nova-glow transition hover:brightness-110"
          >
            {e.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
