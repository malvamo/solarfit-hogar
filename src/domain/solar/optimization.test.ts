import { describe, expect, it } from "vitest";

import { analyzeTiltOptimization } from "./optimization";

describe("analyzeTiltOptimization", () => {
  it("selecciona el mayor rendimiento entre los escenarios evaluados", () => {
    const candidates = [0, 10, 20, 30, 40].map((tiltDeg) => ({
      tiltDeg,
      annualKwhPerKwp: 1_000 - (tiltDeg - 20) ** 2,
    }));

    const result = analyzeTiltOptimization(candidates, 10);
    const optimum = result.evaluations.find((item) => item.tiltDeg === 20);

    expect(result.selectedTiltDeg).toBe(20);
    expect(result.selectedAnnualKwhPerKwp).toBe(1_000);
    expect(result.gainVsReferencePct).toBeCloseTo(11.111111, 5);
    expect(optimum?.isSelectedMaximum).toBe(true);
  });

  it("elige el menor ángulo cuando dos rendimientos máximos empatan", () => {
    const result = analyzeTiltOptimization([
      { tiltDeg: 10, annualKwhPerKwp: 950 },
      { tiltDeg: 20, annualKwhPerKwp: 1_000 },
      { tiltDeg: 30, annualKwhPerKwp: 1_000 },
    ]);

    expect(result.selectedTiltDeg).toBe(20);
  });

  it("exige ángulos únicos y una referencia evaluada", () => {
    expect(() =>
      analyzeTiltOptimization([
        { tiltDeg: 10, annualKwhPerKwp: 900 },
        { tiltDeg: 10, annualKwhPerKwp: 920 },
      ]),
    ).toThrow("no pueden repetirse");

    expect(() =>
      analyzeTiltOptimization(
        [
          { tiltDeg: 10, annualKwhPerKwp: 900 },
          { tiltDeg: 20, annualKwhPerKwp: 950 },
        ],
        15,
      ),
    ).toThrow("debe estar incluida");
  });
});
