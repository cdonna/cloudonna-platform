"use client";

import { useState, useTransition } from "react";
import { updateSprintAction } from "../../actions";
import { DECISION_SPRINT_STATUSES, DECISION_SPRINT_STATUS_LABELS, type DecisionSprintStatus } from "@/lib/commercial/decision-sprint-status";

export function SprintStatusForm({ sprintId, initialStatus }: { sprintId: string; initialStatus: DecisionSprintStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as DecisionSprintStatus;
    const previous = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      const result = await updateSprintAction(sprintId, { status: next });
      if (result.error) {
        setStatus(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <select value={status} onChange={handleChange} disabled={isPending} aria-label="Sprint status" className="rounded-full border border-titanium bg-carbon-2 px-3 py-1.5 text-xs font-medium text-nova-ink outline-none">
        {DECISION_SPRINT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {DECISION_SPRINT_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error && <p role="alert" className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
