import { describe, expect, it } from "vitest";

import { compareEnergySeries } from "./analysis";
import { calendarizeBills } from "./bills";

describe("mathematical analysis", () => {
  it("calcula las métricas de comparación", () => {
    const result = compareEnergySeries([90, 110], [100, 100]);
    expect(result.maeKwh).toBe(10);
    expect(result.rmseKwh).toBe(10);
    expect(result.mapePct).toBe(10);
    expect(result.annualBiasPct).toBe(0);
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
