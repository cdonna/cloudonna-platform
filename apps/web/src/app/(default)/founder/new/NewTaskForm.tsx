"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createTaskAction } from "../actions";
import { FOUNDER_TASK_PRIORITIES, FOUNDER_TASK_TARGET_AREAS, type FounderTaskPriority, type FounderTaskTargetArea } from "@/lib/founder-agent/types";

const TARGET_AREA_LABELS: Record<FounderTaskTargetArea, string> = {
  homepage: "Homepage",
  donna_ai: "Donna AI",
  architects: "Architects",
  decision_skills: "Decision Skills",
  data_economy: "Data Economy",
  trust: "Trust",
  cost_value_lab: "Cost & Value",
  scenario_lab: "Scenario Lab",
  intelligence_fabric: "Intelligence Fabric",
  infrastructure: "Infrastructure",
  bug: "Bug",
  other: "Other",
};

/**
 * The brief's plain-language "New Task" screen: title, description,
 * priority, target area, constraints, acceptance criteria — nothing
 * about git, branches, or CI. Submitting calls createTaskAction
 * (a Server Action, see ../actions.ts) directly; there is no fetch()
 * against /api/founder/tasks here, deliberately, to avoid a pointless
 * extra network hop for the same validation and RLS the Server Action
 * already goes through.
 */
export function NewTaskForm() {
  const router = useRouter();
  const formId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await createTaskAction({
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      priority: String(form.get("priority") ?? "medium") as FounderTaskPriority,
      targetArea: String(form.get("targetArea") ?? "other") as FounderTaskTargetArea,
      constraints: String(form.get("constraints") ?? "").trim() || undefined,
      acceptanceCriteria: String(form.get("acceptanceCriteria") ?? "").trim(),
    });

    if (result.error || !result.task) {
      setSubmitting(false);
      setError(result.error ?? "Something went wrong.");
      return;
    }

    router.push(`/founder/tasks/${result.task.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field id={`${formId}-title`} name="title" label="Task title" required placeholder="Make the Architects page visually closer to Nova" />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-description`} className="text-sm font-medium text-nova-ink">
          Task description <span className="text-nova-accent-strong">*</span>
        </label>
        <textarea
          id={`${formId}-description`}
          name="description"
          required
          rows={4}
          placeholder="What should change, and why? Describe it the way you'd explain it to a developer."
          className="resize-none rounded-xl border border-titanium bg-carbon-2 px-3 py-2.5 text-sm text-nova-ink outline-none placeholder:text-nova-ink-faint focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${formId}-priority`} className="text-sm font-medium text-nova-ink">
            Priority
          </label>
          <select
            id={`${formId}-priority`}
            name="priority"
            defaultValue="medium"
            className="h-11 rounded-xl border border-titanium bg-carbon-2 px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
          >
            {FOUNDER_TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority[0].toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${formId}-targetArea`} className="text-sm font-medium text-nova-ink">
            Target area
          </label>
          <select
            id={`${formId}-targetArea`}
            name="targetArea"
            defaultValue="other"
            className="h-11 rounded-xl border border-titanium bg-carbon-2 px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
          >
            {FOUNDER_TASK_TARGET_AREAS.map((area) => (
              <option key={area} value={area}>
                {TARGET_AREA_LABELS[area]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-constraints`} className="text-sm font-medium text-nova-ink">
          Constraints <span className="font-normal text-nova-ink-faint">(optional)</span>
        </label>
        <textarea
          id={`${formId}-constraints`}
          name="constraints"
          rows={2}
          placeholder="Anything the agent must not touch or must preserve."
          className="resize-none rounded-xl border border-titanium bg-carbon-2 px-3 py-2.5 text-sm text-nova-ink outline-none placeholder:text-nova-ink-faint focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-acceptanceCriteria`} className="text-sm font-medium text-nova-ink">
          Acceptance criteria <span className="text-nova-accent-strong">*</span>
        </label>
        <textarea
          id={`${formId}-acceptanceCriteria`}
          name="acceptanceCriteria"
          required
          rows={3}
          placeholder="What does &quot;done&quot; look like? Be as specific as you can."
          className="resize-none rounded-xl border border-titanium bg-carbon-2 px-3 py-2.5 text-sm text-nova-ink outline-none placeholder:text-nova-ink-faint focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-nova-accent text-sm font-semibold text-white transition-colors hover:bg-nova-accent-strong disabled:opacity-60"
      >
        {submitting ? (
          <>
            <LoaderCircle size={16} className="animate-spin" />
            Creating
          </>
        ) : (
          <>
            Create task
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  placeholder,
  required = false,
}: {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-nova-ink">
        {label} {required && <span className="text-nova-accent-strong">*</span>}
      </label>
      <input
        id={id}
        name={name}
        required={required}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-titanium bg-carbon-2 px-3 text-sm text-nova-ink outline-none placeholder:text-nova-ink-faint focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
      />
    </div>
  );
}
