"use client";

/**
 * The interaction model this replaces: every field in a stage shown at
 * once (Context alone had 11 simultaneous chip fields — the density
 * that actually drives the "too long" feeling, independent of how many
 * named stages exist). This shows exactly one question at a time,
 * auto-advancing on answer, with a running trail of what's already
 * been answered — closer to a conversation than a form. The data
 * collected and how it's scored are completely unchanged; this only
 * changes how the same fields are revealed.
 */
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Chip } from "../shared";
import type { ChipField } from "./ChipStep";

const AUTO_ADVANCE_DELAY_MS = 350;

function firstUnansweredIndex(fields: ChipField[]): number {
  const index = fields.findIndex((field) => field.selected.length === 0);
  return index === -1 ? fields.length : index;
}

export interface ConversationalFieldFlowProps {
  /** Identifies which stage this flow belongs to (e.g. "context",
   * "priorities") — the trigger for resetting activeIndex when the
   * user switches stages. Deliberately not derived from fields.length:
   * two stages could coincidentally have the same field count, and a
   * length-based reset would silently fail to fire. */
  stageKey: string;
  fields: ChipField[];
  note: string;
  onNoteChange: (value: string) => void;
  noteLabel: string;
  notePlaceholder: string;
}

export function ConversationalFieldFlow({ stageKey, fields, note, onNoteChange, noteLabel, notePlaceholder }: ConversationalFieldFlowProps) {
  const [activeIndex, setActiveIndex] = useState(() => firstUnansweredIndex(fields));
  // Adjusting state on a prop change, done during render rather than
  // in an effect — React's own recommended pattern for exactly this
  // case (https://react.dev/learn/you-might-not-need-an-effect), and
  // what the react-hooks/set-state-in-effect lint rule enforces:
  // jumping straight to a field already answered earlier (e.g. via
  // LOAD_SAMPLE, or Back from a later stage) should land past it, on
  // the first genuinely unanswered question, whenever the stage
  // itself changes — never re-litigate answers already given.
  const [renderedStageKey, setRenderedStageKey] = useState(stageKey);
  if (stageKey !== renderedStageKey) {
    setRenderedStageKey(stageKey);
    setActiveIndex(firstUnansweredIndex(fields));
  }

  const [announcement, setAnnouncement] = useState("");
  const advanceTimer = useRef<number | null>(null);
  const noteId = useId();

  useEffect(() => {
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  function selectAndAdvance(field: ChipField, value: string, index: number) {
    field.onSelect(value);

    if (field.multiple) return; // explicit Continue handles advancing

    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => {
      const next = index + 1;
      setActiveIndex(next);
      setAnnouncement(next < fields.length ? fields[next].question ?? fields[next].legend : "All questions answered.");
    }, AUTO_ADVANCE_DELAY_MS);
  }

  const answered = fields.slice(0, activeIndex).filter((field) => field.selected.length > 0);
  const activeField = activeIndex < fields.length ? fields[activeIndex] : null;

  return (
    <div>
      {answered.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 motion-safe:animate-in motion-safe:fade-in duration-panel ease-nova-settle">
          {answered.map((field, index) => {
            const label = field.options.find((option) => option.value === field.selected[0])?.label ?? field.selected.join(", ");
            return (
              <button
                key={field.legend}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="group inline-flex min-h-11 items-center gap-1.5 rounded-full border border-titanium bg-carbon-2 px-3 py-1.5 text-xs text-nova-ink-muted transition-colors duration-control hover:border-titanium-strong hover:text-nova-ink"
              >
                <Check size={11} className="text-nova-success" />
                <span className="text-nova-ink-faint">{field.legend}:</span>
                <span className="font-medium text-nova-ink">{field.multiple ? `${field.selected.length} selected` : label}</span>
              </button>
            );
          })}
        </div>
      )}

      {activeField && (
        <div key={activeIndex} className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 duration-panel ease-nova-settle">
          <fieldset>
            <legend className="text-lg font-medium text-nova-ink">{activeField.question ?? activeField.legend}</legend>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeField.options.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={activeField.selected.includes(option.value)}
                  onClick={() => selectAndAdvance(activeField, option.value, activeIndex)}
                />
              ))}
            </div>
          </fieldset>

          {activeField.multiple && (
            <button
              type="button"
              onClick={() => setActiveIndex(activeIndex + 1)}
              disabled={activeField.selected.length === 0}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-nova-accent-strong transition-colors duration-control hover:text-nova-ink disabled:pointer-events-none disabled:opacity-40"
            >
              Continue
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      )}

      {activeIndex >= fields.length && (
        <div className="motion-safe:animate-in motion-safe:fade-in duration-panel ease-nova-settle">
          <label htmlFor={noteId} className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-nova-ink-faint">
            {noteLabel}
          </label>
          <textarea
            id={noteId}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            rows={3}
            placeholder={notePlaceholder}
            className="w-full resize-none rounded-xl border border-titanium bg-carbon-2 px-3.5 py-2.5 text-sm text-nova-ink outline-none placeholder:text-nova-ink-faint transition-colors duration-control focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
          />
        </div>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
