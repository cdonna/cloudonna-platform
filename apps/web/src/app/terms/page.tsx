import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — ClouDonna",
  description: "Terms governing use of ClouDonna during the Public Alpha program.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
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

          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-nova-ink">Terms of Service</h1>

          <p className="mt-3 text-sm text-nova-ink-faint">Last updated: this page is a placeholder for the Public Alpha program.</p>

          <div className="mt-10 space-y-8 text-sm leading-7 text-nova-ink-muted">
            <p>ClouDonna is provided as an early-stage, evolving product during the Public Alpha program. Full Terms of Service will be published here before general availability.</p>

            <Section title="Alpha program">
              Features, availability and functionality may change at any time without notice while ClouDonna is in Public Alpha.
            </Section>

            <Section title="Acceptable use">Detailed acceptable-use terms will be published here ahead of general availability.</Section>

            <Section title="Contact">
              Use the{" "}
              <Link href="/contact" className="font-medium text-nova-accent-strong hover:text-nova-ink">
                contact form
              </Link>{" "}
              until a dedicated legal contact channel is published here.
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-nova-ink">{title}</h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}
