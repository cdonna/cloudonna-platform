import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageCta, PageHeader, Section, SectionHeading, Shell } from "@/components/editorial/primitives";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.commercialPage.metaTitle}: ClouDonna`;
  const description = dict.commercialPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/commercial"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

/**
 * Commercial Engine V1 (brief §21/§22) — the enterprise-sales-led
 * landing page for Decision Sprint / Team / Enterprise. Not a
 * consumer SaaS pricing table: no self-service checkout, no monthly
 * toggle, no feature-tier comparison grid — every price shown is an
 * indicative "starting from" entry point (brief §7), and every CTA
 * leads to /contact, never a payment form.
 *
 * Decision Sprint gets the full Q&A treatment (brief §22's own
 * question list) since it's the actual entry point most prospects
 * will take first; Team and Enterprise are described more briefly,
 * consistent with how CommercialPaths.tsx already summarizes them —
 * this page is where a prospect goes to read more, not a duplicate of
 * the homepage section.
 */
export default async function CommercialPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const c = dict.commercialPage;

  const sprintQa: Array<{ label: string; body: string }> = [
    { label: c.sprint.whatDecisionLabel, body: c.sprint.whatDecisionBody },
    { label: c.sprint.whatClouDonnaDoesLabel, body: c.sprint.whatClouDonnaDoesBody },
    { label: c.sprint.whatYouReceiveLabel, body: c.sprint.whatYouReceiveBody },
    { label: c.sprint.howLongLabel, body: c.sprint.howLongBody },
    { label: c.sprint.whoParticipatesLabel, body: c.sprint.whoParticipatesBody },
    { label: c.sprint.whatItCostsLabel, body: c.sprint.whatItCostsBody },
    { label: c.sprint.whatHappensAfterLabel, body: c.sprint.whatHappensAfterBody },
  ];

  return (
    <main className="bg-paper">
      <PageHeader eyebrow={c.badge} title={c.h1} lede={c.sub} />

      <Section size="lg">
        <Shell>
          <SectionHeading eyebrow={c.sprint.eyebrow} title={c.sprint.heading} />
          <dl className="mt-10 border-t border-rule">
            {sprintQa.map((qa) => (
              <div key={qa.label} className="grid gap-2 border-b border-rule py-6 lg:grid-cols-[18rem_1fr] lg:gap-10">
                <dt className="text-[0.9375rem] font-medium text-ink">{qa.label}</dt>
                <dd className="max-w-[60ch] text-[0.9375rem] leading-7 text-ink-2">{qa.body}</dd>
              </div>
            ))}
          </dl>
          <a
            href={`/${locale}/contact?type=decision_sprint`}
            className="mt-8 inline-flex min-h-11 items-center rounded-md bg-solid px-5 text-sm font-medium text-solid-on transition-colors duration-control hover:bg-accent hover:text-accent-on"
          >
            {c.sprint.cta}
          </a>
        </Shell>
      </Section>

      <Section size="lg" tone="sunken">
        <Shell>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading eyebrow={c.team.eyebrow} title={c.team.heading} />
              <p className="mt-6 max-w-[60ch] text-[0.9375rem] leading-7 text-ink-2">{c.team.body}</p>
              <p className="mt-4 text-sm font-medium text-ink">{c.team.priceLabel}</p>
              <a href={`/${locale}/contact?type=team`} className="mt-4 inline-flex text-sm font-medium text-accent hover:underline">
                {c.team.cta}
              </a>
            </div>
            <div>
              <SectionHeading eyebrow={c.enterprise.eyebrow} title={c.enterprise.heading} />
              <p className="mt-6 max-w-[60ch] text-[0.9375rem] leading-7 text-ink-2">{c.enterprise.body}</p>
              <p className="mt-4 text-sm font-medium text-ink">{c.enterprise.priceLabel}</p>
              <a href={`/${locale}/contact?type=enterprise`} className="mt-4 inline-flex text-sm font-medium text-accent hover:underline">
                {c.enterprise.cta}
              </a>
            </div>
          </div>
        </Shell>
      </Section>

      <Section size="lg">
        <Shell>
          <SectionHeading eyebrow={c.conversionEyebrow} title={c.conversionHeading} />
          <p className="mt-6 max-w-[62ch] text-[0.9375rem] leading-7 text-ink-2">{c.conversionBody}</p>
        </Shell>
      </Section>

      <PageCta
        heading={c.ctaHeading}
        body={c.ctaBody}
        primaryHref={`/${locale}/contact?type=decision_sprint`}
        primaryLabel={c.ctaPrimary}
        secondaryHref={`/${locale}/contact?type=enterprise`}
        secondaryLabel={c.ctaSecondary}
      />
    </main>
  );
}
