/**
 * Constraint Engine (brief §9) — hard eligibility, kept structurally
 * separate from the weighted scoring engine (scoring/engine.ts).
 *
 * The existing scoring engine already treats `preferredVendor` and
 * `preferredCloud` as *soft* signals folded into weighted dimension
 * scores (architectureFit's trait matching) — a platform that fails a
 * stated hard preference still scores reasonably well there, just a
 * few points lower. That is correct behavior for a genuine preference,
 * but the brief's own examples ("Must support Azure", "Must avoid a
 * prohibited vendor") are not preferences, they're gates: an option
 * that fails one should never quietly rank #1 with the violation
 * buried three tabs deep in evidence text.
 *
 * This module does not change what the scoring engine does with these
 * two fields — it adds a second, independent read of the same two
 * inputs, surfaced as an explicit PASS/FAIL/UNKNOWN per constraint and
 * an overall eligibility per platform. Nothing here changes
 * `overallScore` or `dimensions`; eligibility is reported alongside the
 * score, never multiplied into it.
 */
import type { VendorPlatformProfile } from "../vendor-intelligence/types";
import type { ConstraintsInput } from "../types";

export type ConstraintStatus = "PASS" | "FAIL" | "UNKNOWN";
export type Eligibility = "eligible" | "conditionally_eligible" | "ineligible";

export interface ConstraintEvaluation {
  id: string;
  label: string;
  status: ConstraintStatus;
  /** Why this status — always traceable to the actual input/platform
   * field compared, never a generic sentence. */
  explanation: string;
}

const VENDOR_MATCH: Record<Exclude<ConstraintsInput["preferredVendor"], null | "no-preference">, (vendor: string) => boolean> = {
  sap: (vendor) => vendor.toLowerCase().includes("sap"),
  microsoft: (vendor) => vendor.toLowerCase().includes("microsoft"),
};

function evaluateVendorConstraint(constraints: ConstraintsInput, platform: VendorPlatformProfile): ConstraintEvaluation {
  const id = "preferred-vendor";
  const label = "Preferred vendor";

  if (constraints.preferredVendor === null) {
    return { id, label, status: "UNKNOWN", explanation: "No vendor preference was stated." };
  }
  if (constraints.preferredVendor === "no-preference") {
    return { id, label, status: "PASS", explanation: "No vendor preference was stated as a requirement." };
  }

  const matches = VENDOR_MATCH[constraints.preferredVendor](platform.vendor);
  return matches
    ? { id, label, status: "PASS", explanation: `${platform.vendor} matches the stated vendor preference.` }
    : { id, label, status: "FAIL", explanation: `${platform.vendor} does not match the stated vendor requirement.` };
}

function evaluateCloudConstraint(constraints: ConstraintsInput, platform: VendorPlatformProfile): ConstraintEvaluation {
  const id = "preferred-cloud";
  const label = "Preferred cloud";

  if (constraints.preferredCloud === null) {
    return { id, label, status: "UNKNOWN", explanation: "No cloud requirement was stated." };
  }
  if (constraints.preferredCloud === "no-preference") {
    return { id, label, status: "PASS", explanation: "No cloud requirement was stated." };
  }

  const supports = platform.supportedClouds.includes(constraints.preferredCloud);
  return supports
    ? { id, label, status: "PASS", explanation: `${platform.productName} is available on ${constraints.preferredCloud.toUpperCase()}.` }
    : { id, label, status: "FAIL", explanation: `${platform.productName} is not available on ${constraints.preferredCloud.toUpperCase()}.` };
}

export function evaluateConstraints(constraints: ConstraintsInput, platform: VendorPlatformProfile): ConstraintEvaluation[] {
  return [evaluateVendorConstraint(constraints, platform), evaluateCloudConstraint(constraints, platform)];
}

/**
 * Deterministic rollup: any FAIL makes an option ineligible outright
 * (never buried in a score). An UNKNOWN alone — nothing failed, but not
 * everything could be checked — makes it conditionally eligible rather
 * than silently eligible, so the UI has something honest to say when a
 * required input is simply missing. Only PASS across the board is
 * unconditionally eligible.
 */
export function rollupEligibility(evaluations: ConstraintEvaluation[]): Eligibility {
  if (evaluations.some((e) => e.status === "FAIL")) return "ineligible";
  if (evaluations.some((e) => e.status === "UNKNOWN")) return "conditionally_eligible";
  return "eligible";
}
