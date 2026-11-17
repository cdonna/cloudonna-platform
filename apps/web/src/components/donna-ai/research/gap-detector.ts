/**
 * Evidence Gap Detector (brief §13/§14) — deterministic rules only, no
 * AI, no invented certainty. For every option x criterion cell:
 *
 *  CONFLICTED — an OPEN research_conflicts row touches this cell.
 *               Checked first: a conflict is never silently hidden
 *               behind a SUPPORTED/WEAK label.
 *  MISSING    — zero evidence of any kind (the engine's own
 *               deterministic positive/negative dimension evidence,
 *               plus any ACCEPTED research evidence) touches this cell.
 *  WEAK       — at least one item, but no ACCEPTED official-source
 *               research evidence and fewer than two items total.
 *  SUPPORTED  — everything else: either an accepted official-source
 *               item exists, or at least two independent items do.
 *
 * These cutoffs (0 / <2 without an official source / >=2 or an
 * official source) are fixed and documented here, the only place they
 * are allowed to live — never re-derived per call.
 */
import type { RankedPlatform } from "../scoring/types";
import type { ScoreDimensionKey } from "../types";
import type { GapCell, GapStatus, ResearchEvidence } from "./types";

export interface ConflictedCell {
  criterionId: ScoreDimensionKey;
  optionId: string;
}

function dimensionEvidenceCount(platform: RankedPlatform, criterionId: ScoreDimensionKey): number {
  const dimension = platform.dimensions.find((d) => d.key === criterionId);
  if (!dimension) return 0;
  return dimension.positiveEvidence.length + dimension.negativeEvidence.length;
}

function hasAcceptedOfficialSource(evidence: ResearchEvidence[], optionId: string, criterionId: ScoreDimensionKey): boolean {
  return evidence.some((e) => e.status === "accepted" && e.type === "official-source" && e.optionId === optionId && e.criterionId === criterionId);
}

function acceptedCount(evidence: ResearchEvidence[], optionId: string, criterionId: ScoreDimensionKey): number {
  return evidence.filter((e) => e.status === "accepted" && e.optionId === optionId && e.criterionId === criterionId).length;
}

function cellStatus(
  platform: RankedPlatform,
  criterionId: ScoreDimensionKey,
  acceptedResearchEvidence: ResearchEvidence[],
  conflictedCells: ConflictedCell[],
): GapStatus {
  const isConflicted = conflictedCells.some((c) => c.optionId === platform.platform.id && c.criterionId === criterionId);
  if (isConflicted) return "conflicted";

  const engineCount = dimensionEvidenceCount(platform, criterionId);
  const researchCount = acceptedCount(acceptedResearchEvidence, platform.platform.id, criterionId);
  const total = engineCount + researchCount;

  if (total === 0) return "missing";
  if (hasAcceptedOfficialSource(acceptedResearchEvidence, platform.platform.id, criterionId) || total >= 2) return "supported";
  return "weak";
}

export function detectEvidenceGaps(
  ranked: RankedPlatform[],
  acceptedResearchEvidence: ResearchEvidence[],
  conflictedCells: ConflictedCell[] = [],
): GapCell[] {
  const cells: GapCell[] = [];
  for (const platform of ranked) {
    for (const dimension of platform.dimensions) {
      cells.push({
        criterionId: dimension.key,
        optionId: platform.platform.id,
        status: cellStatus(platform, dimension.key, acceptedResearchEvidence, conflictedCells),
      });
    }
  }
  return cells;
}
