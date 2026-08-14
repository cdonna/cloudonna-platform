import { describe, expect, it } from "vitest";
import { extractFromStatement } from "../deterministic-extractor";

/**
 * One extractor, multi-language patterns — not four extractors and not
 * four schemas (see the localization report's "LANGUAGE ARCHITECTURE"
 * section). Every assertion here checks the same ExtractionCandidates
 * shape the English tests already check; only the input statement's
 * language changes. Product/vendor names (SAP S/4HANA, Power BI,
 * Snowflake, Azure) are never translated, so they match identically
 * regardless of the surrounding language — that's asserted here too,
 * not assumed.
 */
describe("extractFromStatement — German", () => {
  it("recognizes country, industry and product names in a German statement", () => {
    const result = extractFromStatement("Wir sind ein Schweizer Industrieunternehmen. Unser ERP ist SAP S/4HANA und wir nutzen Snowflake.");
    expect(result.candidates.country?.value).toBe("switzerland");
    expect(result.candidates.industry?.value).toBe("manufacturing");
    expect(result.candidates.erp?.value).toBe("sap-s4hana");
    expect(result.candidates.dataWarehouse?.value).toBe("snowflake");
  });

  it("resolves German-specific unicode word boundaries correctly (Österreich, no false split on ö)", () => {
    const result = extractFromStatement("Wir sind ein österreichisches Unternehmen.");
    expect(result.candidates.country?.value).toBe("austria");
  });

  it("extracts a German employee count with period-as-thousands-separator formatting", () => {
    const result = extractFromStatement("Wir haben rund 4.000 Mitarbeitende.");
    expect(result.candidates.employees?.value).toBe("enterprise");
    expect(result.candidates.employees?.rawText).toMatch(/4\.000/);
  });

  it("derives a timeline band from German 'innerhalb der nächsten N Monate' phrasing", () => {
    const result = extractFromStatement("Wir wollen unsere Plattform innerhalb der nächsten 18 Monate modernisieren.");
    expect(result.candidates.timeline?.value).toBe("extended");
    expect(result.goals.map((g) => g.value)).toContain("modernization");
  });

  it("recognizes the German internalSkills 'strong on X, limited on Y' phrasing", () => {
    const result = extractFromStatement("Unser Team kennt SAP und Microsoft sehr gut, hat aber nur wenig Databricks-Erfahrung.");
    expect(result.candidates.internalSkills?.value).toBe("moderate");
  });

  it("recognizes the German preferred-vendor 'SAP soll ... ERP bleiben' phrasing", () => {
    const result = extractFromStatement("SAP soll unser zentrales ERP bleiben.");
    expect(result.candidates.preferredVendor?.value).toBe("sap");
  });
});

describe("extractFromStatement — French", () => {
  it("recognizes country, industry and product names in a French statement", () => {
    const result = extractFromStatement("Nous sommes un fabricant suisse. Notre ERP est SAP S/4HANA et nous utilisons Snowflake.");
    expect(result.candidates.country?.value).toBe("switzerland");
    expect(result.candidates.industry?.value).toBe("manufacturing");
    expect(result.candidates.erp?.value).toBe("sap-s4hana");
    expect(result.candidates.dataWarehouse?.value).toBe("snowflake");
  });

  it("derives a timeline band from French 'dans les N prochains mois' phrasing", () => {
    const result = extractFromStatement("Nous voulons moderniser notre plateforme dans les 18 prochains mois.");
    expect(result.candidates.timeline?.value).toBe("extended");
    expect(result.goals.map((g) => g.value)).toContain("modernization");
  });

  it("resolves a French unicode-edge word correctly (conformité)", () => {
    const result = extractFromStatement("La conformité est une priorité pour nous.");
    expect(result.goals.map((g) => g.value)).toContain("compliance");
  });
});

describe("extractFromStatement — Italian", () => {
  it("recognizes country, industry and product names in an Italian statement", () => {
    const result = extractFromStatement("Siamo un'azienda manifatturiera svizzera. Il nostro ERP è SAP S/4HANA e usiamo Snowflake.");
    expect(result.candidates.country?.value).toBe("switzerland");
    expect(result.candidates.industry?.value).toBe("manufacturing");
    expect(result.candidates.erp?.value).toBe("sap-s4hana");
    expect(result.candidates.dataWarehouse?.value).toBe("snowflake");
  });

  it("extracts an Italian employee count ('circa N dipendenti')", () => {
    const result = extractFromStatement("Abbiamo circa 4.000 dipendenti.");
    expect(result.candidates.employees?.value).toBe("enterprise");
    expect(result.candidates.employees?.rawText).toMatch(/4\.000/);
  });

  it("derives a timeline band from Italian 'entro i prossimi N mesi' phrasing", () => {
    const result = extractFromStatement("Vogliamo modernizzare la nostra piattaforma entro i prossimi 18 mesi.");
    expect(result.candidates.timeline?.value).toBe("extended");
    expect(result.goals.map((g) => g.value)).toContain("modernization");
  });

  it("recognizes the Italian internalSkills 'knows X well, limited on Y' phrasing", () => {
    const result = extractFromStatement("Il nostro team conosce molto bene SAP e Microsoft, ma ha poca esperienza con Databricks.");
    expect(result.candidates.internalSkills?.value).toBe("moderate");
  });

  it("recognizes the Italian preferred-vendor 'SAP deve rimanere' phrasing", () => {
    const result = extractFromStatement("SAP deve rimanere il nostro ERP centrale.");
    expect(result.candidates.preferredVendor?.value).toBe("sap");
  });
});

describe("extractFromStatement — Spanish", () => {
  it("recognizes country, industry and product names in a Spanish statement", () => {
    const result = extractFromStatement("Somos un fabricante suizo. Nuestro ERP es SAP S/4HANA y usamos Snowflake.");
    expect(result.candidates.country?.value).toBe("switzerland");
    expect(result.candidates.industry?.value).toBe("manufacturing");
    expect(result.candidates.erp?.value).toBe("sap-s4hana");
    expect(result.candidates.dataWarehouse?.value).toBe("snowflake");
  });

  it("derives a timeline band from Spanish 'dentro de N meses' phrasing", () => {
    const result = extractFromStatement("Queremos modernizar nuestra plataforma dentro de 18 meses.");
    expect(result.candidates.timeline?.value).toBe("extended");
    expect(result.goals.map((g) => g.value)).toContain("modernization");
  });
});
