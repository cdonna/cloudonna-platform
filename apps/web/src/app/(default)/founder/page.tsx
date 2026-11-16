import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listTasksForStaff, type FounderTaskRecord } from "@/lib/founder-agent/repository";
import type { FounderTaskStatus } from "@/lib/founder-agent/types";

export const metadata: Metadata = { title: "Founder Control — ClouDonna" };

/**
 * The Dashboard's four groups, from the brief: Active / Waiting for
 * approval / Failed / Completed. These are a client-side grouping of
 * the 13 real statuses, not a separate stored field — see
 * groupForStatus() below, the one place that mapping lives.
 */
type DashboardGroup = "active" | "waiting_for_approval" | "failed" | "completed";

const GROUP_LABELS: Record<DashboardGroup, string> = {
  active: "Active",
  waiting_for_approval: "Waiting for approval",
  failed: "Failed",
  completed: "Completed",
};

const GROUP_ORDER: DashboardGroup[] = ["waiting_for_approval", "active", "failed", "completed"];

function groupForStatus(status: FounderTaskStatus): DashboardGroup {
  switch (status) {
    case "review_ready":
      return "waiting_for_approval";
    case "queued":
    case "planning":
    case "running":
    case "testing":
    case "changes_requested":
    case "approved":
    case "merge_ready":
    case "deploy_ready":
      return "active";
    case "failed":
      return "failed";
    case "merged":
    case "deployed":
    case "cancelled":
      return "completed";
  }
}

const STATUS_LABELS: Record<FounderTaskStatus, string> = {
  queued: "Queued",
  planning: "Planning",
  running: "Running",
  testing: "Testing",
  review_ready: "Awaiting your review",
  changes_requested: "Changes requested",
  failed: "Failed",
  approved: "Approved — checking merge",
  merge_ready: "Ready to merge",
  merged: "Merged",
  deploy_ready: "Awaiting deploy approval",
  deployed: "Deployed",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<FounderTaskStatus, string> = {
  queued: "text-nova-ink-faint",
  planning: "text-nova-accent-strong",
  running: "text-nova-accent-strong",
  testing: "text-nova-accent-strong",
  review_ready: "text-nova-warning",
  changes_requested: "text-nova-warning",
  failed: "text-red-400",
  approved: "text-nova-accent-strong",
  merge_ready: "text-nova-success",
  merged: "text-nova-success",
  deploy_ready: "text-nova-warning",
  deployed: "text-nova-success",
  cancelled: "text-nova-ink-faint",
};

export default async function FounderDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const result = await listTasksForStaff(supabase);
  const tasks: FounderTaskRecord[] = result.ok ? result.data : [];

  const grouped: Record<DashboardGroup, FounderTaskRecord[]> = {
    active: [],
    waiting_for_approval: [],
    failed: [],
    completed: [],
  };
  for (const task of tasks) {
    grouped[groupForStatus(task.status)].push(task);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Dashboard</h1>
      <p className="mt-2 text-sm text-nova-ink-faint">
        Every task you&apos;ve started, grouped by where it stands. GitHub remains the source of truth for the actual code.
      </p>

      {!result.ok && (
        <p role="alert" className="mt-6 text-sm text-red-400">
          {result.reason}
        </p>
      )}

      {tasks.length === 0 && result.ok && (
        <div className="mt-8 rounded-2xl border border-titanium bg-carbon p-6 text-center">
          <p className="text-sm text-nova-ink-faint">No tasks yet.</p>
          <Link href="/founder/new" className="mt-3 inline-block text-sm font-medium text-nova-accent-strong hover:text-nova-ink">
            Create your first task →
          </Link>
        </div>
      )}

      <div className="mt-8 space-y-10">
        {GROUP_ORDER.filter((group) => grouped[group].length > 0).map((group) => (
          <section key={group}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-nova-ink-faint">
              {GROUP_LABELS[group]} <span className="text-nova-ink-faint/60">({grouped[group].length})</span>
            </h2>
            <div className="mt-3 divide-y divide-titanium rounded-2xl border border-titanium bg-carbon">
              {grouped[group].map((task) => (
                <Link
                  key={task.id}
                  href={`/founder/tasks/${task.id}`}
                  className="flex min-h-[4.5rem] items-center justify-between gap-4 px-5 py-4 transition hover:bg-carbon-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-nova-ink">{task.title}</p>
                    <p className="mt-1 text-xs text-nova-ink-faint">
                      {task.targetArea.replace(/_/g, " ")} · {task.priority}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium whitespace-nowrap ${STATUS_TONE[task.status]}`}>{STATUS_LABELS[task.status]}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
