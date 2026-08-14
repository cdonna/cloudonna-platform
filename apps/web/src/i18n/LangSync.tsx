"use client";

import { useEffect } from "react";
import type { Locale } from "./locales";

/**
 * The root layout (src/app/layout.tsx) owns the single `<html>` tag
 * for every route — including the unlocalized /app/*, /api/*, /auth/*,
 * and /discovery — so it has to keep a static `lang="en"`. This
 * corrects `document.documentElement.lang` for de/fr/es requests
 * immediately on mount, before paint is user-visible in practice, but
 * honestly: the very first server-rendered byte still says `lang="en"`
 * until this runs. See the localization report's "ACCESSIBILITY
 * STATUS" section — this is disclosed as a known gap, not claimed as
 * full SSR-correct hreflang-grade behavior.
 */
export function LangSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = "en";
    };
  }, [locale]);
  return null;
}
