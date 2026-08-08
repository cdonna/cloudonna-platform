import type { Metadata } from "next";
import DonnaLive from "@/components/donna/DonnaLive";
import EarlyAccess from "@/components/landing/EarlyAccess";
import Ecosystem from "@/components/landing/Ecosystem";
import EnterpriseIntelligence from "@/components/landing/EnterpriseIntelligence";
import Hero from "@/components/landing/Hero";
import NarrativeSequence from "@/components/landing/NarrativeSequence";
import Problem from "@/components/landing/Problem";
import TrustStrip from "@/components/landing/TrustStrip";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-obsidian">
      <Hero />
      <Problem />
      <NarrativeSequence />
      <DonnaLive />
      <TrustStrip />
      <EnterpriseIntelligence />
      <Ecosystem />
      <EarlyAccess />
    </main>
  );
}
