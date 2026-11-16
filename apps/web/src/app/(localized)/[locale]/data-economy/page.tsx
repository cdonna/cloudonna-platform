import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DataProductCard } from "@/components/data-economy/DataProductCard";
import { DATA_PRODUCTS } from "@/components/data-economy/catalog";
import {
  PageCta,
  PageHeader,
  ProductFrame,
  SecondaryAction,
  Section,
  SectionHeading,
  Shell,
} from "@/components/editorial/primitives";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.dataEconomyPage.metaTitle}: ClouDonna`;
  const description = dict.dataEconomyPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/data-economy"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

/**
 * The value chain — Source → Trust → Data Product → Decision → Value —
 * was five equal bordered cards in a row, which read as five unrelated
 * features. It is now one connected canvas: numbered stages on a single
 * rule, so the chain is visibly a chain, and the last stage (Value)
 * carries the accent because it is the only one that is an outcome
 * rather than a step.
 *
 * On narrow screens the rule turns vertical rather than the stages
 * collapsing into a five-row stack of identical boxes.
 */
export default async function DataEconomyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const d = dict.dataEconomyPage;
  const lastIndex = d.flowSteps.length - 1;

  return (
    <main className="bg-paper">
      <PageHeader
        eyebrow={d.badge}
        title={d.h1}
        lede={d.sub}
        aside={
          <div>
            <div className="font-mono text-label font-medium text-ink-3 uppercase">{d.questionsHeading}</div>
            <ul className="mt-5 border-t border-rule">
              {d.questions.map((question) => (
                <li key={question} className="border-b border-rule py-3 text-sm leading-6 text-ink-2">
                  {question}
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <Section size="lg">
        <Shell>
          <SectionHeading eyebrow={d.badge} title={d.flowHeading} />

          <ProductFrame className="mt-12" label={d.flowHeading} meta={dict.showcase.illustrativeLabel}>
            <div className="p-6 sm:p-10">
              {/* One continuous rule behind the stages on wide screens,
                  down the left on narrow ones. The connector is the
                  point of the diagram, so it is drawn once and the
                  stages sit on it. */}
              {/* The padding sits on the <li>, so its leading edge lands
                  exactly on the rule and a 10px marker centred at
                  -0.3125rem straddles it — vertical rule on narrow
                  screens, horizontal on wide, same arithmetic both ways. */}
              <ol className="grid gap-10 border-l border-rule lg:grid-cols-5 lg:gap-0 lg:border-l-0 lg:border-t">
                {d.flowSteps.map((step, index) => {
                  const isOutcome = index === lastIndex;
                  return (
                    <li key={step.label} className="relative pl-8 lg:pt-10 lg:pr-8 lg:pl-0">
                      <span
                        aria-hidden="true"
                        className={`absolute top-1.5 -left-[0.3125rem] h-2.5 w-2.5 rounded-full lg:-top-[0.3125rem] lg:left-0 ${
                          isOutcome ? "bg-accent" : "bg-ink-3"
                        }`}
                      />
                      <div className="font-mono text-label font-medium text-ink-3 tabular-nums uppercase">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <h3 className={`mt-3 text-[1.0625rem] font-medium tracking-[-0.018em] ${isOutcome ? "text-accent" : "text-ink"}`}>
                        {step.label}
                      </h3>
                      <p className="mt-2 max-w-[32ch] text-sm leading-6 text-ink-2">{step.body}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </ProductFrame>
        </Shell>
      </Section>

      <Section size="lg" tone="sunken">
        <Shell>
          <SectionHeading eyebrow={d.dataProductsHeading} title={d.dataProductsSub} />

          <div className="mt-12 border-t border-rule">
            {DATA_PRODUCTS.map((product) => (
              <DataProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-12">
            <SecondaryAction href={`/${locale}/ai-use-cases`}>{dict.aiPortfolioPage.badge}</SecondaryAction>
          </div>
        </Shell>
      </Section>

      <PageCta
        heading={d.ctaHeading}
        body={d.ctaBody}
        primaryHref={`/${locale}/donna-ai`}
        primaryLabel={d.ctaLabel}
        secondaryHref={`/${locale}/cost-value-lab`}
        secondaryLabel={dict.costValueLabPage.badge}
      />
    </main>
  );
}
