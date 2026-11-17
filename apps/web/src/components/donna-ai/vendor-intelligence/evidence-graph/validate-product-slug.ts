/**
 * Application-layer validation of vendor_slug/product_slug against the
 * real, live VendorPlatformProfile catalog — the same discipline
 * research_evidence.option_id already relies on (no database FK is
 * possible since the catalog is TypeScript, not a table; see
 * docs/capabilities/vendor-intelligence-and-evidence-graph.md §A).
 * Never accept a claim about a product that does not exist in the
 * catalog ClouDonna actually scores against.
 */
import { VENDOR_CATALOG } from "../catalog";

export function isKnownProductSlug(productSlug: string): boolean {
  return VENDOR_CATALOG.some((p) => p.id === productSlug);
}

export function vendorSlugForProduct(productSlug: string): string | null {
  const platform = VENDOR_CATALOG.find((p) => p.id === productSlug);
  return platform ? platform.vendor : null;
}

export function productDisplayName(productSlug: string): string | null {
  const platform = VENDOR_CATALOG.find((p) => p.id === productSlug);
  return platform ? `${platform.vendor} ${platform.productName}` : null;
}
