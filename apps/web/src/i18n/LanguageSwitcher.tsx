"use client";

/**
 * Switching language navigates to the same page under the new locale
 * prefix — nothing else. State preservation is not re-implemented
 * here: AdaptiveIntake and DonnaAIExperience already restore their
 * in-progress WizardState from sessionStorage on mount (see
 * ../components/donna-ai/session-history.ts, built for the Back-button
 * fix), and sessionStorage isn't scoped to a URL, so the remount this
 * navigation triggers picks the assessment back up automatically. The
 * middleware sets the NEXT_LOCALE cookie on the resulting request, so
 * no cookie-writing happens client-side here either.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale } from "./LocaleProvider";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "./locales";
import { pathWithLocale } from "./path-with-locale";

export function LanguageSwitcher({ variant = "dropdown" }: { variant?: "dropdown" | "inline" }) {
  const { locale, dict } = useLocale();
  // Read directly from window rather than next/navigation's
  // usePathname()/useSearchParams() hooks — useSearchParams()
  // requires a Suspense boundary for static generation, which the
  // homepage (rendering this in Hero's nav) doesn't have. A plain
  // client-side read inside switchTo() needs no such boundary: it
  // only ever runs after hydration, in response to a click. Same
  // pattern InquiryForm.tsx already uses for the same reason.
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function switchTo(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    const url = new URL(window.location.href);
    router.push(pathWithLocale(url.pathname, url.searchParams.toString(), next));
  }

  if (variant === "inline") {
    return (
      <div role="group" aria-label={dict.languageSwitcher.label} className="flex flex-wrap items-center gap-1.5">
        {SUPPORTED_LOCALES.map((code) => {
          const active = code === locale;
          return (
            <button
              key={code}
              type="button"
              onClick={() => switchTo(code)}
              aria-pressed={active}
              aria-label={LOCALE_LABELS[code].name}
              className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-control focus-visible:ring-3 focus-visible:ring-nova-accent/40 ${
                active
                  ? "border-nova-accent/50 bg-nova-accent/15 text-nova-accent-strong"
                  : "border-titanium bg-carbon-2 text-nova-ink-muted hover:border-titanium-strong hover:text-nova-ink"
              }`}
            >
              <span aria-hidden="true">{LOCALE_LABELS[code].flag}</span>
              {code.toUpperCase()}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={dict.languageSwitcher.choose}
        className="flex h-11 items-center gap-1.5 rounded-xl border border-titanium bg-carbon-2 px-3 text-sm font-medium text-nova-ink-muted transition-colors duration-control hover:border-titanium-strong hover:text-nova-ink focus-visible:ring-3 focus-visible:ring-nova-accent/40"
      >
        <Globe size={15} aria-hidden="true" />
        <span aria-hidden="true">{LOCALE_LABELS[locale].flag}</span>
        {locale.toUpperCase()}
        <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-control ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={dict.languageSwitcher.choose}
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-titanium bg-carbon shadow-nova-raised"
        >
          {SUPPORTED_LOCALES.map((code) => {
            const active = code === locale;
            return (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => switchTo(code)}
                className={`flex min-h-11 w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors duration-control ${
                  active ? "bg-nova-accent/10 text-nova-accent-strong" : "text-nova-ink-muted hover:bg-carbon-2 hover:text-nova-ink"
                }`}
              >
                <span aria-hidden="true">{LOCALE_LABELS[code].flag}</span>
                <span className="flex-1">{LOCALE_LABELS[code].name}</span>
                {active && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
