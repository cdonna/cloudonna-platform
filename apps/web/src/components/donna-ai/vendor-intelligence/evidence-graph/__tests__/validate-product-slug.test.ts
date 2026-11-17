import { describe, expect, it } from "vitest";
import { VENDOR_CATALOG } from "../../catalog";
import { isKnownProductSlug, productDisplayName, vendorSlugForProduct } from "../validate-product-slug";

describe("validate-product-slug", () => {
  it("accepts every real catalog id", () => {
    for (const platform of VENDOR_CATALOG) {
      expect(isKnownProductSlug(platform.id)).toBe(true);
    }
  });

  it("rejects an unknown product slug rather than guessing", () => {
    expect(isKnownProductSlug("not-a-real-product")).toBe(false);
  });

  it("resolves the real vendor name for a known product", () => {
    expect(vendorSlugForProduct("databricks")).toBe("Databricks");
  });

  it("returns null, never a fabricated vendor, for an unknown product", () => {
    expect(vendorSlugForProduct("not-a-real-product")).toBeNull();
  });

  it("builds a real display name from the live catalog", () => {
    expect(productDisplayName("sap-bdc")).toContain("SAP");
  });
});
