/**
 * Freshness Engine V2 (brief §14) — the same documented-heuristic
 * philosophy as research/freshness.ts (which this does not replace;
 * that module still governs decision-scoped research_evidence rows),
 * extended with:
 *  - a dedicated per-source-category threshold table reaching the full
 *    granularity brief §14 asks for (release notes/pricing fast,
 *    product documentation medium, standards slow), and
 *  - a genuinely different rule for security/compliance claims: a
 *    certification's freshness is about whether it has EXPIRED, not
 *    about how old the page describing it is. A five-year-old page
 *    citing a certification valid until 2030 is current; a one-month-
 *    old page citing a certification that expired last week is stale.
 *    Falls back to the age-based rule only when no expiry is known.
 */
import type { EvidenceSourceCategory } from "./types";

export type FreshnessCategory = "current" | "aging" | "stale" | "unknown";

const THRESHOLDS_DAYS: Record<EvidenceSourceCategory, { current: number; aging: number }> = {
  // Fast-moving: ages quickly — brief §14's own examples.
  official_release_notes: { current: 180, aging: 365 },
  official_pricing_licensing: { current: 180, aging: 365 },
  // Medium: product capability documentation.
  official_product_documentation: { current: 365, aging: 730 },
  official_vendor_documentation: { current: 365, aging: 730 },
  official_architecture: { current: 365, aging: 730 },
  // Security/compliance: age-based fallback only (see
  // classifyCertificationFreshness below for the real rule).
  official_security_compliance: { current: 365, aging: 730 },
  // Slow-moving.
  standards_body: { current: 730, aging: 1460 },
  independent_analysis: { current: 365, aging: 730 },
  unknown: { current: 365, aging: 730 },
};

export function classifyFreshnessByAge(publishedAt: string | null, sourceCategory: EvidenceSourceCategory, now: Date = new Date()): FreshnessCategory {
  if (!publishedAt) return "unknown";
  const published = new Date(publishedAt);
  if (!Number.isFinite(published.getTime())) return "unknown";

  const ageDays = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < 0) return "unknown";

  const { current, aging } = THRESHOLDS_DAYS[sourceCategory];
  if (ageDays <= current) return "current";
  if (ageDays <= aging) return "aging";
  return "stale";
}

/**
 * Certification-specific rule (brief §14's "security certification:
 * depends on certification validity"). `validUntil` is the
 * certification's own documented expiry, when the evidence actually
 * states one — never inferred or assumed. Without a known expiry,
 * this defers entirely to the age-based rule, because "we don't know
 * when it expires" is not the same claim as "we know it's still
 * valid."
 */
export function classifyCertificationFreshness(
  validUntil: string | null,
  publishedAt: string | null,
  now: Date = new Date(),
): FreshnessCategory {
  if (validUntil) {
    const expiry = new Date(validUntil);
    if (Number.isFinite(expiry.getTime())) {
      if (expiry.getTime() < now.getTime()) return "stale";
      const daysRemaining = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      // Within 90 days of expiry, a certification is "aging" — still
      // valid, but due for revalidation soon enough to flag.
      return daysRemaining <= 90 ? "aging" : "current";
    }
  }
  return classifyFreshnessByAge(publishedAt, "official_security_compliance", now);
}
