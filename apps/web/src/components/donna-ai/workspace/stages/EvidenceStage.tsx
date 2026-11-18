"use client";

/**
 * Evidence stage (brief §15-§18) — consolidates Research Agent
 * evidence/conflicts, Vendor Intelligence claims, and vendor-knowledge
 * changes that may affect this decision (decision_impacts, brief
 * §84), reusing ResearchPanel/VendorKnowledgePanel/EvidenceExplorer
 * exactly as they already exist elsewhere in the product — nothing
 * here recomputes evidence state.
 */
import { SectionLabel } from "../../shared";
import { ResearchPanel } from "../../ResultPanel/ResearchPanel";
import { VendorKnowledgePanel } from "../../ResultPanel/VendorKnowledgePanel";
import { EvidenceExplorer } from "../../ResultPanel/EvidenceExplorer";
import { SCORE_DIMENSION_LABELS } from "../../scoring/weights";
import type { RankedPlatform } from "../../scoring/types";
import type { EngineEvidence, EvidenceDiagnostics } from "../../engine/evidence";
import type { ResearchEvidence } from "../../research/types";
import type { DecisionImpact } from "../../vendor-intelligence/evidence-graph/types";

const MATERIALITY_STYLES: Record<DecisionImpact["materiality"], string> = {
  high: "border-nova-warning/30 bg-nova-warning/10 text-nova-warning",
  medium: "border-titanium bg-carbon-2 text-nova-ink-muted",
  low: "border-titanium bg-carbon-2 text-nova-ink-faint",
};

interface ResearchConflictRow {
  id: string;
  claimAEvidenceId: string;
  claimBEvidenceId: string;
  severity: "low" | "medium" | "high";
  explanation: string;
  status: "open" | "resolved" | "dismissed";
}

export function EvidenceStage({
  decisionId,
  ranked,
  evidence,
  evidenceDiagnostics,
  researchEvidence,
  researchConflicts,
  decisionImpacts,
  editable,
}: {
  decisionId: string;
  ranked: RankedPlatform[];
  evidence: EngineEvidence[];
  evidenceDiagnostics: EvidenceDiagnostics;
  researchEvidence: ResearchEvidence[];
  researchConflicts: ResearchConflictRow[];
  decisionImpacts: DecisionImpact[];
  editable: boolean;
}) {
  return (
    <div className="space-y-6">
      {decisionImpacts.length > 0 && (
        <div className="rounded-2xl border border-titanium bg-carbon p-5">
          <SectionLabel>Vendor knowledge changes affecting this decision</SectionLabel>
          <div className="mt-3 space-y-2">
            {decisionImpacts.map((impact) => (
              <div key={impact.id} className={`rounded-xl border p-3 text-sm ${MATERIALITY_STYLES[impact.materiality]}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{impact.affectedOption}</span>
                  <span className="font-mono text-[0.625rem] font-semibold uppercase">{impact.materiality}</span>
                </div>
                <p className="mt-1 leading-6">{impact.recommendationImpact}</p>
                {impact.reviewRecommended && <p className="mt-1 text-xs font-medium">Review recommended.</p>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-nova-ink-faint">A human still decides whether this decision needs reopening — nothing here changes the recommendation automatically.</p>
        </div>
      )}

      <ResearchPanel decisionId={decisionId} ranked={ranked} initialEvidence={researchEvidence} initialConflicts={researchConflicts} editable={editable} />
      <VendorKnowledgePanel decisionId={decisionId} baseRanked={ranked} />
      <EvidenceExplorer evidence={evidence} diagnostics={evidenceDiagnostics} dimensionLabels={SCORE_DIMENSION_LABELS} />
    </div>
  );
}
