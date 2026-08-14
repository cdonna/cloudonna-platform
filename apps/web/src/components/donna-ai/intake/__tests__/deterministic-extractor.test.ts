import { describe, expect, it } from "vitest";
import { CONFIRMATION_THRESHOLD, extractFromStatement } from "../deterministic-extractor";

describe("extractFromStatement", () => {
  it("extracts every closed-vocabulary field a fully specified statement supports, at high confidence", () => {
    const result = extractFromStatement(
      "We're a Swiss manufacturer using SAP S/4HANA, Power BI and Snowflake. We need a stronger enterprise data platform and want to keep SAP as our ERP.",
    );

    expect(result.candidates.country?.value).toBe("switzerland");
    expect(result.candidates.industry?.value).toBe("manufacturing");
    expect(result.candidates.erp?.value).toBe("sap-s4hana");
    expect(result.candidates.analytics?.value).toBe("power-bi");
    expect(result.candidates.dataWarehouse?.value).toBe("snowflake");

    for (const field of ["country", "industry", "erp", "analytics", "dataWarehouse"] as const) {
      expect(result.candidates[field]?.confidence).toBeGreaterThanOrEqual(CONFIRMATION_THRESHOLD);
      expect(result.candidates[field]?.requiresConfirmation).toBe(false);
      expect(result.candidates[field]?.source).toBe("user_statement");
    }

    // Genuinely missing from this statement — must not be fabricated.
    expect(result.candidates.cloud).toBeUndefined();
    expect(result.candidates.budget).toBeUndefined();
  });

  it("extracts only what a partially specified statement supports, leaving the rest undefined", () => {
    const result = extractFromStatement("We run SAP S/4HANA today.");

    expect(result.candidates.erp?.value).toBe("sap-s4hana");
    expect(result.candidates.country).toBeUndefined();
    expect(result.candidates.industry).toBeUndefined();
    expect(result.candidates.cloud).toBeUndefined();
    expect(result.goals).toHaveLength(0);
  });

  it("does not fabricate a specific ERP from an ambiguous bare mention", () => {
    // "SAP" alone is ambiguous between S/4HANA, ECC, and SAP CRM/BW —
    // the extractor requires a specific product signal, not the vendor
    // name alone, so this must stay unextracted rather than guessed.
    const result = extractFromStatement("We are an SAP shop.");
    expect(result.candidates.erp).toBeUndefined();
  });

  it("resolves a contradictory statement by documented rule priority, not by pretending to detect the contradiction", () => {
    // Two specific clouds are mentioned; the extractor has no text-
    // position/salience awareness, so it deterministically picks
    // whichever rule is checked first (see CLOUD_RULES order in
    // deterministic-extractor.ts) rather than the one mentioned first
    // in the sentence. This test documents that real, known limitation
    // rather than hiding it — see the Founder report's "KNOWN
    // LIMITATIONS" section.
    const result = extractFromStatement("We use AWS primarily, though finance still runs some workloads on Azure.");
    expect(result.candidates.cloud?.value).toBe("azure");
  });

  it("does not match an unrecognized vendor name onto any known enum value", () => {
    const result = extractFromStatement("We use Infor CloudSuite as our ERP and Qlik for analytics.");
    expect(result.candidates.erp).toBeUndefined();
    expect(result.candidates.analytics).toBeUndefined();
  });

  it("leaves goals empty when the statement states no objective", () => {
    const result = extractFromStatement("We run SAP S/4HANA and Snowflake in Switzerland.");
    expect(result.goals).toHaveLength(0);
  });

  it("marks a paraphrase-derived goal as a low-confidence inference requiring confirmation", () => {
    const result = extractFromStatement("We need a stronger enterprise data platform.");
    const modernization = result.goals.find((g) => g.value === "modernization");

    expect(modernization).toBeDefined();
    expect(modernization?.confidence).toBeLessThan(CONFIRMATION_THRESHOLD);
    expect(modernization?.requiresConfirmation).toBe(true);
    expect(modernization?.source).toBe("inferred");
  });

  it("derives a timeline band from an explicit target year", () => {
    const near = extractFromStatement("We want this modernized before 2027.");
    const far = extractFromStatement("We want this modernized before 2032.");

    expect(near.candidates.timeline?.value).toBe("aggressive");
    expect(far.candidates.timeline?.value).toBe("extended");
    // Year-based inference is never presented as a hard fact.
    expect(near.candidates.timeline?.requiresConfirmation).toBe(true);
  });

  it("never throws and always returns a valid result — empty, gibberish, and long input alike", () => {
    for (const input of ["", "   ", "asdkjhaskjdh 12903 !!!", "x".repeat(5000)]) {
      expect(() => extractFromStatement(input)).not.toThrow();
      const result = extractFromStatement(input);
      expect(result.statement).toBe(input);
      expect(result.candidates).toBeTypeOf("object");
      expect(Array.isArray(result.goals)).toBe(true);
    }
  });

  it("preserves the user's own explicit fact alongside the normalized scoring band — never one instead of the other", () => {
    const result = extractFromStatement("We have around 4,000 employees.");
    expect(result.candidates.employees?.value).toBe("enterprise"); // the real 2,000-10,000 band
    expect(result.candidates.employees?.rawText).toBe("around 4,000 employees"); // the user's own words, untouched
  });

  it("captures every landscape system a statement names, not just the first, without changing which one scores", () => {
    const result = extractFromStatement("We currently use SAP BW, Power BI and Snowflake.");
    // The scored slot keeps exactly what matchFirst would already have
    // picked — unchanged behavior for the engine.
    expect(result.candidates.dataWarehouse?.value).toBe("sap-bw");
    // Snowflake is not silently dropped — it's real landscape context.
    expect(result.additionalSystems).toContainEqual({ category: "dataWarehouse", value: "snowflake", label: "Snowflake" });
  });

  it("does not report additional systems when only one match exists per category", () => {
    const result = extractFromStatement("We run SAP S/4HANA on Azure.");
    expect(result.additionalSystems).toHaveLength(0);
  });
});
