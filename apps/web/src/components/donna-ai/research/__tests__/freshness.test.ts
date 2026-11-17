import { describe, expect, it } from "vitest";
import { classifyFreshness } from "../freshness";

describe("Source Freshness", () => {
  it("returns unknown when publishedAt is null", () => {
    expect(classifyFreshness(null, "official-product-documentation")).toBe("unknown");
  });

  it("returns unknown for an unparseable date", () => {
    expect(classifyFreshness("not-a-date", "official-product-documentation")).toBe("unknown");
  });

  it("returns unknown for a date in the future (never a negative age)", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    expect(classifyFreshness(future, "official-product-documentation")).toBe("unknown");
  });

  it("classifies a recent release-notes page as current under the fast-moving threshold", () => {
    const now = new Date("2026-11-17T00:00:00Z");
    const published = new Date("2026-09-01T00:00:00Z").toISOString();
    expect(classifyFreshness(published, "official-release-notes", now)).toBe("current");
  });

  it("classifies the same age as stale for release notes but still aging (not stale) for a standards body document", () => {
    const now = new Date("2026-11-17T00:00:00Z");
    const published = new Date("2024-11-01T00:00:00Z").toISOString(); // ~2 years old
    expect(classifyFreshness(published, "official-release-notes", now)).toBe("stale");
    expect(classifyFreshness(published, "standards-body", now)).toBe("aging");
  });

  it("is deterministic for identical input", () => {
    const now = new Date("2026-11-17T00:00:00Z");
    const published = new Date("2026-01-01T00:00:00Z").toISOString();
    expect(classifyFreshness(published, "official-product-documentation", now)).toBe(classifyFreshness(published, "official-product-documentation", now));
  });
});
