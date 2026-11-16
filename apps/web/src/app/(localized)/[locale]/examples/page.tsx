import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageCta, PageHeader, Section, Shell } from "@/components/editorial/primitives";
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
    <main className="bg-paper">
      <PageHeader eyebrow={e.badge} title={e.h1} lede={e.sub} />

      {/* Alternating tone between consecutive canvases, so five large
          product surfaces in a row stay separable without five headings
          repeating the same words. */}
      {EXAMPLE_DECISIONS.map((decision, index) => (
        <Section key={decision.id} id={decision.id} size="md" tone={index % 2 === 1 ? "sunken" : "default"}>
          <Shell>
            <DecisionShowcase decision={decision} />
          </Shell>
        </Section>
      ))}

      <PageCta
        heading={e.ctaHeading}
        body={e.ctaBody}
        primaryHref={`/${locale}/donna-ai`}
        primaryLabel={e.ctaLabel}
        secondaryHref={`/${locale}/case-study`}
        secondaryLabel={dict.caseStudyPage.badge}
      />
    </main>
  );
}
