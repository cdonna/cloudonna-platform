import { describe, expect, it } from "vitest";
import { EMPTY_WIZARD_STATE, SAMPLE_PROFILE } from "../../data";
import { VENDOR_CATALOG } from "../../vendor-intelligence/catalog";
import { scoreAllPlatformsV2 } from "../engine";
import { SCORE_WEIGHTS } from "../weights";

describe("Deterministic scoring engine — core invariants (brief §12/§33)", () => {
  it("same normalized input always produces the same deterministic score", () => {
    const a = scoreAllPlatformsV2(SAMPLE_PROFILE);
    const b = scoreAllPlatformsV2(SAMPLE_PROFILE);
    expect(a).toEqual(b);
  });

  it("scores every platform in the catalog, never silently dropping one", () => {
    const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);
    expect(ranked).toHaveLength(VENDOR_CATALOG.length);
    const ids = new Set(ranked.map((r) => r.platform.id));
    expect(ids.size).toBe(VENDOR_CATALOG.length);
  });

  it("ranking is always sorted by overallScore, descending", () => {
    const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);
    for (let i = 1; i < ranked.length; i += 1) {
      expect(ranked[i - 1].overallScore).toBeGreaterThanOrEqual(ranked[i].overallScore);
    }
  });

  it("every dimension score is clamped within [0, 100]", () => {
    const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);
    for (const platform of ranked) {
      for (const dimension of platform.dimensions) {
        expect(dimension.score).toBeGreaterThanOrEqual(0);
        expect(dimension.score).toBeLessThanOrEqual(100);
      }
      expect(platform.overallScore).toBeGreaterThanOrEqual(0);
      expect(platform.overallScore).toBeLessThanOrEqual(100);
    }
  });

  it("every platform carries exactly the 10 weighted dimensions, matching SCORE_WEIGHTS", () => {
    const ranked = scoreAllPlatformsV2(SAMPLE_PROFILE);
    const expectedKeys = Object.keys(SCORE_WEIGHTS).sort();
    for (const platform of ranked) {
      const actualKeys = platform.dimensions.map((d) => d.key).sort();
      expect(actualKeys).toEqual(expectedKeys);
      for (const dimension of platform.dimensions) {
        expect(dimension.weight).toBeCloseTo(SCORE_WEIGHTS[dimension.key], 9);
      }
    }
  });

  it("still produces a complete, valid ranking for a fully empty wizard state (never throws, never returns UNKNOWN in place of a score)", () => {
    const ranked = scoreAllPlatformsV2(EMPTY_WIZARD_STATE);
    expect(ranked).toHaveLength(VENDOR_CATALOG.length);
    for (const platform of ranked) {
      expect(Number.isFinite(platform.overallScore)).toBe(true);
    }
  });

  it("stays deterministic and stably ranked across repeated calls, even for the empty state (the closest practical proxy for a tie-prone input)", () => {
    const a = scoreAllPlatformsV2(EMPTY_WIZARD_STATE).map((r) => r.platform.id);
    const b = scoreAllPlatformsV2(EMPTY_WIZARD_STATE).map((r) => r.platform.id);
    expect(a).toEqual(b);
  });
});
