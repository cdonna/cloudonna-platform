import type { SupabaseClient } from "@supabase/supabase-js";
import type { Organization, OrganizationMember, Project, Workspace } from "../types";
import { assertMaybe, assertNoError } from "./errors";

/**
 * Pure data access over organizations/organization_members/workspaces/
 * projects. No membership-invite flow, no onboarding orchestration, no
 * permission checks beyond what RLS already enforces at the database
 * layer — that belongs to a future service, not here.
 */
export class OrganizationsRepository {
  constructor(private readonly db: SupabaseClient) {}

  async getById(id: string): Promise<Organization | null> {
    const result = await this.db
      .from("organizations")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    return assertMaybe<Organization>("OrganizationsRepository.getById", result);
  }

  async listForUser(userId: string): Promise<Organization[]> {
    const result = await this.db
      .from("organization_members")
      .select("organizations(*)")
      .eq("user_id", userId)
      .is("deleted_at", null);

    const rows = assertNoError<{ organizations: Organization }[]>("OrganizationsRepository.listForUser", result);
    return rows.map((row) => row.organizations);
  }

  async create(input: Pick<Organization, "name" | "slug"> & { created_by?: string }): Promise<Organization> {
    const result = await this.db.from("organizations").insert(input).select("*").single();

    return assertNoError<Organization>("OrganizationsRepository.create", result);
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.db
      .from("organizations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (result.error) throw result.error;
  }

  async listMembers(organizationId: string): Promise<OrganizationMember[]> {
    const result = await this.db
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .is("deleted_at", null);

    return assertNoError<OrganizationMember[]>("OrganizationsRepository.listMembers", result);
  }

  async addMember(
    input: Pick<OrganizationMember, "organization_id" | "user_id" | "role"> & { invited_by?: string },
  ): Promise<OrganizationMember> {
    const result = await this.db.from("organization_members").insert(input).select("*").single();

    return assertNoError<OrganizationMember>("OrganizationsRepository.addMember", result);
  }

  async listWorkspaces(organizationId: string): Promise<Workspace[]> {
    const result = await this.db
      .from("workspaces")
      .select("*")
      .eq("organization_id", organizationId)
      .is("deleted_at", null);

    return assertNoError<Workspace[]>("OrganizationsRepository.listWorkspaces", result);
  }

  async createWorkspace(
    input: Pick<Workspace, "organization_id" | "name" | "slug"> & { description?: string; created_by?: string },
  ): Promise<Workspace> {
    const result = await this.db.from("workspaces").insert(input).select("*").single();

    return assertNoError<Workspace>("OrganizationsRepository.createWorkspace", result);
  }

  async listProjects(workspaceId: string): Promise<Project[]> {
    const result = await this.db
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null);

    return assertNoError<Project[]>("OrganizationsRepository.listProjects", result);
  }

  async createProject(
    input: Pick<Project, "organization_id" | "workspace_id" | "name" | "slug"> & {
      description?: string;
      created_by?: string;
    },
  ): Promise<Project> {
    const result = await this.db.from("projects").insert(input).select("*").single();

    return assertNoError<Project>("OrganizationsRepository.createProject", result);
  }
}
