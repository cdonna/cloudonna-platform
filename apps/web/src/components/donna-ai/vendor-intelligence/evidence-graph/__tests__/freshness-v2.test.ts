import { describe, expect, it } from "vitest";
import { classifyCertificationFreshness, classifyFreshnessByAge } from "../freshness-v2";

const NOW = new Date("2026-11-17T00:00:00Z");

describe("classifyFreshnessByAge", () => {
  it("returns unknown when no published date is known", () => {
    expect(classifyFreshnessByAge(null, "official_product_documentation", NOW)).toBe("unknown");
  });

  it("ages release notes faster than product documentation", () => {
    const sevenMonthsAgo = "2026-04-17";
    expect(classifyFreshnessByAge(sevenMonthsAgo, "official_release_notes", NOW)).toBe("aging");
    expect(classifyFreshnessByAge(sevenMonthsAgo, "official_product_documentation", NOW)).toBe("current");
  });

  it("treats standards-body documentation as slow-moving", () => {
    const twoYearsAgo = "2024-11-17";
    const threeYearsAgo = "2023-11-17";
    expect(classifyFreshnessByAge(twoYearsAgo, "standards_body", NOW)).toBe("current");
    expect(classifyFreshnessByAge(threeYearsAgo, "official_product_documentation", NOW)).toBe("stale");
  });

  it("never returns a negative-age (future-dated) source as current", () => {
    expect(classifyFreshnessByAge("2027-01-01", "official_product_documentation", NOW)).toBe("unknown");
  });
});

describe("classifyCertificationFreshness", () => {
  it("is current when the certification is valid well into the future", () => {
    expect(classifyCertificationFreshness("2028-01-01", "2020-01-01", NOW)).toBe("current");
  });

  it("is aging within 90 days of expiry even if the source page is recent", () => {
    expect(classifyCertificationFreshness("2026-12-01", "2026-11-01", NOW)).toBe("aging");
  });

  it("is stale once the certification has actually expired, regardless of how recently the page was published", () => {
    expect(classifyCertificationFreshness("2026-10-01", "2026-11-10", NOW)).toBe("stale");
  });

  it("falls back to age-based classification when no expiry is known", () => {
    expect(classifyCertificationFreshness(null, "2026-10-01", NOW)).toBe("current");
    expect(classifyCertificationFreshness(null, null, NOW)).toBe("unknown");
  });
});
