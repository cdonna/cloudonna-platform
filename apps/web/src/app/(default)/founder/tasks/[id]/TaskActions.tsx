"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LoaderCircle, RefreshCcw } from "lucide-react";
import { cancelTaskAction, dispatchTaskAction, syncTaskAction } from "../../actions";
import type { FounderTaskStatus } from "@/lib/founder-agent/types";

/**
 * The Task Detail screen's action bar — what a founder can do from
 * here depends entirely on `status`, mirroring exactly what
 * state-machine.ts will and will not allow (a disabled-looking button
 * here is never the only thing stopping an illegal action; the handler
 * behind it would refuse it regardless — this is just honest affordance,
 * not the real guard).
 */
export function TaskActions({ taskId, status, cancellable }: { taskId: string; status: FounderTaskStatus; cancellable: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(label: string, action: () => Promise<{ error: string | null; notConfigured?: boolean }>) {
    setPending(label);
    setError(null);
    const result = await action();
    setPending(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {(status === "queued" || status === "changes_requested") && (
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => run("dispatch", () => dispatchTaskAction(taskId))}
            className="flex h-11 items-center gap-2 rounded-xl bg-nova-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-nova-accent-strong disabled:opacity-60"
          >
            {pending === "dispatch" ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            {status === "changes_requested" ? "Resume work" : "Start"}
          </button>
        )}

        {(status === "planning" || status === "running" || status === "testing") && (
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => run("sync", () => syncTaskAction(taskId))}
            className="flex h-11 items-center gap-2 rounded-xl border border-titanium bg-carbon px-4 text-sm font-medium text-nova-ink transition-colors hover:border-titanium-strong"
          >
            {pending === "sync" ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
            Refresh progress
          </button>
        )}

        {status === "review_ready" && (
          <Link
            href={`/founder/tasks/${taskId}/review`}
            className="flex h-11 items-center gap-2 rounded-xl bg-nova-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-nova-accent-strong"
          >
            Review
            <ArrowRight size={16} />
          </Link>
        )}

        {(status === "approved" || status === "merge_ready") && (
          <Link
            href={`/founder/tasks/${taskId}/merge`}
            className="flex h-11 items-center gap-2 rounded-xl bg-nova-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-nova-accent-strong"
          >
            Merge
            <ArrowRight size={16} />
          </Link>
        )}

        {status === "merged" && (
          <Link
            href={`/founder/tasks/${taskId}/deploy`}
            className="flex h-11 items-center gap-2 rounded-xl border border-titanium bg-carbon px-4 text-sm font-medium text-nova-ink transition-colors hover:border-titanium-strong"
          >
            Deploy
            <ArrowRight size={16} />
          </Link>
        )}

        {cancellable && (
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => run("cancel", () => cancelTaskAction(taskId))}
            className="flex h-11 items-center rounded-xl border border-titanium px-4 text-sm font-medium text-nova-ink-faint transition-colors hover:border-red-400/40 hover:text-red-400 disabled:opacity-60"
          >
            Cancel task
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
