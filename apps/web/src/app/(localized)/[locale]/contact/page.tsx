import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageHeader, Shell } from "@/components/editorial/primitives";
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
  const title = `${dict.seo.contact.title}: ClouDonna`;
  const description = dict.seo.contact.description;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/contact"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

function parseType(value: string | string[] | undefined): InquiryType | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = inquiryTypeSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/**
 * Five reasons to get in touch, as a numbered index rather than five
 * icon tiles. The icons (a rocket, a shop, a handshake) were decorating
 * the reader's own intent back at them; a numbered list of five plain
 * statements is faster to scan and does not imply a hierarchy that
 * isn't there.
 */
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
    <main className="bg-paper">
      <ContactViewedTracker />

      {selectedType ? (
        <>
          <Shell className="pt-10">
            <Link
              href={`/${locale}/contact`}
              className="group inline-flex min-h-11 items-center gap-2 text-sm text-ink-2 transition-colors duration-control hover:text-accent"
            >
              <ArrowLeft size={14} className="transition-transform duration-control ease-nova-settle group-hover:-translate-x-0.5" />
              {dict.contact.chooseDifferent}
            </Link>
          </Shell>
          <InquiryForm inquiryType={selectedType} />
        </>
      ) : (
        <>
          <PageHeader eyebrow={dict.contact.title} title={dict.contact.header} lede={dict.contact.sub} />

          <Shell>
            <ul className="mt-16 mb-28 border-t border-rule">
              {entryPoints.map((entry, index) => (
                <li key={entry.type} className="border-b border-rule">
                  <Link
                    href={`/${locale}/contact?type=${entry.type}`}
                    className="group flex items-baseline gap-6 py-7 transition-colors duration-control"
                  >
                    <span className="font-mono text-label font-medium text-ink-3 tabular-nums uppercase">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-display-3 font-medium tracking-[-0.025em] text-ink transition-colors duration-control group-hover:text-accent">
                      {entry.label}
                    </span>
                    <ArrowRight
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 self-center text-ink-3 transition-transform duration-control ease-nova-settle group-hover:translate-x-1 group-hover:text-accent"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Shell>
        </>
      )}
    </main>
  );
}
