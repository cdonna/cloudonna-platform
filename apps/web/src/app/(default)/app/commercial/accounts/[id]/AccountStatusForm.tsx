"use client";

import { useState, useTransition } from "react";
import { updateAccountAction } from "../../actions";
import { ACCOUNT_STATUSES, ACCOUNT_STATUS_LABELS, type AccountStatus } from "@/lib/commercial/account-status";

export function AccountStatusForm({ accountId, initialStatus }: { accountId: string; initialStatus: AccountStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as AccountStatus;
    const previous = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      const result = await updateAccountAction(accountId, { status: next });
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
        aria-label="Account status"
        className="rounded-full border border-titanium bg-carbon-2 px-3 py-1.5 text-xs font-medium text-nova-ink outline-none"
      >
        {ACCOUNT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ACCOUNT_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error && <p role="alert" className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
