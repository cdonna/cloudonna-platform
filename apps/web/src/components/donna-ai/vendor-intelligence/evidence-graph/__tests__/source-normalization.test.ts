import { describe, expect, it } from "vitest";
import { canonicalizeSourceUrl, sameCanonicalSource } from "../source-normalization";

describe("canonicalizeSourceUrl", () => {
  it("strips a URL fragment", () => {
    expect(canonicalizeSourceUrl("https://docs.example.com/page#section-2")).toBe("https://docs.example.com/page");
  });

  it("strips exactly one trailing slash", () => {
    expect(canonicalizeSourceUrl("https://docs.example.com/page/")).toBe("https://docs.example.com/page");
  });

  it("never strips the root path slash", () => {
    expect(canonicalizeSourceUrl("https://docs.example.com/")).toBe("https://docs.example.com/");
  });

  it("strips known tracking parameters", () => {
    expect(canonicalizeSourceUrl("https://docs.example.com/page?utm_source=newsletter&utm_campaign=x")).toBe("https://docs.example.com/page");
  });

  it("keeps an unrecognized query parameter — never collapses a genuinely different page", () => {
    expect(canonicalizeSourceUrl("https://docs.example.com/page?version=2026")).toBe("https://docs.example.com/page?version=2026");
  });

  it("keeps a mix of tracking and non-tracking params, dropping only the tracking ones", () => {
    expect(canonicalizeSourceUrl("https://docs.example.com/page?version=2026&utm_source=x")).toBe("https://docs.example.com/page?version=2026");
  });

  it("returns the trimmed input unchanged for an unparseable URL, never throws", () => {
    expect(canonicalizeSourceUrl("  not a url  ")).toBe("not a url");
  });
});

describe("sameCanonicalSource", () => {
  it("recognizes a fragment-only difference as the same source", () => {
    expect(sameCanonicalSource("https://docs.example.com/page#a", "https://docs.example.com/page#b")).toBe(true);
  });

  it("recognizes a trailing-slash difference as the same source", () => {
    expect(sameCanonicalSource("https://docs.example.com/page", "https://docs.example.com/page/")).toBe(true);
  });

  it("does not treat two genuinely different paths as the same source", () => {
    expect(sameCanonicalSource("https://docs.example.com/page-a", "https://docs.example.com/page-b")).toBe(false);
  });
});
