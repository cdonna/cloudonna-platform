import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, HandshakeIcon, Rocket, Sparkles, Store } from "lucide-react";
import { InquiryForm } from "@/components/landing/InquiryForm";
import { ContactViewedTracker } from "@/components/landing/ContactViewedTracker";
import { inquiryTypeSchema, type InquiryType } from "@/lib/inquiries/schema";

export const metadata: Metadata = {
  title: "Contact — ClouDonna",
  description: "Become a Founding Tester, request an Enterprise Conversation, or reach ClouDonna as a partner or vendor.",
  alternates: { canonical: "/contact" },
};

const entryPoints: { type: InquiryType; label: string; icon: typeof Rocket }[] = [
  { type: "founding_tester", label: "Become a Founding Tester", icon: Rocket },
  { type: "enterprise", label: "Request an Enterprise Conversation", icon: Building2 },
  { type: "partner", label: "Partner with ClouDonna", icon: HandshakeIcon },
  { type: "vendor", label: "Vendor / Product Information", icon: Store },
  { type: "general", label: "General Enquiry", icon: Sparkles },
];

function parseType(value: string | string[] | undefined): InquiryType | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = inquiryTypeSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const params = await searchParams;
  const selectedType = parseType(params.type);

  return (
    <div className="min-h-screen bg-void">
      <ContactViewedTracker />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/cloudonna-favicon-512.png" alt="ClouDonna" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="text-lg font-semibold tracking-tight text-nova-ink">
            Clou<span className="text-nova-accent-strong">Donna</span>
          </span>
        </Link>

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-muted transition duration-200 hover:text-nova-ink">
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>

      {selectedType ? (
        <>
          <div className="mx-auto max-w-3xl px-6 pt-8">
            <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-faint transition duration-200 hover:text-nova-ink">
              <ArrowLeft size={14} />
              Choose a different reason
            </Link>
          </div>
          <InquiryForm inquiryType={selectedType} />
        </>
      ) : (
        <div className="mx-auto max-w-4xl px-6 pb-28 pt-16 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold tracking-[0.16em] text-nova-accent-strong uppercase">
            Contact
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-nova-ink sm:text-5xl">What brings you here?</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-nova-ink-muted">
            One form, five reasons. Pick the one that fits and it reaches the right person.
          </p>

          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {entryPoints.map((entry) => {
              const Icon = entry.icon;
              return (
                <Link
                  key={entry.type}
                  href={`/contact?type=${entry.type}`}
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
