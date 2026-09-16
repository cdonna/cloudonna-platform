import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Database, Eye, MessageCircleQuestion, ScanSearch, ShieldCheck, Sparkles } from "lucide-react";
import { EvidenceTag, type EvidenceType } from "@/components/showcase/EvidenceTag";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.trustCenterPage.metaTitle}: ClouDonna`;
  const description = dict.trustCenterPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/trust"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

const ICONS = [ScanSearch, Eye, Sparkles, MessageCircleQuestion, Database, ShieldCheck];

// Aligned by index to trustCenterPage.sections — undefined where a
// section isn't about a specific evidence type (data protection,
// challenging a recommendation) rather than forcing a tag that
// wouldn't be an honest fit.
const SECTION_EVIDENCE_TAGS: (EvidenceType | undefined)[] = ["calculated", "official-source", "ai-interpretation", "assumption", undefined, undefined];

export default async function TrustCenterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.trustCenterPage;

  return (
    <div className="min-h-dvh bg-void">
      <div className="mx-auto max-w-3xl px-6 pt-14 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong shadow-sm">
          {t.badge}
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-balance text-nova-ink sm:text-5xl">{t.h1}</h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-nova-ink-muted">{t.sub}</p>
      </div>

      <div className="mx-auto mt-14 max-w-4xl px-6 pb-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {t.sections.map((section, index) => {
            const Icon = ICONS[index];
            const evidenceTag = SECTION_EVIDENCE_TAGS[index];
            return (
              <div key={section.title} className="flex gap-4 rounded-3xl border border-titanium bg-carbon p-6">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-nova-accent/10 text-nova-accent-strong">
                  <Icon size={20} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-nova-ink">{section.title}</h2>
                    {evidenceTag && <EvidenceTag type={evidenceTag} />}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-nova-ink-muted">{section.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-nova-ink-faint">
          {t.independenceLinkPrefix}{" "}
          <Link href={`/${locale}/independence`} className="font-medium text-nova-accent-strong hover:text-nova-ink">
            {t.independenceLinkText}
          </Link>{" "}
          {t.independenceLinkSuffix}
        </p>

        <div className="mt-10 rounded-3xl border border-titanium bg-carbon-2 p-8 text-center">
          <h2 className="text-xl font-semibold text-nova-ink">{t.ctaHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-nova-ink-muted">{t.ctaBody}</p>
          <Link
            href={`/${locale}/donna-ai`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-nova-accent to-sunset-coral px-6 py-3 text-sm font-semibold text-white shadow-nova-glow transition hover:brightness-110"
          >
            {t.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
