import { describe, expect, it } from "vitest";
import { sourcePageSchema } from "../schema";

describe("sourcePageSchema", () => {
  it.each(["en", "de", "fr", "es", "it"])("accepts the locale-prefixed homepage for %s", (locale) => {
    expect(sourcePageSchema.safeParse(`/${locale}`).success).toBe(true);
  });

  it.each(["en", "de", "fr", "es", "it"])("accepts the locale-prefixed contact page for %s", (locale) => {
    expect(sourcePageSchema.safeParse(`/${locale}/contact`).success).toBe(true);
  });

  it.each(["en", "de", "fr", "es", "it"])("accepts the locale-prefixed early-access page for %s", (locale) => {
    expect(sourcePageSchema.safeParse(`/${locale}/early-access`).success).toBe(true);
  });

  it.each(["en", "de", "fr", "es", "it"])("accepts the locale-prefixed for-vendors page for %s", (locale) => {
    expect(sourcePageSchema.safeParse(`/${locale}/for-vendors`).success).toBe(true);
  });

  it.each(["en", "de", "fr", "es", "it"])("accepts the locale-prefixed for-partners page for %s", (locale) => {
    expect(sourcePageSchema.safeParse(`/${locale}/for-partners`).success).toBe(true);
  });

  it.each(["/", "/contact", "/early-access", "/for-vendors", "/for-partners"])(
    "still accepts the existing non-localized path %s",
    (path) => {
      expect(sourcePageSchema.safeParse(path).success).toBe(true);
    },
  );

  it("rejects an arbitrary, unlisted path", () => {
    expect(sourcePageSchema.safeParse("/some-random-page").success).toBe(false);
    expect(sourcePageSchema.safeParse("/en/some-random-page").success).toBe(false);
  });

  it("rejects a malformed or unsupported locale prefix", () => {
    expect(sourcePageSchema.safeParse("/xx/contact").success).toBe(false);
    expect(sourcePageSchema.safeParse("/english/contact").success).toBe(false);
    expect(sourcePageSchema.safeParse("/EN/contact").success).toBe(false);
  });

  it("rejects a trailing slash on a locale-prefixed page (exact match only, not a prefix match)", () => {
    expect(sourcePageSchema.safeParse("/en/contact/").success).toBe(false);
  });
});
