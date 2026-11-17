import { describe, expect, it } from "vitest";
import { scoreAllPlatformsV2 } from "../../scoring/engine";
import { VENDOR_CATALOG } from "../../vendor-intelligence/catalog";
import { SAMPLE_PROFILE } from "../../data";
import type { WizardState } from "../../types";

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
