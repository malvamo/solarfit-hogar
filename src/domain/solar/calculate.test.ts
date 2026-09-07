import { describe, expect, it } from "vitest";

import { DEMO_PROJECT } from "@/data/demo-project";
import { calculateSolarProject } from "./calculate";
import type { SolarProjectInput } from "./types";

function cloneInput(): SolarProjectInput {
  return structuredClone(DEMO_PROJECT);
}

describe("calculateSolarProject", () => {
  it("calcula un balance anual consistente y redondea al final", () => {
    const input = cloneInput();
    const result = calculateSolarProject(input);

    expect(result.continuousPanelCount).toBeGreaterThan(0);
    expect(result.recommendedPanelCount).toBe(Math.ceil(result.continuousPanelCount));
    expect(result.recommendedAnnualCoveragePct).toBeGreaterThanOrEqual(100);
    expect(result.monthly).toHaveLength(12);
  });

  it("no duplica el PR cuando la fuente es rendimiento neto de PVGIS", () => {
    const input = cloneInput();
    input.solarSourceMode = "pvgis-yield";
    input.months = input.months.map((month) => ({
      ...month,
      hsp: null,
      specificYieldKwhPerKwp: 100,
    }));
    input.performanceRatioPct = 10;

    const result = calculateSolarProject(input);
    const expectedContinuous =
      result.targetAnnualEnergyKwh / (12 * 100 * (input.panelPowerWp / 1_000));

    expect(result.continuousPanelCount).toBeCloseTo(expectedContinuous, 8);
    expect(result.warnings.some((warning) => warning.includes("no se volvió a aplicar el PR"))).toBe(true);
  });

  it("reporta la inviabilidad del techo sin alterar la recomendación matemática", () => {
    const input = cloneInput();
    input.roofUsableM2 = 1;
    const result = calculateSolarProject(input);

    expect(result.roofFeasible).toBe(false);
    expect(result.recommendedPanelCount).toBeGreaterThan(result.buildablePanelCount);
    expect(result.buildablePanelCount).toBe(result.maximumPanelsByRoof);
  });

  it("requiere menos paneles cuando aumenta la radiación", () => {
    const baseline = cloneInput();
    const highSolar = cloneInput();
    highSolar.months = highSolar.months.map((month) => ({
      ...month,
      specificYieldKwhPerKwp: (month.specificYieldKwhPerKwp ?? 0) * 1.2,
    }));

    expect(calculateSolarProject(highSolar).continuousPanelCount).toBeLessThan(
      calculateSolarProject(baseline).continuousPanelCount,
    );
  });

  it("en el escenario conservador satisface la meta de cada mes si el techo es viable", () => {
    const input = cloneInput();
    input.sizingStrategy = "monthly-conservative";
    input.roofUsableM2 = 200;
    const result = calculateSolarProject(input);

    expect(result.monthly.every((month) => (month.recommendedCoveragePct ?? 0) >= 100)).toBe(true);
  });

  it("expone la derivada negativa de n(Y)=K/Y", () => {
    const result = calculateSolarProject(cloneInput());

    expect(result.sensitivity.derivativeAtReference).toBeLessThan(0);
    expect(result.sensitivity.referenceYield).toBeGreaterThan(0);
    expect(result.sensitivity.estimatedPanelChange).toBeLessThan(0);
  });
});
