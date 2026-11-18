"use client";

import { useState, useTransition } from "react";
import { createInvoiceAction, updateInvoiceAction } from "../../actions";
import { PAYMENT_STATUS_LABELS } from "@/lib/commercial/payment-status";

export interface InvoiceRow {
  id: string;
  invoiceAmount: number;
  currency: string;
  paidAmount: number;
  paymentStatus: keyof typeof PAYMENT_STATUS_LABELS;
  dueDate: string | null;
}

export function InvoicesPanel({ opportunityId, contractId, invoices }: { opportunityId: string; contractId: string; invoices: InvoiceRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate(formData: FormData) {
    const body = {
      contractId,
      invoiceAmount: Number(formData.get("invoiceAmount") ?? 0),
      invoiceDate: String(formData.get("invoiceDate") ?? "") || undefined,
      dueDate: String(formData.get("dueDate") ?? "") || undefined,
    };
    setError(null);
    startTransition(async () => {
      const result = await createInvoiceAction(opportunityId, body);
      if (result.error) setError(result.error);
    });
  }

  function markPaid(invoiceId: string, amount: number) {
    startTransition(async () => {
      const result = await updateInvoiceAction(invoiceId, opportunityId, { paidAmount: amount });
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="mt-3">
      <div className="space-y-2">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between rounded-xl border border-titanium bg-carbon px-4 py-3 text-sm">
            <div>
              <span className="text-nova-ink">
                {inv.invoiceAmount} {inv.currency}
              </span>
              <span className="ml-2 text-nova-ink-faint">{PAYMENT_STATUS_LABELS[inv.paymentStatus]}</span>
              {inv.dueDate && <span className="ml-2 text-xs text-nova-ink-faint">Due {inv.dueDate}</span>}
            </div>
            {inv.paymentStatus !== "paid" && (
              <button type="button" disabled={isPending} onClick={() => markPaid(inv.id, inv.invoiceAmount)} className="text-xs text-nova-accent hover:underline">
                Mark fully paid
              </button>
            )}
          </div>
        ))}
        {invoices.length === 0 && <p className="text-sm text-nova-ink-faint">No invoices yet.</p>}
      </div>
      <form action={handleCreate} className="mt-3 grid gap-2 rounded-xl border border-titanium bg-carbon-2 p-3 sm:grid-cols-3">
        <input type="number" name="invoiceAmount" placeholder="Invoice amount" required className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
        <input type="date" name="invoiceDate" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
        <input type="date" name="dueDate" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
        <button type="submit" disabled={isPending} className="col-span-full w-fit rounded-full bg-nova-accent px-4 py-1.5 text-xs font-medium text-black disabled:opacity-60">
          Add invoice
        </button>
      </form>
      {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
