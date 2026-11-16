import type { Metadata } from "next";
import ClosingCta from "@/components/landing/ClosingCta";
import DecisionJourney from "@/components/landing/DecisionJourney";
import ExploreMore from "@/components/landing/ExploreMore";
import Hero from "@/components/landing/Hero";
import { InquiryForm } from "@/components/landing/InquiryForm";
import ProductPrinciples from "@/components/landing/ProductPrinciples";
import { Reveal } from "@/components/landing/Reveal";
import TrustStrip from "@/components/landing/TrustStrip";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.seo.home.title,
    description: dict.seo.home.description,
    alternates: localizedAlternates(locale, ""),
    openGraph: localizedOpenGraph(locale, dict.seo.home.title, dict.seo.home.description),
  };
}

/**
 * No `offers` or `aggregateRating` — ClouDonna has no public pricing and
 * no review data to cite. Omitting a schema.org field it doesn't have a
 * real value for beats inventing one to look more complete.
 */
function softwareApplicationJsonLd(locale: Locale, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ClouDonna",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description,
    url: `https://www.cdonna.com/${locale}`,
  };
}

/**
 * The homepage is one argument in five numbered steps, not a stack of
 * sections. What it used to be: Hero → Problem (3 symptom cards) →
 * DonnaSignature (scripted animation) → DonnaLive (interactive demo) →
 * SeeClouDonnaThink → divider → TrustStrip → EnterpriseIntelligence (3
 * pillar cards) → InquiryForm.
 *
 * Two of those are deliberately gone rather than restyled: Problem and
 * EnterpriseIntelligence were marketing-card grids whose content the
 * journey and the principles now carry with the product on screen.
 * DonnaSignature's scripted "watch Donna think" beat and DonnaLive's
 * interactive demo both now live on /demo (PersonaPlayground embeds
 * DonnaLive) — keeping either here would have meant a third and fourth
 * full-width dark section competing with 05 Remember and the close,
 * which is exactly the mechanical light/dark alternation the brief rules
 * out. The hero's secondary action and the nav both reach the real
 * product in one click.
 *
 * `Reveal` stays, wrapping whole sections only: a 550ms settle on
 * GPU-only properties, never hiding content from anyone (see its own
 * reduced-motion handling).
 */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <main className="bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd(locale, dict.seo.home.description)) }}
      />
      <Hero dict={dict} locale={locale} />
      <DecisionJourney dict={dict} />
      <Reveal>
        <ProductPrinciples dict={dict} />
      </Reveal>
      <Reveal>
        <ExploreMore dict={dict} locale={locale} />
      </Reveal>
      <Reveal>
        <TrustStrip dict={dict} locale={locale} />
      </Reveal>
      <ClosingCta dict={dict} locale={locale} />
      <InquiryForm inquiryType="founding_tester" sectionId="early-access" register="dark" />
    </main>
  );
}
