import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CASE_STUDY } from "@/components/showcase/case-study";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.caseStudyPage.metaTitle}: ClouDonna`;
  const description = dict.caseStudyPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/case-study"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const c = dict.caseStudyPage;
  const s = dict.showcase;

  return (
    <div className="min-h-dvh bg-void">
      <div className="mx-auto max-w-3xl px-6 pt-14 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong shadow-sm">
          {c.badge}
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-balance text-nova-ink sm:text-5xl">{CASE_STUDY.title}</h1>

        <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-3 py-1 text-[10px] font-semibold tracking-[0.1em] text-nova-ink-faint uppercase">
          {s.illustrativeLabel}
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-3xl space-y-10 px-6 pb-16">
        <section>
          <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{c.situationLabel}</h2>
          <p className="mt-2 text-base leading-7 text-nova-ink-muted">{CASE_STUDY.situation}</p>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{c.decisionLabel}</h2>
          <p className="mt-2 text-base leading-7 text-nova-ink">{CASE_STUDY.decisionQuestion}</p>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{c.optionsLabel}</h2>
          <ul className="mt-3 space-y-2">
            {CASE_STUDY.options.map((option) => (
              <li key={option} className="flex gap-2 text-sm leading-6 text-nova-ink-muted">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-ink-faint" />
                {option}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{c.constraintsLabel}</h2>
          <ul className="mt-3 space-y-2">
            {CASE_STUDY.constraints.map((constraint) => (
              <li key={constraint} className="flex gap-2 text-sm leading-6 text-nova-ink-muted">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-ink-faint" />
                {constraint}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-nova-accent/30 bg-nova-accent/5 p-6 sm:p-8">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-accent-strong uppercase">{c.recommendationLabel}</h2>
          <p className="mt-2 text-lg font-semibold text-nova-ink">{CASE_STUDY.recommendation}</p>
          <h3 className="mt-4 text-xs font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">{c.whyLabel}</h3>
          <p className="mt-1.5 text-sm leading-6 text-nova-ink-muted">{CASE_STUDY.why}</p>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{c.tradeOffsLabel}</h2>
          <ul className="mt-3 space-y-2">
            {CASE_STUDY.tradeOffs.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-nova-ink-muted">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-ink-faint" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{c.architectureImpactLabel}</h2>
            <p className="mt-2 text-sm leading-6 text-nova-ink-muted">{CASE_STUDY.architectureImpact}</p>
          </section>
          <section>
            <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{c.financialImpactLabel}</h2>
            <p className="mt-2 text-sm leading-6 text-nova-ink-muted">{CASE_STUDY.financialImpact}</p>
          </section>
        </div>

        <section>
          <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{c.risksLabel}</h2>
          <ul className="mt-3 space-y-2">
            {CASE_STUDY.risks.map((risk) => (
              <li key={risk} className="flex gap-2 text-sm leading-6 text-nova-ink-muted">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sunset-coral" />
                {risk}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-titanium bg-carbon p-6 sm:p-8">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{c.outcomeLabel}</h2>
          <p className="mt-2 text-sm leading-6 text-nova-ink-muted">{CASE_STUDY.outcome}</p>
        </section>

        <div className="rounded-3xl border border-titanium bg-carbon-2 p-8 text-center">
          <h2 className="text-xl font-semibold text-nova-ink">{c.ctaHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-nova-ink-muted">{c.ctaBody}</p>
          <Link
            href={`/${locale}/donna-ai`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-nova-accent to-sunset-coral px-6 py-3 text-sm font-semibold text-white shadow-nova-glow transition hover:brightness-110"
          >
            {c.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
