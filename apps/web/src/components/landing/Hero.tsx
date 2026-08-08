"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Menu, Play, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Discovery", href: "/discovery" },
  { label: "Donna AI", href: "/donna-ai" },
  { label: "Independence", href: "/independence" },
  { label: "For Vendors", href: "/for-vendors" },
  { label: "For Partners", href: "/for-partners" },
  { label: "Contact", href: "/contact" },
];

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="relative overflow-hidden bg-void">
      {/* Ambient background — Project NOVA (docs/design/04-material-system.md,
          "Deep Space" + "Aurora"). Two glows only, asymmetric, slow drift. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden motion-safe:animate-aurora-drift">
        <div className="absolute -top-40 left-[8%] h-[34rem] w-[34rem] rounded-full bg-aurora-secondary/20 blur-[140px]" />
        <div className="absolute top-[10%] right-[5%] h-[30rem] w-[30rem] rounded-full bg-aurora-primary/25 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-8 pb-28">
        {/* Minimal navigation */}
        <nav className="rounded-2xl border border-titanium bg-obsidian/70 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <a href="#" className="flex items-center gap-3">
              <Image src="/cloudonna-favicon-512.png" alt="ClouDonna" width={40} height={40} className="h-9 w-9 object-contain" priority />
              <div className="text-lg font-semibold tracking-tight text-nova-ink">
                Clou<span className="text-nova-accent-strong">Donna</span>
              </div>
            </a>

            <div className="hidden items-center gap-7 text-sm text-nova-ink-muted lg:flex">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="transition duration-200 hover:text-nova-ink">
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button className="hidden bg-nova-accent text-white hover:bg-nova-accent-strong sm:inline-flex" render={<a href="/early-access" />}>
                Become a Founding Tester
              </Button>

              <Button
                variant="outline"
                size="icon"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                className="h-11 w-11 border-titanium bg-carbon text-nova-ink lg:hidden"
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </Button>
            </div>
          </div>

          {menuOpen && (
            <div id="mobile-nav" className="mt-4 flex flex-col gap-1 border-t border-titanium pt-4 lg:hidden">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-nova-ink-muted transition duration-200 hover:bg-carbon hover:text-nova-ink"
                >
                  {link.label}
                </a>
              ))}

              <div className="mt-2 flex flex-col gap-2 px-1">
                <Button className="bg-nova-accent text-white hover:bg-nova-accent-strong" render={<a href="/early-access" />} onClick={() => setMenuOpen(false)}>
                  Request Early Access
                </Button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero — one sentence, one line, one action. */}
        <div className="mx-auto mt-24 max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold tracking-[0.14em] text-nova-accent-strong uppercase">
            Independent Enterprise Decision Intelligence
          </div>

          <h1 className="mt-8 text-5xl font-semibold tracking-[-0.035em] text-balance text-nova-ink sm:text-6xl lg:text-7xl">
            Enterprise Decision Intelligence.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-nova-ink-muted">Make every enterprise decision with confidence.</p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 bg-nova-accent px-7 text-white shadow-nova-glow hover:bg-nova-accent-strong" render={<a href="/early-access" />}>
              Become a Founding Tester
              <ArrowRight size={17} />
            </Button>

            <Button size="lg" variant="outline" className="h-12 border-titanium bg-transparent px-7 text-nova-ink hover:border-titanium-strong" render={<a href="#donna" />}>
              <Play size={16} />
              Explore Donna
            </Button>
          </div>

          <p className="mt-8 text-xs tracking-wide text-nova-ink-faint uppercase">Vendor-neutral · Evidence-based · Public Alpha</p>
        </div>
      </div>
    </section>
  );
}
