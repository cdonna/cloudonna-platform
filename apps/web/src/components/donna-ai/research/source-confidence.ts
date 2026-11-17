/**
 * Source Confidence (brief §19) — HIGH/MEDIUM/LOW with reasons, never
 * an invented percentage. Deterministic factors only: is it an
 * official source, how fresh is it, is there an open conflict on it,
 * and whether more than one independent accepted item corroborates
 * the same option/criterion cell.
 */
import type { FreshnessCategory, ResearchConfidence, ResearchEvidence } from "./types";

export interface SourceConfidenceResult {
  level: ResearchConfidence;
  reasons: string[];
}

export function computeSourceConfidence(
  evidence: Pick<ResearchEvidence, "type" | "freshness" | "optionId" | "criterionId">,
  hasOpenConflict: boolean,
  corroboratingAcceptedCount: number,
): SourceConfidenceResult {
  const reasons: string[] = [];
  let points = 0;

  if (evidence.type === "official-source") {
    points += 2;
    reasons.push("Drawn from an official source.");
  } else {
    reasons.push("Not an official source — AI interpretation of retrieved material.");
  }

  const freshnessPoints: Record<FreshnessCategory, number> = { current: 1, aging: 0, stale: -1, unknown: 0 };
  points += freshnessPoints[evidence.freshness];
  if (evidence.freshness === "stale") reasons.push("The source appears stale.");
  if (evidence.freshness === "current") reasons.push("The source is current.");

  if (corroboratingAcceptedCount > 0) {
    points += 1;
    reasons.push(`Corroborated by ${corroboratingAcceptedCount} other accepted item(s) for this option/criterion.`);
  }

  if (hasOpenConflict) {
    points -= 2;
    reasons.push("An open conflict exists for this claim.");
  }

  const level: ResearchConfidence = points >= 3 ? "high" : points >= 1 ? "medium" : "low";
  return { level, reasons };
}
