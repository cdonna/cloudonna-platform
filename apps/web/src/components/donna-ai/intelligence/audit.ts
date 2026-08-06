/**
 * Audit metadata — structured, metadata-only events emitted by the
 * orchestrator after every decision. Never contains prompt text, note
 * content, or a raw provider response — only what happened, not what was
 * said. See docs/intelligence/security-and-privacy.md, "Audit metadata".
 *
 * No sink is wired here (no Supabase, no log service) — see the
 * persistence boundary in donna-intelligence-architecture.md. `onAudit`
 * defaults to a no-op; a caller (e.g. the API route in a later phase, or
 * a future service layer) supplies a real sink via dependency injection,
 * same pattern as `RateLimiter`.
 */
import type { EnrichmentStatus } from "./types";

export interface AuditEvent {
  timestamp: string;
  providerId: string;
  model: string | null;
  enrichmentStatus: EnrichmentStatus;
  /** Character counts only — never the note content itself. */
  sanitizedNoteCount: number;
  sanitizedNoteTotalLength: number;
  shortlistSize: number;
  /** True if sanitize.ts flagged any note as instruction-like — see
   * sanitize.ts. The content itself is never included here. */
  anyNoteFlaggedAsInstructionLike: boolean;
  durationMs: number;
}

export type AuditSink = (event: AuditEvent) => void;

export const noopAuditSink: AuditSink = () => {};
