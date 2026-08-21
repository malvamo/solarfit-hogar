import { calculateSolarProject } from "./calculate";
import { SolarModelError, type SolarProjectInput } from "./types";

export interface EnergySeriesComparison {
  maeKwh: number;
  rmseKwh: number;
  mapePct: number | null;
  annualBiasPct: number | null;
}

export function compareEnergySeries(
  modelKwh: number[],
  referenceKwh: number[],
): EnergySeriesComparison {
  if (modelKwh.length === 0 || modelKwh.length !== referenceKwh.length) {
    throw new SolarModelError(
      "Las series de validación deben tener la misma longitud y al menos un dato.",
      "validationSeries",
    );
  }
  const pairs = modelKwh.map((model, index) => {
    const reference = referenceKwh[index];
    if (![model, reference].every(Number.isFinite)) {
      throw new SolarModelError("Las series de validación solo pueden contener números finitos.");
    }
    return { model, reference, error: model - reference };
  });
  const maeKwh = pairs.reduce((sum, pair) => sum + Math.abs(pair.error), 0) / pairs.length;
  const rmseKwh = Math.sqrt(
    pairs.reduce((sum, pair) => sum + pair.error ** 2, 0) / pairs.length,
  );
  const positiveReferences = pairs.filter((pair) => pair.reference > 0);
  const mapePct = positiveReferences.length === 0
    ? null
    : (positiveReferences.reduce(
        (sum, pair) => sum + Math.abs(pair.error / pair.reference),
        0,
      ) /
        positiveReferences.length) *
      100;
  const referenceTotal = referenceKwh.reduce((sum, value) => sum + value, 0);
  const modelTotal = modelKwh.reduce((sum, value) => sum + value, 0);

  return {
    maeKwh,
    rmseKwh,
    mapePct,
    annualBiasPct:
      referenceTotal === 0 ? null : ((modelTotal - referenceTotal) / referenceTotal) * 100,
  };
}

export function hspSensitivity(args: {
  consumptionKwh: number;
  targetCoverage: number;
  panelPowerKwp: number;
  hspPerDay: number;
  days: number;
  performanceRatio: number;
}) {
  const values = Object.values(args);
  if (values.some((value) => !Number.isFinite(value)) || values.some((value) => value <= 0)) {
    throw new SolarModelError("Los argumentos de sensibilidad deben ser positivos y finitos.");
  }
  const k =
    (args.targetCoverage * args.consumptionKwh) /
    (args.panelPowerKwp * args.days * args.performanceRatio);
  return {
    continuousPanels: k / args.hspPerDay,
    firstDerivative: -k / args.hspPerDay ** 2,
    secondDerivative: (2 * k) / args.hspPerDay ** 3,
    k,
  };
}

export function optimizeTilt(
  candidates: Array<{ tiltDeg: number; input: SolarProjectInput }>,
) {
  if (candidates.length === 0) {
    throw new SolarModelError("Se requiere al menos una inclinación candidata.", "tiltCandidates");
  }
  const evaluations = candidates.map((candidate) => ({
    tiltDeg: candidate.tiltDeg,
    continuousPanels: calculateSolarProject(candidate.input).continuousPanelCount,
  }));
  const best = evaluations.reduce((current, item) =>
    item.continuousPanels < current.continuousPanels ? item : current,
  );
  return { selectedTiltDeg: best.tiltDeg, continuousPanels: best.continuousPanels, evaluations };
}
