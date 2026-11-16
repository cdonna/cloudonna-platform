import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DECISION_SKILL_CATEGORIES } from "@/components/decision-skills/catalog";
import {
  Disclosure,
  FrameField,
  FramePanel,
  IllustrativeLabel,
  PageCta,
  PageHeader,
  ProductFrame,
  RuledList,
  Section,
  SectionHeading,
  Shell,
  Tag,
} from "@/components/editorial/primitives";
import { EvidenceTag } from "@/components/showcase/EvidenceTag";
import { EXAMPLE_DECISIONS } from "@/components/showcase/example-decisions";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.decisionSkillsPage.metaTitle}: ClouDonna`;
  const description = dict.decisionSkillsPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/decision-skills"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

const PREVIEW = EXAMPLE_DECISIONS[0];

/**
 * Decision Skills now reads as product capability rather than a taxonomy:
 * the eight categories are a ruled index of the real enterprise questions
 * each one covers, and the page ends on an actual recommendation preview
 * — the same output the engine produces, not a description of it.
 *
 * The four-colour rotating icon tile per category is gone. It implied
 * eight categories differ in kind when they differ only in subject, and
 * it was the last place on the site still cycling the retired accent
 * range.
 */
export default async function DecisionSkillsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const d = dict.decisionSkillsPage;

  return (
    <main className="bg-paper">
      <PageHeader
        eyebrow={d.badge}
        title={d.h1}
        lede={d.sub}
        aside={
          <div>
            <div className="font-mono text-label font-medium text-ink-3 uppercase">{d.outputHeading}</div>
            <div className="mt-5">
              <RuledList items={d.outputs} tone="accent" />
            </div>
          </div>
        }
      />

      <Section size="lg">
        <Shell>
          <SectionHeading eyebrow={d.questionsHeading} title={d.metaDescription} />

          <div className="mt-12 border-t border-rule">
            {DECISION_SKILL_CATEGORIES.map((category) => {
              const example = EXAMPLE_DECISIONS.find((decision) => decision.decisionSkills.includes(category.id));
              return (
                <Disclosure key={category.id} title={category.label} summary={category.description}>
                  <FrameField label={d.questionsHeading} className="sm:col-span-2">
                    <div className="flex flex-wrap gap-1.5">
                      {category.examples.map((exampleLabel) => (
                        <Tag key={exampleLabel}>{exampleLabel}</Tag>
                      ))}
                    </div>
                  </FrameField>

                  {example && (
                    <div className="sm:col-span-2">
                      <Link
                        href={`/${locale}/examples#${example.id}`}
                        className="group inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors duration-control hover:text-accent"
                      >
                        {d.exampleLinkLabel}
                        <ArrowRight size={14} className="transition-transform duration-control ease-nova-settle group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  )}
                </Disclosure>
              );
            })}
          </div>
        </Shell>
      </Section>

      <Section size="lg" tone="sunken">
        <Shell>
          <SectionHeading eyebrow={d.previewHeading} title={PREVIEW.title} note={PREVIEW.question} />

          <ProductFrame className="mt-12" label={dict.journey.decide.frame} meta={dict.showcase.illustrativeLabel}>
            <div className="grid gap-px bg-rule lg:grid-cols-[1.1fr_1fr]">
              <div className="bg-paper p-6 sm:p-8">
                <FramePanel tone="accent">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-label font-medium text-ink-3 uppercase">{dict.resultOverview.recommendationLabel}</span>
                    <EvidenceTag type="calculated" />
                  </div>
                  <p className="mt-3 text-[1.0625rem] leading-snug font-medium text-ink">{PREVIEW.recommendation}</p>
                  <p className="mt-4 text-sm leading-7 text-ink-2">{PREVIEW.recommendationRationale}</p>
                </FramePanel>

                <FrameField label={dict.executiveBrief.tradeOffsHeading} className="mt-8">
                  <RuledList items={PREVIEW.tradeOffs} />
                </FrameField>
              </div>

              <div className="bg-paper p-6 sm:p-8">
                <FrameField label={dict.resultOverview.whatWouldChangeHeading}>
                  <div className="space-y-4 border-t border-rule pt-4">
                    {PREVIEW.whatWouldChange.map((trigger) => (
                      <p key={trigger.option} className="text-sm leading-7 text-ink-2">
                        <span className="font-medium text-accent">{trigger.option}</span> — {trigger.condition}
                      </p>
                    ))}
                  </div>
                </FrameField>

                <FrameField label={dict.executiveBrief.assumptionsHeading} className="mt-8">
                  <div className="mb-2">
                    <EvidenceTag type="assumption" />
                  </div>
                  <RuledList items={PREVIEW.assumptions} />
                </FrameField>
              </div>
            </div>
          </ProductFrame>

          <p className="mt-8 flex flex-wrap items-center gap-3 text-sm text-ink-3">
            <IllustrativeLabel>{dict.showcase.illustrativeLabel}</IllustrativeLabel>
            {d.evidenceDistinctionNote}
          </p>
        </Shell>
      </Section>

      <PageCta
        heading={d.ctaHeading}
        body={d.ctaBody}
        primaryHref={`/${locale}/donna-ai`}
        primaryLabel={d.ctaLabel}
        secondaryHref={`/${locale}/examples`}
        secondaryLabel={dict.examplesPage.badge}
      />
    </main>
  );
}
