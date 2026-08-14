import type { Metadata } from "next";
import DonnaLive from "@/components/donna/DonnaLive";
import DonnaSignature from "@/components/landing/DonnaSignature";
import Ecosystem from "@/components/landing/Ecosystem";
import EnterpriseIntelligence from "@/components/landing/EnterpriseIntelligence";
import Hero from "@/components/landing/Hero";
import { InquiryForm } from "@/components/landing/InquiryForm";
import Problem from "@/components/landing/Problem";
import { Reveal } from "@/components/landing/Reveal";
import TrustStrip from "@/components/landing/TrustStrip";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "@/i18n/locales";
import { localizedAlternates } from "@/i18n/seo";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.seo.home.title,
    description: dict.seo.home.description,
    alternates: localizedAlternates(locale, ""),
    openGraph: { locale, title: dict.seo.home.title, description: dict.seo.home.description },
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
    <main className="min-h-screen bg-obsidian">
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
        <TrustStrip dict={dict} locale={locale} />
      </Reveal>
      <Reveal>
        <EnterpriseIntelligence dict={dict} />
      </Reveal>
      <Reveal>
        <Ecosystem dict={dict} locale={locale} />
      </Reveal>
      <Reveal>
        <InquiryForm inquiryType="founding_tester" sectionId="early-access" />
      </Reveal>
    </main>
  );
}
