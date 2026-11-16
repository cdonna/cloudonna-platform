import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Section, SectionHeading, Shell } from "@/components/editorial/primitives";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.independence.metaTitle}: ClouDonna`;
  const description = dict.independence.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/independence"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

/**
 * Four structural rules, numbered. The four lucide icons in rounded
 * accent tiles are gone: a set of scales next to "every platform is
 * scored against the same criteria" illustrated the word, not the rule,
 * and made a neutrality commitment look like a feature card.
 */
export default async function IndependencePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const i = dict.independence;

  return (
    <main className="bg-paper">
      <PageHeader eyebrow={i.badge} title={i.h1} lede={i.sub} />

      <Section size="lg">
        <Shell>
          <dl className="border-t border-rule">
            {i.rules.map((rule, index) => (
              <div
                key={rule.title}
                className="grid gap-3 border-b border-rule py-8 lg:grid-cols-[4rem_22rem_1fr] lg:items-baseline lg:gap-10"
              >
                <dt className="font-mono text-label font-medium text-accent tabular-nums uppercase">
                  {String(index + 1).padStart(2, "0")}
                </dt>
                <dt className="text-[1.0625rem] font-medium tracking-[-0.018em] text-ink">{rule.title}</dt>
                <dd className="max-w-[60ch] text-[0.9375rem] leading-7 text-ink-2">{rule.body}</dd>
              </div>
            ))}
          </dl>
        </Shell>
      </Section>

      <Section size="md" tone="sunken">
        <Shell>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading title={i.alphaHeading} />
              <p className="mt-6 max-w-[62ch] text-[0.9375rem] leading-7 text-ink-2">
                {i.alphaBody1}{" "}
                <Link
                  href={`/${locale}/for-vendors`}
                  className="font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
                >
                  {i.forVendorsLink}
                </Link>
                {i.alphaBody2}
              </p>
            </div>

            <div>
              <SectionHeading title={i.communityHeading} />
              <p className="mt-6 max-w-[62ch] text-[0.9375rem] leading-7 text-ink-2">{i.communityBody}</p>
            </div>
          </div>
        </Shell>
      </Section>
    </main>
  );
}
