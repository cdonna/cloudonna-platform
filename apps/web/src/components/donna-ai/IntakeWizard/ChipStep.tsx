import { forwardRef, useId } from "react";
import { Chip } from "../shared";

export interface ChipField {
  legend: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onSelect: (value: string) => void;
}

export interface ChipFieldsProps {
  fields: ChipField[];
  note: string;
  onNoteChange: (value: string) => void;
  noteLabel: string;
  notePlaceholder: string;
}

/** The reusable core of a wizard stage — a set of chip fieldsets plus
 * one free-text note — with no opinion about a heading/prompt above
 * it. Used directly by IntakeWizard's merged Context stage (two of
 * these under one shared heading) and wrapped by ChipStep below (one
 * of these under its own heading) for every other stage. */
export function ChipFields({ fields, note, onNoteChange, noteLabel, notePlaceholder }: ChipFieldsProps) {
  const noteId = useId();

  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <fieldset key={field.legend}>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-nova-ink-faint">{field.legend}</legend>
          <div className="flex flex-wrap gap-2">
            {field.options.map((option) => (
              <Chip key={option.value} label={option.label} selected={field.selected.includes(option.value)} onClick={() => field.onSelect(option.value)} />
            ))}
          </div>
        </fieldset>
      ))}

      <div>
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
    </div>
  );
}

export const ChipStep = forwardRef<
  HTMLHeadingElement,
  ChipFieldsProps & { prompt: string; title: string }
>(function ChipStep({ prompt, title, ...fieldsProps }, ref) {
  return (
    <div>
      <p className="text-sm font-medium text-nova-accent-strong">{prompt}</p>
      <h3 ref={ref} tabIndex={-1} className="mt-2 text-2xl font-semibold text-nova-ink outline-none">
        {title}
      </h3>

      <div className="mt-6">
        <ChipFields {...fieldsProps} />
      </div>
    </div>
  );
});
