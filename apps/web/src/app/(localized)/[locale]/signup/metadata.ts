import type { Metadata } from "next";
// Relative, not "@/..." — see login/metadata.ts's comment.
import { getDictionary } from "../../../../i18n/get-dictionary";
import { isSupportedLocale } from "../../../../i18n/locales";
import { localizedAlternates, localizedOpenGraph } from "../../../../i18n/seo";

/** See login/metadata.ts for why this lives in its own module. */
export async function generateSignupMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = `${dict.signup.h1} — ClouDonna`;
  const description = dict.signup.sub;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/signup"),
    openGraph: localizedOpenGraph(locale, title, description),
  };
}
