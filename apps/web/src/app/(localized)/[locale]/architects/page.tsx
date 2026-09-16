import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ArchitectureDecisionCard } from "@/components/architects/ArchitectureDecisionCard";
import { ArchitecturePatternCard } from "@/components/architects/ArchitecturePatternCard";
import { ARCHITECTURE_PATTERNS } from "@/components/architects/architecture-patterns";
import { ArchitectureTransformationCard } from "@/components/architects/ArchitectureTransformationCard";
import { ARCHITECTURE_TRANSFORMATIONS } from "@/components/architects/architecture-transformations";
import { ARCHITECTURE_DECISION_EXAMPLES } from "@/components/architects/catalog";
import { DEMO_VIDEOS } from "@/components/demo/catalog";
import { VideoCard } from "@/components/demo/VideoCard";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.architectsPage.metaTitle}: ClouDonna`;
  const description = dict.architectsPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/architects"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

const architectsVideo = DEMO_VIDEOS.find((video) => video.id === "home-of-architects");

export default async function ArchitectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const a = dict.architectsPage;

  return (
    <div className="min-h-dvh bg-void">
      <div className="mx-auto max-w-3xl px-6 pt-14 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong shadow-sm">
          {a.badge}
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-balance text-nova-ink sm:text-5xl">{a.h1}</h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-nova-ink-muted">{a.sub}</p>

        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
          {a.questions.map((question) => (
            <span key={question} className="rounded-full border border-titanium bg-carbon px-3.5 py-1.5 text-xs text-nova-ink-muted">
              {question}
            </span>
          ))}
        </div>
      </div>

      {architectsVideo && (
        <div className="mx-auto mt-12 max-w-2xl px-6">
          <VideoCard video={architectsVideo} index={0} />
        </div>
      )}

      <div className="mx-auto mt-16 max-w-4xl px-6">
        <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{a.patternsHeading}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-nova-ink-muted">{a.patternsSub}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {ARCHITECTURE_PATTERNS.map((pattern) => (
            <ArchitecturePatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-4xl px-6">
        <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{a.transformationHeading}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-nova-ink-muted">{a.transformationSub}</p>

        <div className="mt-6 space-y-6">
          {ARCHITECTURE_TRANSFORMATIONS.map((transformation) => (
            <ArchitectureTransformationCard key={transformation.id} transformation={transformation} />
          ))}
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-4xl px-6 pb-16">
        <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{a.adrHeading}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-nova-ink-muted">{a.adrSub}</p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {ARCHITECTURE_DECISION_EXAMPLES.map((example) => (
            <ArchitectureDecisionCard key={example.id} example={example} />
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-titanium bg-carbon-2 p-8 text-center">
          <h2 className="text-xl font-semibold text-nova-ink">{a.ctaHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-nova-ink-muted">{a.ctaBody}</p>
          <Link
            href={`/${locale}/donna-ai`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-nova-accent to-sunset-coral px-6 py-3 text-sm font-semibold text-white shadow-nova-glow transition hover:brightness-110"
          >
            {a.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
