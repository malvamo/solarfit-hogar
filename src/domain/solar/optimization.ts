import { SolarModelError } from "./types";

const ANGLE_EPSILON = 1e-9;
const YIELD_EPSILON = 1e-9;

export interface TiltYieldCandidate {
  tiltDeg: number;
  annualKwhPerKwp: number;
}

export interface TiltYieldEvaluation extends TiltYieldCandidate {
  estimatedFirstDerivativeKwhPerKwpDeg: number;
  estimatedSecondDerivativeKwhPerKwpDeg2: number | null;
  isSelectedMaximum: boolean;
}

export interface TiltOptimizationAnalysis {
  selectedTiltDeg: number;
  selectedAnnualKwhPerKwp: number;
  referenceTiltDeg: number | null;
  referenceAnnualKwhPerKwp: number | null;
  gainVsReferencePct: number | null;
  evaluations: TiltYieldEvaluation[];
}

function validateCandidate(candidate: TiltYieldCandidate) {
  if (!Number.isFinite(candidate.tiltDeg) || candidate.tiltDeg < 0 || candidate.tiltDeg > 90) {
    throw new SolarModelError(
      "Cada inclinación candidata debe estar entre 0° y 90°.",
      "candidateTiltsDeg",
    );
  }
  if (!Number.isFinite(candidate.annualKwhPerKwp) || candidate.annualKwhPerKwp < 0) {
    throw new SolarModelError(
      "Cada rendimiento anual candidato debe ser finito y no negativo.",
      "annualKwhPerKwp",
    );
  }
}

/**
 * Selecciona el máximo de rendimiento anual y aproxima derivadas con
 * diferencias finitas. No modifica los rendimientos netos recibidos ni aplica
 * PR/pérdidas adicionales.
 */
export function analyzeTiltOptimization(
  candidates: readonly TiltYieldCandidate[],
  referenceTiltDeg?: number,
): TiltOptimizationAnalysis {
  if (candidates.length < 2) {
    throw new SolarModelError(
      "Se requieren al menos dos inclinaciones para comparar.",
      "candidateTiltsDeg",
    );
  }

  candidates.forEach(validateCandidate);
  const ordered = [...candidates].toSorted((a, b) => a.tiltDeg - b.tiltDeg);
  if (
    ordered.some(
      (candidate, index) =>
        index > 0 &&
        Math.abs(candidate.tiltDeg - ordered[index - 1].tiltDeg) <= ANGLE_EPSILON,
    )
  ) {
    throw new SolarModelError(
      "Las inclinaciones candidatas no pueden repetirse.",
      "candidateTiltsDeg",
    );
  }
  if (!ordered.some((candidate) => candidate.annualKwhPerKwp > 0)) {
    throw new SolarModelError(
      "Al menos un rendimiento anual candidato debe ser mayor que cero.",
      "annualKwhPerKwp",
    );
  }

  const selected = ordered.reduce((best, candidate) =>
    candidate.annualKwhPerKwp > best.annualKwhPerKwp + YIELD_EPSILON
      ? candidate
      : best,
  );

  let reference: TiltYieldCandidate | undefined;
  if (referenceTiltDeg !== undefined) {
    if (!Number.isFinite(referenceTiltDeg)) {
      throw new SolarModelError(
        "La inclinación de referencia debe ser finita.",
        "referenceTiltDeg",
      );
    }
    reference = ordered.find(
      (candidate) => Math.abs(candidate.tiltDeg - referenceTiltDeg) <= ANGLE_EPSILON,
    );
    if (!reference) {
      throw new SolarModelError(
        "La inclinación de referencia debe estar incluida entre las candidatas.",
        "referenceTiltDeg",
      );
    }
  }

  const evaluations = ordered.map<TiltYieldEvaluation>((candidate, index) => {
    const previous = ordered[index - 1];
    const next = ordered[index + 1];
    const firstDerivative = previous && next
      ? (next.annualKwhPerKwp - previous.annualKwhPerKwp) /
        (next.tiltDeg - previous.tiltDeg)
      : next
        ? (next.annualKwhPerKwp - candidate.annualKwhPerKwp) /
          (next.tiltDeg - candidate.tiltDeg)
        : (candidate.annualKwhPerKwp - previous.annualKwhPerKwp) /
          (candidate.tiltDeg - previous.tiltDeg);

    const secondDerivative = previous && next
      ? (2 *
          ((next.annualKwhPerKwp - candidate.annualKwhPerKwp) /
            (next.tiltDeg - candidate.tiltDeg) -
            (candidate.annualKwhPerKwp - previous.annualKwhPerKwp) /
              (candidate.tiltDeg - previous.tiltDeg))) /
        (next.tiltDeg - previous.tiltDeg)
      : null;

    return {
      ...candidate,
      estimatedFirstDerivativeKwhPerKwpDeg: firstDerivative,
      estimatedSecondDerivativeKwhPerKwpDeg2: secondDerivative,
      isSelectedMaximum: Math.abs(candidate.tiltDeg - selected.tiltDeg) <= ANGLE_EPSILON,
    };
  });

  const gainVsReferencePct = !reference || reference.annualKwhPerKwp === 0
    ? null
    : ((selected.annualKwhPerKwp - reference.annualKwhPerKwp) /
        reference.annualKwhPerKwp) *
      100;

  return {
    selectedTiltDeg: selected.tiltDeg,
    selectedAnnualKwhPerKwp: selected.annualKwhPerKwp,
    referenceTiltDeg: reference?.tiltDeg ?? null,
    referenceAnnualKwhPerKwp: reference?.annualKwhPerKwp ?? null,
    gainVsReferencePct,
    evaluations,
  };
}
