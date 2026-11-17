"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "../shared";
import type { EngineResult } from "../engine/recommendation";
import type { HumanOverride } from "./decisions-repository";

/**
 * Human Decision (brief §18/§28) — the engine's recommendation and the
 * final human decision are rendered as two visibly distinct facts,
 * never merged into one. `humanOverride` is read straight from
 * decision_versions.human_override_json; nothing here ever rewrites
 * deterministic_output_json, and recording a new override always goes
 * through the same append-version path every other new version does
 * (brief §28, "never silently overwrite").
 */
export function HumanDecisionPanel({
  engineResult,
  humanOverride,
  onRecordOverride,
}: {
  engineResult: EngineResult;
  humanOverride: HumanOverride | null;
  onRecordOverride?: (selectedOptionId: string, rationale: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [editing, setEditing] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState(humanOverride?.selectedOptionId ?? engineResult.recommendedOption.id);
  const [rationale, setRationale] = useState(humanOverride?.rationale ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const confirmsEngine = humanOverride !== null && humanOverride.selectedOptionId === engineResult.recommendedOption.id;
  const selectedOptionName = humanOverride ? engineResult.ranking.find((r) => r.id === humanOverride.selectedOptionId)?.name ?? humanOverride.selectedOptionId : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!onRecordOverride || rationale.trim().length === 0) return;
    setStatus("saving");
    setError(null);
    const result = await onRecordOverride(selectedOptionId, rationale.trim());
    if (result.ok) {
      setEditing(false);
      setStatus("idle");
    } else {
      setStatus("error");
      setError(result.error ?? "The final decision could not be recorded.");
    }
  }

  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <SectionLabel>Human decision</SectionLabel>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-nova-ink-faint uppercase">Engine recommendation</p>
          <p className="mt-1 font-medium text-nova-ink">{engineResult.recommendedOption.name}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-nova-ink-faint uppercase">Final human decision</p>
          {humanOverride ? (
            <p className={`mt-1 font-medium ${confirmsEngine ? "text-nova-ink" : "text-nova-gold"}`}>{selectedOptionName}</p>
          ) : (
            <p className="mt-1 text-nova-ink-faint">Not yet recorded</p>
          )}
        </div>
      </div>

      {humanOverride && (
        <div className="mt-3 border-t border-titanium pt-3">
          {confirmsEngine ? (
            <p className="flex items-center gap-2 text-sm text-nova-success">
              <CheckCircle2 size={15} />
              Human decision confirms engine recommendation.
            </p>
          ) : (
            <p className="text-sm text-nova-ink-muted">
              The human decision differs from the engine&apos;s recommendation. Reason: <span className="text-nova-ink">{humanOverride.rationale}</span>
            </p>
          )}
          {confirmsEngine && humanOverride.rationale && <p className="mt-1 text-sm text-nova-ink-muted">{humanOverride.rationale}</p>}
        </div>
      )}

      {onRecordOverride && (
        <div className="mt-4 border-t border-titanium pt-4">
          {!editing ? (
            <Button type="button" variant="outline" onClick={() => setEditing(true)} className="h-9 border-titanium bg-carbon-2 text-xs text-nova-ink hover:border-titanium-strong">
              {humanOverride ? "Update final decision" : "Record final decision"}
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="human-decision-option" className="text-xs font-medium text-nova-ink">
                  Selected option
                </label>
                <select
                  id="human-decision-option"
                  value={selectedOptionId}
                  onChange={(event) => setSelectedOptionId(event.target.value)}
                  className="h-10 rounded-xl border border-titanium bg-carbon-2 px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent"
                >
                  {engineResult.ranking.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="human-decision-rationale" className="text-xs font-medium text-nova-ink">
                  Rationale
                </label>
                <textarea
                  id="human-decision-rationale"
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                  required
                  rows={3}
                  placeholder="Why this option — or why the engine's recommendation was overridden."
                  className="rounded-xl border border-titanium bg-carbon-2 px-3 py-2 text-sm text-nova-ink outline-none focus-visible:border-nova-accent"
                />
              </div>
              {status === "error" && error && (
                <p role="alert" className="text-xs text-red-400">
                  {error}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={status === "saving" || rationale.trim().length === 0} className="h-9 bg-nova-accent text-xs text-white hover:bg-nova-accent-strong">
                  {status === "saving" && <LoaderCircle size={13} className="animate-spin" />}
                  Save final decision
                </Button>
                <button type="button" onClick={() => setEditing(false)} className="text-xs font-medium text-nova-ink-faint hover:text-nova-ink">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
