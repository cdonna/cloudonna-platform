"use client";

import { useState, useTransition } from "react";
import { createSprintAction } from "../actions";

export function CreateSprintForm({ accounts }: { accounts: { id: string; name: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleSubmit(formData: FormData) {
    const accountId = String(formData.get("accountId") ?? "");
    if (!accountId) {
      setError("An account is required.");
      return;
    }
    const body = {
      accountId,
      scope: String(formData.get("scope") ?? "").trim() || undefined,
      startDate: String(formData.get("startDate") ?? "") || undefined,
      targetCompletionDate: String(formData.get("targetCompletionDate") ?? "") || undefined,
    };
    setError(null);
    startTransition(async () => {
      const result = await createSprintAction(body);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-titanium bg-carbon px-4 py-2 text-sm text-nova-ink-muted transition-colors hover:text-nova-ink">
        + New Decision Sprint
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="mt-4 grid gap-3 rounded-2xl border border-titanium bg-carbon p-4 sm:grid-cols-2">
      <select name="accountId" required className="rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none">
        <option value="">Account…</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <input name="scope" placeholder="Scope" className="rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      <input type="date" name="startDate" className="rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      <input type="date" name="targetCompletionDate" className="rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      <div className="col-span-full flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-full bg-nova-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-60">
          {isPending ? "Creating…" : "Create sprint"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-nova-ink-faint hover:text-nova-ink">
          Cancel
        </button>
      </div>
      {error && <p role="alert" className="col-span-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
