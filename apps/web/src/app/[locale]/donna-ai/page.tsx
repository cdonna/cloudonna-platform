import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DonnaAIExperience } from "@/components/donna-ai/DonnaAIExperience";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "@/i18n/seo";
import { getCurrentUser } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.donnaAiPage.metaTitle} · ClouDonna`;
  const description = dict.donnaAiPage.metaDescription;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/donna-ai"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}

// isSignedIn must reflect the real, current session on every request —
// forced dynamic explicitly rather than trusting automatic detection,
// which would otherwise depend on whether Supabase env vars happen to
// be present at build time (see docs/sprint-6/17-auth-implementation.md,
// "Why /donna-ai is forced dynamic"). The wizard itself remains fully
// client-rendered and interactive regardless of this.
export const dynamic = "force-dynamic";

export default async function DonnaAIPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const [user, dict] = await Promise.all([getCurrentUser(), getDictionary(locale)]);

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

      <DonnaAIExperience isSignedIn={Boolean(user)} />
    </div>
  );
}
