import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * Founder Control — private, authenticated, platform-staff-only. Gated
 * more strictly than /app on purpose: /app/layout.tsx only requires a
 * signed-in user (any customer); this layout additionally checks
 * is_platform_staff() via the same RPC /app/inquiries/page.tsx already
 * calls, at the LAYOUT level so every route under /founder inherits the
 * gate rather than each page re-checking it — there is no route under
 * /founder a merely-signed-in, non-staff user can reach. Not a hidden
 * URL "protected" only by obscurity: a non-staff signed-in user gets an
 * explicit 403-shaped notice, and RLS backs every read/write regardless
 * of what this layout does or forgets to do.
 */
export const dynamic = "force-dynamic";

export default async function FounderLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) {
    return (
      <div className="register-dark flex min-h-screen items-center justify-center bg-obsidian px-6 text-center">
        <div>
          <p className="font-mono text-label font-medium text-ink-3 uppercase">403</p>
          <h1 className="mt-4 text-xl font-semibold text-nova-ink">Founder Control is restricted</h1>
          <p className="mt-2 max-w-sm text-sm text-nova-ink-faint">This area is restricted to ClouDonna platform staff.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="register-dark min-h-screen bg-obsidian text-nova-ink">
      {/* Mobile-first: a slim sticky bar with two destinations and
          nothing else competing for a thumb's attention. The brand
          mark is dropped here (unlike /app's header) — this is a tool,
          not a branded surface, and the title says exactly what it is. */}
      <header className="sticky top-0 z-40 border-b border-titanium bg-obsidian/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/founder" className="text-sm font-semibold tracking-tight text-nova-ink">
            Founder Control
          </Link>
          <Link
            href="/founder/new"
            className="flex min-h-10 items-center rounded-lg bg-nova-accent px-3.5 text-sm font-medium text-white transition-colors hover:bg-nova-accent-strong"
          >
            New Task
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
    </div>
  );
}
