import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.legal.privacy.metaTitle} — ClouDonna`;
  const description = dict.legal.privacy.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/privacy"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const p = dict.legal.privacy;

  return (
    <div className="min-h-dvh bg-obsidian">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2.5">
            <Image src="/cloudonna-favicon-512.png" alt="ClouDonna" width={36} height={36} className="brand-mark h-9 w-9 object-contain" />
            <span className="text-lg font-semibold tracking-tight text-nova-ink">
              Clou<span className="text-nova-accent-strong">Donna</span>
            </span>
          </Link>

          <Link href={`/${locale}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-muted transition duration-200 hover:text-nova-ink">
            <ArrowLeft size={15} />
            {dict.common.backToHome}
          </Link>
        </div>

        <div className="mt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold tracking-[0.14em] text-nova-accent-strong uppercase">
            {dict.legal.alphaBadge}
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-nova-ink">{p.h1}</h1>

          <p className="mt-3 text-sm text-nova-ink-faint">{p.lastUpdated}</p>

          <div className="mt-10 space-y-8 text-sm leading-7 text-nova-ink-muted">
            {p.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-nova-ink">{section.title}</h2>
                <div className="mt-2">
                  <p>{section.body}</p>
                </div>
              </section>
            ))}

            <section>
              <h2 className="text-lg font-semibold text-nova-ink">{p.rightsTitle}</h2>
              <div className="mt-2">
                <p>
                  {p.rightsBodyPrefix}{" "}
                  <Link href={`/${locale}/contact`} className="font-medium text-nova-accent-strong hover:text-nova-ink">
                    {p.rightsBodyLink}
                  </Link>{" "}
                  {p.rightsBodySuffix}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-nova-ink">{p.legalEntityTitle}</h2>
              <div className="mt-2">
                <p>
                  {p.legalEntityBodyPrefix}{" "}
                  <Link href={`/${locale}/imprint`} className="font-medium text-nova-accent-strong hover:text-nova-ink">
                    {p.legalEntityBodyLink}
                  </Link>{" "}
                  {p.legalEntityBodySuffix}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
