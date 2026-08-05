import DonnaLive from "@/components/donna/DonnaLive";
import EarlyAccess from "@/components/landing/EarlyAccess";
import Ecosystem from "@/components/landing/Ecosystem";
import FeatureCards from "@/components/landing/FeatureCards";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <Stats />
      <Ecosystem />
      <FeatureCards />
      <DonnaLive />
      <EarlyAccess />
    </main>
  );
}