import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { VENDOR_CATALOG } from "@/components/donna-ai/vendor-intelligence/catalog";
import { handleProductKnowledgeRequest } from "@/components/donna-ai/vendor-intelligence/evidence-graph/persistence/handle-product-knowledge-request";
import { PageLoadError } from "@/components/ui/page-load-error";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const platform = VENDOR_CATALOG.find((p) => p.id === slug);
  return { title: platform ? `${platform.vendor} ${platform.productName} — Vendor Intelligence — ClouDonna` : "Vendor Intelligence — ClouDonna" };
}

const MATURITY_LABEL: Record<string, string> = { emerging: "Emerging", developing: "Developing", established: "Established", leading: "Leading" };

function MaturityCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-titanium bg-carbon-2 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-nova-ink-faint">{label}</p>
      <p className="mt-0.5 text-sm text-nova-ink">{MATURITY_LABEL[value] ?? value}</p>
    </div>
  );
}

export default async function VendorIntelligenceProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const platform = VENDOR_CATALOG.find((p) => p.id === slug);
  if (!platform) notFound();

  let loadError = false;
  let knowledge: Awaited<ReturnType<typeof handleProductKnowledgeRequest>>["body"] | null = null;

  try {
    const user = await getCurrentUser();
    const supabase = await createSupabaseServerClient();
    const result = await handleProductKnowledgeRequest(slug, supabase, user?.id ?? null);
    knowledge = result.body;
  } catch (error) {
    console.error("[app/vendor-intelligence/[slug]] page_load_failed:", error instanceof Error ? error.message : error);
    loadError = true;
  }

  const claims = knowledge && "claims" in knowledge ? knowledge.claims : [];
  const coverage = knowledge && "coverage" in knowledge ? knowledge.coverage : null;

  return (
    <div>
      <Link href="/app/decisions" className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-muted transition duration-200 hover:text-nova-ink">
        <ArrowLeft size={15} />
        Back
      </Link>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">
            {platform.vendor} {platform.productName}
          </h1>
          <p className="mt-1 text-sm text-nova-ink-muted">{platform.vendorCategory}</p>
        </div>
        <span className="rounded-full border border-titanium px-3 py-1 text-xs text-nova-ink-faint">Last reviewed {platform.lastReviewedDate}</span>
      </div>

      <p className="mt-4 max-w-[70ch] text-sm leading-6 text-nova-ink-muted">{platform.shortDescription}</p>

      {loadError && (
        <div className="mt-8">
          <PageLoadError />
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-titanium bg-carbon p-5">
        <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Profile</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MaturityCell label="Cloud model" value={platform.cloudModel} />
          <MaturityCell label="Consumption model" value={platform.consumptionModel} />
          <MaturityCell label="Operating model" value={platform.operatingModel} />
          <MaturityCell label="Region availability" value={platform.regionAvailability} />
          <MaturityCell label="Governance" value={platform.governance} />
          <MaturityCell label="Security" value={platform.security} />
          <MaturityCell label="AI capabilities" value={platform.aiCapabilities} />
          <MaturityCell label="Cost tier" value={platform.costTier} />
        </div>
        {platform.skillsRequired.length > 0 && (
          <p className="mt-3 text-xs text-nova-ink-faint">Skills: {platform.skillsRequired.join(", ")}</p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-titanium bg-carbon p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Evidence-backed capability claims</p>
          {coverage && (
            <div className="flex flex-wrap gap-3 text-xs text-nova-ink-faint">
              <span>
                {coverage.capabilityCoverage.covered} / {coverage.capabilityCoverage.total} categories covered
              </span>
              <span>{coverage.conflictCount} conflicts</span>
              <span>{coverage.unknownCount} unknown</span>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm leading-6 text-nova-ink-muted">
          Canonical, evidence-backed facts about this product — never fabricated. A missing capability here means not yet assessed, not unsupported.
        </p>

        {claims.length === 0 ? (
          <p className="mt-4 text-sm text-nova-ink-faint">No canonical vendor knowledge recorded for this product yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-titanium">
            {claims.map((claim) => (
              <li key={claim.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-nova-ink-faint">
                  <span>{claim.capabilityKey.replace(/_/g, " ")}</span>
                  <span>· {claim.verificationStatus.replace(/_/g, " ")}</span>
                  <span>· {claim.freshness}</span>
                  {claim.lastVerifiedAt && <span>· verified {claim.lastVerifiedAt.slice(0, 10)}</span>}
                </div>
                <p className="mt-1 text-sm text-nova-ink">{claim.claim}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
