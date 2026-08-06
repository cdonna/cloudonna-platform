import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlatformCategory } from "../enums";
import type { Product, ProductCapability, Vendor } from "../types";
import { assertMaybe, assertNoError } from "./errors";

export interface ListProductsFilter {
  platformCategory?: PlatformCategory;
  vendorId?: string;
}

/** A ranked match from vector similarity search — see match_products() in
 * supabase/migrations/20260806120900_semantic_search.sql. */
export interface ProductMatch {
  id: string;
  similarity: number;
}

/**
 * Read-heavy access over the global vendor/product catalog. This is the
 * intended persistence-layer counterpart to the Sprint 3 in-memory
 * VENDOR_CATALOG array — nothing here imports or reads that file; the
 * column-for-column alignment is a naming discipline (see the vendor
 * catalog migration's header comment), not a runtime link.
 *
 * Every write method here targets the service_role — RLS on `products`/
 * `vendors` has no INSERT/UPDATE policy for any other role, on purpose
 * (see docs, "Global reference data vs. tenant-scoped data").
 */
export class VendorCatalogRepository {
  constructor(private readonly db: SupabaseClient) {}

  async listVendors(): Promise<Vendor[]> {
    const result = await this.db.from("vendors").select("*").is("deleted_at", null).order("name");

    return assertNoError<Vendor[]>("VendorCatalogRepository.listVendors", result);
  }

  async listProducts(filter: ListProductsFilter = {}): Promise<Product[]> {
    let query = this.db.from("products").select("*").is("deleted_at", null);

    if (filter.platformCategory) {
      query = query.eq("platform_category", filter.platformCategory);
    }
    if (filter.vendorId) {
      query = query.eq("vendor_id", filter.vendorId);
    }

    const result = await query.order("name");
    return assertNoError<Product[]>("VendorCatalogRepository.listProducts", result);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const result = await this.db
      .from("products")
      .select("*")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();

    return assertMaybe<Product>("VendorCatalogRepository.getProductBySlug", result);
  }

  async listCapabilitiesForProduct(productId: string): Promise<ProductCapability[]> {
    const result = await this.db
      .from("product_capabilities")
      .select("*")
      .eq("product_id", productId)
      .is("deleted_at", null);

    return assertNoError<ProductCapability[]>("VendorCatalogRepository.listCapabilitiesForProduct", result);
  }

  /**
   * Semantic search over product descriptions/positioning via the
   * match_products() RPC. Returns ids ranked by similarity only — callers
   * fetch full rows via getProductBySlug/listProducts, so RLS is applied
   * exactly once, in the normal place.
   */
  async findSimilarProducts(
    queryEmbedding: number[],
    options: { matchCount?: number; minSimilarity?: number } = {},
  ): Promise<ProductMatch[]> {
    const result = await this.db.rpc("match_products", {
      query_embedding: queryEmbedding,
      match_count: options.matchCount ?? 10,
      min_similarity: options.minSimilarity ?? 0,
    });

    return assertNoError<ProductMatch[]>("VendorCatalogRepository.findSimilarProducts", result);
  }

  async upsertProduct(
    product: Partial<Product> &
      Pick<Product, "vendor_id" | "slug" | "name" | "platform_category" | "cloud_model">,
  ): Promise<Product> {
    const result = await this.db.from("products").upsert(product, { onConflict: "slug" }).select("*").single();

    return assertNoError<Product>("VendorCatalogRepository.upsertProduct", result);
  }
}
