/**
 * Source Freshness (brief §16) — a documented heuristic, not one
 * universal threshold for every source type. `publishedAt` is almost
 * never available from a hosted web-search citation (OpenAI's
 * URLCitation gives a URL and title, not a publish date) — UNKNOWN is
 * the honest, correct answer then, never a guess.
 *
 * When a publish date IS known (e.g. a release-notes page with a
 * dated heading the extraction step captured), technology product
 * documentation ages faster than, say, a standards document, so the
 * cutoffs are keyed by a coarse source-type family rather than one
 * fixed number for everything.
 */
import type { SourceType } from "./types";

export type FreshnessCategory = "current" | "aging" | "stale" | "unknown";

const FAST_MOVING: SourceType[] = ["official-release-notes", "official-pricing-licensing"];
const SLOW_MOVING: SourceType[] = ["standards-body"];

const FAST_MOVING_CURRENT_DAYS = 180;
const FAST_MOVING_AGING_DAYS = 365;
const DEFAULT_CURRENT_DAYS = 365;
const DEFAULT_AGING_DAYS = 730;
const SLOW_MOVING_CURRENT_DAYS = 730;
const SLOW_MOVING_AGING_DAYS = 1460;

function thresholdsFor(sourceType: SourceType): { current: number; aging: number } {
  if (FAST_MOVING.includes(sourceType)) return { current: FAST_MOVING_CURRENT_DAYS, aging: FAST_MOVING_AGING_DAYS };
  if (SLOW_MOVING.includes(sourceType)) return { current: SLOW_MOVING_CURRENT_DAYS, aging: SLOW_MOVING_AGING_DAYS };
  return { current: DEFAULT_CURRENT_DAYS, aging: DEFAULT_AGING_DAYS };
}

export function classifyFreshness(publishedAt: string | null, sourceType: SourceType, now: Date = new Date()): FreshnessCategory {
  if (!publishedAt) return "unknown";

  const published = new Date(publishedAt);
  if (!Number.isFinite(published.getTime())) return "unknown";

  const ageDays = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < 0) return "unknown";

  const { current, aging } = thresholdsFor(sourceType);
  if (ageDays <= current) return "current";
  if (ageDays <= aging) return "aging";
  return "stale";
}
