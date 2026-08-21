import { MONTHS, type SolarProjectInput } from "@/domain/solar/types";

const SYNTHETIC_CONSUMPTION = [
  224, 218, 231, 219, 208, 212, 225, 238, 229, 221, 215, 227,
];
const SYNTHETIC_HSP = [4.2, 4.1, 3.9, 3.7, 3.8, 4.0, 4.3, 4.4, 4.1, 3.8, 3.9, 4.1];

export const DEMO_PROJECT: SolarProjectInput = {
  projectName: "Escenario didáctico SolarFit",
  locationLabel: "Ubicación de demostración",
  latitude: 4.711,
  longitude: -74.0721,
  targetCoveragePct: 100,
  sizingStrategy: "annual-balance",
  solarSourceMode: "manual-hsp",
  performanceRatioPct: 82,
  pvgisSystemLossPct: 14,
  tiltDeg: 10,
  azimuthDeg: 180,
  roofUsableM2: 32,
  installationAreaFactor: 1.1,
  panelModel: "Módulo genérico de demostración",
  panelPowerWp: 450,
  panelWidthM: 1.134,
  panelHeightM: 1.762,
  uncertaintyPct: 10,
  months: MONTHS.map((month, index) => ({
    month: month.number,
    consumptionKwh: SYNTHETIC_CONSUMPTION[index],
    billingDays: month.defaultDays,
    hsp: SYNTHETIC_HSP[index],
    specificYieldKwhPerKwp: null,
  })),
  consumptionProvenance: {
    kind: "synthetic",
    label: "Serie sintética de demostración",
    note: "No corresponde a facturas reales y no puede usarse como evidencia académica.",
  },
  solarProvenance: {
    kind: "synthetic",
    label: "HSP sintéticas de demostración",
    note: "Deben reemplazarse por datos trazables de la ubicación estudiada.",
  },
  panelProvenance: {
    kind: "synthetic",
    label: "Ficha genérica de demostración",
    note: "Debe reemplazarse por la ficha técnica oficial del módulo seleccionado.",
  },
};

export const EMPTY_PROJECT: SolarProjectInput = {
  ...DEMO_PROJECT,
  projectName: "Mi evaluación SolarFit",
  locationLabel: "",
  latitude: null,
  longitude: null,
  roofUsableM2: 0,
  panelModel: "",
  panelPowerWp: 0,
  panelWidthM: 0,
  panelHeightM: 0,
  months: MONTHS.map((month) => ({
    month: month.number,
    consumptionKwh: 0,
    billingDays: month.defaultDays,
    hsp: null,
    specificYieldKwhPerKwp: null,
  })),
  consumptionProvenance: {
    kind: "user",
    label: "Pendiente de cargar facturas reales anonimizadas",
  },
  solarProvenance: {
    kind: "user",
    label: "Pendiente de consultar una fuente trazable",
  },
  panelProvenance: {
    kind: "user",
    label: "Pendiente de seleccionar una ficha técnica oficial",
  },
};
