import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTask, listTaskApprovals, listTaskArtifacts, listTaskEvents } from "@/lib/founder-agent/repository";
import { TaskActions } from "./TaskActions";

export const metadata: Metadata = { title: "Task — Founder Control" };

const CANCELLABLE_STATUSES = new Set([
  "queued",
  "planning",
  "running",
  "testing",
  "review_ready",
  "changes_requested",
  "approved",
  "merge_ready",
]);

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default async function FounderTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const taskResult = await getTask(supabase, id);
  if (!taskResult.ok || !taskResult.data) {
    notFound();
  }
  const task = taskResult.data;

  const [eventsResult, artifactsResult, approvalsResult] = await Promise.all([
    listTaskEvents(supabase, id),
    listTaskArtifacts(supabase, id),
    listTaskApprovals(supabase, id),
  ]);
  const events = eventsResult.ok ? eventsResult.data : [];
  const artifacts = artifactsResult.ok ? artifactsResult.data : [];
  const approvals = approvalsResult.ok ? approvalsResult.data : [];

  return (
    <div>
      <p className="font-mono text-xs font-medium uppercase tracking-wide text-nova-ink-faint">{task.targetArea.replace(/_/g, " ")} · {task.priority}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-nova-ink">{task.title}</h1>

      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <Stat label="Status" value={task.status.replace(/_/g, " ")} />
        <Stat label="Created" value={formatDate(task.createdAt)} />
        <Stat label="Branch" value={task.branchName ?? "Not dispatched yet"} mono />
        <Stat label="Pull request" value={task.prUrl ?? "—"} />
      </dl>

      <div className="mt-6">
        <TaskActions taskId={task.id} status={task.status} cancellable={CANCELLABLE_STATUSES.has(task.status)} />
      </div>

      {task.failureReason && (
        <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-400">Failure reason</p>
          <p className="mt-1.5 text-sm text-nova-ink-muted">{task.failureReason}</p>
        </div>
      )}

      <Section title="Plan">
        <Field label="Description" value={task.description} />
        {task.constraints && <Field label="Constraints" value={task.constraints} />}
        <Field label="Acceptance criteria" value={task.acceptanceCriteria} />
      </Section>

      <Section title={`Progress (${events.length})`}>
        {events.length === 0 ? (
          <p className="text-sm text-nova-ink-faint">No progress events yet.</p>
        ) : (
          <ol className="space-y-3">
            {events
              .slice()
              .reverse()
              .map((event) => (
                <li key={event.id} className="rounded-xl border border-titanium bg-carbon-2 p-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-nova-accent-strong">{event.eventName.replace(/_/g, " ")}</span>
                    <span className="text-xs text-nova-ink-faint">{formatDate(event.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-nova-ink-muted">{event.summary}</p>
                  <p className="mt-1 text-xs text-nova-ink-faint">via {event.actorKind}</p>
                </li>
              ))}
          </ol>
        )}
      </Section>

      {artifacts.length > 0 && (
        <Section title="Artifacts">
          <ul className="space-y-2">
            {artifacts.map((artifact) => (
              <li key={artifact.id} className="rounded-xl border border-titanium bg-carbon-2 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-nova-ink-faint">{artifact.artifactType.replace(/_/g, " ")}</p>
                <p className="mt-1 text-sm font-medium text-nova-ink">{artifact.label}</p>
                {artifact.content && <pre className="mt-2 overflow-x-auto text-xs text-nova-ink-muted">{artifact.content}</pre>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {approvals.length > 0 && (
        <Section title="Decisions">
          <ul className="space-y-2">
            {approvals.map((approval) => (
              <li key={approval.id} className="flex items-baseline justify-between gap-3 rounded-xl border border-titanium bg-carbon-2 p-3.5">
                <span className="text-sm text-nova-ink">
                  {approval.approvalType} — {approval.decision.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-nova-ink-faint">{formatDate(approval.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-nova-ink-faint">{label}</dt>
      <dd className={`mt-1 truncate text-sm text-nova-ink ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-nova-ink-faint">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-nova-ink-faint">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-nova-ink-muted">{value}</p>
    </div>
  );
}
