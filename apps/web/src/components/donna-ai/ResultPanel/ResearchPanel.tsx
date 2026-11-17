"use client";

import { useState } from "react";
import { AlertTriangle, Check, ExternalLink, LoaderCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "../shared";
import { detectEvidenceGaps } from "../research/gap-detector";
import { SCORE_DIMENSION_LABELS } from "../scoring/weights";
import type { RankedPlatform } from "../scoring/types";
import type { ScoreDimensionKey } from "../types";
import type { GapCell, GapStatus, ResearchEvidence } from "../research/types";

const GAP_LABEL: Record<GapStatus, string> = { supported: "Supported", weak: "Weak", missing: "Missing", conflicted: "Conflicted" };
const GAP_STYLE: Record<GapStatus, string> = {
  supported: "bg-nova-success/15 text-nova-success",
  weak: "bg-nova-warning/15 text-nova-warning",
  missing: "bg-carbon-2 text-nova-ink-faint",
  conflicted: "bg-red-400/15 text-red-400",
};

interface RunResponse {
  sessionId: string;
  status: string;
  sourcesFound: number;
  evidenceProposed: number;
  conflictsFound: number;
  stopReason: string | null;
  newEvidence: ResearchEvidence[];
}

interface ConflictRow {
  id: string;
  claimAEvidenceId: string;
  claimBEvidenceId: string;
  severity: "low" | "medium" | "high";
  explanation: string;
  status: "open" | "resolved" | "dismissed";
}

/**
 * Research / Evidence Intelligence area of the Decision Command Center
 * (brief §25/§26). Not a separate product: it reads the same `ranked`
 * platforms and renders inside the same DecisionCommandCenter shell as
 * Constraints/Scenario/Evidence/Risk. Every status shown (running,
 * proposed count, stop reason) is real session state from
 * /api/research/run — never a decorative progress bar.
 */
export function ResearchPanel({
  decisionId,
  ranked,
  initialEvidence,
  initialConflicts,
  editable,
}: {
  decisionId: string;
  ranked: RankedPlatform[];
  initialEvidence: ResearchEvidence[];
  initialConflicts: ConflictRow[];
  editable: boolean;
}) {
  const [evidence, setEvidence] = useState<ResearchEvidence[]>(initialEvidence);
  const [conflicts] = useState<ConflictRow[]>(initialConflicts);
  const [running, setRunning] = useState<{ criterionId?: ScoreDimensionKey; optionId?: string } | null>(null);
  const [lastRun, setLastRun] = useState<RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const accepted = evidence.filter((e) => e.status === "accepted");
  const proposed = evidence.filter((e) => e.status === "proposed");
  const openConflicts = conflicts.filter((c) => c.status === "open");
  const conflictedCells = openConflicts.map((c) => {
    const a = evidence.find((e) => e.id === c.claimAEvidenceId);
    return { criterionId: a?.criterionId as ScoreDimensionKey, optionId: a?.optionId as string };
  });

  // Not memoized: detectEvidenceGaps is a cheap pure function over
  // already-in-memory arrays (10 dimensions x a handful of options),
  // and conflictedCells is recomputed fresh every render anyway, so a
  // useMemo here would never actually skip the recomputation.
  const gaps: GapCell[] = detectEvidenceGaps(ranked, accepted, conflictedCells);
  const gapByKey = new Map(gaps.map((g) => [`${g.optionId}:${g.criterionId}`, g]));
  const criteria = Object.keys(SCORE_DIMENSION_LABELS) as ScoreDimensionKey[];

  async function runResearch(scope: { criterionId?: ScoreDimensionKey; optionId?: string }) {
    setRunning(scope);
    setError(null);
    try {
      const response = await fetch("/api/research/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionId, ...scope }),
      });
      const data: RunResponse | { error: string } = await response.json();
      if (!response.ok || !("sessionId" in data)) {
        setError("error" in data ? data.error : "The research run could not be processed.");
        return;
      }
      setLastRun(data);
      setEvidence((current) => [...current, ...data.newEvidence]);
    } catch {
      setError("The research run could not be processed. Check your connection and try again.");
    } finally {
      setRunning(null);
    }
  }

  async function decide(evidenceId: string, decision: "accept" | "reject") {
    setDecidingId(evidenceId);
    try {
      const response = await fetch(`/api/research/evidence/${evidenceId}/${decision}`, { method: "POST" });
      if (!response.ok) return;
      setEvidence((current) => current.map((e) => (e.id === evidenceId ? { ...e, status: decision === "accept" ? "accepted" : "rejected" } : e)));
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-titanium bg-carbon p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionLabel>Evidence coverage matrix</SectionLabel>
          {editable && (
            <Button type="button" onClick={() => runResearch({})} disabled={running !== null} className="h-9 bg-nova-accent text-xs text-white hover:bg-nova-accent-strong">
              {running && !running.criterionId && !running.optionId ? <LoaderCircle size={13} className="animate-spin" /> : <Search size={13} />}
              Run Research
            </Button>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-titanium">
                <th scope="col" className="py-2 pr-4 font-medium text-nova-ink-faint">
                  Criterion
                </th>
                {ranked.map((r) => (
                  <th key={r.platform.id} scope="col" className="py-2 pr-4 font-medium text-nova-ink-faint">
                    {r.platform.productName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((criterionId) => (
                <tr key={criterionId} className="border-b border-titanium/60 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-nova-ink">{SCORE_DIMENSION_LABELS[criterionId]}</td>
                  {ranked.map((r) => {
                    const cell = gapByKey.get(`${r.platform.id}:${criterionId}`);
                    const status = cell?.status ?? "missing";
                    const isRunningThis = running?.criterionId === criterionId && running?.optionId === r.platform.id;
                    return (
                      <td key={r.platform.id} className="py-2.5 pr-4">
                        <button
                          type="button"
                          disabled={!editable || status === "supported" || running !== null}
                          onClick={() => runResearch({ criterionId, optionId: r.platform.id })}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition duration-150 ${GAP_STYLE[status]} ${
                            editable && status !== "supported" ? "cursor-pointer hover:brightness-110" : "cursor-default"
                          }`}
                          title={editable && status !== "supported" ? "Research this option/criterion" : undefined}
                        >
                          {isRunningThis && <LoaderCircle size={11} className="animate-spin" />}
                          {GAP_LABEL[status]}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {lastRun && (
          <p className="mt-3 text-xs leading-5 text-nova-ink-muted">
            Last run: {lastRun.status} · {lastRun.sourcesFound} source(s) found · {lastRun.evidenceProposed} evidence item(s) proposed · {lastRun.conflictsFound} conflict(s)
            {lastRun.stopReason ? ` · stopped: ${lastRun.stopReason.replace(/_/g, " ")}` : ""}
          </p>
        )}
      </div>

      {openConflicts.length > 0 && (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-5">
          <SectionLabel>Conflicts</SectionLabel>
          <div className="mt-3 space-y-3">
            {openConflicts.map((c) => (
              <div key={c.id} className="flex items-start gap-3 text-sm leading-6 text-nova-ink-muted">
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-400" />
                <span>{c.explanation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {proposed.length > 0 && (
        <div className="rounded-2xl border border-titanium bg-carbon p-5">
          <SectionLabel>Proposed evidence</SectionLabel>
          <div className="mt-4 space-y-4">
            {proposed.map((item) => (
              <EvidenceRow key={item.id} item={item} onAccept={() => decide(item.id, "accept")} onReject={() => decide(item.id, "reject")} busy={decidingId === item.id} editable={editable} />
            ))}
          </div>
        </div>
      )}

      {accepted.length > 0 && (
        <div className="rounded-2xl border border-titanium bg-carbon p-5">
          <SectionLabel>Accepted evidence</SectionLabel>
          <div className="mt-4 space-y-4">
            {accepted.map((item) => (
              <EvidenceRow key={item.id} item={item} editable={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = {
  "official-source": "Official source",
  "ai-interpretation": "AI interpretation",
  "observed-data": "Observed data",
};

function EvidenceRow({
  item,
  onAccept,
  onReject,
  busy,
  editable,
}: {
  item: ResearchEvidence;
  onAccept?: () => void;
  onReject?: () => void;
  busy?: boolean;
  editable: boolean;
}) {
  return (
    <div className="rounded-xl border border-titanium bg-carbon-2 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ${item.type === "ai-interpretation" ? "border border-dashed border-titanium-strong text-nova-ink-faint" : "bg-nova-accent/15 text-nova-accent-strong"}`}>
          {TYPE_LABEL[item.type] ?? item.type}
        </span>
        <span className="text-nova-ink-faint">confidence: {item.confidence}</span>
        <span className="text-nova-ink-faint">freshness: {item.freshness}</span>
        {item.criterionId && <span className="text-nova-ink-faint">{SCORE_DIMENSION_LABELS[item.criterionId]}</span>}
      </div>
      <p className="mt-2 text-sm leading-6 text-nova-ink">{item.claim}</p>
      {item.interpretation && <p className="mt-1 text-sm leading-6 text-nova-ink-faint italic">{item.interpretation}</p>}
      {item.sourceUrl && (
        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-nova-accent-strong hover:underline">
          {item.sourceTitle ?? item.sourceUrl}
          <ExternalLink size={11} />
        </a>
      )}
      {item.publisher && <span className="ml-2 text-xs text-nova-ink-faint">{item.publisher}</span>}

      {editable && onAccept && onReject && (
        <div className="mt-3 flex items-center gap-2">
          <Button type="button" onClick={onAccept} disabled={busy} className="h-8 bg-nova-success/90 text-xs text-white hover:bg-nova-success">
            {busy ? <LoaderCircle size={12} className="animate-spin" /> : <Check size={12} />}
            Accept
          </Button>
          <Button type="button" variant="outline" onClick={onReject} disabled={busy} className="h-8 border-titanium bg-carbon text-xs text-nova-ink hover:border-titanium-strong">
            <X size={12} />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
