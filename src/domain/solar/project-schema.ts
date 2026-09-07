import { z } from "zod";

import type { SolarProjectInput } from "./types";

export const SOLAR_PROJECT_SCHEMA_VERSION = 1;
export type ProjectEvidenceStatus =
  | "synthetic_demo"
  | "calibrated_simulation"
  | "pending_verification";

const finiteNumber = z.number().finite();
const optionalHttpUrl = z
  .string()
  .trim()
  .max(2_048)
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "https:" || protocol === "http:";
    } catch {
      return false;
    }
  }, "La URL de procedencia debe usar http o https.")
  .optional();

const provenanceSchema = z.object({
  kind: z.enum(["synthetic", "user", "official"]),
  label: z.string().max(500),
  sourceUrl: optionalHttpUrl,
  fetchedAt: z.string().max(100).optional(),
  note: z.string().max(2_000).optional(),
});

const monthlyInputSchema = z.object({
  month: z.number().int().min(1).max(12),
  consumptionKwh: finiteNumber,
  billingDays: finiteNumber,
  hsp: finiteNumber.nullable(),
  specificYieldKwhPerKwp: finiteNumber.nullable(),
});

export const solarProjectInputSchema: z.ZodType<SolarProjectInput> = z
  .object({
    projectName: z.string().max(200),
    locationLabel: z.string().max(300),
    latitude: finiteNumber.nullable(),
    longitude: finiteNumber.nullable(),
    targetCoveragePct: finiteNumber,
    sizingStrategy: z.enum(["annual-balance", "monthly-conservative"]),
    solarSourceMode: z.enum(["manual-hsp", "pvgis-yield"]),
    performanceRatioPct: finiteNumber,
    pvgisSystemLossPct: finiteNumber,
    tiltDeg: finiteNumber,
    azimuthDeg: finiteNumber,
    roofUsableM2: finiteNumber,
    installationAreaFactor: finiteNumber,
    panelModel: z.string().max(300),
    panelPowerWp: finiteNumber,
    panelWidthM: finiteNumber,
    panelHeightM: finiteNumber,
    uncertaintyPct: finiteNumber,
    months: z.array(monthlyInputSchema).length(12),
    consumptionProvenance: provenanceSchema,
    solarProvenance: provenanceSchema,
    panelProvenance: provenanceSchema,
  })
  .superRefine((project, context) => {
    const orderedMonths = project.months.map((month) => month.month).toSorted((a, b) => a - b);
    if (orderedMonths.some((month, index) => month !== index + 1)) {
      context.addIssue({
        code: "custom",
        path: ["months"],
        message: "Debe existir una sola entrada para cada mes del 1 al 12.",
      });
    }
  });

const projectEnvelopeSchema = z.object({
  schemaVersion: z.literal(SOLAR_PROJECT_SCHEMA_VERSION),
  project: solarProjectInputSchema,
});

export class SolarProjectFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SolarProjectFileError";
  }
}

function describeSchemaError(error: z.ZodError) {
  const issue = error.issues[0];
  const path = issue?.path.length ? ` en ${issue.path.join(".")}` : "";
  return `El proyecto no cumple el esquema SolarFit v1${path}.`;
}

function parseProjectInput(value: unknown) {
  const parsed = solarProjectInputSchema.safeParse(value);
  if (!parsed.success) {
    throw new SolarProjectFileError(describeSchemaError(parsed.error));
  }
  return parsed.data;
}

export function parseSolarProjectValue(value: unknown): SolarProjectInput {
  if (typeof value === "object" && value !== null && "schemaVersion" in value) {
    const version = (value as { schemaVersion?: unknown }).schemaVersion;
    if (version !== SOLAR_PROJECT_SCHEMA_VERSION) {
      throw new SolarProjectFileError(
        `La versión ${String(version)} del archivo no es compatible; esta aplicación admite SolarFit v1.`,
      );
    }

    const parsed = projectEnvelopeSchema.safeParse(value);
    if (!parsed.success) {
      throw new SolarProjectFileError(describeSchemaError(parsed.error));
    }
    return parsed.data.project;
  }

  return parseProjectInput(value);
}

export function parseSolarProjectJson(text: string): SolarProjectInput {
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new SolarProjectFileError("El archivo no contiene JSON válido.");
  }
  return parseSolarProjectValue(value);
}

export function getProjectEvidenceStatus(
  project: SolarProjectInput,
): ProjectEvidenceStatus {
  const hasSyntheticSource = [
    project.consumptionProvenance,
    project.solarProvenance,
    project.panelProvenance,
  ].some((source) => source.kind === "synthetic");
  if (!hasSyntheticSource) return "pending_verification";
  const syntheticSources = [
    project.consumptionProvenance,
    project.solarProvenance,
    project.panelProvenance,
  ].filter((source) => source.kind === "synthetic");
  return syntheticSources.every((source) => Boolean(source.sourceUrl))
    ? "calibrated_simulation"
    : "synthetic_demo";
}
