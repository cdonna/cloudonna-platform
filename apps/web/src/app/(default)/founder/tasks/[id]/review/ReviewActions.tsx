"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, RotateCcw, XCircle } from "lucide-react";
import { reviewTaskAction } from "../../../actions";

/** The Review screen's three actions — Approve / Request Changes /
 * Reject — each a distinct call to reviewTaskAction, never combined
 * with merge. See handle-review-task-request.ts for why only a
 * founder session can ever reach this code path at all. */
export function ReviewActions({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<"approved" | "changes_requested" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "approved" | "changes_requested" | "rejected") {
    setPending(decision);
    setError(null);
    const result = await reviewTaskAction(taskId, decision, notes.trim() || undefined);
    setPending(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/founder/tasks/${taskId}`);
  }

  return (
    <div>
      <label htmlFor="review-notes" className="text-sm font-medium text-nova-ink">
        Notes <span className="font-normal text-nova-ink-faint">(optional for Approve)</span>
      </label>
      <textarea
        id="review-notes"
        rows={3}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="What should change, or why you're rejecting this."
        className="mt-1.5 w-full resize-none rounded-xl border border-titanium bg-carbon-2 px-3 py-2.5 text-sm text-nova-ink outline-none placeholder:text-nova-ink-faint focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
      />

      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => decide("approved")}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-nova-success/15 text-sm font-semibold text-nova-success transition-colors hover:bg-nova-success/25 disabled:opacity-60"
        >
          {pending === "approved" ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          Approve
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => decide("changes_requested")}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-nova-warning/15 text-sm font-semibold text-nova-warning transition-colors hover:bg-nova-warning/25 disabled:opacity-60"
        >
          {pending === "changes_requested" ? <LoaderCircle size={16} className="animate-spin" /> : <RotateCcw size={16} />}
          Request changes
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => decide("rejected")}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-red-400/15 text-sm font-semibold text-red-400 transition-colors hover:bg-red-400/25 disabled:opacity-60"
        >
          {pending === "rejected" ? <LoaderCircle size={16} className="animate-spin" /> : <XCircle size={16} />}
          Reject
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
