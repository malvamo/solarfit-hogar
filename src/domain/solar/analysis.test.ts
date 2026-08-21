import { describe, expect, it } from "vitest";

import { compareEnergySeries, hspSensitivity } from "./analysis";
import { calendarizeBills } from "./bills";

describe("mathematical analysis", () => {
  it("calcula las métricas de comparación", () => {
    const result = compareEnergySeries([90, 110], [100, 100]);
    expect(result.maeKwh).toBe(10);
    expect(result.rmseKwh).toBe(10);
    expect(result.mapePct).toBe(10);
    expect(result.annualBiasPct).toBe(0);
  });

  it("calcula primera y segunda derivada del caso verificable", () => {
    const result = hspSensitivity({
      consumptionKwh: 240,
      targetCoverage: 1,
      panelPowerKwp: 0.5,
      hspPerDay: 4,
      days: 30,
      performanceRatio: 0.8,
    });
    expect(result.continuousPanels).toBe(5);
    expect(result.firstDerivative).toBe(-1.25);
    expect(result.secondDerivative).toBe(0.625);
  });
});

describe("calendarizeBills", () => {
  it("prorratea una factura que cruza dos meses", () => {
    const result = calendarizeBills([
      {
        startInclusive: "2026-01-20",
        endExclusive: "2026-02-10",
        consumptionKwh: 210,
      },
    ]);
    expect(result.months[0]).toMatchObject({ year: 2026, month: 1 });
    expect(result.months[0].consumptionKwh).toBeCloseTo(120, 8);
    expect(result.months[1].consumptionKwh).toBeCloseTo(90, 8);
  });
});
