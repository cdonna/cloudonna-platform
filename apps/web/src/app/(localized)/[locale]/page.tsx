import type { Metadata } from "next";
import DonnaLive from "@/components/donna/DonnaLive";
import DonnaSignature from "@/components/landing/DonnaSignature";
import EnterpriseIntelligence from "@/components/landing/EnterpriseIntelligence";
import Hero from "@/components/landing/Hero";
import { InquiryForm } from "@/components/landing/InquiryForm";
import Problem from "@/components/landing/Problem";
import { Reveal } from "@/components/landing/Reveal";
import SeeClouDonnaThink from "@/components/landing/SeeClouDonnaThink";
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

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <main className="min-h-dvh bg-obsidian">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd(locale, dict.seo.home.description)) }}
      />
      <Hero />
      <Reveal>
        <Problem dict={dict} />
      </Reveal>
      <Reveal>
        <DonnaSignature />
      </Reveal>
      <Reveal>
        <DonnaLive />
      </Reveal>
      <Reveal>
        <SeeClouDonnaThink dict={dict} locale={locale} />
      </Reveal>
      {/* One deliberate signature moment between the interactive demo and
          the trust section — not a recurring divider pattern, so it reads
          as a chosen beat rather than decoration repeated everywhere. */}
      <div aria-hidden="true" className="mx-auto h-px max-w-xs bg-gradient-to-r from-transparent via-sunset-coral/60 via-deep-purple/60 to-transparent" />
      <Reveal>
        <TrustStrip dict={dict} locale={locale} />
      </Reveal>
      <Reveal>
        <EnterpriseIntelligence dict={dict} />
      </Reveal>
      <Reveal>
        <InquiryForm inquiryType="founding_tester" sectionId="early-access" />
      </Reveal>
    </main>
  );
}
