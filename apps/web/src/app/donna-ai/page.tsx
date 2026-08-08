import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DonnaAIExperience } from "@/components/donna-ai/DonnaAIExperience";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Donna AI — Enterprise Decision Assistant · ClouDonna",
  description:
    "Context, priorities, constraints. A guided assessment that produces an evidence-based enterprise technology recommendation. Public Alpha preview.",
  alternates: { canonical: "/donna-ai" },
};

// isSignedIn must reflect the real, current session on every request —
// forced dynamic explicitly rather than trusting automatic detection,
// which would otherwise depend on whether Supabase env vars happen to
// be present at build time (see docs/sprint-6/17-auth-implementation.md,
// "Why /donna-ai is forced dynamic"). The wizard itself remains fully
// client-rendered and interactive regardless of this.
export const dynamic = "force-dynamic";

export default async function DonnaAIPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-void">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/cloudonna-favicon-512.png"
            alt="ClouDonna"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight text-nova-ink">
            Clou<span className="text-nova-accent-strong">Donna</span>
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-muted transition hover:text-nova-accent-strong"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>

      <DonnaAIExperience isSignedIn={Boolean(user)} />
    </div>
  );
}
