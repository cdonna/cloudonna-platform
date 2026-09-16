import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DEMO_VIDEOS } from "@/components/demo/catalog";
import { PersonaPlayground } from "@/components/demo/PersonaPlayground";
import { VideoCard } from "@/components/demo/VideoCard";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.demoPage.metaTitle}: ClouDonna`;
  const description = dict.demoPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/demo"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

export default async function DemoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const d = dict.demoPage;

  return (
    <div className="min-h-dvh bg-void">
      <div className="mx-auto max-w-3xl px-6 pt-14 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong shadow-sm">
          {d.badge}
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-nova-ink sm:text-5xl">{d.h1}</h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-nova-ink-muted">{d.sub}</p>
      </div>

      <div className="mx-auto mt-14 max-w-6xl px-6">
        <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{d.videosHeading}</h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_VIDEOS.map((video, index) => (
            <VideoCard key={video.id} video={video} index={index} />
          ))}
        </div>
      </div>

      {/* PersonaPlayground embeds DonnaLive, which is fully self-contained
          (its own heading, sub and "Try the full Donna AI assessment"
          CTA) — this page only adds a section label and the persona
          picker above it, not a second, duplicate heading. */}
      <div className="mx-auto mt-20 max-w-3xl px-6 text-center">
        <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{d.tryItHeading}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-nova-ink-muted">{d.tryItSub}</p>
      </div>

      <div className="mx-auto mt-8 max-w-6xl px-6">
        <PersonaPlayground />
      </div>

      <div className="mx-auto mt-20 max-w-3xl px-6 pb-20">
        <div className="rounded-3xl border border-titanium bg-carbon-2 p-8 text-center">
          <h2 className="text-xl font-semibold text-nova-ink">{d.scenarioLabHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-nova-ink-muted">{d.scenarioLabBody}</p>
          <Link
            href={`/${locale}/scenario-lab`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-titanium bg-carbon px-6 py-3 text-sm font-semibold text-nova-ink transition hover:border-titanium-strong"
          >
            {d.scenarioLabCta}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
