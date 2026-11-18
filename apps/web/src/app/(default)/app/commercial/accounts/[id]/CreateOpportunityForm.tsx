"use client";

import { useState, useTransition } from "react";
import { createOpportunityAction } from "../../actions";
import { COMMERCIAL_PACKAGES } from "@/lib/commercial/packages";
import type { CommercialPackageId } from "@/lib/commercial/packages";

export function CreateOpportunityForm({ accountId, contacts }: { accountId: string; contacts: { id: string; name: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleSubmit(formData: FormData) {
    const body = {
      accountId,
      primaryContactId: String(formData.get("primaryContactId") ?? "") || undefined,
      commercialPackage: String(formData.get("commercialPackage") ?? "decision_sprint") as CommercialPackageId,
      useCase: String(formData.get("useCase") ?? "").trim() || undefined,
      decisionValueChf: formData.get("decisionValueChf") ? Number(formData.get("decisionValueChf")) : undefined,
    };
    setError(null);
    startTransition(async () => {
      const result = await createOpportunityAction(body);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-nova-accent hover:underline">
        + New opportunity
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="mt-3 grid gap-2 rounded-xl border border-titanium bg-carbon-2 p-3 sm:grid-cols-2">
      <select name="commercialPackage" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none">
        {Object.values(COMMERCIAL_PACKAGES).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select name="primaryContactId" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none">
        <option value="">Primary contact…</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input name="useCase" placeholder="Decision use case" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
      <input name="decisionValueChf" type="number" placeholder="Decision value (CHF)" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
      <div className="col-span-full flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-full bg-nova-accent px-4 py-1.5 text-xs font-medium text-black disabled:opacity-60">
          {isPending ? "Creating…" : "Create opportunity"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-nova-ink-faint hover:text-nova-ink">
          Cancel
        </button>
      </div>
      {error && <p role="alert" className="col-span-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
