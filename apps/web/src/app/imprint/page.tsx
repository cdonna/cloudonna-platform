import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Imprint — ClouDonna",
  description: "Legal publisher information for ClouDonna.",
  alternates: { canonical: "/imprint" },
};

const MISSING_FIELDS = [
  "Legal entity name",
  "Operator / responsible person",
  "Registered postal address",
  "Contact email",
  "Contact phone",
  "Commercial register entry / company registration number",
  "VAT identification number",
];

export default function ImprintPage() {
  return (
    <div className="min-h-screen bg-obsidian">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center justify-between">
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

        <div className="mt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold tracking-[0.14em] text-nova-accent-strong uppercase">
            Public Alpha
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-nova-ink">Imprint</h1>

          <p className="mt-3 text-sm text-nova-ink-faint">This page is not yet complete for general availability — see below for exactly what&apos;s missing.</p>

          <div className="mt-10 space-y-8 text-sm leading-7 text-nova-ink-muted">
            <p>
              Full legal publisher details for ClouDonna (company name, registered address, commercial register entry and
              representatives) will be published here ahead of general availability, in line with applicable legal disclosure
              requirements. Nothing below is invented — the fields that aren&apos;t yet confirmed are listed as open, not filled with
              placeholder text.
            </p>

            <section>
              <h2 className="text-lg font-semibold text-nova-ink">Production requirements not yet confirmed</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                {MISSING_FIELDS.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
              <p className="mt-3">None of these should be invented — they need founder/legal confirmation before this page can be considered complete.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-nova-ink">Contact</h2>
              <p className="mt-2">
                Use the{" "}
                <Link href="/contact" className="font-medium text-nova-accent-strong hover:text-nova-ink">
                  contact form
                </Link>{" "}
                until a dedicated legal contact channel is published here.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
