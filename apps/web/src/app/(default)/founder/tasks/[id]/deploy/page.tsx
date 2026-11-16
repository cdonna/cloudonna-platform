import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTask } from "@/lib/founder-agent/repository";
import { DeployConfirm } from "./DeployConfirm";

export const metadata: Metadata = { title: "Deploy — Founder Control" };

export default async function FounderTaskDeployPage({ params }: { params: Promise<{ id: string }> }) {
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

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-nova-ink">Deploy approval</h1>
      <p className="mt-2 text-sm text-nova-ink-faint">{task.title}</p>

      <div className="mt-6">
        <DeployConfirm taskId={id} />
      </div>
    </div>
  );
}
