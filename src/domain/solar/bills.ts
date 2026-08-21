import { SolarModelError } from "./types";

export interface BillingPeriod {
  startInclusive: string;
  endExclusive: string;
  consumptionKwh: number;
}

export interface CalendarizedConsumption {
  months: Array<{ year: number; month: number; consumptionKwh: number }>;
  warnings: string[];
}

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new SolarModelError(`La fecha ${value} debe tener formato AAAA-MM-DD.`);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (date.toISOString().slice(0, 10) !== value) {
    throw new SolarModelError(`La fecha ${value} no existe en el calendario.`);
  }
  return date;
}

function dayDifference(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function calendarizeBills(bills: BillingPeriod[]): CalendarizedConsumption {
  if (bills.length === 0) {
    throw new SolarModelError("Se requiere al menos una factura.", "bills");
  }
  const normalized = bills
    .map((bill) => {
      const start = parseIsoDate(bill.startInclusive);
      const end = parseIsoDate(bill.endExclusive);
      const days = dayDifference(start, end);
      if (days <= 0) throw new SolarModelError("El fin de la factura debe ser posterior al inicio.");
      if (!Number.isFinite(bill.consumptionKwh) || bill.consumptionKwh < 0) {
        throw new SolarModelError("El consumo de cada factura debe ser no negativo y finito.");
      }
      return { ...bill, start, end, days };
    })
    .toSorted((a, b) => a.start.getTime() - b.start.getTime());

  const warnings: string[] = [
    "Las facturas que cruzan meses se prorratearon suponiendo consumo diario uniforme.",
  ];
  for (let index = 1; index < normalized.length; index += 1) {
    const previous = normalized[index - 1];
    const current = normalized[index];
    if (current.start < previous.end) {
      throw new SolarModelError("Se detectaron períodos de facturación superpuestos.", "bills");
    }
    if (current.start > previous.end) {
      warnings.push(
        `Hay un intervalo sin factura entre ${previous.endExclusive} y ${current.startInclusive}.`,
      );
    }
  }

  const totals = new Map<string, number>();
  for (const bill of normalized) {
    const perDay = bill.consumptionKwh / bill.days;
    for (
      let cursor = new Date(bill.start);
      cursor < bill.end;
      cursor = new Date(cursor.getTime() + 86_400_000)
    ) {
      const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
      totals.set(key, (totals.get(key) ?? 0) + perDay);
    }
  }

  const months = [...totals.entries()]
    .map(([key, consumptionKwh]) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month, consumptionKwh };
    })
    .toSorted((a, b) => a.year - b.year || a.month - b.month);
  return { months, warnings };
}
