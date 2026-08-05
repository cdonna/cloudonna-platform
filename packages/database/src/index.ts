import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AuditLogRepository,
  DecisionReportsRepository,
  DecisionSessionsRepository,
  KnowledgeRepository,
  OrganizationsRepository,
  PartnersRepository,
  RecommendationsRepository,
  VendorCatalogRepository,
} from "./repositories";

export * from "./client";
export * from "./enums";
export * from "./types";
export * from "./repositories";

/**
 * Convenience bundle of every repository over a single client — the
 * expected entry point for a future service layer. Building this is the
 * only thing this function does; it holds no state and makes no decisions
 * of its own.
 */
export function createRepositories(db: SupabaseClient) {
  return {
    organizations: new OrganizationsRepository(db),
    vendorCatalog: new VendorCatalogRepository(db),
    decisionSessions: new DecisionSessionsRepository(db),
    recommendations: new RecommendationsRepository(db),
    decisionReports: new DecisionReportsRepository(db),
    partners: new PartnersRepository(db),
    knowledge: new KnowledgeRepository(db),
    auditLog: new AuditLogRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
