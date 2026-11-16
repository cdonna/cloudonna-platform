import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTask } from "@/lib/founder-agent/repository";
import { MergeConfirm } from "./MergeConfirm";

export const metadata: Metadata = { title: "Merge — Founder Control" };

export default async function FounderTaskMergePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const taskResult = await getTask(supabase, id);
  if (!taskResult.ok || !taskResult.data) notFound();
  const task = taskResult.data;

  return (
    <div>
      <Link href={`/founder/tasks/${id}`} className="inline-flex items-center gap-1.5 text-sm text-nova-ink-faint hover:text-nova-ink">
        <ArrowLeft size={14} />
        Back to task
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-nova-ink">Merge approval</h1>
      <p className="mt-2 text-sm text-nova-ink-faint">{task.title}</p>

      {task.status !== "approved" && task.status !== "merge_ready" ? (
        <p className="mt-6 text-sm text-nova-ink-faint">This task is &quot;{task.status.replace(/_/g, " ")}&quot; and is not ready to merge.</p>
      ) : (
        <div className="mt-6">
          <MergeConfirm taskId={id} branchName={task.branchName ?? "(no branch)"} />
        </div>
      )}
    </div>
  );
}
