import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AIUseCaseCard } from "@/components/ai-portfolio/AIUseCaseCard";
import { AI_USE_CASES, type AIUseCaseQuadrant } from "@/components/ai-portfolio/catalog";
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

const QUADRANT_STYLE: Record<AIUseCaseQuadrant, string> = {
  "quick-win": "border-nova-success/30 bg-nova-success/10 text-nova-success",
  "strategic-bet": "border-nova-accent/30 bg-nova-accent/10 text-nova-accent-strong",
  "foundation-investment": "border-electric-blue/30 bg-electric-blue/10 text-electric-blue",
  "low-value-high-complexity": "border-sunset-coral/30 bg-sunset-coral/10 text-sunset-coral",
};

export default async function AIUseCasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const p = dict.aiPortfolioPage;
  const s = dict.showcase;

  const quadrantLabels: Record<AIUseCaseQuadrant, string> = {
    "quick-win": p.quickWinLabel,
    "strategic-bet": p.strategicBetLabel,
    "foundation-investment": p.foundationInvestmentLabel,
    "low-value-high-complexity": p.lowValueHighComplexityLabel,
  };

  return (
    <div className="min-h-dvh bg-void">
      <div className="mx-auto max-w-3xl px-6 pt-14 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong shadow-sm">
          {p.badge}
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-balance text-nova-ink sm:text-5xl">{p.h1}</h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-nova-ink-muted">{p.sub}</p>

        <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-3 py-1 text-[10px] font-semibold tracking-[0.1em] text-nova-ink-faint uppercase">
          {s.illustrativeLabel}
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-6xl px-6 pb-16">
        <div className="grid gap-8 lg:grid-cols-2">
          {QUADRANT_ORDER.map((quadrant) => (
            <div key={quadrant}>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] ${QUADRANT_STYLE[quadrant]}`}>
                {quadrantLabels[quadrant]}
              </span>
              <div className="mt-4 space-y-3">
                {AI_USE_CASES.filter((useCase) => useCase.quadrant === quadrant).map((useCase) => (
                  <AIUseCaseCard key={useCase.id} useCase={useCase} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-titanium bg-carbon-2 p-8 text-center">
          <h2 className="text-xl font-semibold text-nova-ink">{p.ctaHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-nova-ink-muted">{p.ctaBody}</p>
          <Link
            href={`/${locale}/donna-ai`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-nova-accent to-sunset-coral px-6 py-3 text-sm font-semibold text-white shadow-nova-glow transition hover:brightness-110"
          >
            {p.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
