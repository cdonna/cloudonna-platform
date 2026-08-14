import { describe, expect, it } from "vitest";
import { pathWithLocale } from "../path-with-locale";

/**
 * Switching language must land on the *same logical page* under the
 * new locale prefix, query string intact — this is the pure routing
 * logic behind that guarantee, extracted so it's testable without
 * mounting the component (no component-rendering harness in this
 * repo — see the Founder report's disclosure on this).
 */
describe("pathWithLocale", () => {
  it("swaps only the locale segment, preserving the rest of the path", () => {
    expect(pathWithLocale("/en/for-partners", "", "de")).toBe("/de/for-partners");
  });

  it("preserves a query string across the swap", () => {
    expect(pathWithLocale("/en/contact", "type=partner", "fr")).toBe("/fr/contact?type=partner");
  });

  it("swaps the locale on the bare home route", () => {
    expect(pathWithLocale("/en", "", "es")).toBe("/es");
  });

  it("preserves a deeper nested path", () => {
    expect(pathWithLocale("/de/donna-ai", "", "en")).toBe("/en/donna-ai");
  });
});
