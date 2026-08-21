import "server-only";

import {
  compassToPvgisAspect,
  normalizeNetSpecificYield,
  type SolarYieldDataset,
  type SolarYieldRequest,
} from "./solar-yield";

const PVGIS_ENDPOINT = "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc";
const PVGIS_SOURCE_URL =
  "https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en";

interface PvgisMonth {
  month: number;
  E_m: number;
  "H(i)_d"?: number;
  SD_m?: number;
}

interface PvgisResponse {
  inputs?: {
    location?: { latitude?: number; longitude?: number };
    meteo_data?: {
      radiation_db?: string;
      year_min?: number;
      year_max?: number;
    };
  };
  outputs?: {
    monthly?: { fixed?: PvgisMonth[] };
    totals?: { fixed?: { E_y?: number } };
  };
  message?: string;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// PVGIS limita las solicitudes por IP. Esta cola espacia los inicios a menos
// de 14 solicitudes/segundo por instancia, incluso cuando una optimización
// evalúa varios ángulos en paralelo. El límite del proveedor sigue siendo la
// autoridad y los despliegues con múltiples instancias deben añadir control
// distribuido en la plataforma.
const PVGIS_MIN_START_INTERVAL_MS = 75;
let nextPvgisStartAt = 0;
let pvgisStartQueue: Promise<void> = Promise.resolve();

async function waitForPvgisRequestSlot() {
  const previous = pvgisStartQueue;
  let release: () => void = () => {};
  pvgisStartQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    const waitMs = Math.max(0, nextPvgisStartAt - Date.now());
    if (waitMs > 0) await delay(waitMs);
    nextPvgisStartAt = Date.now() + PVGIS_MIN_START_INTERVAL_MS;
  } finally {
    release();
  }
}

function isRetryable(status: number) {
  return status === 429 || status === 529 || status >= 500;
}

async function fetchWithRetry(url: URL) {
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await waitForPvgisRequestSlot();
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
        next: { revalidate: 86_400 },
      });
      lastResponse = response;
      if (response.ok || !isRetryable(response.status) || attempt === 2) {
        return response;
      }
    } catch (error) {
      if (attempt === 2) throw error;
    }
    await delay(350 * 2 ** attempt);
  }
  return lastResponse as Response;
}

function asFinite(value: unknown, field: string) {
  const number = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : Number.NaN;
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`PVGIS devolvió un valor inválido para ${field}.`);
  }
  return number;
}

function optionalMonthlySeries(
  months: PvgisMonth[],
  read: (month: PvgisMonth) => unknown,
  field: string,
  warnings: string[],
) {
  const values = months.map(read);
  if (values.some((value) => value === undefined || value === null)) {
    warnings.push(`PVGIS no entregó una serie mensual completa de ${field}; se omitió ese dato opcional.`);
    return undefined;
  }
  return values.map((value, index) => asFinite(value, `${field} del mes ${index + 1}`));
}

export async function fetchPvgisYield(
  request: SolarYieldRequest,
): Promise<SolarYieldDataset> {
  const url = new URL(PVGIS_ENDPOINT);
  url.searchParams.set("lat", String(request.latitude));
  url.searchParams.set("lon", String(request.longitude));
  url.searchParams.set("peakpower", "1");
  url.searchParams.set("loss", String(request.systemLossPct));
  url.searchParams.set("pvtechchoice", "crystSi");
  url.searchParams.set("mountingplace", "building");
  url.searchParams.set("angle", String(request.tiltDeg));
  url.searchParams.set("aspect", String(compassToPvgisAspect(request.azimuthDeg)));
  url.searchParams.set("usehorizon", "1");
  url.searchParams.set("outputformat", "json");
  url.searchParams.set("browser", "0");

  const response = await fetchWithRetry(url);
  const payload = (await response.json().catch(() => null)) as PvgisResponse | null;
  if (!response.ok) {
    throw new Error(
      payload?.message || `PVGIS no respondió correctamente (HTTP ${response.status}).`,
    );
  }

  const fixed = payload?.outputs?.monthly?.fixed;
  if (!Array.isArray(fixed) || fixed.length !== 12) {
    throw new Error("PVGIS no devolvió los doce meses esperados.");
  }
  const ordered = [...fixed].toSorted((a, b) => a.month - b.month);
  if (ordered.some((item, index) => item.month !== index + 1)) {
    throw new Error("PVGIS devolvió meses faltantes o duplicados.");
  }

  const normalized = normalizeNetSpecificYield({
    monthlyValues: ordered.map((item) => item.E_m),
    annualValue: payload?.outputs?.totals?.fixed?.E_y,
    providerLabel: "PVGIS",
  });
  const warnings = [...normalized.warnings];
  warnings.push(
    "PVGIS modela el horizonte topográfico, pero no las sombras cercanas de árboles, muros, antenas o edificios.",
  );
  const irradiationKwhM2Day = optionalMonthlySeries(
    ordered,
    (item) => item["H(i)_d"],
    "irradiación diaria",
    warnings,
  );
  const interannualSdKwhPerKwp = optionalMonthlySeries(
    ordered,
    (item) => item.SD_m,
    "desviación interanual",
    warnings,
  );

  return {
    provider: "PVGIS",
    apiVersion: "5.3",
    dataset:
      payload?.inputs?.meteo_data?.radiation_db || "Base recomendada automáticamente por PVGIS",
    fetchedAt: new Date().toISOString(),
    latitude: request.latitude,
    longitude: request.longitude,
    sourceLatitude: payload?.inputs?.location?.latitude,
    sourceLongitude: payload?.inputs?.location?.longitude,
    monthlyKwhPerKwp: normalized.monthlyKwhPerKwp,
    annualKwhPerKwp: normalized.annualKwhPerKwp,
    irradiationKwhM2Day,
    interannualSdKwhPerKwp,
    warnings,
    sourceUrl: PVGIS_SOURCE_URL,
  };
}
