"use client";

/**
 * Remember stage (brief §40/§44/§45) — Decision Memory made visible
 * and valuable: version history, the Outcome Review (what was
 * decided, what happened later), business case actuals, and
 * per-assumption validation. All three outcome tables
 * (decision_outcomes/business_case_actuals/assumption_validations)
 * were built in the Revenue Operations sprint specifically for this
 * — reused here, not duplicated. Context Compounding (brief §41/§42)
 * happens through this data being read back on future decisions,
 * never silently: every reused fact is dated and labeled "customer-
 * provided" or "validated," never presented as permanently current.
 */
import { useState, useTransition } from "react";
import { SectionLabel } from "../../shared";
import { DecisionTimeline } from "../../persistence/DecisionTimeline";
import { VersionControls } from "../../persistence/VersionControls";
import { VersionDiffPanel } from "../../persistence/VersionDiffPanel";
import type { DecisionVersionSummary } from "../../persistence/decisions-repository";
import type { VersionDiff } from "../../persistence/version-diff";
import type { ScoreChangeExplanation } from "../../persistence/score-explanation";
import type { DecisionEvent } from "../../engine/decision-events";
import type { DecisionOutcomeSummary, BusinessCaseActualsSummary, AssumptionValidationSummary } from "../../../../lib/decision-outcomes/repository";
import type { AssumptionValidationStatus } from "../../../../lib/decision-outcomes/assumption-validation-status";
import type { ActivityItem } from "../recent-activity";

const ASSUMPTION_STATUSES: AssumptionValidationStatus[] = ["unknown", "confirmed", "invalidated", "partially_true"];
const ASSUMPTION_LABELS: Record<AssumptionValidationStatus, string> = {
  unknown: "Unknown",
  confirmed: "Confirmed",
  invalidated: "Invalidated",
  partially_true: "Partially true",
};
const ASSUMPTION_STYLES: Record<AssumptionValidationStatus, string> = {
  unknown: "bg-carbon-2 text-nova-ink-faint",
  confirmed: "bg-nova-success/10 text-nova-success",
  invalidated: "bg-red-400/10 text-red-400",
  partially_true: "bg-nova-warning/10 text-nova-warning",
};

export function RememberStage({
  decisionId,
  editable,
  recentActivity,
  initialOutcome,
  initialActuals,
  initialAssumptions,
  versions,
  currentVersionNumber,
  displayedVersionNumber,
  diff,
  diffExplanation,
  diffEvents,
}: {
  decisionId: string;
  editable: boolean;
  recentActivity: ActivityItem[];
  initialOutcome: DecisionOutcomeSummary | null;
  initialActuals: BusinessCaseActualsSummary | null;
  initialAssumptions: AssumptionValidationSummary[];
  versions: DecisionVersionSummary[];
  currentVersionNumber: number;
  displayedVersionNumber: number;
  diff?: VersionDiff | null;
  diffExplanation?: ScoreChangeExplanation | null;
  diffEvents?: DecisionEvent[];
}) {
  const [outcome, setOutcome] = useState(initialOutcome);
  const [actuals, setActuals] = useState(initialActuals);
  const [assumptions, setAssumptions] = useState(initialAssumptions);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [addingAssumption, setAddingAssumption] = useState(false);

  function saveOutcome(formData: FormData) {
    const body = {
      implementationStarted: formData.get("implementationStarted") === "on",
      realizedOutcomeKnown: formData.get("realizedOutcomeKnown") === "on",
      customerFeedback: String(formData.get("customerFeedback") ?? "").trim() || undefined,
    };
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/decisions/${decisionId}/outcome`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "The request could not be processed.");
          return;
        }
        setOutcome(data as DecisionOutcomeSummary);
      } catch {
        setError("The request could not be processed. Check your connection and try again.");
      }
    });
  }

  function saveActuals(formData: FormData) {
    const body = {
      estimatedCost: formData.get("estimatedCost") ? Number(formData.get("estimatedCost")) : undefined,
      actualCost: formData.get("actualCost") ? Number(formData.get("actualCost")) : undefined,
      estimatedBenefit: formData.get("estimatedBenefit") ? Number(formData.get("estimatedBenefit")) : undefined,
      actualBenefit: formData.get("actualBenefit") ? Number(formData.get("actualBenefit")) : undefined,
    };
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/decisions/${decisionId}/business-case-actuals`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "The request could not be processed.");
          return;
        }
        setActuals(data as BusinessCaseActualsSummary);
      } catch {
        setError("The request could not be processed. Check your connection and try again.");
      }
    });
  }

  function addAssumption(formData: FormData) {
    const assumptionText = String(formData.get("assumptionText") ?? "").trim();
    if (!assumptionText) return;
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/decisions/${decisionId}/assumptions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assumptionText }) });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "The request could not be processed.");
          return;
        }
        setAssumptions((prev) => [...prev, data as AssumptionValidationSummary]);
        setAddingAssumption(false);
      } catch {
        setError("The request could not be processed. Check your connection and try again.");
      }
    });
  }

  function updateAssumptionStatus(assumptionId: string, validationStatus: AssumptionValidationStatus) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/decisions/assumptions/${assumptionId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ validationStatus }) });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "The request could not be processed.");
          return;
        }
        setAssumptions((prev) => prev.map((a) => (a.id === assumptionId ? (data as AssumptionValidationSummary) : a)));
      } catch {
        setError("The request could not be processed. Check your connection and try again.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-titanium bg-carbon p-5">
        <SectionLabel>Recent Donna activity</SectionLabel>
        {recentActivity.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {recentActivity.map((item, i) => (
              <li key={`${item.timestamp}-${i}`} className="flex items-start justify-between gap-3 text-sm text-nova-ink-muted">
                <span>{item.label}</span>
                <span className="shrink-0 text-xs text-nova-ink-faint">{new Date(item.timestamp).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-nova-ink-faint">No activity recorded yet.</p>
        )}
      </div>

      {versions.length > 0 && (
        <div className="rounded-2xl border border-titanium bg-carbon p-5">
          <SectionLabel>Version history</SectionLabel>
          <div className="mt-3 space-y-4">
            {versions.length > 1 && <VersionControls decisionId={decisionId} versions={versions} displayedVersionNumber={displayedVersionNumber} />}
            <DecisionTimeline decisionId={decisionId} versions={versions} currentVersionNumber={currentVersionNumber} displayedVersionNumber={displayedVersionNumber} />
          </div>
        </div>
      )}

      {diff && diffExplanation && <VersionDiffPanel diff={diff} explanation={diffExplanation} events={diffEvents ?? []} />}

      <div className="rounded-2xl border border-titanium bg-carbon p-5">
        <SectionLabel>Outcome review</SectionLabel>
        <form action={saveOutcome} className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm text-nova-ink-muted">
            <input type="checkbox" name="implementationStarted" defaultChecked={outcome?.implementationStarted ?? false} disabled={!editable} />
            Implementation has started
          </label>
          <label className="flex items-center gap-2 text-sm text-nova-ink-muted">
            <input type="checkbox" name="realizedOutcomeKnown" defaultChecked={outcome?.realizedOutcomeKnown ?? false} disabled={!editable} />
            Realized outcome is known
          </label>
          <textarea
            name="customerFeedback"
            defaultValue={outcome?.customerFeedback ?? ""}
            placeholder="Customer feedback / lessons learned"
            rows={3}
            disabled={!editable}
            className="w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none"
          />
          {editable && (
            <button type="submit" disabled={isPending} className="rounded-full bg-nova-accent px-4 py-1.5 text-xs font-medium text-black disabled:opacity-60">
              Save outcome
            </button>
          )}
        </form>
      </div>

      <div className="rounded-2xl border border-titanium bg-carbon p-5">
        <SectionLabel>Business case actuals</SectionLabel>
        <form action={saveActuals} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-nova-ink-faint">
            Estimated cost
            <input type="number" name="estimatedCost" defaultValue={actuals?.estimatedCost ?? ""} disabled={!editable} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
          </label>
          <label className="text-xs text-nova-ink-faint">
            Actual cost
            <input type="number" name="actualCost" defaultValue={actuals?.actualCost ?? ""} disabled={!editable} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
          </label>
          <label className="text-xs text-nova-ink-faint">
            Estimated benefit
            <input type="number" name="estimatedBenefit" defaultValue={actuals?.estimatedBenefit ?? ""} disabled={!editable} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
          </label>
          <label className="text-xs text-nova-ink-faint">
            Actual benefit
            <input type="number" name="actualBenefit" defaultValue={actuals?.actualBenefit ?? ""} disabled={!editable} className="mt-1 w-full rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
          </label>
          {editable && (
            <button type="submit" disabled={isPending} className="col-span-full w-fit rounded-full bg-nova-accent px-4 py-1.5 text-xs font-medium text-black disabled:opacity-60">
              Save actuals
            </button>
          )}
        </form>
        <p className="mt-2 text-xs text-nova-ink-faint">Entered by the customer once real data exists — never pre-filled or invented.</p>
      </div>

      <div className="rounded-2xl border border-titanium bg-carbon p-5">
        <div className="flex items-center justify-between">
          <SectionLabel>Assumption validation</SectionLabel>
          {editable && !addingAssumption && (
            <button type="button" onClick={() => setAddingAssumption(true)} className="text-xs text-nova-accent hover:underline">
              + Add assumption
            </button>
          )}
        </div>
        {addingAssumption && (
          <form action={addAssumption} className="mt-3 flex gap-2">
            <input name="assumptionText" placeholder="Assumption" required className="flex-1 rounded-lg border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none" />
            <button type="submit" disabled={isPending} className="rounded-full bg-nova-accent px-4 py-1.5 text-xs font-medium text-black disabled:opacity-60">
              Add
            </button>
          </form>
        )}
        <div className="mt-3 space-y-2">
          {assumptions.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-titanium bg-carbon-2 px-4 py-3 text-sm">
              <span className="text-nova-ink">{a.assumptionText}</span>
              {editable ? (
                <select
                  value={a.validationStatus}
                  onChange={(e) => updateAssumptionStatus(a.id, e.target.value as AssumptionValidationStatus)}
                  disabled={isPending}
                  aria-label={`Validation status for ${a.assumptionText}`}
                  className={`rounded-full border-none px-3 py-1 text-xs font-medium ${ASSUMPTION_STYLES[a.validationStatus]}`}
                >
                  {ASSUMPTION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {ASSUMPTION_LABELS[status]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${ASSUMPTION_STYLES[a.validationStatus]}`}>{ASSUMPTION_LABELS[a.validationStatus]}</span>
              )}
            </div>
          ))}
          {assumptions.length === 0 && <p className="text-sm text-nova-ink-faint">No assumptions recorded for validation yet.</p>}
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
