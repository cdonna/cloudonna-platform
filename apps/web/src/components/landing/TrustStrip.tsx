import { SecondaryAction, Shell } from "@/components/editorial/primitives";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";

/**
 * The independence statement, as a hairline band rather than a card with
 * a shield icon in a rounded tile. The claim is strong enough to carry
 * itself typographically; an icon only made it look like a feature.
 */
export default function TrustStrip({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <section className="bg-paper py-14">
      <Shell>
        <div className="flex flex-col gap-6 border-y border-rule py-10 lg:flex-row lg:items-baseline lg:justify-between lg:gap-12">
          <p className="max-w-[58ch] text-[1.0625rem] leading-7 text-ink-2">
            <span className="text-ink">{dict.trustStrip.boldPart}</span> {dict.trustStrip.rest}
          </p>

          <SecondaryAction href={`/${locale}/independence`} className="shrink-0">
            {dict.trustStrip.linkText.replace(" →", "")}
          </SecondaryAction>
        </div>
      </Shell>
    </section>
  );
}
