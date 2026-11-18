"use client";

import { useState, useTransition } from "react";
import { createConversionAction } from "../../actions";
import { CONVERSION_TYPES, CONVERSION_TYPE_LABELS } from "@/lib/commercial/conversion-type";

export function ConversionForm({ accountId, sprintId }: { accountId: string; sprintId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(formData: FormData) {
    const body = {
      fromAccountId: accountId,
      fromSprintId: sprintId,
      conversionType: String(formData.get("conversionType") ?? "no_expansion"),
      conversionOutcome: String(formData.get("conversionOutcome") ?? "").trim() || undefined,
      conversionDate: String(formData.get("conversionDate") ?? "") || undefined,
      conversionValueChf: formData.get("conversionValueChf") ? Number(formData.get("conversionValueChf")) : undefined,
    };
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await createConversionAction(accountId, body);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="mt-3 grid gap-2 rounded-xl border border-titanium bg-carbon-2 p-3 sm:grid-cols-2">
      <select name="conversionType" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none">
        {CONVERSION_TYPES.map((t) => (
          <option key={t} value={t}>
            {CONVERSION_TYPE_LABELS[t]}
          </option>
        ))}
      </select>
      <input type="date" name="conversionDate" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
      <input type="number" name="conversionValueChf" placeholder="Conversion value (CHF)" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
      <input name="conversionOutcome" placeholder="Outcome note" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
      <div className="col-span-full flex items-center gap-3">
        <button type="submit" disabled={isPending} className="w-fit rounded-full bg-nova-accent px-4 py-1.5 text-xs font-medium text-black disabled:opacity-60">
          {isPending ? "Recording…" : "Record conversion"}
        </button>
        {saved && <span className="text-xs text-nova-success">Saved.</span>}
      </div>
      {error && <p role="alert" className="col-span-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
