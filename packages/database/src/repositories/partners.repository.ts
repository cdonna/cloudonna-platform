import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImplementationPartner, PartnerCompany } from "../types";
import { assertNoError } from "./errors";

/** Backs the /for-partners journey (apps/web, Web Presence Sprint). Only
 * verified rows are ever readable by non-service roles — enforced by RLS,
 * not by this repository, so there is nothing to duplicate here. */
export class PartnersRepository {
  constructor(private readonly db: SupabaseClient) {}

  async listVerifiedForProduct(
    productId: string,
  ): Promise<Array<ImplementationPartner & { partner_company: PartnerCompany }>> {
    const result = await this.db
      .from("implementation_partners")
      .select("*, partner_company:partner_companies(*)")
      .eq("product_id", productId)
      .eq("verification_status", "verified")
      .is("deleted_at", null);

    return assertNoError<Array<ImplementationPartner & { partner_company: PartnerCompany }>>(
      "PartnersRepository.listVerifiedForProduct",
      result,
    );
  }

  async listVerifiedCompanies(): Promise<PartnerCompany[]> {
    const result = await this.db
      .from("partner_companies")
      .select("*")
      .eq("verification_status", "verified")
      .is("deleted_at", null)
      .order("name");

    return assertNoError<PartnerCompany[]>("PartnersRepository.listVerifiedCompanies", result);
  }
}
