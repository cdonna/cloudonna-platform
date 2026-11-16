"use client";

import { ArrowRight } from "lucide-react";
import { FrameField, ProductFrame, RuledList } from "@/components/editorial/primitives";
import { useLocale } from "@/i18n/LocaleProvider";
import type { ArchitectureTransformation } from "./architecture-transformations";

/**
 * The before/after view, promoted from a card into a full product
 * canvas — this is the closest thing the Architects page has to a large
 * architecture visualization, so it gets the width to work as one. The
 * two columns are a real contrast, not two identically-styled lists:
 * "before" is quiet and sunken, "after" carries the accent.
 */
export function ArchitectureTransformationCard({ transformation }: { transformation: ArchitectureTransformation }) {
  const { dict } = useLocale();
  const a = dict.architectsPage;

  return (
    <ProductFrame label={`${a.transformationHeading} · ${transformation.title}`} meta={dict.showcase.illustrativeLabel}>
      <div className="relative grid gap-px bg-rule lg:grid-cols-2">
        <div className="bg-paper-3 p-6 sm:p-8">
          <div className="font-mono text-label font-medium text-ink-3 uppercase">{a.beforeLabel}</div>
          <div className="mt-5">
            <RuledList items={transformation.beforeItems} />
          </div>
        </div>

        <div className="bg-paper p-6 sm:p-8">
          <div className="font-mono text-label font-medium text-accent uppercase">{a.afterLabel}</div>
          <div className="mt-5">
            <RuledList items={transformation.afterItems} tone="accent" />
          </div>
        </div>

        {/* The direction of travel, stated once in the gutter rather than
            implied by column order alone. */}
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-rule bg-paper text-accent lg:flex"
        >
          <ArrowRight size={15} />
        </span>
      </div>

      <div className="grid gap-px border-t border-rule bg-rule lg:grid-cols-2">
        <div className="bg-paper p-6 sm:p-8">
          <FrameField label={a.architectureImpactLabel}>{transformation.architectureImpact}</FrameField>
        </div>
        <div className="bg-paper p-6 sm:p-8">
          <FrameField label={a.businessImpactLabel}>{transformation.businessImpact}</FrameField>
        </div>
      </div>
    </ProductFrame>
  );
}
