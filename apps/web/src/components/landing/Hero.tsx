"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Menu, Play, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Discovery", href: "/discovery" },
  { label: "Donna AI", href: "/donna-ai" },
  { label: "Independence", href: "/independence" },
  { label: "For Vendors", href: "/for-vendors" },
  { label: "For Partners", href: "/for-partners" },
];

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/50 to-white">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-10 h-[30rem] w-[30rem] rounded-full bg-blue-300/30 blur-[120px]" />
        <div className="absolute right-[-10rem] top-[-4rem] h-[34rem] w-[34rem] rounded-full bg-violet-300/35 blur-[130px]" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-fuchsia-200/25 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-8">
        {/* Navigation */}
        <nav className="rounded-2xl border border-white/70 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <a href="#" className="flex items-center gap-3">
              <Image
                src="/cloudonna-favicon-512.png"
                alt="ClouDonna"
                width={50}
                height={50}
                className="h-11 w-11 object-contain"
                priority
              />

              <div>
                <div className="text-xl font-semibold tracking-tight text-slate-950">
                  Clou<span className="text-violet-600">Donna</span>
                </div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                  Enterprise Decision Intelligence
                </div>
              </div>
            </a>

            <div className="hidden items-center gap-7 text-sm text-slate-600 lg:flex">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="transition hover:text-violet-700"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="hidden bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-200 sm:inline-flex"
                render={<a href="/early-access" />}
              >
                Request Early Access
              </Button>

              <Button
                variant="outline"
                size="icon"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                className="h-11 w-11 border-slate-200 bg-white text-slate-800 lg:hidden"
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </Button>
            </div>
          </div>

          {menuOpen && (
            <div
              id="mobile-nav"
              className="mt-4 flex flex-col gap-1 border-t border-slate-200/80 pt-4 lg:hidden"
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                >
                  {link.label}
                </a>
              ))}

              <div className="mt-2 flex flex-col gap-2 px-1">
                <Button
                  className="bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-200"
                  render={<a href="/early-access" />}
                  onClick={() => setMenuOpen(false)}
                >
                  Request Early Access
                </Button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero */}
        <div className="grid items-center gap-16 pb-8 pt-20 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700 shadow-sm">
              <ShieldCheck size={14} />
              Independent Enterprise Decision Intelligence
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
              Turn a Business Goal Into a{" "}
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                Defensible Decision.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              ClouDonna guides you from a business objective to an
              evidence-based technology recommendation — with full reasoning
              behind every option, evaluated on a vendor-neutral, consistent
              basis.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="h-12 bg-gradient-to-r from-blue-600 to-violet-600 px-7 text-white shadow-xl shadow-indigo-200"
                render={<a href="/donna-ai" />}
              >
                Try Donna AI
                <ArrowRight size={17} />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-12 border-slate-200 bg-white/70 px-7 text-slate-900 shadow-sm"
                render={<a href="/discovery" />}
              >
                <Play size={16} />
                See How It Works
              </Button>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              {[
                "Vendor-neutral by design",
                "Evidence-based scoring",
                "Public Alpha",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-slate-600">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check size={14} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview — illustrative example, not a real recommendation */}
          <div className="relative">
            <div className="absolute inset-8 rounded-[2rem] bg-gradient-to-r from-blue-400/25 to-violet-500/30 blur-3xl" />

            <div className="relative rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_35px_100px_-35px_rgba(79,70,229,0.4)] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-5">
                <div className="flex items-center gap-3">
                  <Image
                    src="/cloudonna-favicon-512.png"
                    alt="Donna AI"
                    width={38}
                    height={38}
                    className="h-9 w-9 object-contain"
                  />

                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.14em] text-violet-600">
                      Donna AI Recommendation
                    </div>
                    <div className="mt-1 font-semibold text-slate-950">
                      Enterprise Data Platform
                    </div>
                  </div>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Illustrative example
                </span>
              </div>

              <div className="grid gap-4 pt-5 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs text-slate-500">Top-ranked option</div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-semibold text-slate-950">
                        Platform A
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Data Cloud Platform
                      </div>
                    </div>

                    <div className="h-11 w-11 rounded-xl bg-sky-100" />
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      "Enterprise scalability",
                      "Cloud-native architecture",
                      "Strong ecosystem",
                      "Manageable cost profile",
                    ].map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <Check size={15} className="text-emerald-500" />
                        {benefit}
                      </div>
                    ))}
                  </div>

                  <Button
                    className="mt-6 bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                    render={<a href="/donna-ai" />}
                  >
                    See how this is scored
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Illustrative scorecard</span>
                      <span className="font-semibold text-violet-700">
                        Leading fit
                      </span>
                    </div>

                    <div className="mt-5 space-y-4">
                      {[
                        ["Architecture fit", "Leading"],
                        ["Governance fit", "Established"],
                        ["Security fit", "Leading"],
                        ["Cost fit", "Developing"],
                      ].map(([label, band]) => (
                        <div key={label}>
                          <div className="mb-2 flex justify-between text-xs text-slate-500">
                            <span>{label}</span>
                            <span>{band}</span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                              style={{
                                width:
                                  band === "Leading"
                                    ? "92%"
                                    : band === "Established"
                                      ? "70%"
                                      : "48%",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-medium text-slate-950">
                      Every score ships with evidence
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">
                      No live pricing or market-share numbers — every result
                      links back to the reasoning behind it.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}