"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitMerge, LoaderCircle } from "lucide-react";
import { mergeTaskAction } from "../../../actions";

/** The separate "Merge this branch into main?" confirmation — never
 * triggered by Approve, never combined with Deploy. One button, one
 * explicit question, matching the brief's "never combine merge and
 * deploy into one automatic action." */
export function MergeConfirm({ taskId, branchName }: { taskId: string; branchName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  async function confirmMerge() {
    setPending(true);
    setError(null);
    setNotConfigured(false);
    const result = await mergeTaskAction(taskId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      setNotConfigured(Boolean(result.notConfigured));
      return;
    }
    router.push(`/founder/tasks/${taskId}`);
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex h-12 items-center gap-2 rounded-xl bg-nova-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-nova-accent-strong"
      >
        <GitMerge size={16} />
        Merge this branch into main
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-nova-accent/30 bg-nova-accent/5 p-5">
      <p className="text-sm font-medium text-nova-ink">
        Merge <span className="font-mono text-nova-accent-strong">{branchName}</span> into main?
      </p>
      <p className="mt-1.5 text-sm text-nova-ink-faint">This checks CI is green and the branch is current, then merges.</p>

      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          disabled={pending}
          onClick={confirmMerge}
          className="flex h-11 items-center gap-2 rounded-xl bg-nova-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-nova-accent-strong disabled:opacity-60"
        >
          {pending && <LoaderCircle size={16} className="animate-spin" />}
          Yes, merge
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="flex h-11 items-center rounded-xl border border-titanium px-4 text-sm font-medium text-nova-ink-faint"
        >
          Cancel
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
          {notConfigured && " Remote execution is not connected in this environment."}
        </p>
      )}
    </div>
  );
}
