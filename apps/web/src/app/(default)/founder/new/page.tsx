import type { Metadata } from "next";
import { NewTaskForm } from "./NewTaskForm";

export const metadata: Metadata = { title: "New Task — Founder Control" };

export default function NewFounderTaskPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">New Task</h1>
      <p className="mt-2 text-sm text-nova-ink-faint">
        Describe what you want changed in plain language. You don&apos;t need to know git, branches, or CI — just what
        &quot;done&quot; looks like.
      </p>
      <div className="mt-8">
        <NewTaskForm />
      </div>
    </div>
  );
}
