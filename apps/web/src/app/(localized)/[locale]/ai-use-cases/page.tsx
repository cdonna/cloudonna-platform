import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AIUseCaseCard } from "@/components/ai-portfolio/AIUseCaseCard";
import { AI_USE_CASES, type AIUseCaseQuadrant } from "@/components/ai-portfolio/catalog";
import { IllustrativeLabel, PageCta, PageHeader, Section, Shell } from "@/components/editorial/primitives";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.aiPortfolioPage.metaTitle}: ClouDonna`;
  const description = dict.aiPortfolioPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/ai-use-cases"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

const QUADRANT_ORDER: AIUseCaseQuadrant[] = ["quick-win", "strategic-bet", "foundation-investment", "low-value-high-complexity"];

/**
 * The four quadrants are a judgement about investment, so they are
 * ranked down the page with the accent reserved for the one that is a
 * warning ("low value, high complexity") rather than four differently
 * coloured badges implying four equal options.
 */
const QUADRANT_TONE: Record<AIUseCaseQuadrant, string> = {
  "quick-win": "text-sig-positive",
  "strategic-bet": "text-accent",
  "foundation-investment": "text-sig-input",
  "low-value-high-complexity": "text-sig-caution",
};

export default async function AIUseCasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const p = dict.aiPortfolioPage;

  const quadrantLabels: Record<AIUseCaseQuadrant, string> = {
    "quick-win": p.quickWinLabel,
    "strategic-bet": p.strategicBetLabel,
    "foundation-investment": p.foundationInvestmentLabel,
    "low-value-high-complexity": p.lowValueHighComplexityLabel,
  };

  return (
    <main className="bg-paper">
      <PageHeader
        eyebrow={p.badge}
        title={p.h1}
        lede={p.sub}
        aside={<IllustrativeLabel>{dict.showcase.illustrativeLabel}</IllustrativeLabel>}
      />

      {QUADRANT_ORDER.map((quadrant, index) => {
        const useCases = AI_USE_CASES.filter((useCase) => useCase.quadrant === quadrant);
        return (
          <Section key={quadrant} size="md" tone={index % 2 === 1 ? "sunken" : "default"}>
            <Shell>
              <div className="grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-16">
                <div>
                  <div className="font-mono text-label font-medium text-ink-3 tabular-nums uppercase">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h2 className={`mt-4 text-display-3 font-medium tracking-[-0.025em] ${QUADRANT_TONE[quadrant]}`}>
                    {quadrantLabels[quadrant]}
                  </h2>
                </div>

                <div className="border-t border-rule">
                  {useCases.map((useCase) => (
                    <AIUseCaseCard key={useCase.id} useCase={useCase} />
                  ))}
                </div>
              </div>
            </Shell>
          </Section>
        );
      })}

      <PageCta
        heading={p.ctaHeading}
        body={p.ctaBody}
        primaryHref={`/${locale}/donna-ai`}
        primaryLabel={p.ctaLabel}
        secondaryHref={`/${locale}/data-economy`}
        secondaryLabel={dict.dataEconomyPage.badge}
      />
    </main>
  );
}
