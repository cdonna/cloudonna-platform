import type { SupabaseClient } from "@supabase/supabase-js";
import type { DecisionReport } from "../types";
import { assertMaybe, assertNoError } from "./errors";

export class DecisionReportsRepository {
  constructor(private readonly db: SupabaseClient) {}

  async create(
    input: Pick<DecisionReport, "organization_id" | "decision_session_id"> &
      Partial<Pick<DecisionReport, "executive_summary" | "full_report">> & { created_by?: string },
  ): Promise<DecisionReport> {
    const result = await this.db.from("decision_reports").insert(input).select("*").single();

    return assertNoError<DecisionReport>("DecisionReportsRepository.create", result);
  }

  /** Every report row for a session, newest first — decision_reports is an
   * append-only version history, not a single mutable "current report". */
  async listForSession(sessionId: string): Promise<DecisionReport[]> {
    const result = await this.db
      .from("decision_reports")
      .select("*")
      .eq("decision_session_id", sessionId)
      .is("deleted_at", null)
      .order("generated_at", { ascending: false });

    return assertNoError<DecisionReport[]>("DecisionReportsRepository.listForSession", result);
  }

  async getLatestForSession(sessionId: string): Promise<DecisionReport | null> {
    const result = await this.db
      .from("decision_reports")
      .select("*")
      .eq("decision_session_id", sessionId)
      .is("deleted_at", null)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return assertMaybe<DecisionReport>("DecisionReportsRepository.getLatestForSession", result);
  }

  async markExported(id: string): Promise<void> {
    const result = await this.db
      .from("decision_reports")
      .update({ exported_at: new Date().toISOString() })
      .eq("id", id);

    if (result.error) throw result.error;
  }
}
