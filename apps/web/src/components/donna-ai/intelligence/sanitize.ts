/**
 * Free-text sanitization for wizard note fields, applied once, before any
 * consumer (deterministic engine, evidence package, future prompt) sees
 * the text. Pure function, no side effects, no environment access.
 *
 * This is a bound and a flag, not a content filter — it never tries to
 * "understand" the text, only to cap its size and note whether it looks
 * like it's trying to address an AI system directly, so a future prompt
 * layer can treat it as data rather than instructions. See
 * docs/intelligence/fallback-and-failure-model.md, "Prompt-injection
 * posture".
 */

export const MAX_NOTE_LENGTH = 500;

/** Patterns that suggest the text is trying to talk to a model rather
 * than describe a business situation. Deliberately coarse — false
 * positives just mean a flag, not a rejection. */
const INSTRUCTION_LIKE_PATTERNS = [
  /ignore (all|any|the)? ?(previous|prior|above)/i,
  /you are now/i,
  /^\s*system\s*:/i,
  /^\s*assistant\s*:/i,
  /disregard (all|any|the)? ?(previous|prior|above)/i,
  /new instructions?:/i,
];

export interface SanitizedText {
  value: string;
  wasTruncated: boolean;
  flaggedAsInstructionLike: boolean;
}

export function sanitizeFreeText(raw: string): SanitizedText {
  // Fold all whitespace — including tab/newline, which are themselves
  // Unicode control characters — into single spaces first, then strip any
  // remaining (non-whitespace) control characters. Order matters: control
  // characters must not be silently deleted before they're recognized as
  // the whitespace they represent, or "line one\nline two" would collapse
  // to "line onetwo" instead of "line one line two".
  const whitespaceCollapsed = raw.replace(/\s+/g, " ").trim();
  const controlCharsStripped = whitespaceCollapsed.replace(/\p{Cc}/gu, "");

  const wasTruncated = controlCharsStripped.length > MAX_NOTE_LENGTH;
  const value = wasTruncated ? controlCharsStripped.slice(0, MAX_NOTE_LENGTH) : controlCharsStripped;

  const flaggedAsInstructionLike = INSTRUCTION_LIKE_PATTERNS.some((pattern) => pattern.test(value));

  return { value, wasTruncated, flaggedAsInstructionLike };
}

/** Convenience for building an IntelligenceRequest's sanitizedNotes list —
 * drops empty notes, keeps only the cleaned value. */
export function sanitizeNotes(rawNotes: string[]): string[] {
  return rawNotes.map((note) => sanitizeFreeText(note).value).filter((value) => value.length > 0);
}

export interface SanitizedNotesWithMetadata {
  notes: string[];
  anyFlaggedAsInstructionLike: boolean;
}

/** Same as sanitizeNotes, but also surfaces the aggregate instruction-like
 * flag for audit metadata (audit.ts) — never the flagged content itself,
 * only whether any note tripped the heuristic. */
export function sanitizeNotesWithMetadata(rawNotes: string[]): SanitizedNotesWithMetadata {
  const results = rawNotes.map((note) => sanitizeFreeText(note));
  return {
    notes: results.map((r) => r.value).filter((value) => value.length > 0),
    anyFlaggedAsInstructionLike: results.some((r) => r.flaggedAsInstructionLike),
  };
}
