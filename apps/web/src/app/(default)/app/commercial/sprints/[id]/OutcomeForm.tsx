"use client";

import { useState, useTransition } from "react";
import { upsertSprintOutcomeAction } from "../../actions";

interface Props {
  sprintId: string;
  initial: {
    recommendationDelivered: string | null;
    finalHumanDecision: string | null;
    estimatedDecisionValueChf: number | null;
    businessCaseValueChf: number | null;
    customerAcceptedRecommendation: boolean | null;
    customerSelectedDifferentOption: boolean | null;
    reasons: string | null;
    nextStep: string | null;
    expansionPotential: string | null;
  } | null;
}

/** Sprint outcome capture (brief §14) — a customer selecting a
 * different option than the recommendation is a normal, valid
 * outcome here, not an error state; there is no "failed" status. */
export function OutcomeForm({ sprintId, initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(formData: FormData) {
    const body = {
      recommendationDelivered: String(formData.get("recommendationDelivered") ?? "").trim() || undefined,
      finalHumanDecision: String(formData.get("finalHumanDecision") ?? "").trim() || undefined,
      estimatedDecisionValueChf: formData.get("estimatedDecisionValueChf") ? Number(formData.get("estimatedDecisionValueChf")) : undefined,
      businessCaseValueChf: formData.get("businessCaseValueChf") ? Number(formData.get("businessCaseValueChf")) : undefined,
      customerAcceptedRecommendation: formData.get("customerAcceptedRecommendation") === "on",
      customerSelectedDifferentOption: formData.get("customerSelectedDifferentOption") === "on",
      reasons: String(formData.get("reasons") ?? "").trim() || undefined,
      nextStep: String(formData.get("nextStep") ?? "").trim() || undefined,
      expansionPotential: String(formData.get("expansionPotential") ?? "").trim() || undefined,
    };
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await upsertSprintOutcomeAction(sprintId, body);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="mt-3 grid gap-3 rounded-2xl border border-titanium bg-carbon p-4 sm:grid-cols-2">
      <label className="col-span-full text-xs text-nova-ink-faint">
        Recommendation delivered
        <textarea name="recommendationDelivered" defaultValue={initial?.recommendationDelivered ?? ""} rows={2} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="col-span-full text-xs text-nova-ink-faint">
        Final human decision
        <textarea name="finalHumanDecision" defaultValue={initial?.finalHumanDecision ?? ""} rows={2} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Estimated decision value (CHF)
        <input type="number" name="estimatedDecisionValueChf" defaultValue={initial?.estimatedDecisionValueChf ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Business case value (CHF)
        <input type="number" name="businessCaseValueChf" defaultValue={initial?.businessCaseValueChf ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="flex items-center gap-2 text-xs text-nova-ink-muted">
        <input type="checkbox" name="customerAcceptedRecommendation" defaultChecked={initial?.customerAcceptedRecommendation ?? false} /> Customer accepted recommendation
      </label>
      <label className="flex items-center gap-2 text-xs text-nova-ink-muted">
        <input type="checkbox" name="customerSelectedDifferentOption" defaultChecked={initial?.customerSelectedDifferentOption ?? false} /> Customer selected a different option
      </label>
      <label className="col-span-full text-xs text-nova-ink-faint">
        Reasons
        <textarea name="reasons" defaultValue={initial?.reasons ?? ""} rows={2} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Next step
        <input name="nextStep" defaultValue={initial?.nextStep ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Expansion potential
        <input name="expansionPotential" defaultValue={initial?.expansionPotential ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>

      <div className="col-span-full flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-full bg-nova-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-60">
          {isPending ? "Saving…" : "Save outcome"}
        </button>
        {saved && <span className="text-xs text-nova-success">Saved.</span>}
      </div>
      {error && <p role="alert" className="col-span-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
