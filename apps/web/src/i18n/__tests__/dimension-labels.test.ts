import { describe, expect, it } from "vitest";
import { localizedDimensionLabel } from "../dimension-labels";

describe("localizedDimensionLabel", () => {
  it("returns the English label unchanged for the en locale", () => {
    expect(localizedDimensionLabel("architecture", "Architecture Fit", "en")).toBe("Architecture Fit");
  });

  it.each(["de", "fr", "es", "it"] as const)("translates every one of the ten dimension keys for %s", (locale) => {
    const keys = ["architecture", "business", "technology", "governance", "aiReadiness", "security", "ecosystem", "cost", "timeToValue", "strategic"];
    for (const key of keys) {
      const translated = localizedDimensionLabel(key, `${key} English label`, locale);
      expect(translated).not.toBe(`${key} English label`);
    }
  });

  it("falls back to the English label for an unknown key rather than fabricating one", () => {
    expect(localizedDimensionLabel("not-a-real-dimension", "Fallback Label", "de")).toBe("Fallback Label");
  });
});
