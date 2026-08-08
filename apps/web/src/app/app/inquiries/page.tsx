import type { Metadata } from "next";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { listInquiriesForStaff, type InquirySummary } from "@/lib/inquiries/repository";
import { StatusSelect } from "./StatusSelect";

export const metadata: Metadata = {
  title: "Inquiries — ClouDonna",
};

const TYPE_LABELS: Record<string, string> = {
  founding_tester: "Founding Tester",
  enterprise: "Enterprise",
  partner: "Partner",
  vendor: "Vendor",
  general: "General",
};

/**
 * Staff-gated inbox, not a CRM — see docs/operations/05-inquiry-system-v2.md,
 * "This is an inbox, nothing more." Access is checked by calling the
 * is_platform_staff() RLS predicate directly (RPC) rather than trusting
 * anything client-side — the same function that already gates every
 * row of the inquiries table itself, so this check and the data it
 * protects can never drift apart.
 */
export default async function InquiriesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <RestrictedNotice reason="Sign in to view this page." />;
  }

  const supabase = await createSupabaseServerClient();
  const { data: isStaff } = await supabase.rpc("is_platform_staff");

  if (!isStaff) {
    return <RestrictedNotice reason="This area is restricted to ClouDonna platform staff." />;
  }

  const result = await listInquiriesForStaff(supabase);
  const inquiries = result.ok ? result.data : [];

  const counts = summarize(inquiries);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Inquiries</h1>
      <p className="mt-2 text-sm text-nova-ink-muted">Every inquiry across every public entry point, in one place.</p>

      {!result.ok && (
        <p role="alert" className="mt-6 text-sm text-red-400">
          {result.reason}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard label="New" value={counts.byStatus.new ?? 0} />
        <SummaryCard label="Founding Testers" value={counts.byType.founding_tester ?? 0} />
        <SummaryCard label="Enterprise" value={counts.byType.enterprise ?? 0} />
        <SummaryCard label="Partners" value={counts.byType.partner ?? 0} />
        <SummaryCard label="Vendors" value={counts.byType.vendor ?? 0} />
        <SummaryCard label="Countries" value={counts.countries} />
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold tracking-wide text-nova-ink-muted uppercase">All inquiries</h2>

        {inquiries.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-titanium bg-carbon p-10 text-center">
            <p className="text-sm text-nova-ink-muted">No inquiries yet.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-titanium bg-carbon">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-titanium bg-carbon-2 text-xs font-semibold tracking-wide text-nova-ink-muted uppercase">
                <tr>
                  <th className="px-5 py-3">Name / Company</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Message</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-titanium">
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="align-top transition-colors duration-control hover:bg-carbon-2">
                    <td className="px-5 py-4">
                      <div className="font-medium text-nova-ink">{inquiry.name}</div>
                      <div className="text-xs text-nova-ink-faint">{inquiry.businessEmail}</div>
                      {inquiry.company && <div className="text-xs text-nova-ink-faint">{inquiry.company}</div>}
                    </td>
                    <td className="px-5 py-4 text-nova-ink-muted">{TYPE_LABELS[inquiry.inquiryType] ?? inquiry.inquiryType}</td>
                    <td className="px-5 py-4 font-mono text-xs text-nova-ink-faint">{inquiry.sourcePage ?? "—"}</td>
                    <td className="px-5 py-4 max-w-xs text-nova-ink-muted">
                      <span className="line-clamp-2">{inquiry.message ?? "—"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusSelect inquiryId={inquiry.id} initialStatus={inquiry.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-nova-ink-muted">{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function summarize(inquiries: InquirySummary[]) {
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const countrySet = new Set<string>();

  for (const inquiry of inquiries) {
    byType[inquiry.inquiryType] = (byType[inquiry.inquiryType] ?? 0) + 1;
    byStatus[inquiry.status] = (byStatus[inquiry.status] ?? 0) + 1;
    if (inquiry.country) countrySet.add(inquiry.country);
  }

  return { byType, byStatus, countries: countrySet.size };
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <div className="text-2xl font-semibold tracking-tight text-nova-ink">{value}</div>
      <div className="mt-1 text-xs text-nova-ink-faint">{label}</div>
    </div>
  );
}

function RestrictedNotice({ reason }: { reason: string }) {
  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-10 text-center">
      <p className="text-sm text-nova-ink-muted">{reason}</p>
    </div>
  );
}
