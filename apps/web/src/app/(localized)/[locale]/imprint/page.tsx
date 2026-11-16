import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.legal.imprint.metaTitle}: ClouDonna`;
  const description = dict.legal.imprint.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/imprint"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

export default async function ImprintPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const i = dict.legal.imprint;

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto max-w-3xl px-6 py-16">

        <div className="mt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper-2 px-4 py-1.5 text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            {dict.legal.alphaBadge}
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-ink">{i.h1}</h1>

          <p className="mt-3 text-sm text-ink-3">{i.notComplete}</p>

          <div className="mt-10 space-y-8 text-sm leading-7 text-ink-2">
            <p>{i.intro}</p>

            <section>
              <h2 className="text-lg font-semibold text-ink">{i.missingHeading}</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                {i.missingFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
              <p className="mt-3">{i.missingFooter}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink">{i.contactHeading}</h2>
              <p className="mt-2">
                {i.contactBodyPrefix}{" "}
                <Link href={`/${locale}/contact`} className="font-medium text-accent hover:text-ink">
                  {i.contactBodyLink}
                </Link>{" "}
                {i.contactBodySuffix}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
