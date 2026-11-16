import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTask, listTaskArtifacts } from "@/lib/founder-agent/repository";
import { ReviewActions } from "./ReviewActions";

export const metadata: Metadata = { title: "Review — Founder Control" };

/**
 * The Review screen: summary, diff/files-changed, test/lint/build
 * results, and the three decisions — everything the brief's Review
 * section asks for except screenshots, which have no real pipeline
 * producing them yet (see docs/founder-agent/architecture.md §7). A
 * placeholder image here would be the exact "fake UI" the brief rules
 * out, so this section is simply absent until a real one exists.
 */
export default async function FounderTaskReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const taskResult = await getTask(supabase, id);
  if (!taskResult.ok || !taskResult.data) notFound();
  const task = taskResult.data;

  if (task.status !== "review_ready") {
    return (
      <div>
        <BackLink taskId={id} />
        <p className="mt-6 text-sm text-nova-ink-faint">
          This task is &quot;{task.status.replace(/_/g, " ")}&quot; and is not currently awaiting review.
        </p>
      </div>
    );
  }

  const artifactsResult = await listTaskArtifacts(supabase, id);
  const artifacts = artifactsResult.ok ? artifactsResult.data : [];
  const diffSummary = artifacts.find((a) => a.artifactType === "diff_summary");
  const filesChanged = artifacts.find((a) => a.artifactType === "files_changed");
  const checks = artifacts.filter((a) => ["typescript_result", "eslint_result", "vitest_result", "build_result"].includes(a.artifactType));
  const warnings = artifacts.filter((a) => a.artifactType === "security_warning");

  return (
    <div>
      <BackLink taskId={id} />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-nova-ink">Review</h1>
      <p className="mt-2 text-sm text-nova-ink-faint">{task.title}</p>

      {task.prUrl && (
        <a href={task.prUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-nova-accent-strong hover:text-nova-ink">
          View the pull request on GitHub →
        </a>
      )}

      {diffSummary?.content && (
        <Section title="What changed">
          <pre className="overflow-x-auto rounded-xl border border-titanium bg-carbon-2 p-3.5 text-xs leading-5 text-nova-ink-muted">{diffSummary.content}</pre>
        </Section>
      )}

      {filesChanged?.content && (
        <Section title="Files changed">
          <pre className="overflow-x-auto rounded-xl border border-titanium bg-carbon-2 p-3.5 text-xs leading-5 text-nova-ink-muted">{filesChanged.content}</pre>
        </Section>
      )}

      {checks.length > 0 ? (
        <Section title="Quality gate">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {checks.map((check) => (
              <div key={check.id} className="rounded-xl border border-titanium bg-carbon-2 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-nova-ink-faint">{check.artifactType.replace(/_result/, "").replace(/_/g, " ")}</p>
                <p className="mt-1 text-sm text-nova-ink">{check.label}</p>
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <Section title="Quality gate">
          <p className="text-sm text-nova-ink-faint">
            No structured quality-gate artifact has been recorded for this task yet — see docs/founder-agent/architecture.md §7. Check the
            linked pull request&apos;s own CI status directly until artifact parsing lands.
          </p>
        </Section>
      )}

      {warnings.length > 0 && (
        <Section title="Security warnings">
          <ul className="space-y-2">
            {warnings.map((warning) => (
              <li key={warning.id} className="rounded-xl border border-red-400/30 bg-red-400/5 p-3.5 text-sm text-red-400">
                {warning.label}
                {warning.content && <p className="mt-1 text-xs text-red-400/80">{warning.content}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Decision">
        <ReviewActions taskId={id} />
      </Section>
    </div>
  );
}

function BackLink({ taskId }: { taskId: string }) {
  return (
    <Link href={`/founder/tasks/${taskId}`} className="inline-flex items-center gap-1.5 text-sm text-nova-ink-faint hover:text-nova-ink">
      <ArrowLeft size={14} />
      Back to task
    </Link>
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
