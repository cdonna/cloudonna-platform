import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Display,
  Eyebrow,
  Lede,
  PageCta,
  PageHeader,
  ProductFrame,
  Section,
  SectionHeading,
  Shell,
} from "@/components/editorial/primitives";
import { EvidenceTag, type EvidenceType } from "@/components/showcase/EvidenceTag";
import { EVIDENCE_RECORD } from "@/components/showcase/evidence-record";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.trustCenterPage.metaTitle}: ClouDonna`;
  const description = dict.trustCenterPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/trust"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

/**
 * Trust is now factual and technical rather than reassuring. Three
 * things changed:
 *
 * 1. The six evidence categories are named and labeled with the *same*
 *    EvidenceTag component the product uses, so the taxonomy on this
 *    page is demonstrably the taxonomy in the decisions.
 * 2. An actual evidence record is shown, with source, effective date,
 *    retrieved date, freshness, confidence and scope — including a
 *    "review due" freshness and a medium confidence, because a trust
 *    page that only shows fresh high-confidence evidence is marketing.
 * 3. The AI boundary gets its own dark section. It is the single
 *    strongest commitment on the page and the one most often quietly
 *    broken by products in this category, so it is stated alone rather
 *    than as one of six cards in a grid.
 *
 * The icon-in-a-rounded-tile treatment on all six structural rules is
 * gone; six lucide glyphs added nothing a reader could verify.
 */

// Aligned by index to trustCenterPage.evidenceCategories.
const CATEGORY_TAGS: (EvidenceType | undefined)[] = [
  "official-source",
  "customer-input",
  undefined,
  "calculated",
  "ai-interpretation",
  "assumption",
];

export default async function TrustCenterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.trustCenterPage;

  return (
    <main className="bg-paper">
      <PageHeader eyebrow={t.badge} title={t.h1} lede={t.sub} />

      <Section size="lg">
        <Shell>
          <SectionHeading eyebrow={t.categoriesHeading} title={t.categoriesSub} />

          <dl className="mt-14 border-t border-rule">
            {t.evidenceCategories.map((category, index) => {
              const tag = CATEGORY_TAGS[index];
              return (
                <div
                  key={category.label}
                  className="grid gap-3 border-b border-rule py-7 lg:grid-cols-[16rem_1fr] lg:items-baseline lg:gap-10"
                >
                  <dt>
                    <span className="block text-[1.0625rem] font-medium tracking-[-0.018em] text-ink">{category.label}</span>
                    {tag && (
                      <span className="mt-2.5 block">
                        <EvidenceTag type={tag} />
                      </span>
                    )}
                  </dt>
                  <dd className="max-w-[62ch] text-[0.9375rem] leading-7 text-ink-2">{category.body}</dd>
                </div>
              );
            })}
          </dl>
        </Shell>
      </Section>

      <Section size="lg" tone="sunken">
        <Shell>
          <SectionHeading eyebrow={t.fieldsHeading} title={EVIDENCE_RECORD.claim} note={t.fieldsSub} />

          <ProductFrame className="mt-12 max-w-[56rem]" label={t.fieldsHeading} meta={dict.showcase.illustrativeLabel}>
            <dl className="divide-y divide-rule">
              {EVIDENCE_RECORD.fields.map((field) => (
                <div key={field.key} className="grid gap-1 px-6 py-5 sm:grid-cols-[12rem_1fr] sm:gap-8 sm:px-8">
                  <dt className="font-mono text-label font-medium text-ink-3 uppercase">{t.fieldLabels[field.key]}</dt>
                  <dd className={`text-sm leading-6 ${field.caution ? "text-sig-caution" : "text-ink"}`}>{field.value}</dd>
                </div>
              ))}
            </dl>
          </ProductFrame>
        </Shell>
      </Section>

      {/* The one claim on this page that cannot be hedged. */}
      <Section size="lg" register="dark">
        <Shell>
          <div className="max-w-[46rem]">
            <Eyebrow>{t.badge}</Eyebrow>
            <Display size={2} className="mt-7">
              {t.aiBoundaryHeading}
            </Display>
            <Lede className="mt-7">{t.aiBoundaryBody}</Lede>
            <div className="mt-9">
              <EvidenceTag type="ai-interpretation" />
            </div>
          </div>
        </Shell>
      </Section>

      <Section size="lg">
        <Shell>
          <SectionHeading eyebrow={t.badge} title={t.metaDescription} />

          <dl className="mt-14 border-t border-rule">
            {t.sections.map((section) => (
              <div
                key={section.title}
                className="grid gap-3 border-b border-rule py-7 lg:grid-cols-[22rem_1fr] lg:items-baseline lg:gap-10"
              >
                <dt className="text-[1.0625rem] font-medium tracking-[-0.018em] text-ink">{section.title}</dt>
                <dd className="max-w-[62ch] text-[0.9375rem] leading-7 text-ink-2">{section.body}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-12 max-w-[62ch] text-sm leading-7 text-ink-2">
            {t.independenceLinkPrefix}{" "}
            <Link href={`/${locale}/independence`} className="font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
              {t.independenceLinkText}
            </Link>{" "}
            {t.independenceLinkSuffix}
          </p>
        </Shell>
      </Section>

      <PageCta
        heading={t.ctaHeading}
        body={t.ctaBody}
        primaryHref={`/${locale}/donna-ai`}
        primaryLabel={t.ctaLabel}
        secondaryHref={`/${locale}/examples`}
        secondaryLabel={dict.examplesPage.badge}
      />
    </main>
  );
}
