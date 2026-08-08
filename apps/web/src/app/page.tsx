import type { Metadata } from "next";
import DonnaLive from "@/components/donna/DonnaLive";
import Ecosystem from "@/components/landing/Ecosystem";
import EnterpriseIntelligence from "@/components/landing/EnterpriseIntelligence";
import Hero from "@/components/landing/Hero";
import { InquiryForm } from "@/components/landing/InquiryForm";
import NarrativeSequence from "@/components/landing/NarrativeSequence";
import Problem from "@/components/landing/Problem";
import { Reveal } from "@/components/landing/Reveal";
import TrustStrip from "@/components/landing/TrustStrip";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * No `offers` or `aggregateRating` — ClouDonna has no public pricing and
 * no review data to cite. Omitting a schema.org field it doesn't have a
 * real value for beats inventing one to look more complete.
 */
const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ClouDonna",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Evidence-based enterprise technology decision intelligence, powered by Donna AI.",
  url: "https://www.cdonna.com",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-obsidian">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }} />
      <Hero />
      <Reveal>
        <Problem />
      </Reveal>
      <Reveal>
        <NarrativeSequence />
      </Reveal>
      <Reveal>
        <DonnaLive />
      </Reveal>
      <Reveal>
        <TrustStrip />
      </Reveal>
      <Reveal>
        <EnterpriseIntelligence />
      </Reveal>
      <Reveal>
        <Ecosystem />
      </Reveal>
      <Reveal>
        <InquiryForm inquiryType="founding_tester" sectionId="early-access" />
      </Reveal>
    </main>
  );
}
