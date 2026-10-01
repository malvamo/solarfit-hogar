import { describe, expect, it } from "vitest";

import { calculatePrototype } from "./model";

describe("calculatePrototype", () => {
  it("reproduce el caso calibrado de Bogotá", () => {
    const result = calculatePrototype({
      monthlyConsumptionKwh: 156,
      annualSpecificYield: 1260.65,
      roofUsableM2: 20,
      panelPowerWp: 450,
    });
    expect(result.recommendedPanels).toBe(4);
    expect(result.roofFeasible).toBe(true);
    expect(result.buildableCoveragePct).toBeCloseTo(121.22, 2);
  });

  it("reproduce el caso calibrado de Barranquilla", () => {
    const result = calculatePrototype({
      monthlyConsumptionKwh: 279,
      annualSpecificYield: 1567.18,
      roofUsableM2: 35,
      panelPowerWp: 450,
    });
    expect(result.recommendedPanels).toBe(5);
    expect(result.buildableCoveragePct).toBeCloseTo(105.32, 2);
  });

  it("separa la necesidad energética de la restricción de techo en Quibdó", () => {
    const result = calculatePrototype({
      monthlyConsumptionKwh: 118.8,
      annualSpecificYield: 898.28,
      roofUsableM2: 8,
      panelPowerWp: 450,
    });
    expect(result.recommendedPanels).toBe(4);
    expect(result.maximumPanelsByRoof).toBe(3);
    expect(result.roofFeasible).toBe(false);
    expect(result.buildableCoveragePct).toBeCloseTo(85.06, 2);
  });

  it("la derivada es negativa: más rendimiento reduce la necesidad", () => {
    const result = calculatePrototype({
      monthlyConsumptionKwh: 156,
      annualSpecificYield: 1260.65,
      roofUsableM2: 20,
      panelPowerWp: 450,
    });
    expect(result.derivativeAtReference).toBeLessThan(0);
    expect(result.derivativeAtReference).toBeCloseTo(-0.00262, 5);
  });
});

