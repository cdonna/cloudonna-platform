"use client";

import { useState } from "react";
import { AlertTriangle, LoaderCircle, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "../shared";
import type { ChallengeSeverity, DecisionChallenge } from "../engine/challenger/types";

const TYPE_LABEL: Record<DecisionChallenge["type"], string> = {
  ASSUMPTION_CHALLENGE: "Assumption",
  EVIDENCE_CHALLENGE: "Evidence",
  FINANCIAL_CHALLENGE: "Financial",
  ARCHITECTURE_CHALLENGE: "Architecture",
  RISK_CHALLENGE: "Risk",
  ALTERNATIVE_CHALLENGE: "Alternative",
  CONSTRAINT_CHALLENGE: "Constraint",
};

const SEVERITY_STYLE: Record<ChallengeSeverity, string> = {
  high: "border-red-400/30 bg-red-400/10 text-red-400",
  medium: "border-nova-warning/30 bg-nova-warning/10 text-nova-warning",
  low: "border-titanium bg-carbon-2 text-nova-ink-faint",
};

/**
 * Challenger Agent V1 UI (brief §12-§14). "Challenge Recommendation"
 * is a deliberate action, not a background process — the founder's
 * instruction (brief §13) that the challenger never runs silently or
 * alters a score is reflected here by making it something a reader
 * explicitly asks for, reads, and can dismiss nothing from (there is
 * no accept/reject action — see Known Limitations, docs/capabilities/
 * decision-model-and-business-case-engine.md §P). Every challenge
 * rendered below is exactly what `/api/challenger/run` returned —
 * nothing here is generated client-side.
 */
export function ChallengerPanel({ decisionId }: { decisionId: string }) {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [challenges, setChallenges] = useState<DecisionChallenge[]>([]);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setState("running");
    setError(null);
    try {
      const response = await fetch("/api/challenger/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionId }),
      });
      const data: { challenges?: DecisionChallenge[]; aiStatus?: string; error?: string } = await response.json();
      if (!response.ok) {
        setState("error");
        setError(data.error ?? "The recommendation could not be challenged right now.");
        return;
      }
      setChallenges(data.challenges ?? []);
      setAiStatus(data.aiStatus ?? null);
      setState("done");
    } catch {
      setState("error");
      setError("The request could not be processed. Check your connection and try again.");
    }
  }

  const bySeverity = { high: 0, medium: 0, low: 0 } as Record<ChallengeSeverity, number>;
  for (const c of challenges) bySeverity[c.severity] += 1;

  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel>Challenge this recommendation</SectionLabel>
        <Button
          type="button"
          onClick={() => void run()}
          disabled={state === "running"}
          className="h-9 bg-nova-accent text-xs text-white hover:bg-nova-accent-strong"
        >
          {state === "running" ? <LoaderCircle size={13} className="animate-spin" /> : <ShieldQuestion size={13} />}
          {state === "done" ? "Re-run challenge" : "Challenge recommendation"}
        </Button>
      </div>
      <p className="mt-2 text-sm leading-6 text-nova-ink-muted">
        Surfaces fragile assumptions, the weakest supporting evidence, and what could flip this recommendation — it never
        changes the score itself.
      </p>

      {state === "error" && error && (
        <p role="alert" className="mt-3 text-xs text-red-400">
          {error}
        </p>
      )}

      {state === "done" && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-4 text-xs text-nova-ink-faint">
            <span>{challenges.length} challenge{challenges.length === 1 ? "" : "s"}</span>
            {bySeverity.high > 0 && <span className="text-red-400">{bySeverity.high} high severity</span>}
            {aiStatus && aiStatus !== "ok" && <span>AI-assisted challenges unavailable this run ({aiStatus})</span>}
          </div>

          {challenges.length === 0 ? (
            <p className="text-sm text-nova-ink-faint">No challenges were found for this recommendation.</p>
          ) : (
            <ul className="space-y-2">
              {challenges.map((challenge) => (
                <li key={challenge.id} className="rounded-xl border border-titanium bg-carbon-2 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLE[challenge.severity]}`}>
                      {challenge.severity === "high" && <AlertTriangle size={11} />}
                      {challenge.severity}
                    </span>
                    <span className="text-xs font-medium tracking-wide text-nova-ink-faint uppercase">{TYPE_LABEL[challenge.type]}</span>
                    <span className="ml-auto text-[10px] text-nova-ink-faint">{challenge.source === "deterministic" ? "Calculated" : "AI-assisted"}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-nova-ink">{challenge.statement}</p>
                  <p className="mt-1.5 text-xs leading-5 text-nova-ink-faint">Suggested validation: {challenge.suggestedValidation}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
