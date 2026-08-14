import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Scale, ShieldAlert } from "lucide-react";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.forVendors.metaTitle} — ClouDonna`;
  const description = dict.forVendors.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/for-vendors"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

const ICONS = [BadgeCheck, Scale, ShieldAlert];

export default async function ForVendorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <div className="min-h-screen bg-void">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-8">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <Image
            src="/cloudonna-favicon-512.png"
            alt="ClouDonna"
            width={36}
            height={36}
            className="brand-mark h-9 w-9 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight text-nova-ink">
            Clou<span className="text-nova-accent-strong">Donna</span>
          </span>
        </Link>

        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-muted transition hover:text-nova-accent-strong"
        >
          <ArrowLeft size={15} />
          {dict.common.backToHome}
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-24 pt-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong shadow-sm">
          {dict.forVendors.badge}
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-nova-ink sm:text-5xl">
          {dict.forVendors.h1}
        </h1>

        <p className="mt-5 text-lg leading-8 text-nova-ink-muted">{dict.forVendors.sub}</p>

        <div className="mt-14 space-y-6">
          {dict.forVendors.points.map((point, index) => {
            const Icon = ICONS[index];

            return (
              <div
                key={point.title}
                className="flex gap-5 rounded-3xl border border-titanium bg-carbon p-6 shadow-sm"
              >
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-nova-accent text-white">
                  <Icon size={20} />
                </span>

                <div>
                  <h2 className="text-lg font-semibold text-nova-ink">
                    {point.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-nova-ink-muted">
                    {point.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 rounded-3xl border border-titanium bg-carbon-2 p-8">
          <h2 className="text-xl font-semibold text-nova-ink">
            {dict.forVendors.statusHeading}
          </h2>
          <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{dict.forVendors.statusBody}</p>
        </div>

        <div className="mt-10 text-center">
          <Link
            href={`/${locale}/contact?type=vendor`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nova-accent px-6 py-3 text-sm font-semibold text-white shadow-nova-glow transition hover:opacity-90"
          >
            {dict.forVendors.applyCta}
            <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-xs text-nova-ink-faint">
            {dict.common.readNeutralityRules}{" "}
            <Link href={`/${locale}/independence`} className="font-medium text-nova-accent-strong hover:text-nova-ink">
              {dict.common.neutralityRulesLink}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
