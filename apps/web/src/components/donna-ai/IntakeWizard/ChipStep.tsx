import { forwardRef, useId } from "react";
import { Chip } from "../shared";

export interface ChipField {
  legend: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onSelect: (value: string) => void;
}

export const ChipStep = forwardRef<HTMLHeadingElement, {
  prompt: string;
  title: string;
  fields: ChipField[];
  note: string;
  onNoteChange: (value: string) => void;
  noteLabel: string;
  notePlaceholder: string;
}>(function ChipStep(
  { prompt, title, fields, note, onNoteChange, noteLabel, notePlaceholder },
  ref,
) {
  const noteId = useId();

  return (
    <div>
      <p className="text-sm font-medium text-violet-700">{prompt}</p>
      <h3 ref={ref} tabIndex={-1} className="mt-2 text-2xl font-semibold text-slate-950 outline-none">
        {title}
      </h3>

      <div className="mt-6 space-y-6">
        {fields.map((field) => (
          <fieldset key={field.legend}>
            <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              {field.legend}
            </legend>
            <div className="flex flex-wrap gap-2">
              {field.options.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={field.selected.includes(option.value)}
                  onClick={() => field.onSelect(option.value)}
                />
              ))}
            </div>
          </fieldset>
        ))}

        <div>
          <label
            htmlFor={noteId}
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-400"
          >
            {noteLabel}
          </label>
          <textarea
            id={noteId}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            rows={3}
            placeholder={notePlaceholder}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20"
          />
        </div>
      </div>
    </div>
  );
});
