"use client";

import { Disclosure, FrameField, FramePanel, RuledList, Tag } from "@/components/editorial/primitives";
import { useLocale } from "@/i18n/LocaleProvider";
import type { ArchitecturePattern } from "./architecture-patterns";

export function ArchitecturePatternCard({ pattern }: { pattern: ArchitecturePattern }) {
  const { dict } = useLocale();
  const a = dict.architectsPage;

  return (
    <Disclosure title={pattern.name} summary={pattern.purpose}>
      <FrameField label={a.problemLabel}>{pattern.problem}</FrameField>

      <FrameField label={a.componentsLabel}>
        <RuledList items={pattern.components} />
      </FrameField>

      <FrameField label={dict.executiveBrief.tradeOffsHeading}>
        <RuledList items={pattern.tradeOffs} />
      </FrameField>

      <FrameField label={a.whatChangesLabel}>{pattern.whatChangesIt}</FrameField>

      <FrameField label={a.whoCaresLabel}>
        <div className="flex flex-wrap gap-1.5">
          {pattern.whoShouldCare.map((role) => (
            <Tag key={role}>{role}</Tag>
          ))}
        </div>
      </FrameField>

      <FramePanel tone="accent">
        <FrameField label={a.cfoNoteLabel}>{pattern.cfoNote}</FrameField>
      </FramePanel>
    </Disclosure>
  );
}
