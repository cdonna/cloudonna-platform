import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, PrimaryAction, Section, SectionHeading, Shell } from "@/components/editorial/primitives";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.forVendors.metaTitle}: ClouDonna`;
  const description = dict.forVendors.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/for-vendors"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

export default async function ForVendorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const v = dict.forVendors;

  return (
    <main className="bg-paper">
      <PageHeader eyebrow={v.badge} title={v.h1} lede={v.sub} />

      <Section size="lg">
        <Shell>
          <dl className="border-t border-rule">
            {v.points.map((point) => (
              <div key={point.title} className="grid gap-3 border-b border-rule py-8 lg:grid-cols-[24rem_1fr] lg:items-baseline lg:gap-16">
                <dt className="text-[1.0625rem] font-medium tracking-[-0.018em] text-ink">{point.title}</dt>
                <dd className="max-w-[62ch] text-[0.9375rem] leading-7 text-ink-2">{point.body}</dd>
              </div>
            ))}
          </dl>
        </Shell>
      </Section>

      <Section size="md" tone="sunken">
        <Shell>
          <SectionHeading title={v.statusHeading} note={v.statusBody} />

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
            <PrimaryAction href={`/${locale}/contact?type=vendor`}>{v.applyCta}</PrimaryAction>
            <p className="text-sm text-ink-3">
              {dict.common.readNeutralityRules}{" "}
              <Link
                href={`/${locale}/independence`}
                className="font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
              >
                {dict.common.neutralityRulesLink}
              </Link>
              .
            </p>
          </div>
        </Shell>
      </Section>
    </main>
  );
}
