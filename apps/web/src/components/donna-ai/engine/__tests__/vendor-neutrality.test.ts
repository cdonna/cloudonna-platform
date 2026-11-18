import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { scoreAllPlatformsV2 } from "../../scoring/engine";
import { VENDOR_CATALOG } from "../../vendor-intelligence/catalog";
import { SAMPLE_PROFILE } from "../../data";
import type { WizardState } from "../../types";
import { computeMateriality, type MaterialityInput } from "../../vendor-intelligence/evidence-graph/materiality";
import { rankRevalidationQueue, type RevalidationCandidate } from "../../vendor-intelligence/evidence-graph/revalidation-queue";
import { detectCrossSessionConflicts, type ConflictCandidate } from "../../vendor-intelligence/evidence-graph/conflict-detection";
import { computeProductCoverage } from "../../vendor-intelligence/evidence-graph/coverage-metrics";
import type { CapabilityClaim } from "../../vendor-intelligence/evidence-graph/types";

/**
 * Vendor neutrality & eval regression suite (brief §20/§21).
 *
 * These are regression guards against THIS codebase introducing
 * vendor-name special-casing or array-position-dependent scoring —
 * not a statistical fairness audit against real-world outcome data,
 * which this product does not have. See
 * docs/capabilities/decision-model-and-business-case-engine.md §K.
 */

function clone(state: WizardState): WizardState {
  return JSON.parse(JSON.stringify(state)) as WizardState;
}

describe("Vendor neutrality — catalog order independence", () => {
  it("scores every platform identically regardless of VENDOR_CATALOG's array order", () => {
    const before = scoreAllPlatformsV2(SAMPLE_PROFILE);
    const beforeById = new Map(before.map((r) => [r.platform.id, r]));

    VENDOR_CATALOG.reverse();
    try {
      const after = scoreAllPlatformsV2(SAMPLE_PROFILE);
      expect(after).toHaveLength(before.length);
      for (const result of after) {
        const originalResult = beforeById.get(result.platform.id);
        expect(originalResult).toBeDefined();
        expect(result.overallScore).toBe(originalResult!.overallScore);
        expect(result.dimensions).toEqual(originalResult!.dimensions);
      }
    } finally {
      // Restore the real catalog order — this array is a shared module
      // singleton and other test files read it.
      VENDOR_CATALOG.reverse();
    }
  });

  it("is a pure function of (state, platform) — identical input produces identical output across repeated calls", () => {
    const a = scoreAllPlatformsV2(SAMPLE_PROFILE);
    const b = scoreAllPlatformsV2(SAMPLE_PROFILE);
    expect(a).toEqual(b);
  });
});

describe("Vendor neutrality — no hard-coded vendor-name branching in the scoring engine", () => {
  it("never compares platform.vendor or platform.id to a vendor-name literal in a conditional", async () => {
    // Static-analysis guard: scoring must only ever branch on structural
    // fields (MaturityBand, costTier, timeToValue, traits, ...), never on
    // which specific vendor a platform happens to be. A future change
    // that adds `if (platform.vendor === "SAP") ...` would fail this.
    const fs = await import("node:fs");
    const path = await import("node:path");
    const enginePath = path.join(__dirname, "..", "..", "scoring", "engine.ts");
    const source = fs.readFileSync(enginePath, "utf-8");
    expect(source).not.toMatch(/platform\.(vendor|id)\s*===/);
    expect(source).not.toMatch(/platform\.(vendor|id)\s*==/);
  });
});

describe("Vendor neutrality — archetype fixtures produce a real, explicable winner", () => {
  const archetypes: Array<{ name: string; build: () => WizardState }> = [
    {
      name: "SAP-heavy",
      build: () => {
        const s = clone(SAMPLE_PROFILE);
        s.landscape.erp = "sap-s4hana";
        s.constraints.preferredVendor = "sap";
        return s;
      },
    },
    {
      name: "Microsoft-heavy",
      build: () => {
        const s = clone(SAMPLE_PROFILE);
        s.landscape.erp = "dynamics";
        s.landscape.analytics = "power-bi";
        s.landscape.cloud = "azure";
        s.constraints.preferredVendor = "microsoft";
        s.constraints.preferredCloud = "azure";
        return s;
      },
    },
    {
      name: "multi-cloud, cost-sensitive",
      build: () => {
        const s = clone(SAMPLE_PROFILE);
        s.landscape.cloud = "multi-cloud";
        s.constraints.preferredCloud = "no-preference";
        s.constraints.preferredVendor = "no-preference";
        s.constraints.budget = "tight";
        return s;
      },
    },
    {
      name: "AI-first, no legacy preference",
      build: () => {
        const s = clone(SAMPLE_PROFILE);
        s.landscape.erp = "other-none";
        s.landscape.dataWarehouse = "other-none";
        s.goals.goals = ["business-ai", "innovation"];
        s.constraints.preferredCloud = "no-preference";
        s.constraints.preferredVendor = "no-preference";
        return s;
      },
    },
  ];

  it.each(archetypes)("$name: produces a deterministic, fully-ranked result for every catalog platform", ({ build }) => {
    const state = build();
    const ranked = scoreAllPlatformsV2(state);
    expect(ranked).toHaveLength(VENDOR_CATALOG.length);
    // Every platform in the catalog is represented exactly once.
    const ids = ranked.map((r) => r.platform.id);
    expect(new Set(ids).size).toBe(VENDOR_CATALOG.length);
    // The winner's score is a real number derived from its dimensions,
    // not a sentinel or fabricated value.
    expect(ranked[0].overallScore).toBeGreaterThan(0);
    expect(ranked[0].dimensions.length).toBeGreaterThan(0);
    // Re-running the same archetype is deterministic.
    expect(scoreAllPlatformsV2(build())).toEqual(ranked);
  });
});

/**
 * Vendor Intelligence & Evidence Graph V1 — neutrality extension
 * (brief §42). The Evidence Graph's deterministic modules
 * (materiality, revalidation queue, conflict detection, coverage)
 * take productSlug/vendorSlug only as an opaque label to group by —
 * never as a branch condition. These tests prove that property by
 * literally swapping which real vendor's slug is used and confirming
 * the output is identical given identical abstract inputs, and by
 * statically scanning the module source for any vendor-name literal
 * used in a conditional.
 */
describe("Vendor neutrality — Evidence Graph", () => {
  const REAL_VENDOR_NAMES = Array.from(new Set(VENDOR_CATALOG.map((p) => p.vendor)));

  it("no evidence-graph module branches on a literal vendor or product name", async () => {
    const dir = path.join(__dirname, "..", "..", "vendor-intelligence", "evidence-graph");
    const offenders: string[] = [];
    const walk = (d: string) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        if (entry.name === "__tests__" || entry.name.startsWith(".")) continue;
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.ts$/.test(entry.name)) {
          const content = fs.readFileSync(full, "utf-8");
          for (const vendorName of REAL_VENDOR_NAMES) {
            // A conditional comparing a variable to a literal vendor
            // name — not a mere mention (comments/docs/seed data are
            // fine; a branch condition is not).
            const pattern = new RegExp(`===\\s*["'\`]${vendorName}["'\`]|["'\`]${vendorName}["'\`]\\s*===`, "i");
            if (pattern.test(content)) offenders.push(`${full}: ${vendorName}`);
          }
        }
      }
    };
    walk(dir);
    expect(offenders).toEqual([]);
  });

  it("computeMateriality gives identical output for two different products given identical abstract inputs", () => {
    const abstractInput: Omit<MaterialityInput, "changeType"> = {
      isWinner: true,
      isTopAlternative: false,
      criterionWeight: 0.15,
      robustnessLevel: "FRAGILE",
      hardConstraintAffected: false,
      businessCaseAssumptionAffected: false,
      criticalRiskAffected: false,
    };
    const resultA = computeMateriality({ ...abstractInput, changeType: "capability_changed" });
    const resultB = computeMateriality({ ...abstractInput, changeType: "capability_changed" });
    // There is no vendor/product field in MaterialityInput at all —
    // this is the structural guarantee, demonstrated by the fact that
    // the two calls (standing in for "SAP" and "Databricks") cannot
    // differ since neither call was ever given a vendor identity.
    expect(resultA).toEqual(resultB);
  });

  it("rankRevalidationQueue ranks two claims identically regardless of which real product slug they carry", () => {
    const candidateFor = (productSlug: string): RevalidationCandidate => ({
      claimId: `claim-${productSlug}`,
      productSlug,
      capabilityKey: "security",
      verificationStatus: "stale",
      decisionReferenceCount: 3,
      usedByFragileWinnerDecision: true,
    });
    const rankedA = rankRevalidationQueue([candidateFor("sap-bdc"), candidateFor("databricks")]);
    const rankedB = rankRevalidationQueue([candidateFor("oracle"), candidateFor("snowflake")]);
    expect(rankedA.map((r) => r.priorityScore)).toEqual(rankedB.map((r) => r.priorityScore));
  });

  it("detectCrossSessionConflicts treats the GA-vs-preview example identically no matter which real vendor is named", () => {
    for (const productSlug of ["sap-bdc", "databricks", "snowflake", "ms-fabric", "oracle", "aws", "google-cloud"]) {
      const active: ConflictCandidate[] = [{ claimId: "existing", productSlug, capabilityKey: "data_sovereignty", claim: "Generally available in all regions." }];
      const conflicts = detectCrossSessionConflicts({ productSlug, capabilityKey: "data_sovereignty", claim: "Still in preview in the EU region." }, active);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].severity).toBe("high");
    }
  });

  it("UNKNOWN coverage is never reported as unsupported — an uncovered capability contributes 0 to covered, not a negative signal", () => {
    const noClaims = computeProductCoverage([]);
    expect(noClaims.capabilityCoverage.covered).toBe(0);
    expect(noClaims.unknownCount).toBe(0); // zero claims is "nothing asserted," not "28 unknown facts"
    expect(noClaims.conflictCount).toBe(0);
  });

  it("an explicit UNKNOWN-status claim is counted as unknown, never silently treated as a conflict or a negative capability", () => {
    const claim: CapabilityClaim = {
      id: "c1",
      vendorSlug: "Oracle",
      productSlug: "oracle",
      capabilityKey: "genai",
      claim: "Capability not yet assessed.",
      verificationStatus: "unknown",
      lifecycleStatus: "active",
      evidenceQuality: null,
      validFrom: null,
      validTo: null,
      lastVerifiedAt: null,
      version: 1,
      supersededBy: null,
      scope: "global",
      organizationId: null,
      notes: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const result = computeProductCoverage([{ claim, freshness: "unknown" }]);
    expect(result.unknownCount).toBe(1);
    expect(result.conflictCount).toBe(0);
  });
});
