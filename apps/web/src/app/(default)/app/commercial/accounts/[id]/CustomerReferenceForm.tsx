"use client";

import { useState, useTransition } from "react";
import { upsertCustomerReferenceAction } from "../../actions";
import { CUSTOMER_REFERENCE_STATUSES, CUSTOMER_REFERENCE_STATUS_LABELS, type CustomerReferenceStatus } from "@/lib/commercial/customer-reference-status";

export function CustomerReferenceForm({
  accountId,
  initial,
}: {
  accountId: string;
  initial: { referenceStatus: CustomerReferenceStatus; allowAnonymousStats: boolean; allowPublicReference: boolean; allowLogoUse: boolean; allowCaseStudy: boolean; allowQuote: boolean };
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(formData: FormData) {
    const body = {
      accountId,
      referenceStatus: String(formData.get("referenceStatus") ?? "private") as CustomerReferenceStatus,
      allowAnonymousStats: formData.get("allowAnonymousStats") === "on",
      allowPublicReference: formData.get("allowPublicReference") === "on",
      allowLogoUse: formData.get("allowLogoUse") === "on",
      allowCaseStudy: formData.get("allowCaseStudy") === "on",
      allowQuote: formData.get("allowQuote") === "on",
    };
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await upsertCustomerReferenceAction(accountId, body);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="mt-3 grid gap-2 rounded-xl border border-titanium bg-carbon-2 p-3 text-sm">
      <p className="text-xs text-nova-ink-faint">Default: no public use of any kind until explicitly recorded here.</p>
      <select name="referenceStatus" defaultValue={initial.referenceStatus} className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none">
        {CUSTOMER_REFERENCE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {CUSTOMER_REFERENCE_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-xs text-nova-ink-muted">
          <input type="checkbox" name="allowAnonymousStats" defaultChecked={initial.allowAnonymousStats} /> Anonymous stats
        </label>
        <label className="flex items-center gap-2 text-xs text-nova-ink-muted">
          <input type="checkbox" name="allowPublicReference" defaultChecked={initial.allowPublicReference} /> Public reference
        </label>
        <label className="flex items-center gap-2 text-xs text-nova-ink-muted">
          <input type="checkbox" name="allowLogoUse" defaultChecked={initial.allowLogoUse} /> Logo use
        </label>
        <label className="flex items-center gap-2 text-xs text-nova-ink-muted">
          <input type="checkbox" name="allowCaseStudy" defaultChecked={initial.allowCaseStudy} /> Case study
        </label>
        <label className="flex items-center gap-2 text-xs text-nova-ink-muted">
          <input type="checkbox" name="allowQuote" defaultChecked={initial.allowQuote} /> Quote
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className="w-fit rounded-full bg-nova-accent px-4 py-1.5 text-xs font-medium text-black disabled:opacity-60">
          {isPending ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-xs text-nova-success">Saved.</span>}
      </div>
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
