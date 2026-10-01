export interface CalibratedCase {
  id: "bogota" | "barranquilla" | "quibdo";
  code: string;
  city: string;
  context: string;
  altitudeBand: string;
  monthlyConsumptionKwh: number;
  annualSpecificYield: number;
  roofUsableM2: number;
  panelPowerWp: number;
  purpose: string;
  consumptionBasis: string;
  solarBasis: string;
}

export const CALIBRATED_CASES: readonly CalibratedCase[] = [
  {
    id: "bogota",
    code: "SIM-BOG-001",
    city: "Bogotá",
    context: "Vivienda urbana · piso térmico frío",
    altitudeBand: "Más de 1.500 m s. n. m.",
    monthlyConsumptionKwh: 156,
    annualSpecificYield: 1260.65,
    roofUsableM2: 20,
    panelPowerWp: 450,
    purpose: "Caso base con demanda moderada y espacio suficiente para instalar la recomendación.",
    consumptionBasis:
      "Promedio mensual SUI 2018 publicado por UPME/CORPOEMA para usuarios del SIN por encima de 1.500 m s. n. m. Se repite en los doce meses para no inventar una estacionalidad.",
    solarBasis:
      "Rendimiento específico anual estimado con PVGIS para un punto urbano de referencia, 10° de inclinación, orientación sur y 14 % de pérdidas.",
  },
  {
    id: "barranquilla",
    code: "SIM-BAQ-002",
    city: "Barranquilla",
    context: "Vivienda urbana · piso térmico cálido",
    altitudeBand: "Menos de 500 m s. n. m.",
    monthlyConsumptionKwh: 279,
    annualSpecificYield: 1567.18,
    roofUsableM2: 35,
    panelPowerWp: 450,
    purpose: "Caso de mayor consumo, compensado parcialmente por un recurso solar anual más alto.",
    consumptionBasis:
      "Promedio mensual SUI 2018 publicado por UPME/CORPOEMA para usuarios del SIN por debajo de 500 m s. n. m. Se conserva constante durante el año.",
    solarBasis:
      "Rendimiento específico anual estimado con PVGIS para un punto urbano de referencia, 10° de inclinación, orientación sur y 14 % de pérdidas.",
  },
  {
    id: "quibdo",
    code: "SIM-UIB-003",
    city: "Quibdó",
    context: "Vivienda rural · techo restringido",
    altitudeBand: "Piso térmico cálido rural",
    monthlyConsumptionKwh: 118.8,
    annualSpecificYield: 898.28,
    roofUsableM2: 8,
    panelPowerWp: 450,
    purpose: "Caso límite: la energía requiere cuatro paneles, pero el techo hipotético solo admite tres.",
    consumptionBasis:
      "Promedio rural SUI 2018 publicado por UPME/CORPOEMA para clima cálido. Los 8 m² de techo son un supuesto explícito para probar la restricción.",
    solarBasis:
      "Rendimiento específico anual estimado con PVGIS para un punto de referencia cercano a Quibdó, 10° de inclinación, orientación sur y 14 % de pérdidas.",
  },
] as const;

export const PANEL_MODEL = "LONGi Hi-MO X6 LR5-54HTH-450M";
export const PANEL_WIDTH_M = 1.134;
export const PANEL_HEIGHT_M = 1.722;
export const INSTALLATION_AREA_FACTOR = 1.1;

