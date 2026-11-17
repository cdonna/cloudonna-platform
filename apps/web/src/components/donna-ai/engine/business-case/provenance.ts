/**
 * Financial Confidence (brief §10) — "financial confidence must be
 * derived from evidence coverage," never set by an LLM. Deterministic
 * rollup over every cost/benefit line item's own provenance tag —
 * the same HIGH/MEDIUM/LOW-with-reasons discipline as
 * engine/confidence.ts and engine/source-confidence.ts.
 */
import type { BusinessCaseOptionInput, FinancialProvenance } from "./types";

const TRUSTWORTHY: FinancialProvenance[] = ["official-source", "customer-input", "observed-data", "calculated"];

export interface FinancialConfidenceResult {
  level: "high" | "medium" | "low";
  reasons: string[];
}

export function computeFinancialConfidence(input: BusinessCaseOptionInput): FinancialConfidenceResult {
  const items = [...input.costs, ...input.benefits];
  if (items.length === 0) {
    return { level: "low", reasons: ["No cost or benefit figures have been entered for this option yet."] };
  }

  const assumptionCount = items.filter((i) => i.provenance === "assumption").length;
  const interpretationCount = items.filter((i) => i.provenance === "ai-interpretation").length;
  const trustworthyCount = items.filter((i) => TRUSTWORTHY.includes(i.provenance)).length;

  const assumptionRatio = assumptionCount / items.length;
  const trustworthyRatio = trustworthyCount / items.length;

  const reasons: string[] = [];
  reasons.push(`${trustworthyCount} of ${items.length} financial figures are customer-provided, official-source, observed, or calculated.`);
  if (assumptionCount > 0) reasons.push(`${assumptionCount} figure(s) are unvalidated assumptions.`);
  if (interpretationCount > 0) reasons.push(`${interpretationCount} figure(s) are AI interpretations, not verified figures.`);

  let level: "high" | "medium" | "low";
  if (trustworthyRatio >= 0.75 && assumptionRatio <= 0.25) level = "high";
  else if (assumptionRatio >= 0.6) level = "low";
  else level = "medium";

  return { level, reasons };
}
