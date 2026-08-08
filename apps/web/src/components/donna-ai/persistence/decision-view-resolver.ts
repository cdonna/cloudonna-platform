/**
 * Pure decision-view resolution logic, extracted from
 * app/app/decisions/[id]/page.tsx (Sprint 6.2, Slice A) so it is
 * directly unit-testable instead of only reachable through the page's
 * own rendered output. Nothing here performs I/O — every function takes
 * already-fetched data or already-known facts (version numbers, search
 * params) and returns a plan or a result. The page's only remaining job
 * is to follow the plan this module produces: fetch what it says to
 * fetch, render what it says to render. See
 * docs/capabilities/decision-memory.md, "Slice A."
 */
import { diffDecisionVersions, type VersionDiff, type VersionSnapshot } from "./version-diff";
import { explainScoreChange, type ScoreChangeExplanation } from "./score-explanation";
import type { DecisionVersionContent } from "./decisions-repository";
import type { DecisionInput, DecisionReport } from "../intelligence/types";

/** `undefined`/invalid input → null, never NaN — every caller treats
 * null as "no version requested," falling back to the current version. */
export function parseVersionParam(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export interface DecisionViewPlan {
  /** Which version number should be shown as the main content. */
  displayedVersionNumber: number;
  /** True when displayedVersionNumber differs from the decision's
   * current version and must be fetched separately — false means the
   * caller can reuse the already-fetched current-version content. */
  needsDisplayFetch: boolean;
  /** Set only when a valid, known version distinct from the displayed
   * one was requested for comparison; null otherwise. */
  compareVersionNumber: number | null;
}

/** Decides what to fetch and display — never fetches anything itself. A
 * requested version number is only ever honored if it's a known version
 * of this decision; an unknown, malformed, or not-found request falls
 * back to the current version silently, exactly as a caller navigating
 * with a stale or guessed URL should expect. */
export function resolveDecisionViewPlan(input: {
  requestedVersion: number | null;
  compareVersion: number | null;
  knownVersionNumbers: readonly number[];
  currentVersionNumber: number;
}): DecisionViewPlan {
  const { requestedVersion, compareVersion, knownVersionNumbers, currentVersionNumber } = input;

  const isKnownDisplayVersion = requestedVersion !== null && knownVersionNumbers.includes(requestedVersion);
  const displayedVersionNumber = isKnownDisplayVersion ? (requestedVersion as number) : currentVersionNumber;

  const isKnownCompareVersion =
    compareVersion !== null && compareVersion !== displayedVersionNumber && knownVersionNumbers.includes(compareVersion);

  return {
    displayedVersionNumber,
    needsDisplayFetch: displayedVersionNumber !== currentVersionNumber,
    compareVersionNumber: isKnownCompareVersion ? compareVersion : null,
  };
}

/** True when the displayed version is not the decision's current one —
 * i.e. the page is showing a historical version, not live/current
 * content. Deliberately never named "replay": nothing in this module
 * or its caller re-executes the deterministic engine, it only
 * redisplays stored history exactly as saved. Real Decision Replay
 * (re-running buildDecisionOutput against a historical input) is a
 * separate, not-yet-built capability — see
 * docs/capabilities/decision-memory.md, "Known limitations." */
export function isHistoricalVersionView(displayedVersionNumber: number, currentVersionNumber: number): boolean {
  return displayedVersionNumber !== currentVersionNumber;
}

export interface VersionComparison {
  diff: VersionDiff;
  explanation: ScoreChangeExplanation;
}

/** Always diffs older → newer, regardless of which side the caller
 * fetched first, so the resulting reasons/labels read naturally
 * either way. */
export function buildOrderedComparison(a: VersionSnapshot, b: VersionSnapshot): VersionComparison {
  const [older, newer] = a.versionNumber < b.versionNumber ? [a, b] : [b, a];
  const diff = diffDecisionVersions(older, newer);
  return { diff, explanation: explainScoreChange(diff) };
}

// Stored decision_input_json was validated by the exact same Zod
// schemas at save time (save-decision-schema.ts), before ever reaching
// the database — the same justification the existing `as` casts on
// enrichment/provider/fallback below already rely on.
export function toVersionSnapshot(content: DecisionVersionContent): VersionSnapshot {
  return {
    versionNumber: content.versionNumber,
    decisionInput: content.decisionInput as DecisionInput,
    output: content.deterministicOutput,
    provenance: {
      schemaVersion: content.schemaVersion,
      scoringEngineVersion: content.scoringEngineVersion,
      knowledgeBaseVersion: content.knowledgeBaseVersion,
    },
  };
}

export function toDecisionReport(content: DecisionVersionContent): DecisionReport {
  return {
    output: content.deterministicOutput,
    enrichment: content.enrichment as DecisionReport["enrichment"],
    provider: content.provider as DecisionReport["provider"],
    fallback: content.fallback as DecisionReport["fallback"],
    generatedAt: content.generatedAt,
  };
}
