"use client";

import { useState, useTransition } from "react";
import { createContactAction } from "../../actions";
import { BUYER_PERSONAS, BUYER_PERSONA_LABELS } from "@/lib/commercial/buyer-persona";

export function AddContactForm({ accountId }: { accountId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) {
      setError("A name is required.");
      return;
    }
    const body = {
      accountId,
      name,
      email: String(formData.get("email") ?? "").trim() || undefined,
      role: String(formData.get("role") ?? "").trim() || undefined,
      buyerPersona: String(formData.get("buyerPersona") ?? "") || undefined,
      economicBuyer: formData.get("economicBuyer") === "on",
      decisionMaker: formData.get("decisionMaker") === "on",
      champion: formData.get("champion") === "on",
    };
    setError(null);
    startTransition(async () => {
      const result = await createContactAction(body);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-nova-accent hover:underline">
        + Add contact
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="mt-3 grid gap-2 rounded-xl border border-titanium bg-carbon-2 p-3 sm:grid-cols-2">
      <input name="name" placeholder="Name" required className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
      <input name="email" placeholder="Email" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
      <input name="role" placeholder="Role / title" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
      <select name="buyerPersona" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none">
        <option value="">Buyer persona…</option>
        {BUYER_PERSONAS.map((p) => (
          <option key={p} value={p}>
            {BUYER_PERSONA_LABELS[p]}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-xs text-nova-ink-muted">
        <input type="checkbox" name="economicBuyer" /> Economic buyer
      </label>
      <label className="flex items-center gap-2 text-xs text-nova-ink-muted">
        <input type="checkbox" name="decisionMaker" /> Decision maker
      </label>
      <label className="flex items-center gap-2 text-xs text-nova-ink-muted">
        <input type="checkbox" name="champion" /> Champion
      </label>
      <div className="col-span-full flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-full bg-nova-accent px-4 py-1.5 text-xs font-medium text-black disabled:opacity-60">
          {isPending ? "Adding…" : "Add contact"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-nova-ink-faint hover:text-nova-ink">
          Cancel
        </button>
      </div>
      {error && <p role="alert" className="col-span-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
