import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DataProductCard } from "@/components/data-economy/DataProductCard";
import { DATA_PRODUCTS } from "@/components/data-economy/catalog";
import { DEMO_VIDEOS } from "@/components/demo/catalog";
import { VideoCard } from "@/components/demo/VideoCard";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.dataEconomyPage.metaTitle}: ClouDonna`;
  const description = dict.dataEconomyPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/data-economy"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

const dataEconomyVideo = DEMO_VIDEOS.find((video) => video.id === "data-economy");

export default async function DataEconomyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const d = dict.dataEconomyPage;

  return (
    <div className="min-h-dvh bg-void">
      <div className="mx-auto max-w-3xl px-6 pt-14 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong shadow-sm">
          {d.badge}
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-balance text-nova-ink sm:text-5xl">{d.h1}</h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-nova-ink-muted">{d.sub}</p>
      </div>

      {dataEconomyVideo && (
        <div className="mx-auto mt-12 max-w-2xl px-6">
          <VideoCard video={dataEconomyVideo} index={1} />
        </div>
      )}

      <div className="mx-auto mt-16 max-w-4xl px-6">
        <h2 className="text-center text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{d.flowHeading}</h2>

        <div className="mt-8 grid gap-3 sm:grid-cols-5">
          {d.flowSteps.map((step, index) => (
            <div key={step.label} className="relative rounded-2xl border border-titanium bg-carbon p-5">
              <span
                className={`text-xs font-semibold tracking-[0.1em] uppercase ${
                  index === d.flowSteps.length - 1 ? "text-sunset-coral" : "text-nova-accent-strong"
                }`}
              >
                {step.label}
              </span>
              <p className="mt-2 text-xs leading-5 text-nova-ink-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-4xl px-6">
        <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{d.dataProductsHeading}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-nova-ink-muted">{d.dataProductsSub}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {DATA_PRODUCTS.map((product) => (
            <DataProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/ai-use-cases`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-nova-accent-strong transition duration-control hover:text-nova-ink"
          >
            {dict.aiPortfolioPage.badge}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-4xl px-6 pb-16">
        <h2 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{d.questionsHeading}</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {d.questions.map((question) => (
            <span key={question} className="rounded-full border border-titanium bg-carbon px-3.5 py-1.5 text-sm text-nova-ink-muted">
              {question}
            </span>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-titanium bg-carbon-2 p-8 text-center">
          <h2 className="text-xl font-semibold text-nova-ink">{d.ctaHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-nova-ink-muted">{d.ctaBody}</p>
          <Link
            href={`/${locale}/donna-ai`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-nova-accent to-sunset-coral px-6 py-3 text-sm font-semibold text-white shadow-nova-glow transition hover:brightness-110"
          >
            {d.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
