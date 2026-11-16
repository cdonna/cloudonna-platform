import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Display,
  Eyebrow,
  IllustrativeLabel,
  Lede,
  PageCta,
  RuledList,
  Section,
  Shell,
} from "@/components/editorial/primitives";
import { CASE_STUDY } from "@/components/showcase/case-study";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";
import type { Dictionary } from "@/i18n/dictionary";

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

/**
 * Editorial treatment: a numbered article with a hanging label column,
 * one reading measure, and real vertical rhythm — the structure the
 * brief asks for (situation → decision → options → constraints →
 * recommendation → why → trade-offs → architecture → financial → risks
 * → outcome) made legible as a document rather than as eleven stacked
 * uppercase labels above paragraphs.
 *
 * No customer logos, invented or otherwise. The illustrative disclosure
 * sits with the headline, not in small print at the bottom.
 */
function Chapter({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t border-rule py-12 lg:grid-cols-[14rem_1fr] lg:gap-16">
      <h2 className="flex items-baseline gap-3 font-mono text-label font-medium uppercase">
        <span className="text-accent tabular-nums">{String(index).padStart(2, "0")}</span>
        <span className="text-ink-3">{label}</span>
      </h2>
      <div className="max-w-[68ch]">{children}</div>
    </section>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-[1.0625rem] leading-8 text-ink-2">{children}</p>;
}

export default async function CaseStudyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict: Dictionary = await getDictionary(locale);
  const c = dict.caseStudyPage;

  return (
    <main className="bg-paper">
      <Section size="md" className="pb-0">
        <Shell>
          <div className="max-w-[52rem]">
            <Eyebrow>{c.badge}</Eyebrow>
            <Display level={1} size={1} className="mt-8">
              {CASE_STUDY.title}
            </Display>
            <Lede className="mt-8 max-w-[44rem]">{CASE_STUDY.decisionQuestion}</Lede>
            <div className="mt-9">
              <IllustrativeLabel>{dict.showcase.illustrativeLabel}</IllustrativeLabel>
            </div>
          </div>
        </Shell>
      </Section>

      <Section size="md">
        <Shell>
          <div className="max-w-[72rem]">
            <Chapter index={1} label={c.situationLabel}>
              <Prose>{CASE_STUDY.situation}</Prose>
            </Chapter>

            <Chapter index={2} label={c.decisionLabel}>
              <Prose>{CASE_STUDY.decisionQuestion}</Prose>
            </Chapter>

            <Chapter index={3} label={c.optionsLabel}>
              <RuledList items={CASE_STUDY.options} />
            </Chapter>

            <Chapter index={4} label={c.constraintsLabel}>
              <RuledList items={CASE_STUDY.constraints} />
            </Chapter>

            {/* The recommendation is the one chapter set at display size:
                it is the thing the previous four chapters were for. */}
            <Chapter index={5} label={c.recommendationLabel}>
              <Display size={3}>{CASE_STUDY.recommendation}</Display>
            </Chapter>

            <Chapter index={6} label={c.whyLabel}>
              <Prose>{CASE_STUDY.why}</Prose>
            </Chapter>

            <Chapter index={7} label={c.tradeOffsLabel}>
              <RuledList items={CASE_STUDY.tradeOffs} />
            </Chapter>

            <Chapter index={8} label={c.architectureImpactLabel}>
              <Prose>{CASE_STUDY.architectureImpact}</Prose>
            </Chapter>

            <Chapter index={9} label={c.financialImpactLabel}>
              <Prose>{CASE_STUDY.financialImpact}</Prose>
            </Chapter>

            <Chapter index={10} label={c.risksLabel}>
              <RuledList items={CASE_STUDY.risks} tone="caution" />
            </Chapter>

            <Chapter index={11} label={c.outcomeLabel}>
              <Prose>{CASE_STUDY.outcome}</Prose>
            </Chapter>
          </div>
        </Shell>
      </Section>

      <PageCta
        heading={c.ctaHeading}
        body={c.ctaBody}
        primaryHref={`/${locale}/donna-ai`}
        primaryLabel={c.ctaLabel}
        secondaryHref={`/${locale}/examples`}
        secondaryLabel={dict.examplesPage.badge}
      />
    </main>
  );
}
