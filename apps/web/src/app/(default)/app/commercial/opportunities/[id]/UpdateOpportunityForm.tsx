"use client";

import { useState, useTransition } from "react";
import { updateOpportunityAction } from "../../actions";
import { OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS, type OpportunityStage } from "@/lib/commercial/opportunity-stages";
import { FORECAST_CATEGORIES, FORECAST_CATEGORY_LABELS } from "@/lib/commercial/forecast";
import { LOST_REASONS, LOST_REASON_LABELS, WON_REASONS, WON_REASON_LABELS } from "@/lib/commercial/lost-won-reasons";

interface Props {
  opportunityId: string;
  initial: {
    stage: OpportunityStage;
    nextAction: string | null;
    nextActionDueAt: string | null;
    targetCloseDate: string | null;
    decisionTitle: string | null;
    decisionDeadline: string | null;
    expectedBookingsChf: number | null;
    expectedArrChf: number | null;
    expectedTcvChf: number | null;
    forecastCategory: string | null;
  };
}

export function UpdateOpportunityForm({ opportunityId, initial }: Props) {
  const [stage, setStage] = useState<OpportunityStage>(initial.stage);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isClosing = stage === "closed_won" || stage === "closed_lost";

  function handleSubmit(formData: FormData) {
    const body: Record<string, unknown> = {
      stage,
      nextAction: String(formData.get("nextAction") ?? "").trim() || undefined,
      nextActionDueAt: String(formData.get("nextActionDueAt") ?? "") || undefined,
      targetCloseDate: String(formData.get("targetCloseDate") ?? "") || undefined,
      decisionTitle: String(formData.get("decisionTitle") ?? "").trim() || undefined,
      decisionDeadline: String(formData.get("decisionDeadline") ?? "") || undefined,
      expectedBookingsChf: formData.get("expectedBookingsChf") ? Number(formData.get("expectedBookingsChf")) : undefined,
      expectedArrChf: formData.get("expectedArrChf") ? Number(formData.get("expectedArrChf")) : undefined,
      expectedTcvChf: formData.get("expectedTcvChf") ? Number(formData.get("expectedTcvChf")) : undefined,
      forecastCategory: String(formData.get("forecastCategory") ?? "") || undefined,
    };
    if (stage === "closed_won") {
      body.wonReason = String(formData.get("wonReason") ?? "") || undefined;
      body.wonReasonNote = String(formData.get("reasonNote") ?? "").trim() || undefined;
    }
    if (stage === "closed_lost") {
      body.lostReason = String(formData.get("lostReason") ?? "") || undefined;
      body.lostReasonNote = String(formData.get("reasonNote") ?? "").trim() || undefined;
    }
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateOpportunityAction(opportunityId, body);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="mt-3 grid gap-3 rounded-2xl border border-titanium bg-carbon p-4 sm:grid-cols-2">
      <label className="text-xs text-nova-ink-faint">
        Stage
        <select value={stage} onChange={(e) => setStage(e.target.value as OpportunityStage)} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none">
          {OPPORTUNITY_STAGES.map((s) => (
            <option key={s} value={s}>
              {OPPORTUNITY_STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-nova-ink-faint">
        Forecast category
        <select name="forecastCategory" defaultValue={initial.forecastCategory ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none">
          <option value="">—</option>
          {FORECAST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {FORECAST_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>

      {isClosing && stage === "closed_won" && (
        <label className="text-xs text-nova-ink-faint">
          Won reason
          <select name="wonReason" className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none">
            <option value="">—</option>
            {WON_REASONS.map((r) => (
              <option key={r} value={r}>
                {WON_REASON_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
      )}
      {isClosing && stage === "closed_lost" && (
        <label className="text-xs text-nova-ink-faint">
          Lost reason
          <select name="lostReason" className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none">
            <option value="">—</option>
            {LOST_REASONS.map((r) => (
              <option key={r} value={r}>
                {LOST_REASON_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
      )}
      {isClosing && (
        <label className="col-span-full text-xs text-nova-ink-faint">
          Reason note
          <input name="reasonNote" className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
        </label>
      )}

      <label className="text-xs text-nova-ink-faint">
        Next action
        <input name="nextAction" defaultValue={initial.nextAction ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Next action due
        <input type="date" name="nextActionDueAt" defaultValue={initial.nextActionDueAt ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Target close date
        <input type="date" name="targetCloseDate" defaultValue={initial.targetCloseDate ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Customer decision deadline
        <input type="date" name="decisionDeadline" defaultValue={initial.decisionDeadline ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="col-span-full text-xs text-nova-ink-faint">
        Decision title
        <input name="decisionTitle" defaultValue={initial.decisionTitle ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Expected bookings (CHF)
        <input type="number" name="expectedBookingsChf" defaultValue={initial.expectedBookingsChf ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Expected ARR (CHF)
        <input type="number" name="expectedArrChf" defaultValue={initial.expectedArrChf ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>
      <label className="text-xs text-nova-ink-faint">
        Expected TCV (CHF)
        <input type="number" name="expectedTcvChf" defaultValue={initial.expectedTcvChf ?? ""} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
      </label>

      <div className="col-span-full flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-full bg-nova-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-60">
          {isPending ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-xs text-nova-success">Saved.</span>}
      </div>
      {error && <p role="alert" className="col-span-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
