"use client";

/**
 * Vendor Knowledge Panel (brief §50/§51) — opened from a decision
 * option, inside Analyst Mode only (never Executive Mode, per the
 * brief's own instruction not to overwhelm the executive view). Every
 * number here is read directly from
 * /api/vendor-intelligence/decisions/[id]/products/[slug], which in
 * turn reads real vendor_capability_claims rows — nothing here is
 * computed client-side or decorative.
 */
import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, LoaderCircle } from "lucide-react";
import { SectionLabel } from "../shared";
import type { RankedPlatform } from "../scoring/types";

interface ProductKnowledgeClaim {
  id: string;
  capabilityKey: string;
  claim: string;
  verificationStatus: string;
  lifecycleStatus: string;
  evidenceQuality: string | null;
  freshness: string;
  scope: string;
  lastVerifiedAt: string | null;
  version: number;
}

interface ProductKnowledgeResponse {
  productSlug: string;
  productDisplayName: string;
  claims: ProductKnowledgeClaim[];
  coverage: {
    capabilityCoverage: { covered: number; total: number };
    evidenceCoverage: { withEvidence: number; total: number };
    freshnessCoverage: { current: number; aging: number; stale: number; unknown: number };
    conflictCount: number;
    unknownCount: number;
  };
}

interface ClaimTraceResponse {
  claim: { id: string; claim: string; verificationStatus: string };
  evidence: Array<{
    evidence: { id: string; polarity: string; excerpt: string | null; confidence: string };
    source: { id: string; title: string; publisher: string; retrievedUrl: string; publishedAt: string | null; retrievedAt: string; sourceCategory: string };
  }>;
}

const STATUS_STYLE: Record<string, string> = {
  verified: "border-nova-success/30 text-nova-success",
  partially_verified: "border-nova-warning/30 text-nova-warning",
  conflicted: "border-red-400/30 text-red-400",
  stale: "border-nova-warning/30 text-nova-warning",
  unknown: "border-titanium text-nova-ink-faint",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_STYLE[status] ?? "border-titanium text-nova-ink-faint"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ClaimRow({ claim }: { claim: ProductKnowledgeClaim }) {
  const [expanded, setExpanded] = useState(false);
  const [trace, setTrace] = useState<ClaimTraceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (trace) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/vendor-intelligence/claims/${claim.id}/trace`);
      if (response.ok) setTrace(await response.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <li className="border-b border-titanium py-2.5 last:border-b-0">
      <button type="button" onClick={() => void toggle()} className="flex w-full items-start gap-2 text-left">
        {expanded ? <ChevronDown size={14} className="mt-0.5 shrink-0 text-nova-ink-faint" /> : <ChevronRight size={14} className="mt-0.5 shrink-0 text-nova-ink-faint" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={claim.verificationStatus} />
            <span className="text-[10px] uppercase tracking-wide text-nova-ink-faint">{claim.capabilityKey.replace(/_/g, " ")}</span>
            <span className="text-[10px] text-nova-ink-faint">· {claim.freshness}</span>
            <span className="text-[10px] text-nova-ink-faint">· {claim.scope === "global" ? "Global" : "Organization-private"}</span>
          </div>
          <p className="mt-1 text-sm text-nova-ink">{claim.claim}</p>
        </div>
      </button>
      {expanded && (
        <div className="mt-2 ml-5 space-y-2 border-l border-titanium pl-3">
          {loading && (
            <p className="flex items-center gap-1.5 text-xs text-nova-ink-faint">
              <LoaderCircle size={12} className="animate-spin" /> Loading evidence…
            </p>
          )}
          {!loading && trace && trace.evidence.length === 0 && <p className="text-xs text-nova-ink-faint">No evidence recorded for this claim yet.</p>}
          {!loading &&
            trace?.evidence.map(({ evidence, source }) => (
              <div key={evidence.id} className="text-xs leading-5">
                <a href={source.retrievedUrl} target="_blank" rel="noreferrer" className="font-medium text-nova-accent-strong hover:underline">
                  {source.title}
                </a>
                <span className="text-nova-ink-faint"> — {source.publisher}</span>
                <div className="text-nova-ink-faint">
                  {evidence.polarity === "contradicts" ? "Contradicts" : "Supports"} · {source.sourceCategory.replace(/_/g, " ")} ·{" "}
                  {source.publishedAt ? `published ${source.publishedAt}` : "publish date unknown"} · confidence {evidence.confidence}
                </div>
                {evidence.excerpt && <p className="mt-0.5 text-nova-ink-muted italic">&ldquo;{evidence.excerpt}&rdquo;</p>}
              </div>
            ))}
        </div>
      )}
    </li>
  );
}

export function VendorKnowledgePanel({ decisionId, baseRanked }: { decisionId: string; baseRanked: RankedPlatform[] }) {
  const [selectedSlug, setSelectedSlug] = useState(baseRanked[0]?.platform.id ?? "");
  const [data, setData] = useState<ProductKnowledgeResponse | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "loaded" | "error">("idle");

  async function load(slug: string) {
    setSelectedSlug(slug);
    setState("loading");
    try {
      const response = await fetch(`/api/vendor-intelligence/decisions/${decisionId}/products/${slug}`);
      if (!response.ok) {
        setState("error");
        return;
      }
      setData(await response.json());
      setState("loaded");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel>Vendor knowledge</SectionLabel>
        <select
          value={selectedSlug}
          onChange={(e) => void load(e.target.value)}
          className="h-9 rounded-lg border border-titanium bg-carbon-2 px-2 text-sm text-nova-ink"
        >
          {baseRanked.map((r) => (
            <option key={r.platform.id} value={r.platform.id}>
              {r.platform.vendor} {r.platform.productName}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-sm leading-6 text-nova-ink-muted">
        Canonical, evidence-backed capability claims for the selected option — distinct from this decision&apos;s own live research and private evidence.
      </p>

      {state === "idle" && (
        <button type="button" onClick={() => void load(selectedSlug)} className="mt-4 text-sm font-medium text-nova-accent-strong hover:underline">
          Load vendor knowledge for {baseRanked.find((r) => r.platform.id === selectedSlug)?.platform.productName ?? "this option"}
        </button>
      )}
      {state === "loading" && (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-nova-ink-faint">
          <LoaderCircle size={14} className="animate-spin" /> Loading…
        </p>
      )}
      {state === "error" && <p className="mt-4 text-sm text-red-400">Vendor knowledge could not be loaded.</p>}

      {state === "loaded" && data && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-nova-ink-faint">
            <span>
              {data.coverage.capabilityCoverage.covered} / {data.coverage.capabilityCoverage.total} capability categories covered
            </span>
            <span>
              {data.coverage.evidenceCoverage.withEvidence} / {data.coverage.evidenceCoverage.total} claims have evidence
            </span>
            {data.coverage.conflictCount > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <AlertTriangle size={12} /> {data.coverage.conflictCount} conflict{data.coverage.conflictCount === 1 ? "" : "s"}
              </span>
            )}
            {data.coverage.unknownCount > 0 && <span>{data.coverage.unknownCount} unknown</span>}
          </div>

          {data.claims.length === 0 ? (
            <p className="mt-4 text-sm text-nova-ink-faint">No canonical vendor knowledge recorded for this product yet. Unknown, not unsupported.</p>
          ) : (
            <ul className="mt-4">
              {data.claims.map((claim) => (
                <ClaimRow key={claim.id} claim={claim} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
