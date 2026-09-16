"use client";

/**
 * The one persistent header for every public ClouDonna page — replaces
 * the per-page "logo + Back to home" mini-headers that used to make
 * each page feel like an island. Rendered once from
 * (localized)/[locale]/layout.tsx (covers all 12 localized pages) and
 * once, with defaults, from the standalone /discovery page (outside
 * the locale tree, same optional-props pattern Footer.tsx already
 * uses). Never rendered inside /app/* — the authenticated product has
 * its own nav and is a deliberately different context.
 */
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // Discovery and Independence remain real pages (linked from the
  // Footer's "Explore" column) but sit outside the primary bar — six
  // items reads clean, matches the brief's target IA, and every item
  // here has real content behind it.
  const navItems: NavItem[] = [
    { label: dict.nav.links.donnaAi, href: `/${locale}/donna-ai` },
    { label: dict.nav.links.decisionSkills, href: `/${locale}/decision-skills` },
    { label: dict.nav.links.demo, href: `/${locale}/demo` },
    { label: dict.nav.links.architects, href: `/${locale}/architects` },
    { label: dict.nav.links.dataEconomy, href: `/${locale}/data-economy` },
    { label: dict.nav.links.contact, href: `/${locale}/contact` },
  ];

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-panel ease-nova-settle ${
        scrolled ? "border-titanium bg-obsidian/75 backdrop-blur-xl" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Link href={`/${locale}`} className="flex shrink-0 items-center gap-2.5">
          <Image src="/cloudonna-favicon-512.png" alt="ClouDonna" width={36} height={36} className="brand-mark h-8 w-8 object-contain" priority />
          <span className="text-lg font-bold tracking-[-0.02em] text-nova-ink">
            Clou<span className="text-nova-accent-strong">Donna</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1.5 lg:flex">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-4 py-2 text-sm font-semibold tracking-[-0.006em] transition-colors duration-control ${
                  active ? "text-nova-ink" : "text-nova-ink-muted hover:text-nova-ink"
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full border border-titanium bg-carbon-2/80 shadow-[0_10px_24px_-16px_rgba(251,118,96,0.55)]"
                  />
                )}
                <span className="relative">{item.label}</span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-nova-accent to-sunset-coral"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {showLanguageSwitcher && (
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
          )}

          <Button
            className="hidden bg-gradient-to-r from-nova-accent to-sunset-coral text-white transition-[filter] duration-control hover:brightness-110 sm:inline-flex"
            render={<a href={`/${locale}/early-access`} />}
          >
            {dict.nav.ctaDesktop}
          </Button>

          <Button
            variant="outline"
            size="icon"
            aria-label={menuOpen ? dict.nav.closeMenu : dict.nav.openMenu}
            aria-expanded={menuOpen}
            aria-controls="global-mobile-nav"
            className="h-11 w-11 border-titanium bg-carbon text-nova-ink lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div id="global-mobile-nav" className="border-t border-titanium bg-obsidian/95 px-6 py-4 backdrop-blur-xl lg:hidden">
          <nav aria-label="Primary" className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    active ? "bg-carbon-2 text-nova-ink" : "text-nova-ink-muted hover:bg-carbon hover:text-nova-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {showLanguageSwitcher && (
            <div className="mt-3 px-1">
              <LanguageSwitcher variant="inline" />
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2 px-1">
            <Button
              className="bg-gradient-to-r from-nova-accent to-sunset-coral text-white"
              render={<a href={`/${locale}/early-access`} />}
              onClick={() => setMenuOpen(false)}
            >
              {dict.nav.ctaMobile}
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
