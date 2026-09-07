import { MONTHS, type SolarProjectInput } from "@/domain/solar/types";

const CALIBRATED_CONSUMPTION_KWH = 156;
const ARCHIVED_PVGIS_YIELD = [
  121.39, 108.99, 106.87, 94.02, 91.5, 85.08,
  89.5, 105.91, 118.14, 114.2, 106.43, 118.62,
];
const ARCHIVED_PVGIS_HSP = [5.2, 5.19, 4.57, 4.13, 3.87, 3.71, 3.77, 4.49, 5.22, 4.87, 4.68, 5.07];

export const DEMO_PROJECT: SolarProjectInput = {
  projectName: "Caso simulado calibrado — Bogotá, piso frío",
  locationLabel: "Bogotá, D. C. (punto urbano de referencia)",
  latitude: 4.705583,
  longitude: -74.150667,
  targetCoveragePct: 100,
  sizingStrategy: "annual-balance",
  solarSourceMode: "pvgis-yield",
  performanceRatioPct: 82,
  pvgisSystemLossPct: 14,
  tiltDeg: 10,
  azimuthDeg: 180,
  roofUsableM2: 20,
  installationAreaFactor: 1.1,
  panelModel: "LONGi Hi-MO X6 LR5-54HTH-450M",
  panelPowerWp: 450,
  panelWidthM: 1.134,
  panelHeightM: 1.722,
  uncertaintyPct: 10,
  months: MONTHS.map((month, index) => ({
    month: month.number,
    consumptionKwh: CALIBRATED_CONSUMPTION_KWH,
    billingDays: month.defaultDays,
    hsp: ARCHIVED_PVGIS_HSP[index],
    specificYieldKwhPerKwp: ARCHIVED_PVGIS_YIELD[index],
  })),
  consumptionProvenance: {
    kind: "synthetic",
    label: "Simulación calibrada con promedio SUI 2018 de piso térmico frío",
    sourceUrl: "https://bdigital.upme.gov.co/handle/001/1367",
    note: "156 kWh/mes. No son facturas ni un promedio exclusivo de Bogotá.",
  },
  solarProvenance: {
    kind: "official",
    label: "PVGIS 5.3 · PVGIS-ERA5 · consulta archivada del caso Bogotá",
    sourceUrl: "https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en",
    fetchedAt: "2026-09-07T17:18:38.685Z",
    note: "Modelo solar oficial; no es producción medida ni incorpora sombras cercanas.",
  },
  panelProvenance: {
    kind: "official",
    label: "Ficha oficial LONGi LR5-54HTH 445–455M",
    sourceUrl: "https://static.longi.com/Hi_MO_X6_LR_5_54_HTH_445_455_M_V1_30_30_and_15_V19_ES_09bf28ff6d.pdf",
    note: "Se usaron 450 Wp y dimensiones 1,722 × 1,134 m.",
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
    label: "Pendiente de cargar consumos trazables o una regla de simulación documentada",
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
