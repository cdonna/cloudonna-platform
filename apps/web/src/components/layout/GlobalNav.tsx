"use client";

/**
 * The one persistent header for every public ClouDonna page. Rendered
 * once from (localized)/[locale]/layout.tsx (covers all localized
 * pages) and once, with defaults, from the standalone /discovery page
 * (outside the locale tree, same optional-props pattern Footer.tsx
 * uses). Never rendered inside /app/* — the authenticated product has
 * its own nav and is a deliberately different context.
 *
 * Redesigned for the editorial register: a quiet, always-present bar on
 * warm paper. What was removed, deliberately — the gradient CTA button
 * (`from-nova-accent to-sunset-coral`), the glass pill behind the active
 * item, the coral glow under it, the gradient underline, the
 * transparent-until-scrolled background, and the second CTA in the
 * mobile sheet. What remains is: wordmark, six items, one solid CTA, and
 * the language selector as the secondary control the brief asks for.
 */
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { en } from "@/i18n/dictionary";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionary";

interface NavItem {
  label: string;
  href: string;
}

export function GlobalNav({
  dict = en,
  locale = DEFAULT_LOCALE,
  showLanguageSwitcher = true,
}: {
  dict?: Dictionary;
  locale?: Locale;
  /** false on /discovery, which renders outside LocaleProvider — see
   * that file's own comment for why it stays English-only. */
  showLanguageSwitcher?: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Six items, matching the brief's target IA. Contact and Donna AI are
  // still real pages (Contact from the Footer, Donna AI as "Product"
  // here and as every page's primary action) — they moved out of the bar
  // rather than disappearing.
  const navItems: NavItem[] = [
    { label: dict.nav.links.product, href: `/${locale}/donna-ai` },
    { label: dict.nav.links.decisionSkills, href: `/${locale}/decision-skills` },
    { label: dict.nav.links.architects, href: `/${locale}/architects` },
    { label: dict.nav.links.dataEconomy, href: `/${locale}/data-economy` },
    { label: dict.nav.links.demo, href: `/${locale}/demo` },
    { label: dict.nav.links.trust, href: `/${locale}/trust` },
  ];

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header
      className={`sticky top-0 z-50 bg-paper/90 backdrop-blur-xl transition-colors duration-panel ease-nova-settle ${
        scrolled ? "border-b border-rule" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[82rem] items-center gap-6 px-6 py-4 sm:px-8 lg:px-12">
        <Link href={`/${locale}`} className="flex shrink-0 items-center gap-2.5">
          <Image src="/cloudonna-favicon-512.png" alt="ClouDonna" width={32} height={32} className="h-7 w-7 object-contain" priority />
          <span className="text-[1.0625rem] font-medium tracking-[-0.025em] text-ink">
            Clou<span className="text-accent">Donna</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden flex-1 items-center justify-center gap-7 lg:flex">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-1 text-sm tracking-[-0.008em] transition-colors duration-control ${
                  active ? "text-ink" : "text-ink-2 hover:text-ink"
                }`}
              >
                {item.label}
                {/* A hairline, not a pill. The only state marker in the bar. */}
                {active && <span aria-hidden="true" className="absolute -bottom-px left-0 h-px w-full bg-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {showLanguageSwitcher && (
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
          )}

          <Link
            href={`/${locale}/early-access`}
            className="hidden min-h-10 items-center rounded-md bg-solid px-4 text-sm font-medium text-solid-on transition-colors duration-control hover:bg-accent hover:text-accent-on focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none sm:inline-flex"
          >
            {dict.nav.ctaDesktop}
          </Link>

          <button
            type="button"
            aria-label={menuOpen ? dict.nav.closeMenu : dict.nav.openMenu}
            aria-expanded={menuOpen}
            aria-controls="global-mobile-nav"
            className="flex h-11 w-11 items-center justify-center rounded-md text-ink transition-colors duration-control hover:bg-paper-3 focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* The mobile sheet is not the desktop bar stacked: items are set at
          reading size on their own hairline-separated rows, so a thumb has
          a real target and the list reads as a table of contents. */}
      {menuOpen && (
        <div id="global-mobile-nav" className="border-t border-rule bg-paper lg:hidden">
          <nav aria-label="Primary" className="flex flex-col px-6 sm:px-8">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`flex min-h-14 items-center border-b border-rule text-[1.0625rem] tracking-[-0.015em] transition-colors duration-control ${
                    active ? "text-accent" : "text-ink hover:text-accent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-5 px-6 py-6 sm:px-8">
            <Link
              href={`/${locale}/early-access`}
              onClick={() => setMenuOpen(false)}
              className="flex min-h-12 items-center justify-center rounded-md bg-solid px-5 text-sm font-medium text-solid-on"
            >
              {dict.nav.ctaMobile}
            </Link>

            {showLanguageSwitcher && <LanguageSwitcher variant="inline" />}
          </div>
        </div>
      )}
    </header>
  );
}
