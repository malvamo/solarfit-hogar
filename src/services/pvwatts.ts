import "server-only";

import {
  normalizeNetSpecificYield,
  SolarProviderConfigurationError,
  type SolarYieldDataset,
  type SolarYieldRequest,
} from "./solar-yield";

const PVWATTS_ENDPOINT = "https://developer.nlr.gov/api/pvwatts/v8.json";
const PVWATTS_SOURCE_URL = "https://developer.nlr.gov/docs/solar/pvwatts/v8/";

interface PvwattsResponse {
  errors?: unknown[];
  warnings?: unknown[];
  version?: string;
  station_info?: {
    lat?: number;
    lon?: number;
    distance?: number;
    weather_data_source?: string;
    solar_resource_file?: string;
  };
  outputs?: {
    ac_monthly?: unknown[];
    ac_annual?: unknown;
    solrad_monthly?: unknown[];
  };
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isRetryable(status: number) {
  return status === 429 || status >= 500;
}

async function fetchWithRetry(url: URL, apiKey: string) {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Api-Key": apiKey,
        },
        signal: AbortSignal.timeout(12_000),
        // La clave se conserva fuera de la URL para reducir su exposición en
        // historiales y registros de infraestructura.
        cache: "no-store",
      });
      lastResponse = response;
      if (response.ok || !isRetryable(response.status) || attempt === 2) {
        return response;
      }
    } catch (error) {
      if (attempt === 2) throw error;
    }

    await delay(500 * 2 ** attempt);
  }

  return lastResponse as Response;
}

function readableMessages(values: unknown[] | undefined) {
  return (values ?? [])
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function optionalFiniteInRange(
  value: unknown,
  field: string,
  min: number,
  max = Number.POSITIVE_INFINITY,
) {
  if (value === undefined || value === null) return undefined;
  const number = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : Number.NaN;
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`PVWatts devolvió un valor inválido para ${field}.`);
  }
  return number;
}

export async function fetchPvwattsYield(
  request: SolarYieldRequest,
): Promise<SolarYieldDataset> {
  const apiKey = process.env.NLR_API_KEY?.trim();
  if (!apiKey) {
    throw new SolarProviderConfigurationError(
      "PVWatts no está configurado: define NLR_API_KEY únicamente en el entorno del servidor.",
    );
  }

  const url = new URL(PVWATTS_ENDPOINT);
  url.searchParams.set("system_capacity", "1");
  url.searchParams.set("module_type", "0");
  url.searchParams.set("array_type", "1");
  url.searchParams.set("losses", String(request.systemLossPct));
  url.searchParams.set("tilt", String(request.tiltDeg));
  url.searchParams.set("azimuth", String(request.azimuthDeg));
  url.searchParams.set("lat", String(request.latitude));
  url.searchParams.set("lon", String(request.longitude));
  url.searchParams.set("timeframe", "monthly");
  url.searchParams.set("dataset", "nsrdb");

  const response = await fetchWithRetry(url, apiKey);
  const payload = (await response.json().catch(() => null)) as PvwattsResponse | null;
  const providerErrors = readableMessages(payload?.errors);

  if (!response.ok || providerErrors.length > 0) {
    const detail = providerErrors[0];
    throw new Error(
      detail
        ? `PVWatts rechazó la consulta: ${detail}`
        : `PVWatts no respondió correctamente (HTTP ${response.status}).`,
    );
  }

  const monthlyValues = payload?.outputs?.ac_monthly;
  if (!Array.isArray(monthlyValues)) {
    throw new Error("PVWatts no devolvió la serie mensual AC esperada.");
  }

  const normalized = normalizeNetSpecificYield({
    monthlyValues,
    annualValue: payload?.outputs?.ac_annual,
    providerLabel: "PVWatts",
  });
  const warnings = [...readableMessages(payload?.warnings), ...normalized.warnings];
  warnings.push(
    "PVWatts reporta energía AC neta para 1 kWp e incorpora las pérdidas configuradas; no se volvió a aplicar el PR.",
    "PVWatts no sustituye una inspección de sombras cercanas ni un diseño eléctrico y estructural.",
  );

  const solrad = payload?.outputs?.solrad_monthly;
  const irradiationKwhM2Day = Array.isArray(solrad) && solrad.length === 12
    ? solrad.map((value, index) => {
        const parsed = optionalFiniteInRange(
          value,
          `solrad_monthly ${index + 1}`,
          0,
        );
        if (parsed === undefined) {
          throw new Error(`PVWatts no reportó radiación para el mes ${index + 1}.`);
        }
        return parsed;
      })
    : undefined;

  return {
    provider: "PVWATTS",
    apiVersion: payload?.version || "8",
    dataset:
      payload?.station_info?.weather_data_source ||
      payload?.station_info?.solar_resource_file ||
      "NSRDB seleccionado por PVWatts",
    fetchedAt: new Date().toISOString(),
    latitude: request.latitude,
    longitude: request.longitude,
    sourceLatitude: optionalFiniteInRange(
      payload?.station_info?.lat,
      "latitud de la estación",
      -90,
      90,
    ),
    sourceLongitude: optionalFiniteInRange(
      payload?.station_info?.lon,
      "longitud de la estación",
      -180,
      180,
    ),
    sourceDistanceM: optionalFiniteInRange(
      payload?.station_info?.distance,
      "distancia de la estación",
      0,
    ),
    monthlyKwhPerKwp: normalized.monthlyKwhPerKwp,
    annualKwhPerKwp: normalized.annualKwhPerKwp,
    irradiationKwhM2Day,
    warnings,
    sourceUrl: PVWATTS_SOURCE_URL,
  };
}
