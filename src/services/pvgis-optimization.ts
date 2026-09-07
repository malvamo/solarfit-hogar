import "server-only";

import {
  analyzeTiltOptimization,
  type TiltYieldEvaluation,
} from "@/domain/solar/optimization";
import { fetchPvgisYield } from "./pvgis";
import type { SolarYieldRequest } from "./solar-yield";

export const MAX_PVGIS_TILT_CANDIDATES = 13;

const PVGIS_SOURCE_URL =
  "https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en";

export interface PvgisTiltOptimizationRequest
  extends Omit<SolarYieldRequest, "tiltDeg"> {
  candidateTiltsDeg: number[];
  referenceTiltDeg?: number;
}

export interface PvgisTiltEvaluation extends TiltYieldEvaluation {
  monthlyKwhPerKwp: number[];
  dataset: string;
}

export interface PvgisTiltOptimizationResult {
  provider: "PVGIS";
  apiVersion: string;
  objective: "maximize-annual-specific-yield";
  evaluatedAt: string;
  selectedTiltDeg: number;
  selectedAnnualKwhPerKwp: number;
  referenceTiltDeg: number | null;
  referenceAnnualKwhPerKwp: number | null;
  gainVsReferencePct: number | null;
  evaluations: PvgisTiltEvaluation[];
  failedEvaluations: Array<{ tiltDeg: number; error: string }>;
  warnings: string[];
  sourceUrl: string;
}

export async function optimizePvgisTilt(
  request: PvgisTiltOptimizationRequest,
): Promise<PvgisTiltOptimizationResult> {
  if (
    request.candidateTiltsDeg.length < 2 ||
    request.candidateTiltsDeg.length > MAX_PVGIS_TILT_CANDIDATES
  ) {
    throw new Error(
      `La comparación admite entre 2 y ${MAX_PVGIS_TILT_CANDIDATES} inclinaciones por consulta.`,
    );
  }

  const settled = await Promise.allSettled(
    request.candidateTiltsDeg.map(async (tiltDeg) => ({
      tiltDeg,
      dataset: await fetchPvgisYield({
        latitude: request.latitude,
        longitude: request.longitude,
        tiltDeg,
        azimuthDeg: request.azimuthDeg,
        systemLossPct: request.systemLossPct,
      }),
    })),
  );

  const successful = settled.flatMap((item) =>
    item.status === "fulfilled" ? [item.value] : [],
  );
  const failedEvaluations = settled.flatMap((item, index) =>
    item.status === "rejected"
      ? [{
          tiltDeg: request.candidateTiltsDeg[index],
          error: item.reason instanceof Error
            ? item.reason.message
            : "PVGIS no respondió para esta inclinación.",
        }]
      : [],
  );

  if (successful.length < 2) {
    const detail = failedEvaluations[0]?.error;
    throw new Error(
      detail
        ? `PVGIS no produjo suficientes escenarios para comparar. ${detail}`
        : "PVGIS no produjo suficientes escenarios para comparar.",
    );
  }

  const requestedReferenceTilt = request.referenceTiltDeg;
  const referenceSucceeded = requestedReferenceTilt === undefined
    ? undefined
    : successful.some(
        (item) => Math.abs(item.tiltDeg - requestedReferenceTilt) <= 1e-9,
      )
      ? requestedReferenceTilt
      : undefined;
  const analysis = analyzeTiltOptimization(
    successful.map((item) => ({
      tiltDeg: item.tiltDeg,
      annualKwhPerKwp: item.dataset.annualKwhPerKwp,
    })),
    referenceSucceeded,
  );

  const evaluations = analysis.evaluations.map<PvgisTiltEvaluation>((evaluation) => {
    const source = successful.find(
      (item) => Math.abs(item.tiltDeg - evaluation.tiltDeg) <= 1e-9,
    );
    if (!source) {
      throw new Error("No fue posible asociar un escenario PVGIS con su inclinación.");
    }
    return {
      ...evaluation,
      monthlyKwhPerKwp: source.dataset.monthlyKwhPerKwp,
      dataset: source.dataset.dataset,
    };
  });

  const warnings = new Set(successful.flatMap((item) => item.dataset.warnings));
  warnings.add(
    "Se eligió el mayor rendimiento únicamente entre los ángulos evaluados; no se afirma un máximo continuo.",
  );
  warnings.add(
    "Cada rendimiento específico de PVGIS ya incorpora las pérdidas configuradas; no se aplicó PR adicional.",
  );
  if (failedEvaluations.length > 0) {
    warnings.add(
      `No se pudieron evaluar ${failedEvaluations.length} inclinación(es); el máximo se eligió entre las respuestas válidas.`,
    );
  }
  if (requestedReferenceTilt !== undefined && referenceSucceeded === undefined) {
    warnings.add(
      "La inclinación de referencia falló en PVGIS, por lo que no se calculó la ganancia porcentual frente a ella.",
    );
  }

  return {
    provider: "PVGIS",
    apiVersion: successful[0].dataset.apiVersion,
    objective: "maximize-annual-specific-yield",
    evaluatedAt: new Date().toISOString(),
    selectedTiltDeg: analysis.selectedTiltDeg,
    selectedAnnualKwhPerKwp: analysis.selectedAnnualKwhPerKwp,
    referenceTiltDeg: analysis.referenceTiltDeg,
    referenceAnnualKwhPerKwp: analysis.referenceAnnualKwhPerKwp,
    gainVsReferencePct: analysis.gainVsReferencePct,
    evaluations,
    failedEvaluations,
    warnings: [...warnings],
    sourceUrl: PVGIS_SOURCE_URL,
  };
}
