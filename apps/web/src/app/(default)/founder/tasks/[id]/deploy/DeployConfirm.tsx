"use client";

import { useState } from "react";
import { Rocket } from "lucide-react";
import { deployTaskAction } from "../../../actions";

/**
 * The separate "Deploy current main to production?" confirmation.
 * Calling this always returns 501 today — see
 * handle-deploy-task-request.ts. The screen still exists, for real,
 * because the brief asks for deployment approval to be *designed* even
 * while disabled: a founder can see exactly what this screen will do
 * once deployment is enabled, and exactly why it isn't yet.
 */
export function DeployConfirm({ taskId }: { taskId: string }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ error: string | null; disabled?: boolean } | null>(null);

  async function confirmDeploy() {
    setPending(true);
    const outcome = await deployTaskAction(taskId);
    setPending(false);
    setResult(outcome);
  }

  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <p className="text-sm font-medium text-nova-ink">Deploy current main to production?</p>
      <p className="mt-1.5 text-sm text-nova-ink-faint">
        Production deployment approval is designed but intentionally disabled in this environment.
      </p>

      <button
        type="button"
        disabled={pending}
        onClick={confirmDeploy}
        className="mt-4 flex h-11 items-center gap-2 rounded-xl border border-titanium px-4 text-sm font-medium text-nova-ink-faint disabled:opacity-60"
      >
        <Rocket size={16} />
        {pending ? "Checking…" : "Yes, deploy"}
      </button>

      {result && (
        <p className={`mt-3 text-sm ${result.disabled ? "text-nova-ink-faint" : "text-red-400"}`} role={result.error ? "alert" : undefined}>
          {result.error}
        </p>
      )}
    </div>
  );
}
