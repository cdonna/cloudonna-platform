import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listDecisionsForCurrentUser } from "@/components/donna-ai/persistence/decisions-repository";

export const metadata: Metadata = {
  title: "Decision history — ClouDonna",
};

const STATUS_STYLES: Record<string, string> = {
  saved: "bg-nova-success/10 text-nova-success border-nova-success/30",
  draft: "bg-carbon-2 text-nova-ink-muted border-titanium",
  archived: "bg-carbon-2 text-nova-ink-faint border-titanium",
};

export default async function DecisionHistoryPage() {
  const supabase = await createSupabaseServerClient();
  const result = await listDecisionsForCurrentUser(supabase);
  const decisions = result.ok ? result.data : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Decision history</h1>
      <p className="mt-2 text-sm text-nova-ink-muted">Every decision you&apos;ve explicitly saved, across your organizations.</p>

      {!result.ok ? (
        <p role="alert" className="mt-6 text-sm text-red-400">
          {result.reason}
        </p>
      ) : decisions.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-titanium bg-carbon p-10 text-center">
          <p className="text-sm text-nova-ink-muted">No saved decisions yet. Run an assessment and save it to see it here.</p>
          <Link href="/donna-ai" className="mt-4 inline-block text-sm font-medium text-nova-accent-strong underline-offset-4 hover:underline">
            Run a new assessment
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-titanium bg-carbon">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-titanium bg-carbon-2 text-xs font-semibold tracking-wide text-nova-ink-muted uppercase">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Version</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-titanium">
              {decisions.map((decision) => (
                <tr key={decision.id} className="transition-colors duration-control hover:bg-carbon-2">
                  <td className="px-5 py-4">
                    <Link href={`/app/decisions/${decision.id}`} className="font-medium text-nova-ink hover:text-nova-accent-strong">
                      {decision.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-nova-ink-faint">{decision.humanReadableId}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[decision.status] ?? STATUS_STYLES.draft}`}
                    >
                      {decision.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-nova-ink-muted">
                    {decision.workspaceName} / {decision.projectName}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs tabular-nums text-nova-ink-muted">v{decision.currentVersionNumber ?? "—"}</td>
                  <td className="px-5 py-4 text-nova-ink-muted">{new Date(decision.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
