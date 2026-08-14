"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "./dictionary";
import type { Locale } from "./locales";

interface LocaleContextValue {
  locale: Locale;
  dict: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Client components (AdaptiveIntake, InquiryForm, LanguageSwitcher,
 * etc.) read the dictionary already resolved server-side for this
 * request via this context — no re-fetching, no locale re-detection
 * on the client, no flash of the wrong language. */
export function LocaleProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: React.ReactNode }) {
  return <LocaleContext.Provider value={{ locale, dict }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale() must be used within a LocaleProvider — this component rendered outside src/app/[locale]/layout.tsx.");
  return ctx;
}
