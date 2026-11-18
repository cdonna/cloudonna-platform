"use client";

/**
 * Align stage (brief §36-§39) — stakeholders, their alignment status,
 * and a minimal decision action plan. The only stage backed by
 * genuinely new schema this sprint (decision_stakeholders/
 * decision_action_items) — every other stage reuses existing tables.
 * Alignment status is always set explicitly by a human; never
 * inferred from inactivity.
 */
import { useState, useTransition } from "react";
import { SectionLabel } from "../../shared";
import type { AlignmentStatus, DecisionStakeholder } from "../stakeholders-repository";
import type { ActionItemStatus, DecisionActionItem } from "../action-items-repository";

const ALIGNMENT_STATUSES: AlignmentStatus[] = ["not_reviewed", "aligned", "conditional", "objected", "approved"];
const ALIGNMENT_LABELS: Record<AlignmentStatus, string> = {
  not_reviewed: "Not reviewed",
  aligned: "Aligned",
  conditional: "Conditional",
  objected: "Objected",
  approved: "Approved",
};
const ALIGNMENT_STYLES: Record<AlignmentStatus, string> = {
  not_reviewed: "bg-carbon-2 text-nova-ink-faint",
  aligned: "bg-nova-success/10 text-nova-success",
  conditional: "bg-nova-warning/10 text-nova-warning",
  objected: "bg-red-400/10 text-red-400",
  approved: "bg-nova-accent/10 text-nova-accent-strong",
};

export function AlignStage({
  decisionId,
  editable,
  initialStakeholders,
  initialActionItems,
}: {
  decisionId: string;
  editable: boolean;
  initialStakeholders: DecisionStakeholder[];
  initialActionItems: DecisionActionItem[];
}) {
  const [stakeholders, setStakeholders] = useState(initialStakeholders);
  const [actionItems, setActionItems] = useState(initialActionItems);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [addingStakeholder, setAddingStakeholder] = useState(false);
  const [addingAction, setAddingAction] = useState(false);

  function addStakeholder(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    const body = { name, role: String(formData.get("role") ?? "").trim() || undefined };
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/decisions/${decisionId}/stakeholders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "The request could not be processed.");
          return;
        }
        setStakeholders((prev) => [...prev, data as DecisionStakeholder]);
        setAddingStakeholder(false);
      } catch {
        setError("The request could not be processed. Check your connection and try again.");
      }
    });
  }

  function updateAlignment(stakeholderId: string, alignmentStatus: AlignmentStatus) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/decisions/stakeholders/${stakeholderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alignmentStatus }) });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "The request could not be processed.");
          return;
        }
        setStakeholders((prev) => prev.map((s) => (s.id === stakeholderId ? (data as DecisionStakeholder) : s)));
      } catch {
        setError("The request could not be processed. Check your connection and try again.");
      }
    });
  }

  function addActionItem(formData: FormData) {
    const action = String(formData.get("action") ?? "").trim();
    if (!action) return;
    const body = { action, owner: String(formData.get("owner") ?? "").trim() || undefined, targetDate: String(formData.get("targetDate") ?? "") || undefined };
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/decisions/${decisionId}/action-items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "The request could not be processed.");
          return;
        }
        setActionItems((prev) => [...prev, data as DecisionActionItem]);
        setAddingAction(false);
      } catch {
        setError("The request could not be processed. Check your connection and try again.");
      }
    });
  }

  function toggleActionStatus(itemId: string, status: ActionItemStatus) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/decisions/action-items/${itemId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "The request could not be processed.");
          return;
        }
        setActionItems((prev) => prev.map((a) => (a.id === itemId ? (data as DecisionActionItem) : a)));
      } catch {
        setError("The request could not be processed. Check your connection and try again.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-titanium bg-carbon p-5">
        <div className="flex items-center justify-between">
          <SectionLabel>Stakeholders</SectionLabel>
          {editable && !addingStakeholder && (
            <button type="button" onClick={() => setAddingStakeholder(true)} className="text-xs text-nova-accent hover:underline">
              + Add stakeholder
            </button>
          )}
        </div>

        {addingStakeholder && (
          <form action={addStakeholder} className="mt-3 grid gap-2 rounded-xl border border-titanium bg-carbon-2 p-3 sm:grid-cols-2">
            <input name="name" placeholder="Name" required className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
            <input name="role" placeholder="Role (e.g. Economic Buyer)" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
            <div className="col-span-full flex items-center gap-3">
              <button type="submit" disabled={isPending} className="rounded-full bg-nova-accent px-4 py-1.5 text-xs font-medium text-black disabled:opacity-60">
                Add
              </button>
              <button type="button" onClick={() => setAddingStakeholder(false)} className="text-xs text-nova-ink-faint hover:text-nova-ink">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-3 space-y-2">
          {stakeholders.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-titanium bg-carbon-2 px-4 py-3 text-sm">
              <div>
                <span className="font-medium text-nova-ink">{s.name}</span>
                {s.role && <span className="ml-2 text-nova-ink-faint">{s.role}</span>}
              </div>
              {editable ? (
                <select
                  value={s.alignmentStatus}
                  onChange={(e) => updateAlignment(s.id, e.target.value as AlignmentStatus)}
                  disabled={isPending}
                  aria-label={`Alignment status for ${s.name}`}
                  className={`rounded-full border-none px-3 py-1 text-xs font-medium ${ALIGNMENT_STYLES[s.alignmentStatus]}`}
                >
                  {ALIGNMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {ALIGNMENT_LABELS[status]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${ALIGNMENT_STYLES[s.alignmentStatus]}`}>{ALIGNMENT_LABELS[s.alignmentStatus]}</span>
              )}
            </div>
          ))}
          {stakeholders.length === 0 && <p className="text-sm text-nova-ink-faint">No stakeholders added yet.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-titanium bg-carbon p-5">
        <div className="flex items-center justify-between">
          <SectionLabel>Decision action plan</SectionLabel>
          {editable && !addingAction && (
            <button type="button" onClick={() => setAddingAction(true)} className="text-xs text-nova-accent hover:underline">
              + Add action
            </button>
          )}
        </div>

        {addingAction && (
          <form action={addActionItem} className="mt-3 grid gap-2 rounded-xl border border-titanium bg-carbon-2 p-3 sm:grid-cols-3">
            <input name="action" placeholder="Action" required className="col-span-full rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none sm:col-span-1" />
            <input name="owner" placeholder="Owner" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
            <input type="date" name="targetDate" className="rounded-lg border border-titanium bg-carbon px-3 py-2 text-sm text-nova-ink outline-none" />
            <div className="col-span-full flex items-center gap-3">
              <button type="submit" disabled={isPending} className="rounded-full bg-nova-accent px-4 py-1.5 text-xs font-medium text-black disabled:opacity-60">
                Add
              </button>
              <button type="button" onClick={() => setAddingAction(false)} className="text-xs text-nova-ink-faint hover:text-nova-ink">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-3 space-y-2">
          {actionItems.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-titanium bg-carbon-2 px-4 py-3 text-sm">
              <div>
                <span className={a.status === "done" ? "text-nova-ink-faint line-through" : "text-nova-ink"}>{a.action}</span>
                {a.owner && <span className="ml-2 text-xs text-nova-ink-faint">{a.owner}</span>}
                {a.targetDate && <span className="ml-2 text-xs text-nova-ink-faint">{a.targetDate}</span>}
              </div>
              {editable && (
                <button type="button" disabled={isPending} onClick={() => toggleActionStatus(a.id, a.status === "open" ? "done" : "open")} className="text-xs text-nova-accent hover:underline">
                  {a.status === "open" ? "Mark done" : "Reopen"}
                </button>
              )}
            </div>
          ))}
          {actionItems.length === 0 && <p className="text-sm text-nova-ink-faint">No action items yet.</p>}
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
