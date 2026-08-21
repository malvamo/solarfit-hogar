export interface SolarYieldDataset {
  provider: "PVGIS" | "PVWATTS";
  apiVersion: string;
  dataset: string;
  fetchedAt: string;
  latitude: number;
  longitude: number;
  sourceLatitude?: number;
  sourceLongitude?: number;
  sourceDistanceM?: number;
  monthlyKwhPerKwp: number[];
  annualKwhPerKwp: number;
  irradiationKwhM2Day?: number[];
  interannualSdKwhPerKwp?: number[];
  warnings: string[];
  sourceUrl: string;
}

export interface SolarYieldRequest {
  latitude: number;
  longitude: number;
  tiltDeg: number;
  azimuthDeg: number;
  systemLossPct: number;
}

export interface NormalizedNetYield {
  monthlyKwhPerKwp: number[];
  annualKwhPerKwp: number;
  warnings: string[];
}

export class SolarProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SolarProviderConfigurationError";
  }
}

function finiteNonNegative(value: unknown, field: string) {
  const number = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : Number.NaN;
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${field} debe ser un número finito no negativo.`);
  }
  return number;
}

/**
 * Normaliza una serie que el proveedor ya reporta como energía AC neta para
 * un sistema de 1 kWp. Esta función deliberadamente no recibe PR ni pérdidas:
 * aplicarlos de nuevo duplicaría el descuento configurado en el proveedor.
 */
export function normalizeNetSpecificYield(args: {
  monthlyValues: readonly unknown[];
  annualValue?: unknown;
  providerLabel: string;
  annualToleranceKwhPerKwp?: number;
}): NormalizedNetYield {
  if (args.monthlyValues.length !== 12) {
    throw new Error(`${args.providerLabel} no devolvió los doce meses esperados.`);
  }

  const monthlyKwhPerKwp = args.monthlyValues.map((value, index) =>
    finiteNonNegative(
      value,
      `${args.providerLabel}: rendimiento neto del mes ${index + 1}`,
    ),
  );
  const annualFromMonths = monthlyKwhPerKwp.reduce((sum, value) => sum + value, 0);
  const annualKwhPerKwp = args.annualValue === undefined
    ? annualFromMonths
    : finiteNonNegative(
        args.annualValue,
        `${args.providerLabel}: rendimiento neto anual`,
      );
  const tolerance = args.annualToleranceKwhPerKwp ?? 2;
  const warnings: string[] = [];

  if (Math.abs(annualKwhPerKwp - annualFromMonths) > tolerance) {
    warnings.push(
      `La suma mensual y el total anual de ${args.providerLabel} difieren más de ${tolerance} kWh/kWp; se conservó el total anual reportado.`,
    );
  }

  return { monthlyKwhPerKwp, annualKwhPerKwp, warnings };
}

export function compassToPvgisAspect(compassDeg: number) {
  const raw = compassDeg - 180;
  return ((raw + 180) % 360 + 360) % 360 - 180;
}
