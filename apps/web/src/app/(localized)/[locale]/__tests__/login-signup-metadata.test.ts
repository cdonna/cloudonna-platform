import { describe, expect, it } from "vitest";
import { generateLoginMetadata } from "../login/metadata";
import { generateSignupMetadata } from "../signup/metadata";

/**
 * login/signup are Client Components (useActionState, local UI state)
 * and Next.js does not allow a "use client" file to export
 * generateMetadata at all — that's the actual reason these two pages
 * previously always fell back to the root layout's static English
 * title/og:locale regardless of the visited locale. The fix was a
 * thin Server Component wrapper (page.tsx) that owns metadata while
 * LoginForm/SignupForm keep the interactive form, with the metadata
 * function itself in its own pure module (no next/navigation import)
 * specifically so it's directly testable here without a rendering
 * harness.
 */
describe("login/signup locale-aware metadata", () => {
  it.each([
    ["en", "en_US"],
    ["de", "de_DE"],
    ["fr", "fr_FR"],
    ["es", "es_ES"],
    ["it", "it_IT"],
  ] as const)("login generateMetadata: %s -> og:locale %s", async (locale, ogLocale) => {
    const metadata = await generateLoginMetadata({ params: Promise.resolve({ locale }) });
    expect(metadata.openGraph?.locale).toBe(ogLocale);
    expect(metadata.alternates?.canonical).toBe(`/${locale}/login`);
    expect(metadata.title).toBeTruthy();
  });

  it.each([
    ["en", "en_US"],
    ["de", "de_DE"],
    ["fr", "fr_FR"],
    ["es", "es_ES"],
    ["it", "it_IT"],
  ] as const)("signup generateMetadata: %s -> og:locale %s", async (locale, ogLocale) => {
    const metadata = await generateSignupMetadata({ params: Promise.resolve({ locale }) });
    expect(metadata.openGraph?.locale).toBe(ogLocale);
    expect(metadata.alternates?.canonical).toBe(`/${locale}/signup`);
    expect(metadata.title).toBeTruthy();
  });

  it("returns empty metadata for an unsupported locale rather than fabricating one", async () => {
    const loginMeta = await generateLoginMetadata({ params: Promise.resolve({ locale: "xx" }) });
    const signupMeta = await generateSignupMetadata({ params: Promise.resolve({ locale: "xx" }) });
    expect(loginMeta).toEqual({});
    expect(signupMeta).toEqual({});
  });
});
