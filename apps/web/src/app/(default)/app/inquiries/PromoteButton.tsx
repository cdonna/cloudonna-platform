"use client";

/** Lead -> Opportunity promotion trigger (brief §50) — human-approved,
 * one inquiry at a time; nothing is ever auto-promoted. */
import { useState, useTransition } from "react";
import { promoteInquiryAction } from "../commercial/actions";
import { COMMERCIAL_PACKAGES, type CommercialPackageId } from "@/lib/commercial/packages";

export function PromoteButton({ inquiryId }: { inquiryId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(false);

  function handlePromote(formData: FormData) {
    const commercialPackage = String(formData.get("commercialPackage") ?? "decision_sprint") as CommercialPackageId;
    setError(null);
    startTransition(async () => {
      const result = await promoteInquiryAction(inquiryId, { commercialPackage });
      if (result.error) setError(result.error);
      else setDone(true);
    });
  }

  if (done) return <span className="text-xs text-nova-success">Promoted to opportunity.</span>;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-nova-accent hover:underline">
        Promote to opportunity
      </button>
    );
  }

  return (
    <form action={handlePromote} className="flex items-center gap-2">
      <select name="commercialPackage" className="rounded-full border border-titanium bg-carbon-2 px-2 py-1 text-xs text-nova-ink outline-none">
        {Object.values(COMMERCIAL_PACKAGES).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={isPending} className="rounded-full bg-nova-accent px-3 py-1 text-xs font-medium text-black disabled:opacity-60">
        {isPending ? "Promoting…" : "Confirm"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </form>
  );
}
