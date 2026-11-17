import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageCta, PageHeader, Section, SectionHeading, Shell } from "@/components/editorial/primitives";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.companyPage.metaTitle}: ClouDonna`;
  const description = dict.companyPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/company"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

/**
 * Website Perfection & SEO Release Gate (brief §12/§27): the brand
 * credibility page search engines and human visitors both need, built
 * strictly without naming an individual founder — "Team" stays
 * institutional ("founder-led," "built by enterprise technology
 * practitioners"), never a name, photo, bio or personal link. See the
 * privacy regression test (src/__tests__/founder-privacy.test.ts) for
 * the automated guarantee that stays true.
 *
 * Deliberately short on new claims: Philosophy and Status both link out
 * to /independence and /trust rather than re-arguing what those pages
 * already establish in full.
 */
export default async function CompanyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const c = dict.companyPage;

  return (
    <main className="bg-paper">
      <PageHeader eyebrow={c.badge} title={c.h1} lede={c.sub} />

      <Section size="lg">
        <Shell>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading eyebrow={c.missionEyebrow} title={c.missionHeading} />
              <p className="mt-6 max-w-[60ch] text-[0.9375rem] leading-7 text-ink-2">{c.missionBody}</p>
            </div>
            <div>
              <SectionHeading eyebrow={c.categoryEyebrow} title={c.categoryHeading} />
              <p className="mt-6 max-w-[60ch] text-[0.9375rem] leading-7 text-ink-2">{c.categoryBody}</p>
            </div>
          </div>
        </Shell>
      </Section>

      <Section size="lg" tone="sunken">
        <Shell>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading eyebrow={c.philosophyEyebrow} title={c.philosophyHeading} />
              <p className="mt-6 max-w-[60ch] text-[0.9375rem] leading-7 text-ink-2">
                {c.philosophyBody1}{" "}
                <Link href={`/${locale}/independence`} className="font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
                  {c.philosophyLinkIndependence}
                </Link>{" "}
                {c.philosophyBodyMiddle}{" "}
                <Link href={`/${locale}/trust`} className="font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
                  {c.philosophyLinkTrust}
                </Link>
                {c.philosophyBody2}
              </p>
            </div>
            <div>
              <SectionHeading eyebrow={c.teamEyebrow} title={c.teamHeading} />
              <p className="mt-6 max-w-[60ch] text-[0.9375rem] leading-7 text-ink-2">{c.teamBody}</p>
            </div>
          </div>
        </Shell>
      </Section>

      <Section size="lg">
        <Shell>
          <SectionHeading eyebrow={c.statusEyebrow} title={c.statusHeading} />
          <p className="mt-6 max-w-[62ch] text-[0.9375rem] leading-7 text-ink-2">
            {c.statusBody1}{" "}
            <Link href={`/${locale}/trust`} className="font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
              {c.statusLinkTrust}
            </Link>
            {c.statusBody2}
          </p>
        </Shell>
      </Section>

      <PageCta
        heading={c.ctaHeading}
        body={c.ctaBody}
        primaryHref={`/${locale}/donna-ai`}
        primaryLabel={c.ctaPrimary}
        secondaryHref={`/${locale}/trust`}
        secondaryLabel={c.ctaSecondary}
      />
    </main>
  );
}
