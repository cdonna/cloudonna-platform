/**
 * Research Agent V1 — domain types. Pure data shapes, no I/O, no SDK
 * dependency, same discipline as intelligence/types.ts. `criterionId`
 * and `optionId` are the Decision Engine's own identifier spaces
 * (ScoreDimensionKey and a vendor-intelligence catalog id) — never a
 * parallel "criterion"/"option" concept invented for research.
 */
import type { EvidenceType } from "@/components/showcase/EvidenceTag";
import type { ScoreDimensionKey } from "../types";

export const RESEARCH_AGENT_VERSION = "research-agent-v1";

export type ResearchPriority = "high" | "medium" | "low";

export interface ResearchTask {
  taskId: string;
  criterionId: ScoreDimensionKey | null;
  optionId: string | null;
  question: string;
  preferredSourceTypes: SourceType[];
  priority: ResearchPriority;
  /** Deterministic priority score used only to sort tasks — never
   * shown as a fabricated confidence number. See research/prioritization.ts. */
  priorityScore: number;
  reason: string;
}

export type SourceType =
  | "official-vendor-documentation"
  | "official-product-documentation"
  | "official-security-compliance"
  | "official-architecture"
  | "official-pricing-licensing"
  | "official-release-notes"
  | "standards-body"
  | "independent-analysis"
  | "unknown";

export interface SourceDocument {
  id: string;
  url: string;
  title: string;
  publisher: string;
  publishedAt: string | null;
  retrievedAt: string;
  sourceType: SourceType;
  /** Bounded — see research/schema.ts. Never the full document. */
  contentExcerpt: string;
  language: string | null;
  metadata: Record<string, unknown>;
}

export type ResearchConfidence = "high" | "medium" | "low";
export type FreshnessCategory = "current" | "aging" | "stale" | "unknown";
export type ResearchEvidenceStatus = "proposed" | "accepted" | "rejected";

export interface ProposedClaim {
  claim: string;
  /** Index into the RetrievalResult's citations array this claim is
   * grounded in — validated against the real citation list before
   * this claim is ever trusted (research/providers/openai-research-provider.ts). */
  citationIndex: number;
  type: Extract<EvidenceType, "official-source" | "ai-interpretation" | "observed-data">;
  /** Set only on an ai-interpretation claim — what the model infers
   * beyond what the source directly states. Never merged into `claim`
   * itself (brief §18). */
  interpretation: string | null;
  criterionId: ScoreDimensionKey | null;
  optionId: string | null;
  confidence: ResearchConfidence;
}

export interface ProposedConflict {
  claimIndexA: number;
  claimIndexB: number;
  severity: "low" | "medium" | "high";
  explanation: string;
}

export interface ResearchEvidence {
  id: string;
  type: EvidenceType;
  claim: string;
  interpretation: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  publisher: string | null;
  publishedAt: string | null;
  retrievedAt: string;
  criterionId: ScoreDimensionKey | null;
  optionId: string | null;
  confidence: ResearchConfidence;
  freshness: FreshnessCategory;
  researchTaskId: string;
  agentVersion: string;
  status: ResearchEvidenceStatus;
  metadata: Record<string, unknown>;
}

export interface EvidenceConflict {
  id: string;
  claimAEvidenceId: string;
  claimBEvidenceId: string;
  criterionId: ScoreDimensionKey | null;
  optionId: string | null;
  severity: "low" | "medium" | "high";
  explanation: string;
  status: "open" | "resolved" | "dismissed";
}

export type GapStatus = "supported" | "weak" | "missing" | "conflicted";

export interface GapCell {
  criterionId: ScoreDimensionKey;
  optionId: string;
  status: GapStatus;
}

export type RetrievalStatus = "ok" | "no_source_found" | "retrieval_failed" | "unsupported_source" | "parse_failed";

export type RetrievalResult =
  | { status: "ok"; claims: ProposedClaim[]; conflicts: ProposedConflict[]; sources: SourceDocument[] }
  | { status: Exclude<RetrievalStatus, "ok">; reason: string };

export type ResearchSessionStatus = "planned" | "running" | "completed" | "failed" | "partial";
export type StopReason =
  | "high_priority_gaps_covered"
  | "duplicate_ratio_high"
  | "max_task_count_reached"
  | "time_budget_reached"
  | "no_authoritative_sources_found"
  | "all_tasks_completed";

export interface ResearchSessionSummary {
  id: string;
  decisionId: string;
  status: ResearchSessionStatus;
  tasks: ResearchTask[];
  sourcesFound: number;
  evidenceProposed: number;
  conflictsFound: number;
  gapsRemaining: GapCell[];
  stopReason: StopReason | null;
  startedAt: string | null;
  completedAt: string | null;
}
