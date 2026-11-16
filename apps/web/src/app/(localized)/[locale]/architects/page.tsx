import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArchitectureDecisionCard } from "@/components/architects/ArchitectureDecisionCard";
import { ArchitecturePatternCard } from "@/components/architects/ArchitecturePatternCard";
import { ARCHITECTURE_PATTERNS } from "@/components/architects/architecture-patterns";
import { ArchitectureTransformationCard } from "@/components/architects/ArchitectureTransformationCard";
import { ARCHITECTURE_TRANSFORMATIONS } from "@/components/architects/architecture-transformations";
import { ARCHITECTURE_DECISION_EXAMPLES } from "@/components/architects/catalog";
import { IllustrativeLabel, PageCta, PageHeader, Section, SectionHeading, Shell } from "@/components/editorial/primitives";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.architectsPage.metaTitle}: ClouDonna`;
  const description = dict.architectsPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/architects"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

/**
 * The page keeps its central message — architecture should end with an
 * explainable decision, not a diagram — and now leads with the largest
 * thing on it: the before/after transformation canvas, with dependencies,
 * architecture impact and business impact attached to it.
 *
 * What changed structurally: the `questions` list is a ruled index
 * beside the headline rather than a cloud of pills; the patterns and ADRs
 * are hairline-separated disclosure rows rather than two dense card
 * grids; and the placeholder demo video (videoUrl is still null — see
 * demo/types.ts) was removed from this page, because a title card for an
 * unrecorded video is not evidence of anything. Every video still lives
 * on /demo, where the page is actually about watching them.
 */
export default async function ArchitectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const a = dict.architectsPage;

  return (
    <main className="bg-paper">
      <PageHeader
        eyebrow={a.badge}
        title={a.h1}
        lede={a.sub}
        aside={
          <div>
            <div className="font-mono text-label font-medium text-ink-3 uppercase">{a.questionsHeading}</div>
            <ul className="mt-5 border-t border-rule">
              {a.questions.map((question) => (
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
          <SectionHeading eyebrow={a.transformationHeading} title={a.transformationSub} />
          <div className="mt-12 space-y-12">
            {ARCHITECTURE_TRANSFORMATIONS.map((transformation) => (
              <ArchitectureTransformationCard key={transformation.id} transformation={transformation} />
            ))}
          </div>
        </Shell>
      </Section>

      <Section size="lg" tone="sunken">
        <Shell>
          <SectionHeading eyebrow={a.patternsHeading} title={a.patternsSub} />
          <div className="mt-12 border-t border-rule">
            {ARCHITECTURE_PATTERNS.map((pattern) => (
              <ArchitecturePatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        </Shell>
      </Section>

      <Section size="lg">
        <Shell>
          <SectionHeading eyebrow={a.adrHeading} title={a.adrSub} />
          <div className="mt-6">
            <IllustrativeLabel>{dict.showcase.illustrativeLabel}</IllustrativeLabel>
          </div>

          <div className="mt-12 grid gap-x-16 gap-y-12 lg:grid-cols-2">
            {ARCHITECTURE_DECISION_EXAMPLES.map((example) => (
              <ArchitectureDecisionCard key={example.id} example={example} />
            ))}
          </div>
        </Shell>
      </Section>

      <PageCta
        heading={a.ctaHeading}
        body={a.ctaBody}
        primaryHref={`/${locale}/donna-ai`}
        primaryLabel={a.ctaLabel}
        secondaryHref={`/${locale}/case-study`}
        secondaryLabel={dict.caseStudyPage.badge}
      />
    </main>
  );
}
