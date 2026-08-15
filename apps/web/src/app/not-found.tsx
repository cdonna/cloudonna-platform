import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// This file sits outside both (default) and (localized)/[locale] — the
// only two places metadataBase is otherwise set — so it needs its own,
// otherwise Next.js falls back to localhost when resolving any
// relative OG/Twitter image URL for this specific fallback page.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.cdonna.com"),
  title: "Page not found — ClouDonna",
};

/**
 * Required once (default)/layout.tsx and (localized)/[locale]/layout.tsx
 * became two independent root layouts — Next.js needs a top-level
 * not-found.tsx with its own `<html>`/`<body>` to handle a request
 * that matches neither group's routes at all (e.g. a bare, completely
 * unknown path with no locale segment). Every "normal" 404 inside a
 * known locale or inside /app is still handled by that branch's own
 * root layout as before; this is only the fallback for paths outside
 * both.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col items-center justify-center bg-obsidian px-6 text-center text-nova-ink">
        <p className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">404</p>
        <h1 className="mt-3 text-2xl font-semibold">Page not found</h1>
        <Link href="/" className="mt-6 text-sm font-medium text-nova-accent-strong hover:underline">
          Back to home
        </Link>
      </body>
    </html>
  );
}
