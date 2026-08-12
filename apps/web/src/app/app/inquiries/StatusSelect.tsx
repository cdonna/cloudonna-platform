"use client";

import { useState, useTransition } from "react";
import { updateInquiryStatusAction } from "./actions";

const STATUSES = ["new", "reviewing", "contacted", "qualified", "closed"] as const;

const STATUS_STYLES: Record<string, string> = {
  new: "border-nova-accent/30 text-nova-accent-strong",
  reviewing: "border-nova-warning/30 text-nova-warning",
  contacted: "border-nova-success/30 text-nova-success",
  qualified: "border-nova-success/30 text-nova-success",
  closed: "border-titanium text-nova-ink-faint",
};

export function StatusSelect({ inquiryId, initialStatus }: { inquiryId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    const previous = status;
    setStatus(next);
    setError(null);

    startTransition(async () => {
      const result = await updateInquiryStatusAction(inquiryId, next);
      if (result.error) {
        setStatus(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <select
        value={status}
        onChange={handleChange}
        disabled={isPending}
        aria-label="Inquiry status"
        className={`rounded-full border bg-carbon-2 px-2.5 py-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-nova-accent/40 ${STATUS_STYLES[status] ?? STATUS_STYLES.new}`}
      >
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
