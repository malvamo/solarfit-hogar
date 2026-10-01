import {
  INSTALLATION_AREA_FACTOR,
  PANEL_HEIGHT_M,
  PANEL_WIDTH_M,
} from "./cases";

export interface PrototypeInputs {
  monthlyConsumptionKwh: number;
  annualSpecificYield: number;
  roofUsableM2: number;
  panelPowerWp: number;
}

export interface PrototypeResult {
  annualConsumptionKwh: number;
  panelPowerKw: number;
  energyPerPanelKwh: number;
  continuousPanels: number;
  recommendedPanels: number;
  areaPerPanelM2: number;
  maximumPanelsByRoof: number;
  buildablePanels: number;
  roofFeasible: boolean;
  buildableGenerationKwh: number;
  buildableCoveragePct: number;
  derivativeAtReference: number;
  estimatedChangePer100Yield: number;
}

function requirePositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} debe ser mayor que cero.`);
  }
}

export function calculatePrototype(input: PrototypeInputs): PrototypeResult {
  requirePositive(input.monthlyConsumptionKwh, "El consumo mensual");
  requirePositive(input.annualSpecificYield, "El rendimiento solar");
  requirePositive(input.panelPowerWp, "La potencia del panel");
  if (!Number.isFinite(input.roofUsableM2) || input.roofUsableM2 < 0) {
    throw new Error("El área útil del techo no puede ser negativa.");
  }

  const annualConsumptionKwh = input.monthlyConsumptionKwh * 12;
  const panelPowerKw = input.panelPowerWp / 1000;
  const energyPerPanelKwh = panelPowerKw * input.annualSpecificYield;
  const continuousPanels = annualConsumptionKwh / energyPerPanelKwh;
  const recommendedPanels = Math.ceil(continuousPanels - 1e-10);
  const areaPerPanelM2 = PANEL_WIDTH_M * PANEL_HEIGHT_M * INSTALLATION_AREA_FACTOR;
  const maximumPanelsByRoof = Math.max(
    0,
    Math.floor(input.roofUsableM2 / areaPerPanelM2 + 1e-10),
  );
  const buildablePanels = Math.min(recommendedPanels, maximumPanelsByRoof);
  const buildableGenerationKwh = buildablePanels * energyPerPanelKwh;
  const derivativeAtReference =
    -annualConsumptionKwh / (panelPowerKw * input.annualSpecificYield ** 2);

  return {
    annualConsumptionKwh,
    panelPowerKw,
    energyPerPanelKwh,
    continuousPanels,
    recommendedPanels,
    areaPerPanelM2,
    maximumPanelsByRoof,
    buildablePanels,
    roofFeasible: recommendedPanels <= maximumPanelsByRoof,
    buildableGenerationKwh,
    buildableCoveragePct: (buildableGenerationKwh / annualConsumptionKwh) * 100,
    derivativeAtReference,
    estimatedChangePer100Yield: derivativeAtReference * 100,
  };
}

