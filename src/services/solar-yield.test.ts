import { describe, expect, it } from "vitest";

import {
  compassToPvgisAspect,
  normalizeNetSpecificYield,
} from "./solar-yield";

describe("normalizeNetSpecificYield", () => {
  it("conserva sin otro descuento la energía neta mensual del proveedor", () => {
    const monthly = Array.from({ length: 12 }, (_, index) => 80 + index);
    const annual = monthly.reduce((sum, value) => sum + value, 0);

    const result = normalizeNetSpecificYield({
      monthlyValues: monthly,
      annualValue: annual,
      providerLabel: "Proveedor de prueba",
    });

    expect(result.monthlyKwhPerKwp).toEqual(monthly);
    expect(result.annualKwhPerKwp).toBe(annual);
    expect(result.warnings).toEqual([]);
  });

  it("advierte cuando el total anual no coincide con la suma mensual", () => {
    const result = normalizeNetSpecificYield({
      monthlyValues: Array(12).fill(100),
      annualValue: 1_210,
      providerLabel: "Proveedor de prueba",
    });

    expect(result.annualKwhPerKwp).toBe(1_210);
    expect(result.warnings).toHaveLength(1);
  });

  it("rechaza una respuesta mensual incompleta", () => {
    expect(() =>
      normalizeNetSpecificYield({
        monthlyValues: Array(11).fill(100),
        providerLabel: "Proveedor de prueba",
      }),
    ).toThrow("doce meses");
  });

  it.each([null, "", "   ", false])(
    "rechaza el valor no numérico %p en vez de convertirlo silenciosamente en cero",
    (invalidValue) => {
      const monthly = Array(12).fill(100);
      monthly[4] = invalidValue;

      expect(() =>
        normalizeNetSpecificYield({
          monthlyValues: monthly,
          providerLabel: "Proveedor de prueba",
        }),
      ).toThrow("número finito no negativo");
    },
  );
});

describe("compassToPvgisAspect", () => {
  it("convierte el azimut de brújula a la convención PVGIS", () => {
    expect(compassToPvgisAspect(180)).toBe(0);
    expect(compassToPvgisAspect(90)).toBe(-90);
    expect(compassToPvgisAspect(270)).toBe(90);
    expect(compassToPvgisAspect(0)).toBe(-180);
  });
});
