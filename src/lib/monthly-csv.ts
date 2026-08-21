import { MONTHS, SolarModelError, type MonthlySolarInput } from "@/domain/solar/types";

function parseCell(value: string, label: string) {
  const parsed = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(parsed)) {
    throw new SolarModelError(`El valor de ${label} no es numérico.`);
  }
  return parsed;
}

export function parseMonthlyCsv(text: string): MonthlySolarInput[] {
  const rows = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);
  if (rows.length < 2) {
    throw new SolarModelError("El CSV debe contener encabezado y doce filas mensuales.");
  }
  const delimiter = rows[0].includes(";") ? ";" : ",";
  const header = rows[0].split(delimiter).map((cell) => cell.trim().toLowerCase());
  const required = ["month", "consumption_kwh", "billing_days", "hsp"];
  const indexes = required.map((field) => header.indexOf(field));
  if (indexes.some((index) => index < 0)) {
    throw new SolarModelError(
      `El encabezado debe contener: ${required.join(", ")}.`,
      "csv",
    );
  }
  if (rows.length !== 13) {
    throw new SolarModelError("El CSV debe contener exactamente doce filas de datos.", "csv");
  }

  const parsed = rows.slice(1).map((row, rowIndex) => {
    const cells = row.split(delimiter);
    const month = parseCell(cells[indexes[0]] ?? "", `mes en fila ${rowIndex + 2}`);
    const consumptionKwh = parseCell(
      cells[indexes[1]] ?? "",
      `consumo en fila ${rowIndex + 2}`,
    );
    const billingDays = parseCell(cells[indexes[2]] ?? "", `días en fila ${rowIndex + 2}`);
    const hsp = parseCell(cells[indexes[3]] ?? "", `HSP en fila ${rowIndex + 2}`);
    return { month, consumptionKwh, billingDays, hsp, specificYieldKwhPerKwp: null };
  });
  const sorted = parsed.toSorted((a, b) => a.month - b.month);
  if (sorted.some((item, index) => item.month !== MONTHS[index].number)) {
    throw new SolarModelError("El CSV debe incluir una sola fila para cada mes del 1 al 12.");
  }
  return sorted;
}

export function monthlyCsvTemplate() {
  return [
    "month,consumption_kwh,billing_days,hsp",
    ...MONTHS.map((month) => `${month.number},0,${month.defaultDays},0`),
  ].join("\n");
}
