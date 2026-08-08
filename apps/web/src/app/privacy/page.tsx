import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — ClouDonna",
  description: "How ClouDonna handles data during the Public Alpha program.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
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

          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-nova-ink">Privacy Policy</h1>

          <p className="mt-3 text-sm text-nova-ink-faint">
            Last updated: 2026-08-09. This describes ClouDonna&apos;s actual current data handling during the Public Alpha — not a future
            state. It will be replaced by a full, legally reviewed policy before general availability; several sections below say
            exactly what&apos;s still missing.
          </p>

          <div className="mt-10 space-y-8 text-sm leading-7 text-nova-ink-muted">
            <Section title="What we collect">
              <p>
                When you submit the contact form (at <code>/contact</code>, <code>/early-access</code>, or the homepage Founding
                Testers section), we store: your name, work email, company, role, country and phone number if you provide them, your
                message, which of the six inquiry categories you selected, the page you submitted from, and — if present in the URL —
                UTM campaign parameters and referrer.
              </p>
              <p className="mt-3">
                We do not collect this data anywhere else on the site today. There is no analytics or visitor-tracking script running
                on ClouDonna yet — an abstraction for one exists in the codebase, but nothing is deployed or active.
              </p>
            </Section>

            <Section title="Why we collect it">
              <p>Solely to respond to your inquiry. Nothing submitted through this form is used for advertising, sold, or shared with a third party.</p>
            </Section>

            <Section title="Where it's stored">
              <p>
                In our Postgres database (via Supabase), protected by row-level security — only ClouDonna platform staff can read
                submitted inquiries. Exact hosting region is not yet confirmed publicly here; ask via the contact form if this matters
                to your evaluation.
              </p>
            </Section>

            <Section title="Third parties">
              <p>
                None today. No email-notification provider is configured yet — a new inquiry is currently only logged server-side, not
                emailed anywhere. This section will name the provider once one is configured.
              </p>
            </Section>

            <Section title="Data retention">
              <p>Not yet defined. This is an open item we&apos;re flagging honestly rather than inventing a number — a real retention policy will be published here before general availability.</p>
            </Section>

            <Section title="Your rights">
              <p>
                To ask what we hold about you, or to request deletion, use the{" "}
                <Link href="/contact" className="font-medium text-nova-accent-strong hover:text-nova-ink">
                  contact form
                </Link>{" "}
                — General Contact category.
              </p>
            </Section>

            <Section title="Legal entity">
              <p>
                The legal entity operating ClouDonna, its registered address, and applicable data-protection contact details are not
                yet published — see the{" "}
                <Link href="/imprint" className="font-medium text-nova-accent-strong hover:text-nova-ink">
                  Imprint
                </Link>{" "}
                for what&apos;s confirmed so far.
              </p>
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
      <div className="mt-2">{children}</div>
    </section>
  );
}
