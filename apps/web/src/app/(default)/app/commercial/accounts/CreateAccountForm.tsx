"use client";

import { useState, useTransition } from "react";
import { createAccountAction } from "../actions";

export function CreateAccountForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleSubmit(formData: FormData) {
    const body = {
      name: String(formData.get("name") ?? "").trim(),
      website: String(formData.get("website") ?? "").trim() || undefined,
      industry: String(formData.get("industry") ?? "").trim() || undefined,
      country: String(formData.get("country") ?? "").trim() || undefined,
    };
    if (!body.name) {
      setError("A company name is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createAccountAction(body);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-titanium bg-carbon px-4 py-2 text-sm text-nova-ink-muted transition-colors hover:text-nova-ink">
        + New account
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="mt-4 grid gap-3 rounded-2xl border border-titanium bg-carbon p-4 sm:grid-cols-2">
      <input name="name" placeholder="Company name" required className="rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      <input name="website" placeholder="Website (optional)" className="rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      <input name="industry" placeholder="Industry (optional)" className="rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      <input name="country" placeholder="Country (optional)" className="rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      <div className="col-span-full flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-full bg-nova-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-60">
          {isPending ? "Creating…" : "Create account"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-nova-ink-faint hover:text-nova-ink">
          Cancel
        </button>
      </div>
      {error && <p role="alert" className="col-span-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
