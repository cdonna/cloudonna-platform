"use client";

/**
 * The explicit Save Decision action. Requires an authenticated session
 * (verified server-side by /api/decisions regardless of anything this
 * component does) and an explicit user click every time — there is no
 * autosave code path anywhere in this file or its caller. See
 * docs/sprint-6/20-save-decision-flow.md.
 */
import { useEffect, useState } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DecisionReport } from "../intelligence/types";
import type { WizardState } from "../types";

interface SaveTargetOption {
  organizationId: string;
  organizationName: string;
  workspaceId: string;
  workspaceName: string;
  projectId: string;
  projectName: string;
}

/**
 * Deliberately unmounted (not just visually hidden) when closed — the
 * parent only renders this component while the dialog is open. Every
 * mount therefore starts from this file's own useState initializers
 * ("idle", null, null) with no need to imperatively reset anything in
 * an effect, and closing discards all in-progress state automatically.
 * This also sidesteps calling setState synchronously inside an effect
 * body (React's own guidance against it — cascading renders), since the
 * effect below only ever fetches, never resets.
 */
export function SaveDecisionDialog({
  onClose,
  wizardState,
  report,
}: {
  onClose: () => void;
  wizardState: WizardState;
  report: DecisionReport;
}) {
  const [options, setOptions] = useState<SaveTargetOption[] | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "saved">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedHumanId, setSavedHumanId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/save-targets")
      .then((res) => res.json())
      .then((data: { signedIn: boolean; options: SaveTargetOption[] }) => {
        setOptions(data.options);
        if (data.options.length > 0) setSelectedProjectId(data.options[0].projectId);
      })
      .catch(() => setOptions([]));
  }, []);

  const selected = options?.find((o) => o.projectId === selectedProjectId) ?? null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || title.trim().length === 0) return;

    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          organizationId: selected.organizationId,
          workspaceId: selected.workspaceId,
          projectId: selected.projectId,
          decisionInput: { wizardState },
          enrichment: report.enrichment,
          provider: report.provider,
          fallback: report.fallback,
        }),
      });

      const data: { id?: string; humanReadableId?: string; error?: string } = await response.json();

      if (!response.ok || !data.humanReadableId) {
        setStatus("error");
        setErrorMessage(data.error ?? "The decision could not be saved.");
        return;
      }

      setSavedHumanId(data.humanReadableId);
      setStatus("saved");
    } catch {
      setStatus("error");
      setErrorMessage("The decision could not be saved. Check your connection and try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 px-4 backdrop-blur-sm" onClick={() => onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-decision-title"
        className="w-full max-w-md rounded-2xl border border-titanium bg-obsidian p-6 shadow-nova-glow"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 id="save-decision-title" className="text-lg font-semibold text-nova-ink">
            Save decision
          </h2>
          <button type="button" onClick={() => onClose()} aria-label="Close" className="text-nova-ink-faint transition duration-200 hover:text-nova-ink">
            <X size={18} />
          </button>
        </div>

        {status === "saved" && savedHumanId ? (
          <div role="status" aria-live="polite" className="mt-5 rounded-xl border border-nova-success/30 bg-nova-success/10 p-4 text-sm text-nova-success">
            <div className="flex items-center gap-2 font-medium">
              <Check size={16} />
              Saved as {savedHumanId}
            </div>
            <p className="mt-1 text-nova-success/80">You can find it in Decision History.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="decision-title" className="text-sm font-medium text-nova-ink">
                Title
              </label>
              <input
                id="decision-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="e.g. 2027 Data Platform RFP"
                className="h-11 rounded-xl border border-titanium bg-carbon px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="decision-project" className="text-sm font-medium text-nova-ink">
                Project
              </label>
              {options === null ? (
                <div className="flex h-11 items-center gap-2 text-sm text-nova-ink-faint">
                  <LoaderCircle size={14} className="animate-spin" />
                  Loading your projects…
                </div>
              ) : options.length === 0 ? (
                <p className="text-sm text-nova-ink-muted">No project is available yet.</p>
              ) : (
                <select
                  id="decision-project"
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  className="h-11 rounded-xl border border-titanium bg-carbon px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
                >
                  {options.map((option) => (
                    <option key={option.projectId} value={option.projectId}>
                      {option.organizationName} / {option.workspaceName} / {option.projectName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {status === "error" && errorMessage && (
              <p role="alert" className="text-sm text-red-400">
                {errorMessage}
              </p>
            )}

            <Button
              type="submit"
              disabled={status === "saving" || !selected || title.trim().length === 0}
              className="h-11 bg-nova-accent text-white hover:bg-nova-accent-strong"
            >
              {status === "saving" && <LoaderCircle size={16} className="animate-spin" />}
              Save decision
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
