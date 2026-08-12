import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { AccountMenu } from "@/components/auth/AccountMenu";

// Every route under /app is personalized, authenticated content — it
// must never be static-generated at build time (which would bake one
// user's snapshot, or an unconfigured-Supabase error, into a file
// served to everyone). Forced dynamic explicitly rather than relying on
// Next.js's automatic dynamic-API detection, which doesn't trigger here
// when Supabase is unconfigured (getCurrentUser() short-circuits before
// ever calling cookies()) — exactly the gap that caused a real build
// failure, caught and fixed during this task's own quality gate.
export const dynamic = "force-dynamic";

/**
 * Route protection lives here, not in middleware.ts — a deliberate
 * choice. Next.js middleware runs on the Edge runtime, where a
 * database-backed session check is a heavier, less flexible place to
 * put an auth gate than a Server Component that can redirect with full
 * Node.js context. middleware.ts's only job is keeping the session
 * cookie fresh (src/lib/supabase/middleware.ts); every route under
 * /app checks getCurrentUser() itself, once, here, and every page below
 * inherits the guarantee. See docs/sprint-6/17-auth-implementation.md,
 * "Why route protection is not in middleware."
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-obsidian text-nova-ink">
      <header className="sticky top-0 z-40 border-b border-titanium bg-obsidian/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link href="/app" className="flex shrink-0 items-center gap-2.5">
            <Image src="/cloudonna-favicon-512.png" alt="ClouDonna" width={28} height={28} className="h-7 w-7 object-contain" />
            <span className="text-base font-semibold tracking-tight text-nova-ink">
              Clou<span className="text-nova-accent-strong">Donna</span>
            </span>
          </Link>
          {/* overflow-x-auto rather than wrapping or hiding items — on a
              narrow viewport this scrolls horizontally instead of
              breaking layout or silently dropping a nav item. */}
          <nav className="flex flex-1 items-center gap-6 overflow-x-auto">
            <Link href="/app/decisions" className="shrink-0 py-1 text-sm font-medium whitespace-nowrap text-nova-ink-muted transition duration-200 hover:text-nova-ink">
              Decisions
            </Link>
            <Link href="/donna-ai" className="shrink-0 py-1 text-sm font-medium whitespace-nowrap text-nova-ink-muted transition duration-200 hover:text-nova-ink">
              New assessment
            </Link>
            <Link href="/app/settings/billing" className="shrink-0 py-1 text-sm font-medium whitespace-nowrap text-nova-ink-muted transition duration-200 hover:text-nova-ink">
              Billing
            </Link>
          </nav>
          <div className="shrink-0">
            <AccountMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
