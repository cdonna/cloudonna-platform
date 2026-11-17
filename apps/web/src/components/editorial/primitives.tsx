/**
 * The editorial primitives every public ClouDonna page is now composed
 * from. Before this, each page re-implemented the same centred
 * badge + h1 + sub + `rounded-3xl border bg-carbon` card grid inline,
 * which is why twelve pages looked like one template with the nouns
 * swapped. The brief's "do not rewrite every component independently
 * where a shared component can solve the problem" is enforced here:
 * a page states its content and its register, not its paddings.
 *
 * Every colour below is a register-relative token (see globals.css), so
 * the same primitive is correct on warm paper and inside a dark section
 * without a second code path.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

type Register = "light" | "dark";

/** The one horizontal measure. Wider than the old max-w-4xl pages so a
 * product canvas can actually be large; the reading column is narrowed
 * per-block by `Measure`, not by shrinking the page. */
export function Shell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[82rem] px-6 sm:px-8 lg:px-12 ${className}`}>{children}</div>;
}

const SECTION_PADDING: Record<"sm" | "md" | "lg" | "xl", string> = {
  sm: "py-16 sm:py-20",
  md: "py-20 sm:py-28",
  lg: "py-24 sm:py-32 lg:py-40",
  xl: "py-28 sm:py-40 lg:py-52",
};

/**
 * `register="dark"` is the whole mechanism behind an intentional dark
 * section: it swaps the token values, so nothing inside needs a dark
 * variant. `tone="sunken"` is the ivory band on light / the deepest
 * black on dark — used to separate two adjacent sections without
 * mechanically alternating light and dark.
 */
export function Section({
  id,
  register = "light",
  tone = "default",
  size = "lg",
  className = "",
  children,
}: {
  id?: string;
  register?: Register;
  tone?: "default" | "sunken" | "raised";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children: ReactNode;
}) {
  const surface = tone === "sunken" ? "bg-paper-3" : tone === "raised" ? "bg-paper-2" : "bg-paper";
  return (
    <section
      id={id}
      className={`${register === "dark" ? "register-dark " : ""}${surface} text-ink ${id ? "scroll-mt-20 " : ""}${SECTION_PADDING[size]} ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * The eyebrow. Mono, uppercase, wide-tracked — the same typographic
 * voice as the section numerals and the evidence labels, because all
 * three are metadata about the argument rather than part of it. It
 * replaces the old pill badge (`rounded-full border bg-carbon px-4 py-2`)
 * that opened all twelve pages identically.
 */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-label font-medium text-ink-3 uppercase ${className}`}>
      {children}
    </p>
  );
}

/** The large numeral used as a section marker. Deliberately oversized and
 * quiet rather than small and loud. */
export function Numeral({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span aria-hidden="true" className={`block font-mono text-numeral font-medium text-ink/10 tabular-nums ${className}`}>
      {children}
    </span>
  );
}

const DISPLAY_SIZE = {
  1: "text-display",
  2: "text-display-2",
  3: "text-display-3",
} as const;

/**
 * Editorial headline. `level` is the heading level for the document
 * outline; `size` is the visual scale — kept separate so an h2 can be
 * the largest thing on a page without breaking the outline.
 */
export function Display({
  level = 2,
  size = 2,
  children,
  className = "",
}: {
  level?: 1 | 2 | 3;
  size?: 1 | 2 | 3;
  children: ReactNode;
  className?: string;
}) {
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  return <Tag className={`${DISPLAY_SIZE[size]} font-medium text-balance text-ink ${className}`}>{children}</Tag>;
}

/** The supporting statement under a headline. One size, one colour. */
export function Lede({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-lede text-ink-2 ${className}`}>{children}</p>;
}

/**
 * Primary action: one solid, maximum-contrast button per view. No
 * gradient, no glow, no brightness filter — the three things the old
 * CTA (a violet-to-coral gradient fill, a violet glow shadow, and a
 * brightness filter on hover) did, repeated on eleven pages.
 */
export function PrimaryAction({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-solid px-6 text-sm font-medium text-solid-on transition-colors duration-control ease-nova-settle hover:bg-accent hover:text-accent-on focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none ${className}`}
    >
      {children}
    </Link>
  );
}

/** Secondary action: a text link with an arrow. The arrow moves, nothing
 * else does. */
export function SecondaryAction({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-12 items-center gap-2 text-sm font-medium text-ink transition-colors duration-control hover:text-accent focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none ${className}`}
    >
      {children}
      <ArrowRight size={15} className="transition-transform duration-control ease-nova-settle group-hover:translate-x-0.5" />
    </Link>
  );
}

/**
 * The illustrative-example disclosure. Honesty is load-bearing in this
 * product, so this is a shared primitive rather than a string every page
 * styles slightly differently — and it is deliberately legible, not a
 * 10px grey afterthought.
 */
export function IllustrativeLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 border border-dashed border-rule-2 px-2.5 py-1 font-mono text-label font-medium text-ink-3 uppercase ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * A large product canvas. This is the component that makes "show product,
 * not marketing cards" structural: a dark, chrome-framed surface sized to
 * dominate its section, with its own register so everything inside it is
 * correct without a single dark: variant.
 *
 * `label` names the surface being shown (a real ClouDonna view), `meta`
 * carries the disclosure or state. Both render in the chrome bar, which
 * is what makes it read as an application rather than an image.
 */
export function ProductFrame({
  label,
  meta,
  children,
  className = "",
}: {
  label: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`register-dark overflow-hidden rounded-xl border border-rule bg-paper text-ink shadow-ed-raised ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-rule bg-paper-2 px-4 py-3 sm:flex-nowrap sm:px-5">
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
        <span className="min-w-0 flex-1 truncate font-mono text-label font-medium text-ink-3 uppercase">{label}</span>
        {meta && (
          <span className="shrink-0 basis-full pl-[1.125rem] font-mono text-label font-medium text-ink-3 uppercase sm:basis-auto sm:pl-0">
            {meta}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/** A labelled field inside a product canvas — the smallest unit the
 * canvases are built from, so a "landscape" panel and a "constraints"
 * panel are visibly the same kind of thing. */
export function FrameField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="font-mono text-label font-medium text-ink-3 uppercase">{label}</div>
      <div className="mt-2 text-sm leading-6 text-ink-2">{children}</div>
    </div>
  );
}

/** A panel inside a product canvas. */
export function FramePanel({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: "default" | "raised" | "accent" | "positive";
  className?: string;
}) {
  const surface =
    tone === "raised"
      ? "border-rule bg-paper-2"
      : tone === "accent"
        ? "border-accent/30 bg-accent-wash"
        : tone === "positive"
          ? "border-sig-positive/30 bg-sig-positive/10"
          : "border-rule bg-paper";
  return <div className={`rounded-lg border p-4 sm:p-5 ${surface} ${className}`}>{children}</div>;
}

/** A small value chip (a priority, a constraint, a parameter). Replaces
 * the pill-with-a-border that every page had its own spelling of. */
export function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-rule bg-paper-2 px-3 py-1.5 text-xs text-ink-2 ${className}`}>
      {children}
    </span>
  );
}

/**
 * The opening of a public page. Replaces the centred
 * pill-badge + h1 + sub block that opened twelve pages identically —
 * left-aligned now, because a left-aligned measure is readable at any
 * length while a centred one stops being readable past two lines.
 *
 * `aside` carries whatever that specific page needs next to its
 * headline (a disclosure label, a set of questions it answers) instead
 * of every page inventing its own slot for it.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  aside,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Section size="md" className="pb-0">
      <Shell>
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div className="max-w-[46rem]">
            <Eyebrow>{eyebrow}</Eyebrow>
            <Display level={1} size={1} className="mt-8">
              {title}
            </Display>
            {lede && <Lede className="mt-8 max-w-[40rem]">{lede}</Lede>}
            {children && <div className="mt-10">{children}</div>}
          </div>
          {aside && <div className="lg:pt-24">{aside}</div>}
        </div>
      </Shell>
    </Section>
  );
}

/**
 * The closing action block every public page ends on. Eleven pages had
 * their own copy of this as a centred `rounded-3xl border bg-carbon-2`
 * box with a gradient button in it; this is the one implementation, on
 * the dark register, so the end of a page reads as an ending.
 */
export function PageCta({
  heading,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  heading: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Section size="lg" register="dark">
      <Shell>
        <div className="max-w-[44rem]">
          <Display size={2}>{heading}</Display>
          <Lede className="mt-7 max-w-[36rem]">{body}</Lede>
          <div className="mt-11 flex flex-wrap items-center gap-x-8 gap-y-3">
            <PrimaryAction href={primaryHref}>{primaryLabel}</PrimaryAction>
            {secondaryHref && secondaryLabel && <SecondaryAction href={secondaryHref}>{secondaryLabel}</SecondaryAction>}
          </div>
        </div>
      </Shell>
    </Section>
  );
}

/**
 * A section heading inside a page — one level below PageHeader. Eyebrow
 * plus a display line, with an optional note, so every page's internal
 * sections are separated the same way rather than by an 11px uppercase
 * label floating above a grid.
 */
export function SectionHeading({
  eyebrow,
  title,
  note,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  note?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-[44rem] ${className}`}>
      {eyebrow && <Eyebrow className="mb-5">{eyebrow}</Eyebrow>}
      <Display size={3}>{title}</Display>
      {note && <p className="mt-5 max-w-[60ch] text-[0.9375rem] leading-7 text-ink-2">{note}</p>}
    </div>
  );
}

/**
 * A disclosure row. The architecture patterns, data products and AI use
 * cases were each rendered as a `rounded-3xl border bg-carbon` card
 * holding a `<details>`; the content is a list of named things with
 * detail behind each, so it is now a ruled list — which is what a list
 * is — and the open state is a hairline apart from the closed one
 * instead of a different surface colour.
 *
 * Still a native `<details>`: keyboard and screen-reader behaviour, and
 * in-page find, come free and are not re-implemented in JavaScript.
 */
export function Disclosure({
  title,
  summary,
  children,
}: {
  title: string;
  summary?: string;
  children: ReactNode;
}) {
  return (
    <details className="group border-b border-rule">
      <summary className="flex cursor-pointer list-none items-start gap-6 py-7 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block text-[1.0625rem] font-medium tracking-[-0.018em] text-ink transition-colors duration-control group-hover:text-accent">
            {title}
          </span>
          {summary && <span className="mt-2 block max-w-[64ch] text-sm leading-7 text-ink-2">{summary}</span>}
        </span>
        <Plus
          size={18}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-ink-3 transition-transform duration-control ease-nova-settle group-open:rotate-45"
        />
      </summary>
      <div className="grid gap-x-10 gap-y-7 pb-9 sm:grid-cols-2">{children}</div>
    </details>
  );
}

/** A plain ruled list of short statements. Used wherever the old pages
 * reached for a dot-bulleted list inside a bordered box. */
export function RuledList({ items, tone = "neutral" }: { items: string[]; tone?: "neutral" | "accent" | "caution" }) {
  const marker = tone === "accent" ? "bg-accent" : tone === "caution" ? "bg-sig-caution" : "bg-ink-3";
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-7 text-ink-2">
          <span aria-hidden="true" className={`mt-3 h-px w-3 shrink-0 ${marker}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
