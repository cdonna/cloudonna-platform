import type { Metadata } from "next";
import ClosingCta from "@/components/landing/ClosingCta";
import CommercialPaths from "@/components/landing/CommercialPaths";
import DecisionJourney from "@/components/landing/DecisionJourney";
import EnterpriseGovernance from "@/components/landing/EnterpriseGovernance";
import EvidenceTaxonomyStrip from "@/components/landing/EvidenceTaxonomyStrip";
import ExploreMore from "@/components/landing/ExploreMore";
import Hero from "@/components/landing/Hero";
import { InquiryForm } from "@/components/landing/InquiryForm";
import PlatformArchitecture from "@/components/landing/PlatformArchitecture";
import ProductPrinciples from "@/components/landing/ProductPrinciples";
import { Reveal } from "@/components/landing/Reveal";
import SampleDecisions from "@/components/landing/SampleDecisions";
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
    url: `https://www.cdonna.ch/${locale}`,
  };
}

/**
 * The brief's §20 flow, built from what actually exists rather than as
 * fourteen separate marketing blocks:
 *
 *  1. Cinematic hero (dark)                         → Hero
 *  2. Trust / positioning                           → TrustStrip
 *  3. Live decision demo                            → carried by
 *     DecisionJourney itself (02 Evidence, 04 Simulate embed the real
 *     EvidenceTag taxonomy and the real <ScenarioLab/>); a separate
 *     teaser immediately above it would show the same thing twice.
 *  4. Understand → Evidence → Compare → Simulate → Decide → Align →
 *     Remember                                       → DecisionJourney
 *  5. Decision Command Center                        → the real
 *     authenticated workspace at /donna-ai (Hero's secondary CTA, the
 *     nav's "Platform" item) — not duplicated here as a second,
 *     non-interactive mock of itself.
 *  6. Flagship Data & AI decision                    → DecisionJourney
 *     already follows this exact decision, framed as "Enterprise Data
 *     & AI Platform Strategy," end to end — one flagship, not two.
 *  7. Executive recommendation                       → the confidence
 *     + executive summary panel inside 05 Decide.
 *  8. Decision Memory                                → 07 Remember.
 *  9. Platform architecture                          → PlatformArchitecture
 * 10. Sample decisions                                → SampleDecisions
 * 11. Trust / evidence model                          → EvidenceTaxonomyStrip
 * 12. Enterprise security / governance                → EnterpriseGovernance
 * 13. Commercial models                                → CommercialPaths
 * 14. Final CTA                                        → ClosingCta
 *
 * Dark sections are deliberate, not alternating on a fixed beat: Hero,
 * 07 Remember (inside DecisionJourney), PlatformArchitecture, and
 * ClosingCta — four, spaced apart, each landing on something that
 * earns the weight of a dark canvas.
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
      <Reveal>
        <TrustStrip dict={dict} locale={locale} />
      </Reveal>
      <DecisionJourney dict={dict} />
      <Reveal>
        <ProductPrinciples dict={dict} />
      </Reveal>
      <PlatformArchitecture dict={dict} />
      <Reveal>
        <SampleDecisions dict={dict} locale={locale} />
      </Reveal>
      <Reveal>
        <ExploreMore dict={dict} locale={locale} />
      </Reveal>
      <Reveal>
        <EvidenceTaxonomyStrip dict={dict} locale={locale} />
      </Reveal>
      <Reveal>
        <EnterpriseGovernance dict={dict} locale={locale} />
      </Reveal>
      <Reveal>
        <CommercialPaths dict={dict} locale={locale} />
      </Reveal>
      <ClosingCta dict={dict} locale={locale} />
      <InquiryForm inquiryType="founding_tester" sectionId="early-access" register="dark" />
    </main>
  );
}
