import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, History, Sparkles } from "lucide-react";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { listDecisionsForCurrentUser, type DecisionListItem } from "@/components/donna-ai/persistence/decisions-repository";

export const metadata: Metadata = {
  title: "Dashboard — ClouDonna",
};

export default async function AppDashboardPage() {
  const user = await getCurrentUser();

  // AppLayout already redirects an unauthenticated request to /login, but
  // Next.js does not guarantee that redirect fully resolves before this
  // page's own body starts rendering — falling through here would call
  // the throwing Supabase client constructor for a request that's about
  // to be redirected anyway. Matches the non-throwing pattern every other
  // page in this domain uses (see decisions-repository.ts callers).
  let recent: DecisionListItem[] = [];
  if (user) {
    const supabase = await createSupabaseServerClient();
    const result = await listDecisionsForCurrentUser(supabase);
    recent = result.ok ? result.data.slice(0, 5) : [];
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Welcome back{user?.email ? `, ${user.email}` : ""}</h1>
      <p className="mt-2 text-sm text-slate-500">Run a new assessment or pick up a saved decision.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Link
          href="/donna-ai"
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-300 hover:shadow-md"
        >
          <div>
            <div className="flex items-center gap-2 text-violet-700">
              <Sparkles size={16} />
              <span className="text-sm font-semibold uppercase tracking-wide">New assessment</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">Run Donna&apos;s six-step assessment and, when it&apos;s ready, save it here.</p>
          </div>
          <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />
        </Link>

        <Link
          href="/app/decisions"
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-300 hover:shadow-md"
        >
          <div>
            <div className="flex items-center gap-2 text-violet-700">
              <History size={16} />
              <span className="text-sm font-semibold uppercase tracking-wide">Decision history</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">Browse every decision you&apos;ve saved.</p>
          </div>
          <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />
        </Link>
      </div>

      {recent.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent decisions</h2>
          <div className="mt-3 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {recent.map((decision) => (
              <Link
                key={decision.id}
                href={`/app/decisions/${decision.id}`}
                className="flex items-center justify-between px-5 py-4 transition hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{decision.title}</p>
                  <p className="text-xs text-slate-400">
                    {decision.humanReadableId} · {decision.projectName}
                  </p>
                </div>
                <ArrowRight size={16} className="text-slate-300" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
