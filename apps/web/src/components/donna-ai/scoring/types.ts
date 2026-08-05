import type { VendorPlatformProfile } from "../vendor-intelligence/types";

export type ScoreDimensionKey =
  | "architecture"
  | "business"
  | "technology"
  | "governance"
  | "aiReadiness"
  | "security"
  | "ecosystem"
  | "cost"
  | "timeToValue"
  | "strategic";

export interface DimensionResult {
  key: ScoreDimensionKey;
  label: string;
  /** 0-100. Never fabricated precision — always derived from the formulas in scoring/engine.ts. */
  score: number;
  /** The weight applied to this dimension in the overall score, surfaced for transparency. */
  weight: number;
  positiveEvidence: string[];
  negativeEvidence: string[];
}

export interface RankedPlatform {
  platform: VendorPlatformProfile;
  /** 0-100 weighted composite of all ten dimensions. */
  overallScore: number;
  dimensions: DimensionResult[];
}

export interface EvidenceItem {
  dimension: ScoreDimensionKey;
  text: string;
}
