import { createHash } from "node:crypto";

import { compareEnergySeries, type EnergySeriesComparison } from "./analysis";
import { calculateSolarProject } from "./calculate";
import { MONTHS, type SolarProjectInput, type SolarProjectResult } from "./types";
import type { SolarYieldDataset } from "../../services/solar-yield";

export const FORMAL_CASE_SCHEMA_VERSION = "1.0.0" as const;
export const FORMAL_CASE_CLASSIFICATION = "simulated_formal" as const;

export interface FormalCaseSourceReference {
  id: string;
  label: string;
  url: string;
  use: string;
}

export interface FormalCaseFixture {
  schemaVersion: typeof FORMAL_CASE_SCHEMA_VERSION;
  classification: typeof FORMAL_CASE_CLASSIFICATION;
  caseId: string;
  scenarioVersion: string;
  title: string;
  objective: string;
  simulationRule: string;
  declaredAssumptions: string[];
  sourceReferences: FormalCaseSourceReference[];
  input: SolarProjectInput;
}

export interface FormalCaseMonthlyComparison {
  month: number;
  monthLabel: string;
  consumptionKwh: number;
  pvgisSpecificYieldKwhPerKwp: number;
  pvwattsSpecificYieldKwhPerKwp: number;
  specificYieldDifferenceKwhPerKwp: number;
  pvgisGenerationAtComparedCapacityKwh: number;
  pvwattsGenerationAtComparedCapacityKwh: number;
  generationDifferenceKwh: number;
  pvgisBuildableCoveragePct: number | null;
}

export interface FormalCaseEvidenceCore {
  schemaVersion: typeof FORMAL_CASE_SCHEMA_VERSION;
  classification: typeof FORMAL_CASE_CLASSIFICATION;
  caseId: string;
  scenarioVersion: string;
  generatedAt: string;
  execution: {
    runnerVersion: string;
    baseUrl: string;
    sequentialRequests: true;
    retryPolicy: {
      maximumAttempts: number;
      initialBackoffMs: number;
      requestTimeoutMs: number;
    };
    endpoints: {
      pvgis: string;
      pvwatts: string;
    };
  };
  fixture: FormalCaseFixture;
  providerResponses: {
    pvgis: SolarYieldDataset;
    pvwatts: SolarYieldDataset;
  };
  evaluatedInputs: {
    pvgis: SolarProjectInput;
    pvwatts: SolarProjectInput;
  };
  results: {
    pvgis: SolarProjectResult;
    pvwatts: SolarProjectResult;
  };
  validation: {
    modelProvider: "PVGIS";
    referenceProvider: "PVWATTS";
    comparisonScope: string;
    capacityUsedKwp: number;
    monthlySeries: FormalCaseMonthlyComparison[];
    metrics: {
      specificYield: EnergySeriesComparison;
      generationAtComparedCapacity: EnergySeriesComparison;
    };
    recommendationDifference: {
      continuousPanels: number;
      roundedPanels: number;
      capacityKwp: number;
    };
    pvwattsEquivalentAnnualCoveragePct: number;
  };
}

export interface FormalCaseEvidence extends FormalCaseEvidenceCore {
  integrity: {
    algorithm: "SHA-256";
    canonicalization: "recursive-key-sort-json-v1";
    sha256: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${field} debe ser un objeto.`);
  return value;
}

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} debe ser una cadena no vacía.`);
  }
  return value;
}

function requireFiniteNumber(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} debe ser un número finito.`);
  }
  return value;
}

function requireStringArray(value: unknown, field: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`${field} debe ser una lista de cadenas no vacías.`);
  }
}

export function validateFormalCaseFixture(value: unknown): FormalCaseFixture {
  const fixture = requireRecord(value, "fixture");
  if (fixture.schemaVersion !== FORMAL_CASE_SCHEMA_VERSION) {
    throw new Error(`fixture.schemaVersion debe ser ${FORMAL_CASE_SCHEMA_VERSION}.`);
  }
  if (fixture.classification !== FORMAL_CASE_CLASSIFICATION) {
    throw new Error(`fixture.classification debe ser ${FORMAL_CASE_CLASSIFICATION}.`);
  }

  const caseId = requireString(fixture.caseId, "fixture.caseId");
  if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(caseId)) {
    throw new Error("fixture.caseId solo puede contener minúsculas, números y guiones bajos.");
  }
  requireString(fixture.scenarioVersion, "fixture.scenarioVersion");
  requireString(fixture.title, "fixture.title");
  requireString(fixture.objective, "fixture.objective");
  requireString(fixture.simulationRule, "fixture.simulationRule");
  requireStringArray(fixture.declaredAssumptions, "fixture.declaredAssumptions");

  if (!Array.isArray(fixture.sourceReferences) || fixture.sourceReferences.length === 0) {
    throw new Error("fixture.sourceReferences debe contener al menos una fuente.");
  }
  fixture.sourceReferences.forEach((source, index) => {
    const item = requireRecord(source, `fixture.sourceReferences[${index}]`);
    requireString(item.id, `fixture.sourceReferences[${index}].id`);
    requireString(item.label, `fixture.sourceReferences[${index}].label`);
    const url = requireString(item.url, `fixture.sourceReferences[${index}].url`);
    try {
      new URL(url);
    } catch {
      throw new Error(`fixture.sourceReferences[${index}].url debe ser una URL válida.`);
    }
    requireString(item.use, `fixture.sourceReferences[${index}].use`);
  });

  const input = requireRecord(fixture.input, "fixture.input");
  requireString(input.projectName, "fixture.input.projectName");
  requireString(input.locationLabel, "fixture.input.locationLabel");
  requireFiniteNumber(input.latitude, "fixture.input.latitude");
  requireFiniteNumber(input.longitude, "fixture.input.longitude");
  if (input.solarSourceMode !== "pvgis-yield") {
    throw new Error("Los casos formales deben declarar solarSourceMode=pvgis-yield.");
  }
  if (!Array.isArray(input.months) || input.months.length !== 12) {
    throw new Error("fixture.input.months debe contener exactamente doce meses.");
  }
  input.months.forEach((month, index) => {
    const item = requireRecord(month, `fixture.input.months[${index}]`);
    if (item.month !== index + 1) {
      throw new Error("fixture.input.months debe estar ordenado de enero a diciembre.");
    }
    const consumption = requireFiniteNumber(
      item.consumptionKwh,
      `fixture.input.months[${index}].consumptionKwh`,
    );
    if (consumption < 0) throw new Error("El consumo mensual no puede ser negativo.");
    requireFiniteNumber(item.billingDays, `fixture.input.months[${index}].billingDays`);
    if (item.specificYieldKwhPerKwp !== null || item.hsp !== null) {
      throw new Error("El fixture debe dejar hsp y specificYieldKwhPerKwp en null; el runner los completa.");
    }
  });

  const consumptionProvenance = requireRecord(
    input.consumptionProvenance,
    "fixture.input.consumptionProvenance",
  );
  if (consumptionProvenance.kind !== "synthetic") {
    throw new Error("El consumo de un caso simulated_formal debe tener provenance kind=synthetic.");
  }

  return value as FormalCaseFixture;
}

export function validateSolarYieldDataset(
  value: unknown,
  expectedProvider: "PVGIS" | "PVWATTS",
): SolarYieldDataset {
  const dataset = requireRecord(value, expectedProvider);
  if (dataset.provider !== expectedProvider) {
    throw new Error(`Se esperaba provider=${expectedProvider}.`);
  }
  requireString(dataset.apiVersion, `${expectedProvider}.apiVersion`);
  requireString(dataset.dataset, `${expectedProvider}.dataset`);
  const fetchedAt = requireString(dataset.fetchedAt, `${expectedProvider}.fetchedAt`);
  if (Number.isNaN(Date.parse(fetchedAt))) {
    throw new Error(`${expectedProvider}.fetchedAt debe ser una fecha ISO válida.`);
  }
  requireFiniteNumber(dataset.latitude, `${expectedProvider}.latitude`);
  requireFiniteNumber(dataset.longitude, `${expectedProvider}.longitude`);
  if (!Array.isArray(dataset.monthlyKwhPerKwp) || dataset.monthlyKwhPerKwp.length !== 12) {
    throw new Error(`${expectedProvider}.monthlyKwhPerKwp debe contener doce valores.`);
  }
  dataset.monthlyKwhPerKwp.forEach((item, index) => {
    const parsed = requireFiniteNumber(item, `${expectedProvider}.monthlyKwhPerKwp[${index}]`);
    if (parsed < 0) throw new Error("El rendimiento específico no puede ser negativo.");
  });
  const annual = requireFiniteNumber(dataset.annualKwhPerKwp, `${expectedProvider}.annualKwhPerKwp`);
  if (annual < 0) throw new Error("El rendimiento anual no puede ser negativo.");
  requireString(dataset.sourceUrl, `${expectedProvider}.sourceUrl`);
  if (!Array.isArray(dataset.warnings) || dataset.warnings.some((item) => typeof item !== "string")) {
    throw new Error(`${expectedProvider}.warnings debe ser una lista de cadenas.`);
  }
  return value as SolarYieldDataset;
}

function providerInput(
  fixture: FormalCaseFixture,
  dataset: SolarYieldDataset,
): SolarProjectInput {
  return {
    ...structuredClone(fixture.input),
    months: fixture.input.months.map((month, index) => ({
      ...month,
      hsp: null,
      specificYieldKwhPerKwp: dataset.monthlyKwhPerKwp[index],
    })),
    solarProvenance: {
      kind: "official",
      label: `${dataset.provider} ${dataset.apiVersion} — ${dataset.dataset}`,
      sourceUrl: dataset.sourceUrl,
      fetchedAt: dataset.fetchedAt,
      note: "Rendimiento específico AC neto para 1 kWp; las pérdidas configuradas ya están incorporadas.",
    },
  };
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!isRecord(value)) return value;

  return Object.keys(value)
    .toSorted()
    .reduce<Record<string, unknown>>((result, key) => {
      if (value[key] !== undefined) result[key] = canonicalValue(value[key]);
      return result;
    }, {});
}

export function canonicalJson(value: unknown, pretty = false) {
  return JSON.stringify(canonicalValue(value), null, pretty ? 2 : undefined);
}

export function sha256Canonical(value: unknown) {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}

export function sha256Text(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function buildFormalCaseEvidence(args: {
  fixture: FormalCaseFixture;
  pvgis: SolarYieldDataset;
  pvwatts: SolarYieldDataset;
  generatedAt: string;
  baseUrl: string;
  runnerVersion: string;
  retryPolicy: FormalCaseEvidenceCore["execution"]["retryPolicy"];
}): FormalCaseEvidence {
  const fixture = validateFormalCaseFixture(args.fixture);
  const pvgis = validateSolarYieldDataset(args.pvgis, "PVGIS");
  const pvwatts = validateSolarYieldDataset(args.pvwatts, "PVWATTS");
  if (Number.isNaN(Date.parse(args.generatedAt))) {
    throw new Error("generatedAt debe ser una fecha ISO válida.");
  }

  const pvgisInput = providerInput(fixture, pvgis);
  const pvwattsInput = providerInput(fixture, pvwatts);
  const pvgisResult = calculateSolarProject(pvgisInput);
  const pvwattsResult = calculateSolarProject(pvwattsInput);
  // Compare both providers at the same physically installable capacity. Using the
  // PVGIS recommendation here would make roof-constrained cases incomparable.
  const capacityUsedKwp = pvgisResult.buildableCapacityKwp;
  const pvgisGeneration = pvgis.monthlyKwhPerKwp.map((value) => value * capacityUsedKwp);
  const pvwattsGeneration = pvwatts.monthlyKwhPerKwp.map((value) => value * capacityUsedKwp);
  const monthlySeries = MONTHS.map((month, index): FormalCaseMonthlyComparison => ({
    month: month.number,
    monthLabel: month.label,
    consumptionKwh: fixture.input.months[index].consumptionKwh,
    pvgisSpecificYieldKwhPerKwp: pvgis.monthlyKwhPerKwp[index],
    pvwattsSpecificYieldKwhPerKwp: pvwatts.monthlyKwhPerKwp[index],
    specificYieldDifferenceKwhPerKwp:
      pvgis.monthlyKwhPerKwp[index] - pvwatts.monthlyKwhPerKwp[index],
    pvgisGenerationAtComparedCapacityKwh: pvgisGeneration[index],
    pvwattsGenerationAtComparedCapacityKwh: pvwattsGeneration[index],
    generationDifferenceKwh: pvgisGeneration[index] - pvwattsGeneration[index],
    pvgisBuildableCoveragePct: pvgisResult.monthly[index].buildableCoveragePct,
  }));
  const totalConsumption = pvgisResult.totalConsumptionKwh;
  const pvwattsEquivalentAnnualGeneration = pvwattsGeneration.reduce(
    (sum, value) => sum + value,
    0,
  );

  const baseUrl = args.baseUrl.replace(/\/$/, "");
  const core: FormalCaseEvidenceCore = {
    schemaVersion: FORMAL_CASE_SCHEMA_VERSION,
    classification: FORMAL_CASE_CLASSIFICATION,
    caseId: fixture.caseId,
    scenarioVersion: fixture.scenarioVersion,
    generatedAt: args.generatedAt,
    execution: {
      runnerVersion: args.runnerVersion,
      baseUrl,
      sequentialRequests: true,
      retryPolicy: args.retryPolicy,
      endpoints: {
        pvgis: `${baseUrl}/api/pvgis`,
        pvwatts: `${baseUrl}/api/pvwatts`,
      },
    },
    fixture,
    providerResponses: { pvgis, pvwatts },
    evaluatedInputs: { pvgis: pvgisInput, pvwatts: pvwattsInput },
    results: { pvgis: pvgisResult, pvwatts: pvwattsResult },
    validation: {
      modelProvider: "PVGIS",
      referenceProvider: "PVWATTS",
      comparisonScope:
        "Contraste mensual del rendimiento específico AC neto y de la generación de ambos proveedores usando exactamente la misma capacidad construible según el techo declarado.",
      capacityUsedKwp,
      monthlySeries,
      metrics: {
        specificYield: compareEnergySeries(
          pvgis.monthlyKwhPerKwp,
          pvwatts.monthlyKwhPerKwp,
        ),
        generationAtComparedCapacity: compareEnergySeries(
          pvgisGeneration,
          pvwattsGeneration,
        ),
      },
      recommendationDifference: {
        continuousPanels: pvgisResult.continuousPanelCount - pvwattsResult.continuousPanelCount,
        roundedPanels: pvgisResult.recommendedPanelCount - pvwattsResult.recommendedPanelCount,
        capacityKwp: pvgisResult.recommendedCapacityKwp - pvwattsResult.recommendedCapacityKwp,
      },
      pvwattsEquivalentAnnualCoveragePct:
        totalConsumption === 0 ? 0 : (pvwattsEquivalentAnnualGeneration / totalConsumption) * 100,
    },
  };

  return {
    ...core,
    integrity: {
      algorithm: "SHA-256",
      canonicalization: "recursive-key-sort-json-v1",
      sha256: sha256Canonical(core),
    },
  };
}

export function verifyFormalCaseEvidence(evidence: FormalCaseEvidence) {
  const { integrity, ...core } = evidence;
  return integrity.algorithm === "SHA-256" && integrity.sha256 === sha256Canonical(core);
}

function csvCell(value: string | number | boolean | null) {
  if (value === null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csvLine(values: Array<string | number | boolean | null>) {
  return values.map(csvCell).join(",");
}

function rounded(value: number | null, digits = 3): number | null {
  if (value === null) return null;
  return Number(value.toFixed(digits));
}

export function renderCaseSummaryCsv(evidence: readonly FormalCaseEvidence[]) {
  const header = csvLine([
    "case_id",
    "classification",
    "title",
    "location",
    "generated_at",
    "annual_consumption_kwh",
    "pvgis_annual_yield_kwh_per_kwp",
    "pvwatts_annual_yield_kwh_per_kwp",
    "yield_mae_kwh_per_kwp_month",
    "yield_rmse_kwh_per_kwp_month",
    "yield_mape_pct",
    "yield_annual_bias_pct",
    "pvgis_continuous_panels",
    "pvgis_recommended_panels",
    "pvwatts_recommended_panels",
    "rounded_panel_difference",
    "roof_feasible",
    "maximum_panels_by_roof",
    "buildable_panels",
    "recommended_capacity_kwp",
    "buildable_annual_coverage_pct",
    "pvwatts_equivalent_annual_coverage_pct",
    "sha256",
  ]);
  const rows = [...evidence]
    .toSorted((a, b) => a.caseId.localeCompare(b.caseId))
    .map((item) => csvLine([
      item.caseId,
      item.classification,
      item.fixture.title,
      item.fixture.input.locationLabel,
      item.generatedAt,
      rounded(item.results.pvgis.totalConsumptionKwh),
      rounded(item.providerResponses.pvgis.annualKwhPerKwp),
      rounded(item.providerResponses.pvwatts.annualKwhPerKwp),
      rounded(item.validation.metrics.specificYield.maeKwh),
      rounded(item.validation.metrics.specificYield.rmseKwh),
      rounded(item.validation.metrics.specificYield.mapePct),
      rounded(item.validation.metrics.specificYield.annualBiasPct),
      rounded(item.results.pvgis.continuousPanelCount, 6),
      item.results.pvgis.recommendedPanelCount,
      item.results.pvwatts.recommendedPanelCount,
      item.validation.recommendationDifference.roundedPanels,
      item.results.pvgis.roofFeasible,
      item.results.pvgis.maximumPanelsByRoof,
      item.results.pvgis.buildablePanelCount,
      rounded(item.results.pvgis.recommendedCapacityKwp),
      rounded(item.results.pvgis.buildableAnnualCoveragePct),
      rounded(item.validation.pvwattsEquivalentAnnualCoveragePct),
      item.integrity.sha256,
    ]));
  return `${[header, ...rows].join("\n")}\n`;
}

export function renderMonthlySeriesCsv(evidence: readonly FormalCaseEvidence[]) {
  const header = csvLine([
    "case_id",
    "month",
    "month_label",
    "consumption_kwh",
    "pvgis_specific_yield_kwh_per_kwp",
    "pvwatts_specific_yield_kwh_per_kwp",
    "specific_yield_difference_kwh_per_kwp",
    "pvgis_generation_at_compared_capacity_kwh",
    "pvwatts_generation_at_compared_capacity_kwh",
    "generation_difference_kwh",
    "pvgis_buildable_coverage_pct",
  ]);
  const rows = [...evidence]
    .toSorted((a, b) => a.caseId.localeCompare(b.caseId))
    .flatMap((item) => item.validation.monthlySeries.map((month) => csvLine([
      item.caseId,
      month.month,
      month.monthLabel,
      rounded(month.consumptionKwh),
      rounded(month.pvgisSpecificYieldKwhPerKwp, 6),
      rounded(month.pvwattsSpecificYieldKwhPerKwp, 6),
      rounded(month.specificYieldDifferenceKwhPerKwp, 6),
      rounded(month.pvgisGenerationAtComparedCapacityKwh, 6),
      rounded(month.pvwattsGenerationAtComparedCapacityKwh, 6),
      rounded(month.generationDifferenceKwh, 6),
      rounded(month.pvgisBuildableCoveragePct),
    ])));
  return `${[header, ...rows].join("\n")}\n`;
}

function markdownNumber(value: number | null, digits = 2) {
  return value === null ? "N/D" : value.toFixed(digits);
}

export function renderEvidenceMarkdown(evidence: readonly FormalCaseEvidence[]) {
  if (evidence.length === 0) throw new Error("Se requiere al menos un caso para generar Markdown.");
  const ordered = [...evidence].toSorted((a, b) => a.caseId.localeCompare(b.caseId));
  const lines = [
    "# Evidencia reproducible — cinco casos SolarFit Hogar",
    "",
    `Ejecución: ${ordered[0].generatedAt}`,
    "",
    "> Clasificación: `simulated_formal`. Los consumos representan promedios oficiales agregados aplicados a escenarios residenciales hipotéticos; las áreas de techo son supuestos declarados. No son facturas ni levantamientos físicos. El recurso solar fue consultado en PVGIS y PVWatts por medio de los endpoints de producción.",
    "",
    "## Resumen",
    "",
    "| Caso | Consumo anual (kWh) | PVGIS (kWh/kWp·año) | PVWatts (kWh/kWp·año) | Paneles PVGIS | Paneles PVWatts | Techo viable | Diferencia anual (%) |",
    "|---|---:|---:|---:|---:|---:|:---:|---:|",
    ...ordered.map((item) =>
      `| ${item.fixture.title} | ${markdownNumber(item.results.pvgis.totalConsumptionKwh, 0)} | ${markdownNumber(item.providerResponses.pvgis.annualKwhPerKwp)} | ${markdownNumber(item.providerResponses.pvwatts.annualKwhPerKwp)} | ${item.results.pvgis.recommendedPanelCount} | ${item.results.pvwatts.recommendedPanelCount} | ${item.results.pvgis.roofFeasible ? "Sí" : "No"} | ${markdownNumber(item.validation.metrics.specificYield.annualBiasPct)} |`,
    ),
    "",
    "## Método de contraste",
    "",
    "Para cada ubicación se consultó primero PVGIS y después PVWatts, sin paralelizar solicitudes. El motor `calculateSolarProject` se ejecutó una vez con cada serie mensual. La presentación compara el rendimiento anual, la cobertura con la misma capacidad física y el cambio —o no— en la cantidad entera de paneles; PVWatts es una referencia de contraste, no una medición de campo.",
    "",
    "## Resultados por caso",
    "",
  ];

  ordered.forEach((item) => {
    const result = item.results.pvgis;
    lines.push(
      `### ${item.fixture.title}`,
      "",
      `- ID: \`${item.caseId}\``,
      `- Regla de simulación: ${item.fixture.simulationRule}`,
      `- Recomendación PVGIS: ${result.recommendedPanelCount} paneles (${markdownNumber(result.recommendedCapacityKwp)} kWp).`,
      `- Capacidad construible por techo: ${result.buildablePanelCount} paneles; viabilidad: ${result.roofFeasible ? "sí" : "no"}.`,
      `- Cobertura anual construible según PVGIS: ${markdownNumber(result.buildableAnnualCoveragePct)} %.`,
      `- Cobertura equivalente al contrastar la misma capacidad física construible con PVWatts: ${markdownNumber(item.validation.pvwattsEquivalentAnnualCoveragePct)} %.`,
      `- Diferencia de recomendación PVGIS − PVWatts: ${item.validation.recommendationDifference.roundedPanels} panel(es).`,
      `- Integridad SHA-256: \`${item.integrity.sha256}\``,
      "",
    );
  });

  lines.push(
    "## Alcance",
    "",
    "Esta evidencia comprueba reproducibilidad del cálculo y contrasta dos modelos solares oficiales. No demuestra exactitud frente a una instalación ni reemplaza facturas, medición de sombras, visita estructural, diseño eléctrico, cotización o estudio de conexión a red.",
    "",
  );
  return lines.join("\n");
}
