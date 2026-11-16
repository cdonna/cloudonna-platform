import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_VIDEOS } from "@/components/demo/catalog";
import { PersonaPlayground } from "@/components/demo/PersonaPlayground";
import { VideoCard } from "@/components/demo/VideoCard";
import { PageCta, PageHeader, Section, SectionHeading, Shell } from "@/components/editorial/primitives";
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

/**
 * The live demo now leads, and the (still unrecorded — see
 * demo/types.ts) video library follows it. Previously the page opened
 * with six placeholder title cards and put the one interactive thing on
 * it below the fold, which inverted the order of what's actually real.
 *
 * PersonaPlayground embeds DonnaLive, which is self-contained (its own
 * heading, lede and "Try the full Donna AI assessment" link) and renders
 * on the dark register — the one intentional dark beat in the middle of
 * this page.
 */
export default async function DemoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const d = dict.demoPage;

  return (
    <main className="bg-paper">
      <PageHeader eyebrow={d.badge} title={d.h1} lede={d.sub} />

      <Section size="lg">
        <Shell>
          <SectionHeading eyebrow={d.tryItHeading} title={d.tryItSub} />
          <div className="mt-12">
            <PersonaPlayground />
          </div>
        </Shell>
      </Section>

      <Section size="lg" tone="sunken">
        <Shell>
          <SectionHeading title={d.videosHeading} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DEMO_VIDEOS.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </Shell>
      </Section>

      <PageCta
        heading={d.scenarioLabHeading}
        body={d.scenarioLabBody}
        primaryHref={`/${locale}/scenario-lab`}
        primaryLabel={d.scenarioLabCta}
        secondaryHref={`/${locale}/donna-ai`}
        secondaryLabel={d.tryItCta}
      />
    </main>
  );
}
