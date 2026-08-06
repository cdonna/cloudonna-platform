import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditLogEntry } from "../types";
import { assertNoError } from "./errors";

/**
 * Append-only by design: this repository exposes no update/delete method
 * at all, matching the table's own RLS (no UPDATE/DELETE policy exists for
 * any role). A future service layer calls `append()` after a meaningful
 * write elsewhere — there is no trigger doing this automatically, on
 * purpose (see the audit_logs migration's header comment).
 */
export class AuditLogRepository {
  constructor(private readonly db: SupabaseClient) {}

  async append(
    entry: Pick<AuditLogEntry, "action" | "entity_type"> &
      Partial<Pick<AuditLogEntry, "organization_id" | "actor_user_id" | "entity_id" | "before_data" | "after_data">>,
  ): Promise<AuditLogEntry> {
    const result = await this.db.from("audit_logs").insert(entry).select("*").single();

    return assertNoError<AuditLogEntry>("AuditLogRepository.append", result);
  }

  async listForOrganization(organizationId: string, limit = 100): Promise<AuditLogEntry[]> {
    const result = await this.db
      .from("audit_logs")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return assertNoError<AuditLogEntry[]>("AuditLogRepository.listForOrganization", result);
  }
}
