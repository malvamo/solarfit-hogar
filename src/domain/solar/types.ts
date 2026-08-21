export const MONTHS = [
  { number: 1, short: "Ene", label: "Enero", defaultDays: 31 },
  { number: 2, short: "Feb", label: "Febrero", defaultDays: 28 },
  { number: 3, short: "Mar", label: "Marzo", defaultDays: 31 },
  { number: 4, short: "Abr", label: "Abril", defaultDays: 30 },
  { number: 5, short: "May", label: "Mayo", defaultDays: 31 },
  { number: 6, short: "Jun", label: "Junio", defaultDays: 30 },
  { number: 7, short: "Jul", label: "Julio", defaultDays: 31 },
  { number: 8, short: "Ago", label: "Agosto", defaultDays: 31 },
  { number: 9, short: "Sep", label: "Septiembre", defaultDays: 30 },
  { number: 10, short: "Oct", label: "Octubre", defaultDays: 31 },
  { number: 11, short: "Nov", label: "Noviembre", defaultDays: 30 },
  { number: 12, short: "Dic", label: "Diciembre", defaultDays: 31 },
] as const;

export type SolarSourceMode = "manual-hsp" | "pvgis-yield";
export type SizingStrategy = "annual-balance" | "monthly-conservative";
export type ProvenanceKind = "synthetic" | "user" | "official";

export interface DataProvenance {
  kind: ProvenanceKind;
  label: string;
  sourceUrl?: string;
  fetchedAt?: string;
  note?: string;
}

export interface MonthlySolarInput {
  month: number;
  consumptionKwh: number;
  billingDays: number;
  hsp: number | null;
  specificYieldKwhPerKwp: number | null;
}

export interface SolarProjectInput {
  projectName: string;
  locationLabel: string;
  latitude: number | null;
  longitude: number | null;
  targetCoveragePct: number;
  sizingStrategy: SizingStrategy;
  solarSourceMode: SolarSourceMode;
  performanceRatioPct: number;
  pvgisSystemLossPct: number;
  tiltDeg: number;
  azimuthDeg: number;
  roofUsableM2: number;
  installationAreaFactor: number;
  panelModel: string;
  panelPowerWp: number;
  panelWidthM: number;
  panelHeightM: number;
  uncertaintyPct: number;
  months: MonthlySolarInput[];
  consumptionProvenance: DataProvenance;
  solarProvenance: DataProvenance;
  panelProvenance: DataProvenance;
}

export interface MonthlySolarResult extends MonthlySolarInput {
  monthLabel: string;
  specificYieldKwhPerKwpUsed: number;
  energyPerPanelKwh: number;
  targetEnergyKwh: number;
  continuousPanelsRequired: number;
  recommendedGenerationKwh: number;
  buildableGenerationKwh: number;
  recommendedCoveragePct: number | null;
  buildableCoveragePct: number | null;
  recommendedBalanceKwh: number;
  buildableBalanceKwh: number;
}

export interface SensitivityPoint {
  hsp: number;
  continuousPanels: number;
}

export interface SensitivityResult {
  resourceSymbol: "h" | "y_d";
  resourceLabel: string;
  resourceUnit: "HSP" | "kWh/kWp·día";
  referenceMonth: number | null;
  referenceLabel: string;
  kConstant: number;
  referenceHsp: number;
  derivativeAtReference: number;
  changeForPointOneHsp: number;
  elasticity: number;
  points: SensitivityPoint[];
}

export interface SolarProjectResult {
  strategy: SizingStrategy;
  sourceMode: SolarSourceMode;
  continuousPanelCount: number;
  recommendedPanelCount: number;
  buildablePanelCount: number;
  limitingMonth: number;
  panelPowerKw: number;
  continuousCapacityKwp: number;
  recommendedCapacityKwp: number;
  buildableCapacityKwp: number;
  panelAreaM2: number;
  panelAreaWithInstallationM2: number;
  requiredRoofAreaM2: number;
  maximumPanelsByRoof: number;
  roofFeasible: boolean;
  totalConsumptionKwh: number;
  targetAnnualEnergyKwh: number;
  recommendedAnnualGenerationKwh: number;
  buildableAnnualGenerationKwh: number;
  recommendedAnnualCoveragePct: number;
  buildableAnnualCoveragePct: number;
  uncertaintyPanelRange: {
    optimisticContinuous: number;
    conservativeContinuous: number;
    optimisticRounded: number;
    conservativeRounded: number;
  };
  monthly: MonthlySolarResult[];
  sensitivity: SensitivityResult;
  warnings: string[];
}

export class SolarModelError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "SolarModelError";
  }
}
