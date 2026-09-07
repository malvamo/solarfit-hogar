# Evidencia reproducible — cinco casos SolarFit Hogar

Ejecución: 2026-09-07T20:00:02.531Z

> Clasificación: `simulated_formal`. Los consumos representan promedios oficiales agregados aplicados a escenarios residenciales hipotéticos; las áreas de techo son supuestos declarados. No son facturas ni levantamientos físicos. El recurso solar fue consultado en PVGIS y PVWatts por medio de los endpoints de producción.

## Resumen

| Caso | Consumo anual (kWh) | PVGIS (kWh/kWp·año) | PVWatts (kWh/kWp·año) | Paneles PVGIS | Paneles PVWatts | Techo viable | Diferencia anual (%) |
|---|---:|---:|---:|---:|---:|:---:|---:|
| Barranquilla — escenario residencial urbano de piso térmico cálido | 3348 | 1567.18 | 1643.33 | 5 | 5 | Sí | -4.63 |
| Bogotá — escenario residencial urbano de piso térmico frío | 1872 | 1260.65 | 1271.06 | 4 | 4 | Sí | -0.82 |
| Cali — escenario residencial urbano de piso térmico templado | 2136 | 1235.27 | 1422.18 | 4 | 4 | Sí | -13.14 |
| Medellín — escenario residencial urbano de piso térmico templado | 2136 | 1387.55 | 1369.68 | 4 | 4 | Sí | 1.31 |
| Quibdó — escenario residencial rural cálido con techo restringido | 1426 | 898.28 | 1131.87 | 4 | 3 | No | -20.64 |

## Método de contraste

Para cada ubicación se consultó primero PVGIS y después PVWatts, sin paralelizar solicitudes. El motor `calculateSolarProject` se ejecutó una vez con cada serie mensual. La presentación compara el rendimiento anual, la cobertura con la misma capacidad física y el cambio —o no— en la cantidad entera de paneles; PVWatts es una referencia de contraste, no una medición de campo.

## Resultados por caso

### Barranquilla — escenario residencial urbano de piso térmico cálido

- ID: `barranquilla_piso_calido`
- Regla de simulación: Doce meses constantes de 279 kWh (3.348 kWh/año). El valor reproduce el promedio mensual 2018 del SIN para poblaciones ubicadas por debajo de 500 m s. n. m.; la constancia mensual evita inventar una estacionalidad no respaldada por la fuente.
- Recomendación PVGIS: 5 paneles (2.25 kWp).
- Capacidad construible por techo: 5 paneles; viabilidad: sí.
- Cobertura anual construible según PVGIS: 105.32 %.
- Cobertura equivalente al contrastar la misma capacidad física construible con PVWatts: 110.44 %.
- Diferencia de recomendación PVGIS − PVWatts: 0 panel(es).
- Integridad SHA-256: `5709622d63e867a6283f820fd2f9e67feffba4fa719263a0e77bc66762a9dd6d`

### Bogotá — escenario residencial urbano de piso térmico frío

- ID: `bogota_piso_frio`
- Regla de simulación: Doce meses constantes de 156 kWh (1.872 kWh/año). El valor reproduce el promedio mensual 2018 del SIN para poblaciones ubicadas por encima de 1.500 m s. n. m.; la constancia mensual evita inventar una estacionalidad no respaldada por la fuente.
- Recomendación PVGIS: 4 paneles (1.80 kWp).
- Capacidad construible por techo: 4 paneles; viabilidad: sí.
- Cobertura anual construible según PVGIS: 121.22 %.
- Cobertura equivalente al contrastar la misma capacidad física construible con PVWatts: 122.22 %.
- Diferencia de recomendación PVGIS − PVWatts: 0 panel(es).
- Integridad SHA-256: `261c9dfef00042ba7d2bf48dd047b822ff13cb7dc02416948d77813373f4d0a6`

### Cali — escenario residencial urbano de piso térmico templado

- ID: `cali_piso_templado`
- Regla de simulación: Doce meses constantes de 178 kWh (2.136 kWh/año). El valor reproduce el promedio mensual 2018 del SIN para poblaciones entre 500 y 1.500 m s. n. m.; la constancia mensual evita inventar una estacionalidad no respaldada por la fuente.
- Recomendación PVGIS: 4 paneles (1.80 kWp).
- Capacidad construible por techo: 4 paneles; viabilidad: sí.
- Cobertura anual construible según PVGIS: 104.10 %.
- Cobertura equivalente al contrastar la misma capacidad física construible con PVWatts: 119.85 %.
- Diferencia de recomendación PVGIS − PVWatts: 0 panel(es).
- Integridad SHA-256: `847950e3bb6e985fd7d80018a165f72d5ba2dfa503fde3ef76ec6f9be448760d`

### Medellín — escenario residencial urbano de piso térmico templado

- ID: `medellin_piso_templado`
- Regla de simulación: Doce meses constantes de 178 kWh (2.136 kWh/año). El valor reproduce el promedio mensual 2018 del SIN para poblaciones entre 500 y 1.500 m s. n. m.; la constancia mensual evita inventar una estacionalidad no respaldada por la fuente.
- Recomendación PVGIS: 4 paneles (1.80 kWp).
- Capacidad construible por techo: 4 paneles; viabilidad: sí.
- Cobertura anual construible según PVGIS: 116.93 %.
- Cobertura equivalente al contrastar la misma capacidad física construible con PVWatts: 115.42 %.
- Diferencia de recomendación PVGIS − PVWatts: 0 panel(es).
- Integridad SHA-256: `d181debcc8194a8501befc100983c3d9b82beabdbffc73794fbed1620abeca15`

### Quibdó — escenario residencial rural cálido con techo restringido

- ID: `quibdo_rural_techo_restringido`
- Regla de simulación: Doce meses constantes de 118,8 kWh (1.425,6 kWh/año). El valor reproduce el promedio rural SUI 2018 para piso térmico cálido; se combina con 8 m² de techo útil como supuesto explícito para probar la restricción.
- Recomendación PVGIS: 4 paneles (1.80 kWp).
- Capacidad construible por techo: 3 paneles; viabilidad: no.
- Cobertura anual construible según PVGIS: 85.06 %.
- Cobertura equivalente al contrastar la misma capacidad física construible con PVWatts: 107.19 %.
- Diferencia de recomendación PVGIS − PVWatts: 1 panel(es).
- Integridad SHA-256: `0d57f89d93e28ddf061e19bc94d16f5f2918a56115de6bd64c39fe5755f12a4f`

## Alcance

Esta evidencia comprueba reproducibilidad del cálculo y contrasta dos modelos solares oficiales. No demuestra exactitud frente a una instalación ni reemplaza facturas, medición de sombras, visita estructural, diseño eléctrico, cotización o estudio de conexión a red.
