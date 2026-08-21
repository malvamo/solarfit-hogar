import {
  MONTHS,
  SolarModelError,
  type MonthlySolarInput,
  type SensitivityResult,
  type SolarProjectInput,
  type SolarProjectResult,
} from "./types";

const EPSILON = 1e-10;

function requireFinite(
  value: number,
  field: string,
  min: number,
  max = Number.POSITIVE_INFINITY,
) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new SolarModelError(
      `${field} debe estar entre ${min} y ${Number.isFinite(max) ? max : "un valor finito"}.`,
      field,
    );
  }
}

function validateMonths(months: MonthlySolarInput[]) {
  if (months.length !== 12) {
    throw new SolarModelError("Se requieren exactamente doce registros mensuales.", "months");
  }

  const uniqueMonths = new Set(months.map((item) => item.month));
  if (uniqueMonths.size !== 12 || months.some((item) => item.month < 1 || item.month > 12)) {
    throw new SolarModelError("Los meses deben ser únicos y estar numerados del 1 al 12.", "months");
  }
}

function safeCeil(value: number) {
  return Math.ceil(value - EPSILON);
}

function buildSensitivity(
  input: SolarProjectInput,
  monthlyContinuous: number[],
  specificYields: number[],
  panelPowerKw: number,
  targetFraction: number,
): SensitivityResult {
  const isConservative = input.sizingStrategy === "monthly-conservative";
  const isManualHsp = input.solarSourceMode === "manual-hsp";
  const limitingIndex = monthlyContinuous.reduce(
    (best, value, index, values) => (value > values[best] ? index : best),
    0,
  );
  const selectedMonths = isConservative ? [input.months[limitingIndex]] : input.months;
  const selectedYields = isConservative ? [specificYields[limitingIndex]] : specificYields;
  const referenceConsumption = selectedMonths.reduce((sum, month) => sum + month.consumptionKwh, 0);
  const referenceDays = selectedMonths.reduce((sum, month) => sum + month.billingDays, 0);

  const effectivePerformanceRatio = isManualHsp
    ? input.performanceRatioPct / 100
    : 1;
  const referenceHsp = isManualHsp
    ? selectedMonths.reduce(
        (sum, month) => sum + (month.hsp ?? 0) * month.billingDays,
        0,
      ) / referenceDays
    : selectedYields.reduce((sum, value) => sum + value, 0) / referenceDays;

  const kConstant =
    (targetFraction * referenceConsumption) /
    (panelPowerKw * effectivePerformanceRatio * referenceDays);
  const derivativeAtReference = -kConstant / referenceHsp ** 2;
  const minHsp = Math.max(0.25, referenceHsp * 0.55);
  const maxHsp = referenceHsp * 1.55;
  const points = Array.from({ length: 25 }, (_, index) => {
    const hsp = minHsp + ((maxHsp - minHsp) * index) / 24;
    return { hsp, continuousPanels: kConstant / hsp };
  });

  return {
    resourceSymbol: isManualHsp ? "h" : "y_d",
    resourceLabel: isManualHsp
      ? "horas solares pico"
      : "rendimiento específico neto diario equivalente",
    resourceUnit: isManualHsp ? "HSP" : "kWh/kWp·día",
    referenceMonth: isConservative ? input.months[limitingIndex].month : null,
    referenceLabel: isConservative
      ? `mes crítico: ${MONTHS[limitingIndex].label}`
      : "balance anual equivalente",
    kConstant,
    referenceHsp,
    derivativeAtReference,
    changeForPointOneHsp: derivativeAtReference * 0.1,
    elasticity: -1,
    points,
  };
}

export function calculateSolarProject(input: SolarProjectInput): SolarProjectResult {
  validateMonths(input.months);
  requireFinite(input.targetCoveragePct, "Cobertura objetivo", 1, 100);
  requireFinite(input.performanceRatioPct, "Rendimiento global", 1, 100);
  requireFinite(input.pvgisSystemLossPct, "Pérdidas PVGIS", 0, 100);
  requireFinite(input.roofUsableM2, "Área útil del techo", 0);
  requireFinite(input.installationAreaFactor, "Factor de área de instalación", 1, 3);
  requireFinite(input.panelPowerWp, "Potencia del panel", 1, 2_000);
  requireFinite(input.panelWidthM, "Ancho del panel", 0.1, 5);
  requireFinite(input.panelHeightM, "Alto del panel", 0.1, 5);
  requireFinite(input.uncertaintyPct, "Incertidumbre", 0, 50);

  const targetFraction = input.targetCoveragePct / 100;
  const panelPowerKw = input.panelPowerWp / 1_000;
  const performanceRatio = input.performanceRatioPct / 100;
  const panelAreaM2 = input.panelWidthM * input.panelHeightM;
  const panelAreaWithInstallationM2 = panelAreaM2 * input.installationAreaFactor;

  const months = [...input.months].toSorted((a, b) => a.month - b.month);
  const specificYields = months.map((month) => {
    requireFinite(month.consumptionKwh, `${MONTHS[month.month - 1].label}: consumo`, 0, 20_000);
    requireFinite(month.billingDays, `${MONTHS[month.month - 1].label}: días`, 1, 45);

    if (input.solarSourceMode === "manual-hsp") {
      requireFinite(month.hsp ?? Number.NaN, `${MONTHS[month.month - 1].label}: HSP`, 0.1, 12);
      return (month.hsp ?? 0) * month.billingDays * performanceRatio;
    }

    requireFinite(
      month.specificYieldKwhPerKwp ?? Number.NaN,
      `${MONTHS[month.month - 1].label}: rendimiento PVGIS`,
      0.1,
      500,
    );
    return month.specificYieldKwhPerKwp ?? 0;
  });

  const totalConsumptionKwh = months.reduce((sum, month) => sum + month.consumptionKwh, 0);
  if (totalConsumptionKwh <= 0) {
    throw new SolarModelError("El consumo anual debe ser mayor que cero.", "months");
  }

  const energyPerPanel = specificYields.map((yieldValue) => yieldValue * panelPowerKw);
  const monthlyContinuous = months.map((month, index) =>
    month.consumptionKwh === 0
      ? 0
      : (targetFraction * month.consumptionKwh) / energyPerPanel[index],
  );
  const limitingIndex = monthlyContinuous.reduce(
    (best, value, index, values) => (value > values[best] ? index : best),
    0,
  );
  const annualContinuous =
    (targetFraction * totalConsumptionKwh) /
    energyPerPanel.reduce((sum, value) => sum + value, 0);
  const continuousPanelCount =
    input.sizingStrategy === "annual-balance"
      ? annualContinuous
      : monthlyContinuous[limitingIndex];
  const recommendedPanelCount = safeCeil(continuousPanelCount);
  const maximumPanelsByRoof = Math.max(
    0,
    Math.floor(input.roofUsableM2 / panelAreaWithInstallationM2 + EPSILON),
  );
  const roofFeasible = recommendedPanelCount <= maximumPanelsByRoof;
  const buildablePanelCount = Math.min(recommendedPanelCount, maximumPanelsByRoof);

  const monthly = months.map((month, index) => {
    const recommendedGenerationKwh = recommendedPanelCount * energyPerPanel[index];
    const buildableGenerationKwh = buildablePanelCount * energyPerPanel[index];
    const targetEnergyKwh = targetFraction * month.consumptionKwh;
    return {
      ...month,
      monthLabel: MONTHS[month.month - 1].label,
      specificYieldKwhPerKwpUsed: specificYields[index],
      energyPerPanelKwh: energyPerPanel[index],
      targetEnergyKwh,
      continuousPanelsRequired: monthlyContinuous[index],
      recommendedGenerationKwh,
      buildableGenerationKwh,
      recommendedCoveragePct:
        month.consumptionKwh > 0
          ? (recommendedGenerationKwh / month.consumptionKwh) * 100
          : null,
      buildableCoveragePct:
        month.consumptionKwh > 0
          ? (buildableGenerationKwh / month.consumptionKwh) * 100
          : null,
      recommendedBalanceKwh: recommendedGenerationKwh - month.consumptionKwh,
      buildableBalanceKwh: buildableGenerationKwh - month.consumptionKwh,
    };
  });

  const recommendedAnnualGenerationKwh = monthly.reduce(
    (sum, month) => sum + month.recommendedGenerationKwh,
    0,
  );
  const buildableAnnualGenerationKwh = monthly.reduce(
    (sum, month) => sum + month.buildableGenerationKwh,
    0,
  );
  const uncertainty = input.uncertaintyPct / 100;
  const optimisticContinuous = continuousPanelCount / (1 + uncertainty);
  const conservativeContinuous = continuousPanelCount / (1 - uncertainty);
  const warnings: string[] = [];

  if (!roofFeasible) {
    warnings.push(
      `La meta requiere ${recommendedPanelCount} paneles, pero el techo admite aproximadamente ${maximumPanelsByRoof}. La meta no es físicamente viable con estos supuestos.`,
    );
  }
  if (input.solarSourceMode === "pvgis-yield") {
    warnings.push(
      "El rendimiento específico de PVGIS ya incorpora las pérdidas configuradas; no se volvió a aplicar el PR.",
    );
  }
  if (input.sizingStrategy === "annual-balance") {
    warnings.push(
      "El balance anual puede compensar la meta en el total del año sin alcanzarla necesariamente en todos los meses.",
    );
  }
  warnings.push(
    "Este resultado es una prefactibilidad energética: no dimensiona inversor, protecciones, estructura, cableado ni baterías.",
  );

  return {
    strategy: input.sizingStrategy,
    sourceMode: input.solarSourceMode,
    continuousPanelCount,
    recommendedPanelCount,
    buildablePanelCount,
    limitingMonth: months[limitingIndex].month,
    panelPowerKw,
    continuousCapacityKwp: continuousPanelCount * panelPowerKw,
    recommendedCapacityKwp: recommendedPanelCount * panelPowerKw,
    buildableCapacityKwp: buildablePanelCount * panelPowerKw,
    panelAreaM2,
    panelAreaWithInstallationM2,
    requiredRoofAreaM2: recommendedPanelCount * panelAreaWithInstallationM2,
    maximumPanelsByRoof,
    roofFeasible,
    totalConsumptionKwh,
    targetAnnualEnergyKwh: targetFraction * totalConsumptionKwh,
    recommendedAnnualGenerationKwh,
    buildableAnnualGenerationKwh,
    recommendedAnnualCoveragePct:
      (recommendedAnnualGenerationKwh / totalConsumptionKwh) * 100,
    buildableAnnualCoveragePct:
      (buildableAnnualGenerationKwh / totalConsumptionKwh) * 100,
    uncertaintyPanelRange: {
      optimisticContinuous,
      conservativeContinuous,
      optimisticRounded: safeCeil(optimisticContinuous),
      conservativeRounded: safeCeil(conservativeContinuous),
    },
    monthly,
    sensitivity: buildSensitivity(
      { ...input, months },
      monthlyContinuous,
      specificYields,
      panelPowerKw,
      targetFraction,
    ),
    warnings,
  };
}
