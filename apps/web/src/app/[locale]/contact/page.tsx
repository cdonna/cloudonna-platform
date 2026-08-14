import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, HandshakeIcon, Rocket, Sparkles, Store } from "lucide-react";
import { InquiryForm } from "@/components/landing/InquiryForm";
import { ContactViewedTracker } from "@/components/landing/ContactViewedTracker";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";
import { inquiryTypeSchema, type InquiryType } from "@/lib/inquiries/schema";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.seo.contact.title} — ClouDonna`;
  const description = dict.seo.contact.description;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/contact"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

const ENTRY_ICONS: Record<InquiryType, typeof Rocket> = {
  founding_tester: Rocket,
  enterprise: Building2,
  partner: HandshakeIcon,
  vendor: Store,
  general: Sparkles,
};

function parseType(value: string | string[] | undefined): InquiryType | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = inquiryTypeSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const [dict, sp] = await Promise.all([getDictionary(locale), searchParams]);
  const selectedType = parseType(sp.type);

  const entryPoints: { type: InquiryType; label: string }[] = [
    { type: "founding_tester", label: dict.contact.entryPoints.founding_tester },
    { type: "enterprise", label: dict.contact.entryPoints.enterprise },
    { type: "partner", label: dict.contact.entryPoints.partner },
    { type: "vendor", label: dict.contact.entryPoints.vendor },
    { type: "general", label: dict.contact.entryPoints.general },
  ];

  return (
    <div className="min-h-screen bg-void">
      <ContactViewedTracker />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-8">
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

      {selectedType ? (
        <>
          <div className="mx-auto max-w-3xl px-6 pt-8">
            <Link href={`/${locale}/contact`} className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-faint transition duration-200 hover:text-nova-ink">
              <ArrowLeft size={14} />
              {dict.contact.chooseDifferent}
            </Link>
          </div>
          <InquiryForm inquiryType={selectedType} />
        </>
      ) : (
        <div className="mx-auto max-w-4xl px-6 pb-28 pt-16 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold tracking-[0.16em] text-nova-accent-strong uppercase">
            {dict.contact.title}
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-nova-ink sm:text-5xl">{dict.contact.header}</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-nova-ink-muted">{dict.contact.sub}</p>

          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {entryPoints.map((entry) => {
              const Icon = ENTRY_ICONS[entry.type];
              return (
                <Link
                  key={entry.type}
                  href={`/${locale}/contact?type=${entry.type}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-titanium bg-carbon p-6 text-left transition duration-300 hover:-translate-y-0.5 hover:border-titanium-strong hover:shadow-nova-raised"
                >
                  <span className="flex items-center gap-4">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-nova-accent text-white shadow-nova-glow">
                      <Icon size={20} />
                    </span>
                    <span className="text-base font-semibold text-nova-ink">{entry.label}</span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-nova-ink-faint transition duration-200 group-hover:translate-x-1 group-hover:text-nova-accent-strong" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
