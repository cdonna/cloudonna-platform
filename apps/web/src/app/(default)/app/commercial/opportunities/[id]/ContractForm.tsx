"use client";

import { useState, useTransition } from "react";
import { upsertContractAction } from "../../actions";
import { CONTRACT_STATUSES, CONTRACT_STATUS_LABELS, BILLING_FREQUENCIES, BILLING_FREQUENCY_LABELS } from "./contract-constants";

interface Props {
  opportunityId: string;
  initial: {
    oneTimeFee: number;
    servicesFee: number;
    recurringAnnualFee: number;
    discountPercent: number;
    termMonths: number | null;
    contractStart: string | null;
    contractEnd: string | null;
    billingFrequency: string;
    currency: string;
    contractStatus: string;
    computedBookingsChf: number | null;
    computedArrChf: number | null;
    computedTcvChf: number | null;
  } | null;
}

export function ContractForm({ opportunityId, initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(formData: FormData) {
    const body = {
      oneTimeFee: Number(formData.get("oneTimeFee") ?? 0),
      servicesFee: Number(formData.get("servicesFee") ?? 0),
      recurringAnnualFee: Number(formData.get("recurringAnnualFee") ?? 0),
      discountPercent: Number(formData.get("discountPercent") ?? 0),
      termMonths: formData.get("termMonths") ? Number(formData.get("termMonths")) : undefined,
      contractStart: String(formData.get("contractStart") ?? "") || undefined,
      contractEnd: String(formData.get("contractEnd") ?? "") || undefined,
      billingFrequency: String(formData.get("billingFrequency") ?? "annual"),
      contractStatus: String(formData.get("contractStatus") ?? "draft"),
    };
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await upsertContractAction(opportunityId, body);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="mt-3 grid gap-3 rounded-2xl border border-titanium bg-carbon p-4 sm:grid-cols-2">
      <label className="text-xs text-nova-ink-faint">
        One-time fee
        <input type="number" name="oneTimeFee" defaultValue={initial?.oneTimeFee ?? 0} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Services fee
        <input type="number" name="servicesFee" defaultValue={initial?.servicesFee ?? 0} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Recurring annual fee
        <input type="number" name="recurringAnnualFee" defaultValue={initial?.recurringAnnualFee ?? 0} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Discount %
        <input type="number" name="discountPercent" defaultValue={initial?.discountPercent ?? 0} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Term (months)
        <input type="number" name="termMonths" defaultValue={initial?.termMonths ?? ""} placeholder="Defaults to 1 year" className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Billing frequency
        <select name="billingFrequency" defaultValue={initial?.billingFrequency ?? "annual"} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none">
          {BILLING_FREQUENCIES.map((f) => (
            <option key={f} value={f}>
              {BILLING_FREQUENCY_LABELS[f]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-nova-ink-faint">
        Contract start
        <input type="date" name="contractStart" defaultValue={initial?.contractStart ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Contract end
        <input type="date" name="contractEnd" defaultValue={initial?.contractEnd ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Contract status
        <select name="contractStatus" defaultValue={initial?.contractStatus ?? "draft"} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none">
          {CONTRACT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CONTRACT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      {initial && (
        <div className="col-span-full rounded-xl border border-titanium bg-carbon-2 p-3 text-xs text-nova-ink-muted">
          Computed: Bookings {initial.computedBookingsChf ?? "—"} · ARR {initial.computedArrChf ?? "—"} · TCV {initial.computedTcvChf ?? "—"} ({initial.currency})
        </div>
      )}

      <div className="col-span-full flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-full bg-nova-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-60">
          {isPending ? "Saving…" : "Save contract"}
        </button>
        {saved && <span className="text-xs text-nova-success">Saved.</span>}
      </div>
      {error && <p role="alert" className="col-span-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
