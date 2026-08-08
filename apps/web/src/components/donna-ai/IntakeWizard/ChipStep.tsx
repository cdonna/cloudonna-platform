/**
 * The ChipStep/ChipFields components that used to live in this file
 * (rendering every field in a stage simultaneously) are gone —
 * ConversationalFieldFlow replaced that interaction model with one
 * question at a time. Only the shared field shape survives, since both
 * IntakeWizard and ConversationalFieldFlow still need it.
 */
export interface ChipField {
  legend: string;
  /** A conversational phrasing shown as the question itself in
   * ConversationalFieldFlow (e.g. "What industry are you in?"). */
  question?: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onSelect: (value: string) => void;
  /** Multi-select fields (e.g. Goals) never auto-advance — the user
   * needs an explicit way to say "I'm done picking." */
  multiple?: boolean;
}
