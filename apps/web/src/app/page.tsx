import DonnaLive from "@/components/donna/DonnaLive";
import FeatureCards from "@/components/landing/FeatureCards";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <Stats />
      <FeatureCards />
      <DonnaLive />
    </main>
  );
}