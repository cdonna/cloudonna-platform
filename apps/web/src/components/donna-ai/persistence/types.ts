import type { DecisionOutput, WizardState } from "../types";

/**
 * Interfaces only — no implementation, no Supabase, no database, no auth.
 * These exist so future persistence work has a stable shape to build
 * against rather than inventing one under time pressure. Nothing in this
 * file is imported or used anywhere yet.
 */

export interface SavedAssessment {
  id: string;
  createdAt: string;
  wizardState: WizardState;
  output: DecisionOutput;
}

export interface Project {
  id: string;
  name: string;
  assessments: SavedAssessment[];
}

export interface Workspace {
  id: string;
  name: string;
  projects: Project[];
  members: WorkspaceMember[];
}

export interface WorkspaceMember {
  id: string;
  role: "owner" | "editor" | "viewer";
}

export interface ReportExport {
  assessmentId: string;
  format: "text" | "pdf" | "slides";
}

/**
 * Storage-agnostic contract a future backend (Supabase or otherwise)
 * would implement. No implementation ships in this sprint.
 */
export interface AssessmentRepository {
  save(assessment: SavedAssessment): Promise<void>;
  list(workspaceId: string): Promise<SavedAssessment[]>;
  get(id: string): Promise<SavedAssessment | null>;
  remove(id: string): Promise<void>;
}
