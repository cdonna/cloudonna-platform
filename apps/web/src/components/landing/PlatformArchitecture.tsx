import { ArrowDown } from "lucide-react";
import { Display, Eyebrow, Lede, ProductFrame, Section, Shell } from "@/components/editorial/primitives";
import { ARCHITECTURE_FACETS, ARCHITECTURE_STACK, INTEGRATION_BADGES, type ArchitectureStatus } from "@/components/landing/architecture-stack";
import type { Dictionary } from "@/i18n/dictionary";

/**
 * The brief's §12 Technology / Architecture section: a real stack, not
 * a logo wall. Every layer's status (Available / Planned /
 * Architectural direction) was set by checking this repository, not
 * chosen for how impressive it would look — see architecture-stack.ts.
 */
const STATUS_TONE: Record<ArchitectureStatus, string> = {
  available: "text-sig-positive border-sig-positive/40 bg-sig-positive/10",
  planned: "text-gold border-gold/40 bg-gold-wash",
  direction: "text-ink-3 border-rule-2 bg-transparent",
};

function StatusBadge({ status, label }: { status: ArchitectureStatus; label: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.625rem] font-medium tracking-[0.1em] uppercase ${STATUS_TONE[status]}`}>
      {label}
    </span>
  );
}

export default function PlatformArchitecture({ dict }: { dict: Dictionary }) {
  const p = dict.architectureSection;
  const statusLabels: Record<ArchitectureStatus, string> = {
    available: p.statusAvailable,
    planned: p.statusPlanned,
    direction: p.statusDirection,
  };

  return (
    <Section size="lg" register="dark">
      <Shell>
        <div className="max-w-[44rem]">
          <Eyebrow>{p.eyebrow}</Eyebrow>
          <Display size={2} className="mt-7">
            {p.heading}
          </Display>
          <Lede className="mt-7">{p.body}</Lede>
        </div>

        <ProductFrame className="mt-14" label={p.frame}>
          <div className="p-6 sm:p-10">
            {/* The four sequential layers. */}
            <div className="mx-auto max-w-[32rem] space-y-3">
              {ARCHITECTURE_STACK.map((layer, index) => (
                <div key={layer.id}>
                  <div className="rounded-lg border border-rule bg-paper-2 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink">{layer.label}</span>
                      <StatusBadge status={layer.status} label={statusLabels[layer.status]} />
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-ink-3">{layer.note}</p>
                  </div>
                  {index < ARCHITECTURE_STACK.length - 1 && (
                    <div className="flex justify-center py-1.5">
                      <ArrowDown size={14} aria-hidden="true" className="text-ink-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center py-1.5">
              <ArrowDown size={14} aria-hidden="true" className="text-ink-3" />
            </div>

            {/* The four parallel facets — side by side, since none
                depends on the others running first. */}
            <div className="mx-auto grid max-w-[56rem] gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ARCHITECTURE_FACETS.map((facet) => (
                <div key={facet.id} className="rounded-lg border border-rule bg-paper-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{facet.label}</span>
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={facet.status} label={statusLabels[facet.status]} />
                  </div>
                  <p className="mt-2.5 text-xs leading-5 text-ink-3">{facet.note}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center py-1.5">
              <ArrowDown size={14} aria-hidden="true" className="text-ink-3" />
            </div>

            {/* Enterprise Data & Systems — every badge is honestly
                "architectural direction" today; see
                architecture-stack.ts's own comment on why that is
                stated plainly rather than omitted. */}
            <div className="mx-auto max-w-[40rem] rounded-lg border border-dashed border-rule-2 p-5 text-center">
              <div className="font-mono text-label font-medium text-ink-3 uppercase">{p.integrationsLabel}</div>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {INTEGRATION_BADGES.map((badge) => (
                  <span key={badge.name} className="rounded-full border border-rule-2 px-3 py-1 text-xs text-ink-2">
                    {badge.name}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-ink-3">{p.integrationsNote}</p>
            </div>
          </div>
        </ProductFrame>
      </Shell>
    </Section>
  );
}
