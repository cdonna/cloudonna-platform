import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BusinessGoal,
  DecisionSession,
  DecisionSessionCapability,
  Requirement,
  SessionConstraint,
} from "../types";
import { assertMaybe, assertNoError } from "./errors";

/**
 * Data access over a decision session and its direct children (goals,
 * required capabilities, requirements, constraints). Deliberately does not
 * know how to score anything, generate a recommendation, or decide what
 * "done" means for a session — that is the scoring engine and a future
 * service layer's job, not this repository's.
 */
export class DecisionSessionsRepository {
  constructor(private readonly db: SupabaseClient) {}

  async create(
    input: Pick<DecisionSession, "organization_id" | "workspace_id" | "project_id" | "title"> & {
      framework_id?: string;
      created_by?: string;
    },
  ): Promise<DecisionSession> {
    const result = await this.db.from("decision_sessions").insert(input).select("*").single();

    return assertNoError<DecisionSession>("DecisionSessionsRepository.create", result);
  }

  async getById(id: string): Promise<DecisionSession | null> {
    const result = await this.db
      .from("decision_sessions")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    return assertMaybe<DecisionSession>("DecisionSessionsRepository.getById", result);
  }

  async listForProject(projectId: string): Promise<DecisionSession[]> {
    const result = await this.db
      .from("decision_sessions")
      .select("*")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    return assertNoError<DecisionSession[]>("DecisionSessionsRepository.listForProject", result);
  }

  async updateStatus(id: string, status: DecisionSession["status"]): Promise<void> {
    const result = await this.db.from("decision_sessions").update({ status }).eq("id", id);
    if (result.error) throw result.error;
  }

  async addBusinessGoal(
    input: Pick<BusinessGoal, "organization_id" | "decision_session_id"> &
      Partial<Pick<BusinessGoal, "goal_tag" | "custom_goal_text" | "priority">> & { created_by?: string },
  ): Promise<BusinessGoal> {
    const result = await this.db.from("business_goals").insert(input).select("*").single();

    return assertNoError<BusinessGoal>("DecisionSessionsRepository.addBusinessGoal", result);
  }

  async listBusinessGoals(sessionId: string): Promise<BusinessGoal[]> {
    const result = await this.db
      .from("business_goals")
      .select("*")
      .eq("decision_session_id", sessionId)
      .is("deleted_at", null);

    return assertNoError<BusinessGoal[]>("DecisionSessionsRepository.listBusinessGoals", result);
  }

  async setRequiredCapabilities(
    sessionId: string,
    capabilities: Array<{ capabilityId: string; priority?: "must-have" | "nice-to-have" }>,
  ): Promise<DecisionSessionCapability[]> {
    const rows = capabilities.map((c) => ({
      decision_session_id: sessionId,
      capability_id: c.capabilityId,
      priority: c.priority ?? "must-have",
    }));

    const result = await this.db
      .from("decision_session_capabilities")
      .upsert(rows, { onConflict: "decision_session_id,capability_id" })
      .select("*");

    return assertNoError<DecisionSessionCapability[]>("DecisionSessionsRepository.setRequiredCapabilities", result);
  }

  async addRequirement(
    input: Pick<Requirement, "organization_id" | "decision_session_id" | "title"> &
      Partial<Pick<Requirement, "description" | "capability_id" | "is_mandatory">> & { created_by?: string },
  ): Promise<Requirement> {
    const result = await this.db.from("requirements").insert(input).select("*").single();

    return assertNoError<Requirement>("DecisionSessionsRepository.addRequirement", result);
  }

  async listRequirements(sessionId: string): Promise<Requirement[]> {
    const result = await this.db
      .from("requirements")
      .select("*")
      .eq("decision_session_id", sessionId)
      .is("deleted_at", null);

    return assertNoError<Requirement[]>("DecisionSessionsRepository.listRequirements", result);
  }

  async addConstraint(
    input: Pick<SessionConstraint, "organization_id" | "decision_session_id" | "constraint_type" | "value"> & {
      notes?: string;
      created_by?: string;
    },
  ): Promise<SessionConstraint> {
    const result = await this.db.from("session_constraints").insert(input).select("*").single();

    return assertNoError<SessionConstraint>("DecisionSessionsRepository.addConstraint", result);
  }

  async listConstraints(sessionId: string): Promise<SessionConstraint[]> {
    const result = await this.db
      .from("session_constraints")
      .select("*")
      .eq("decision_session_id", sessionId)
      .is("deleted_at", null);

    return assertNoError<SessionConstraint[]>("DecisionSessionsRepository.listConstraints", result);
  }
}
