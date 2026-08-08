import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBillingSummaryForOrganization, getPrimaryOrganizationForCurrentUser } from "@/lib/billing/billing-repository";
import { getEntitlementsForOrganization } from "@/lib/entitlements/resolver";
import type { BooleanEntitlementKey } from "@/lib/entitlements/types";

export const metadata: Metadata = {
  title: "Billing — ClouDonna",
};

const ENTITLEMENT_LABELS: Record<BooleanEntitlementKey, string> = {
  decision_memory: "Decision Memory",
  decision_replay: "Decision Replay",
  evidence_intelligence: "Evidence Intelligence",
  executive_reports: "Executive Reports",
  api_access: "API access",
  advanced_governance: "Advanced governance",
};

const BOOLEAN_ENTITLEMENT_KEYS = Object.keys(ENTITLEMENT_LABELS) as BooleanEntitlementKey[];

/**
 * No pricing, no checkout form, no card input anywhere on this page —
 * deliberately. Pricing has not been Founder-approved
 * (docs/commercial/01-billing-architecture.md §10), so every plan is
 * shown as "Contact / Early Access" rather than an invented number, and
 * the only action available is a link to the existing lead-capture flow
 * (/early-access), never a payment form. See that document's Commercial
 * Activation Gate for exactly what has to happen before this page can
 * show a real "Upgrade" button.
 */
export default async function BillingSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const organization = await getPrimaryOrganizationForCurrentUser(supabase);

  if (!organization) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Billing</h1>
        <p className="mt-4 text-sm text-nova-ink-muted">No organization found for your account yet.</p>
      </div>
    );
  }

  const [billing, entitlements] = await Promise.all([
    getBillingSummaryForOrganization(supabase, organization.organizationId),
    getEntitlementsForOrganization(supabase, organization.organizationId),
  ]);

  const isAdmin = organization.role === "owner" || organization.role === "admin";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Billing</h1>
      <p className="mt-2 text-sm text-nova-ink-muted">{organization.organizationName}</p>

      <div className="mt-8 rounded-2xl border border-titanium bg-carbon p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon-2 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-nova-accent-strong uppercase">
              <Sparkles size={13} />
              Current plan
            </div>
            <p className="mt-3 text-xl font-semibold text-nova-ink">{billing.planDisplayName}</p>
            <p className="mt-1 text-sm text-nova-ink-muted">
              {billing.status === null
                ? "Founding Tester access — no payment on file, no renewal, no expiration date."
                : `Status: ${billing.status}${billing.cancelAtPeriodEnd ? " (cancels at period end)" : ""}`}
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/early-access"
              className="inline-flex h-10 items-center rounded-xl bg-nova-accent px-4 text-sm font-medium text-white shadow-nova-glow transition duration-200 hover:bg-nova-accent-strong"
            >
              Contact / Early Access
            </Link>
          )}
        </div>

        {!isAdmin && (
          <p className="mt-4 text-xs text-nova-ink-faint">
            Billing is managed by an organization owner or admin. Contact one of them to make changes.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-titanium bg-carbon p-6">
        <h2 className="text-sm font-semibold tracking-wide text-nova-ink uppercase">What&apos;s included</h2>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {BOOLEAN_ENTITLEMENT_KEYS.map((key) => {
            const included = entitlements[key];
            return (
              <li key={key} className="flex items-center gap-2.5 text-sm">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${included ? "bg-nova-success" : "bg-nova-ink-faint"}`}
                />
                <span className={included ? "text-nova-ink" : "text-nova-ink-faint line-through"}>{ENTITLEMENT_LABELS[key]}</span>
              </li>
            );
          })}
        </ul>

        <dl className="mt-6 grid gap-4 border-t border-titanium pt-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs tracking-wide text-nova-ink-faint uppercase">Users</dt>
            <dd className="mt-1 text-sm font-medium text-nova-ink">up to {entitlements.max_users}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-nova-ink-faint uppercase">Workspaces</dt>
            <dd className="mt-1 text-sm font-medium text-nova-ink">up to {entitlements.max_workspaces}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-nova-ink-faint uppercase">Decisions / month</dt>
            <dd className="mt-1 text-sm font-medium text-nova-ink">up to {entitlements.max_decisions_per_month}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-6 text-xs text-nova-ink-faint">
        ClouDonna is in Public Alpha. Subscription plans and pricing have not launched yet — every organization currently has full
        Founding Tester access at no cost, with no payment method required.
      </p>
    </div>
  );
}
