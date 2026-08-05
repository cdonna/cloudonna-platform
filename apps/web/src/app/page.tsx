import type { Metadata } from "next";
import DonnaLive from "@/components/donna/DonnaLive";
import EarlyAccess from "@/components/landing/EarlyAccess";
import Ecosystem from "@/components/landing/Ecosystem";
import FeatureCards from "@/components/landing/FeatureCards";
import Hero from "@/components/landing/Hero";
import NarrativeSequence from "@/components/landing/NarrativeSequence";
import Stats from "@/components/landing/Stats";
import TrustStrip from "@/components/landing/TrustStrip";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <Stats />
      <NarrativeSequence />
      <Ecosystem />
      <FeatureCards />
      <DonnaLive />
      <TrustStrip />
      <EarlyAccess />
    </main>
  );
}