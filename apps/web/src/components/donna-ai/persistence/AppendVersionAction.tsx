"use client";

/**
 * Sprint 6.2, Slice D — the "Save as new version" action on the
 * Decision Detail page. Deliberately requires no wizard/edit UI: the
 * currently-displayed version's own decisionInput is resent unchanged,
 * and the server always recomputes deterministicOutput fresh from it
 * (handle-append-decision-version-request.ts, identical discipline to
 * the original save path) — so this button's real value is capturing
 * "what would today's engine/knowledge-base say about this same input,"
 * officially, as a new immutable version, with a human-authored reason.
 * Reuses SaveDecisionDialog's established form/status pattern rather
 * than inventing a new one — unmounted (not just hidden) when closed,
 * for the same reason that file gives: every open starts fresh from
 * useState initializers, no imperative reset needed.
 */
import { useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DecisionInput, DecisionReport } from "../intelligence/types";

export function AppendVersionAction({
  decisionId,
  decisionInput,
  report,
}: {
  decisionId: string;
  decisionInput: DecisionInput;
  report: DecisionReport;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="border-titanium bg-carbon-2 text-nova-ink hover:border-titanium-strong">
        <Plus size={15} />
        Save as new version
      </Button>
      {open && (
        <AppendVersionDialog decisionId={decisionId} decisionInput={decisionInput} report={report} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function AppendVersionDialog({
  decisionId,
  decisionInput,
  report,
  onClose,
}: {
  decisionId: string;
  decisionInput: DecisionInput;
  report: DecisionReport;
  onClose: () => void;
}) {
  const [changeReason, setChangeReason] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "saved">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedVersionNumber, setSavedVersionNumber] = useState<number | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (changeReason.trim().length === 0) return;

    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/decisions/${decisionId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionInput,
          enrichment: report.enrichment,
          provider: report.provider,
          fallback: report.fallback,
          changeReason: changeReason.trim(),
        }),
      });

      const data: { id?: string; versionNumber?: number; error?: string } = await response.json();

      if (!response.ok || data.versionNumber == null) {
        setStatus("error");
        setErrorMessage(data.error ?? "The new version could not be saved.");
        return;
      }

      setSavedVersionNumber(data.versionNumber);
      setStatus("saved");
    } catch {
      setStatus("error");
      setErrorMessage("The new version could not be saved. Check your connection and try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 px-4 backdrop-blur-sm" onClick={() => onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="append-version-title"
        className="w-full max-w-md rounded-2xl border border-titanium bg-obsidian p-6 shadow-nova-glow"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 id="append-version-title" className="text-lg font-semibold text-nova-ink">
            Save as new version
          </h2>
          <button type="button" onClick={() => onClose()} aria-label="Close" className="text-nova-ink-faint transition duration-200 hover:text-nova-ink">
            <X size={18} />
          </button>
        </div>

        {status === "saved" && savedVersionNumber !== null ? (
          <div role="status" aria-live="polite" className="mt-5 rounded-xl border border-nova-success/30 bg-nova-success/10 p-4 text-sm text-nova-success">
            <div className="flex items-center gap-2 font-medium">
              <Check size={16} />
              Saved as version {savedVersionNumber}
            </div>
            <Link
              href={`/app/decisions/${decisionId}?version=${savedVersionNumber}`}
              onClick={() => onClose()}
              className="mt-1 inline-block font-medium underline underline-offset-2"
            >
              View this version
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <p className="text-sm text-nova-ink-muted">
              This saves the current input, recomputed against today&apos;s scoring engine and knowledge base, as a new,
              permanent version. The original version is never changed.
            </p>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="append-change-reason" className="text-sm font-medium text-nova-ink">
                Reason for this version
              </label>
              <input
                id="append-change-reason"
                value={changeReason}
                onChange={(event) => setChangeReason(event.target.value)}
                required
                placeholder="e.g. Budget increased after Q3 planning"
                className="h-11 rounded-xl border border-titanium bg-carbon px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
              />
            </div>

            {status === "error" && errorMessage && (
              <p role="alert" className="text-sm text-red-400">
                {errorMessage}
              </p>
            )}

            <Button
              type="submit"
              disabled={status === "saving" || changeReason.trim().length === 0}
              className="h-11 bg-nova-accent text-white hover:bg-nova-accent-strong"
            >
              {status === "saving" && <LoaderCircle size={16} className="animate-spin" />}
              Save version
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
