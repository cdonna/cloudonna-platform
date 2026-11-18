import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { listCommercialAccounts } from "@/lib/commercial/repository";
import { ACCOUNT_STATUS_LABELS } from "@/lib/commercial/account-status";
import { CreateAccountForm } from "./CreateAccountForm";

export const metadata: Metadata = {
  title: "Commercial Accounts — ClouDonna",
};

/** Account list (brief §4/§37) — platform-staff only, same access
 * check as /app/commercial. */
export default async function CommercialAccountsPage() {
  const user = await getCurrentUser();
  if (!user) return <Restricted reason="Sign in to view this page." />;

  const supabase = await createSupabaseServerClient();
  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return <Restricted reason="This area is restricted to ClouDonna platform staff." />;

  const result = await listCommercialAccounts(supabase);
  const accounts = result.ok ? result.data : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Accounts</h1>
          <p className="mt-2 text-sm text-nova-ink-muted">Every commercial account — prospect through customer through expansion.</p>
        </div>
        <CreateAccountForm />
      </div>

      {!result.ok && (
        <p role="alert" className="mt-6 text-sm text-red-400">
          {result.reason}
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-titanium">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-titanium text-xs text-nova-ink-faint">
              <th className="px-4 py-2 font-medium">Company</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Industry</th>
              <th className="px-4 py-2 font-medium">Country</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b border-titanium last:border-b-0">
                <td className="px-4 py-2 text-nova-ink">{a.name}</td>
                <td className="px-4 py-2 text-nova-ink-muted">{ACCOUNT_STATUS_LABELS[a.status]}</td>
                <td className="px-4 py-2 text-nova-ink-muted">{a.industry ?? "—"}</td>
                <td className="px-4 py-2 text-nova-ink-muted">{a.country ?? "—"}</td>
                <td className="px-4 py-2">
                  <Link href={`/app/commercial/accounts/${a.id}`} className="text-nova-accent hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-nova-ink-faint">
                  No accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Restricted({ reason }: { reason: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Accounts</h1>
      <p className="mt-4 text-sm text-nova-ink-muted">{reason}</p>
    </div>
  );
}
