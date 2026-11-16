import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageCta, PageHeader, Section, SectionHeading, Shell } from "@/components/editorial/primitives";
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
    <main className="bg-paper">
      <PageHeader
        eyebrow={s.badge}
        title={s.h1}
        lede={s.sub}
        aside={
          <div>
            <div className="font-mono text-label font-medium text-ink-3 uppercase">{s.shiftKindsHeading}</div>
            <ul className="mt-5 border-t border-rule">
              {[s.shiftKinds.recommendation, s.shiftKinds.risk, s.shiftKinds.cost, s.shiftKinds.architecture].map((kind) => (
                <li key={kind} className="border-b border-rule py-3 text-sm text-ink-2">
                  {kind}
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <Section size="lg">
        <Shell>
          <ScenarioLab />
        </Shell>
      </Section>

      <Section size="lg" register="dark">
        <Shell>
          <SectionHeading title={s.timelineHeading} note={s.timelineSub} />
          <div className="mt-14 max-w-[52rem]">
            <ScenarioTimeline />
          </div>
        </Shell>
      </Section>

      <PageCta
        heading={s.ctaHeading}
        body={s.ctaBody}
        primaryHref={`/${locale}/donna-ai`}
        primaryLabel={s.ctaLabel}
        secondaryHref={`/${locale}/cost-value-lab`}
        secondaryLabel={dict.costValueLabPage.badge}
      />
    </main>
  );
}
