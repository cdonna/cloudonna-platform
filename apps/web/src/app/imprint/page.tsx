import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Imprint — ClouDonna",
  description: "Legal publisher information for ClouDonna.",
  alternates: { canonical: "/imprint" },
};

export default function ImprintPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/cloudonna-favicon-512.png"
            alt="ClouDonna"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight text-slate-950">
            Clou<span className="text-violet-600">Donna</span>
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-violet-700"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>

      <div className="mt-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700 shadow-sm">
          Public Alpha
        </div>

        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-slate-950">
          Imprint
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          This page is a placeholder for the Public Alpha program.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-slate-600">
          <p>
            Full legal publisher details for ClouDonna (company name,
            registered address, commercial register entry and
            representatives) will be published here ahead of general
            availability, in line with applicable legal disclosure
            requirements.
          </p>

          <PlaceholderSection title="Responsible for content">
            ClouDonna — details to be confirmed.
          </PlaceholderSection>

          <PlaceholderSection title="Contact">
            A dedicated contact channel will be published here before
            general availability.
          </PlaceholderSection>
        </div>
      </div>
    </div>
  );
}

function PlaceholderSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}
