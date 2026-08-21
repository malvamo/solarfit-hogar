import { describe, expect, it } from "vitest";

import { monthlyCsvTemplate, parseMonthlyCsv } from "./monthly-csv";

describe("importación mensual CSV", () => {
  it("interpreta las doce filas de la plantilla con comas", () => {
    const parsed = parseMonthlyCsv(monthlyCsvTemplate().replaceAll(",0,", ",100,"));

    expect(parsed).toHaveLength(12);
    expect(parsed.every((month) => month.consumptionKwh === 100)).toBe(true);
  });

  it("admite punto y coma y coma decimal", () => {
    const rows = [
      "month;consumption_kwh;billing_days;hsp",
      ...Array.from({ length: 12 }, (_, index) => `${index + 1};100,5;30;4,2`),
    ];

    const parsed = parseMonthlyCsv(rows.join("\n"));
    expect(parsed[0]).toMatchObject({ consumptionKwh: 100.5, hsp: 4.2 });
  });

  it("rechaza archivos sin los doce meses", () => {
    const incomplete = monthlyCsvTemplate().split("\n").slice(0, -1).join("\n");
    expect(() => parseMonthlyCsv(incomplete)).toThrow("exactamente doce filas");
  });
});
