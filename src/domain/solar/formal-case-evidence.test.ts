import { describe, expect, it } from "vitest";

import { DEMO_PROJECT } from "@/data/demo-project";
import type { SolarYieldDataset } from "@/services/solar-yield";
import {
  buildFormalCaseEvidence,
  canonicalJson,
  renderCaseSummaryCsv,
  renderEvidenceMarkdown,
  renderMonthlySeriesCsv,
  validateFormalCaseFixture,
  validateSolarYieldDataset,
  verifyFormalCaseEvidence,
  type FormalCaseFixture,
} from "./formal-case-evidence";

function fixture(): FormalCaseFixture {
  return {
    schemaVersion: "1.0.0",
    classification: "simulated_formal",
    caseId: "caso_prueba",
    scenarioVersion: "test-1",
    title: "Caso, de prueba",
    objective: "Comprobar exportaciones sin red.",
    simulationRule: "Serie determinista de la prueba.",
    declaredAssumptions: ["No representa facturas reales."],
    sourceReferences: [{
      id: "test",
      label: "Fuente de prueba",
      url: "https://example.com/source",
      use: "Fixture sin red.",
    }],
    input: {
      ...structuredClone(DEMO_PROJECT),
      projectName: "Caso formal de prueba",
      solarSourceMode: "pvgis-yield",
      months: DEMO_PROJECT.months.map((month) => ({
        ...month,
        hsp: null,
        specificYieldKwhPerKwp: null,
      })),
      consumptionProvenance: {
        kind: "synthetic",
        label: "Serie sintética de prueba",
      },
    },
  };
}

function dataset(provider: "PVGIS" | "PVWATTS", monthlyValue: number): SolarYieldDataset {
  return {
    provider,
    apiVersion: provider === "PVGIS" ? "5.3" : "8.5.0",
    dataset: "fixture-offline",
    fetchedAt: "2026-08-21T12:00:00.000Z",
    latitude: 4.711,
    longitude: -74.0721,
    monthlyKwhPerKwp: Array.from({ length: 12 }, () => monthlyValue),
    annualKwhPerKwp: monthlyValue * 12,
    warnings: [],
    sourceUrl: `https://example.com/${provider.toLowerCase()}`,
  };
}

function evidence() {
  return buildFormalCaseEvidence({
    fixture: fixture(),
    pvgis: dataset("PVGIS", 100),
    pvwatts: dataset("PVWATTS", 110),
    generatedAt: "2026-08-21T12:30:00.000Z",
    baseUrl: "https://solarfit-hogar.vercel.app/",
    runnerVersion: "test",
    retryPolicy: {
      maximumAttempts: 3,
      initialBackoffMs: 750,
      requestTimeoutMs: 30_000,
    },
  });
}

describe("formal case fixtures", () => {
  it("acepta un fixture formal y rechaza una clasificación engañosa", () => {
    expect(validateFormalCaseFixture(fixture()).caseId).toBe("caso_prueba");
    expect(() => validateFormalCaseFixture({
      ...fixture(),
      classification: "real_observed",
    })).toThrow("simulated_formal");
  });

  it("rechaza series de proveedor incompletas sin hacer solicitudes de red", () => {
    expect(() => validateSolarYieldDataset({
      ...dataset("PVGIS", 100),
      monthlyKwhPerKwp: [100],
    }, "PVGIS")).toThrow("doce valores");
  });
});

describe("formal case evidence", () => {
  it("usa los motores existentes y calcula métricas verificables", () => {
    const item = evidence();

    expect(item.results.pvgis.recommendedPanelCount).toBe(4);
    expect(item.validation.metrics.specificYield.maeKwh).toBe(10);
    expect(item.validation.metrics.specificYield.rmseKwh).toBe(10);
    expect(item.validation.metrics.specificYield.mapePct).toBeCloseTo(100 / 11, 8);
    expect(item.validation.metrics.generationAtComparedCapacity.maeKwh).toBe(18);
    expect(item.validation.monthlySeries).toHaveLength(12);
  });

  it("contrasta ambos proveedores con la misma capacidad cuando el techo limita", () => {
    const constrainedFixture = fixture();
    constrainedFixture.input.roofUsableM2 = 4.4;
    const item = buildFormalCaseEvidence({
      fixture: constrainedFixture,
      pvgis: dataset("PVGIS", 100),
      pvwatts: dataset("PVWATTS", 110),
      generatedAt: "2026-09-07T16:30:00.000Z",
      baseUrl: "https://solarfit-hogar.vercel.app",
      runnerVersion: "test",
      retryPolicy: { maximumAttempts: 1, initialBackoffMs: 0, requestTimeoutMs: 1000 },
    });

    expect(item.results.pvgis.buildablePanelCount).toBe(2);
    expect(item.validation.capacityUsedKwp).toBeCloseTo(0.9, 8);
    expect(item.validation.monthlySeries[0].pvgisGenerationAtComparedCapacityKwh).toBe(90);
    expect(item.validation.monthlySeries[0].pvwattsGenerationAtComparedCapacityKwh).toBe(99);
  });

  it("produce el mismo JSON y hash para entradas idénticas", () => {
    const first = evidence();
    const second = evidence();

    expect(canonicalJson(first)).toBe(canonicalJson(second));
    expect(first.integrity.sha256).toBe(second.integrity.sha256);
    expect(verifyFormalCaseEvidence(first)).toBe(true);

    const tampered = structuredClone(first);
    tampered.results.pvgis.recommendedPanelCount += 1;
    expect(verifyFormalCaseEvidence(tampered)).toBe(false);
  });

  it("exporta CSV y Markdown deterministas y correctamente escapados", () => {
    const item = evidence();
    const summary = renderCaseSummaryCsv([item]);
    const monthly = renderMonthlySeriesCsv([item]);
    const markdown = renderEvidenceMarkdown([item]);

    expect(summary).toBe(renderCaseSummaryCsv([item]));
    expect(monthly).toBe(renderMonthlySeriesCsv([item]));
    expect(markdown).toBe(renderEvidenceMarkdown([item]));
    expect(summary).toContain('"Caso, de prueba"');
    expect(monthly.trim().split("\n")).toHaveLength(13);
    expect(markdown).toContain("`simulated_formal`");
    expect(markdown).toContain(item.integrity.sha256);
  });
});
