# Evidencia reproducible — cinco casos SolarFit Hogar

Ejecución: 2026-08-21T14:49:48.267Z

> Clasificación: `simulated_formal`. Los consumos y las áreas de techo son supuestos declarados; no son facturas ni levantamientos físicos. El recurso solar sí fue consultado en PVGIS y PVWatts por medio de los endpoints de producción.

## Resumen

| Caso | Consumo anual (kWh) | PVGIS (kWh/kWp·año) | PVWatts (kWh/kWp·año) | Paneles PVGIS | Paneles PVWatts | Techo viable | MAPE (%) |
|---|---:|---:|---:|---:|---:|:---:|---:|
| Barranquilla — demanda alta por climatización | 4800 | 1567.18 | 1643.33 | 7 | 7 | Sí | 4.74 |
| Bogotá — consumo residencial promedio | 1884 | 1260.65 | 1271.06 | 4 | 4 | Sí | 4.65 |
| Cali — demanda residencial media | 2880 | 1235.27 | 1422.18 | 6 | 5 | Sí | 13.17 |
| Medellín — consumo de subsistencia en altura | 1560 | 1387.55 | 1369.68 | 3 | 3 | Sí | 4.43 |
| Quibdó — techo restringido | 2640 | 898.28 | 1131.87 | 7 | 6 | No | 20.39 |

## Método de contraste

Para cada ubicación se consultó primero PVGIS y después PVWatts, sin paralelizar solicitudes. El motor `calculateSolarProject` se ejecutó una vez con cada serie mensual. `compareEnergySeries` calculó MAE, RMSE, MAPE y sesgo anual, usando PVWatts como referencia de contraste, no como medición de campo.

## Resultados por caso

### Barranquilla — demanda alta por climatización

- ID: `barranquilla_climatizacion_alta`
- Regla de simulación: Serie sintética estacional de 4.800 kWh/año (400 kWh/mes en promedio), equivalente a 2,31 veces el consumo de subsistencia de 173 kWh/mes para alturas inferiores a 1.000 m.
- Recomendación PVGIS: 7 paneles (3.15 kWp).
- Capacidad construible por techo: 7 paneles; viabilidad: sí.
- Cobertura anual construible según PVGIS: 102.85 %.
- Cobertura equivalente al contrastar la capacidad recomendada con PVWatts: 107.84 %.
- Diferencia de recomendación PVGIS − PVWatts: 0 panel(es).
- Integridad SHA-256: `435e69a4fc204611f3494a1d5b139f372bf0ed40620c11b3436eeca4d1ac59ca`

### Bogotá — consumo residencial promedio

- ID: `bogota_promedio_residencial`
- Regla de simulación: Serie sintética de 157 kWh en cada mes (1.884 kWh/año), calibrada con el promedio residencial de referencia de 157 kWh/mes reportado por UPME.
- Recomendación PVGIS: 4 paneles (1.80 kWp).
- Capacidad construible por techo: 4 paneles; viabilidad: sí.
- Cobertura anual construible según PVGIS: 120.44 %.
- Cobertura equivalente al contrastar la capacidad recomendada con PVWatts: 121.44 %.
- Diferencia de recomendación PVGIS − PVWatts: 0 panel(es).
- Integridad SHA-256: `09ee1f5cb2cfff963e462b266712801cb189118848d359d748ce93af07d9b265`

### Cali — demanda residencial media

- ID: `cali_demanda_media`
- Regla de simulación: Serie sintética de 2.880 kWh/año (240 kWh/mes en promedio), equivalente a 1,85 veces el consumo de subsistencia de 130 kWh/mes; la estacionalidad es una regla declarada.
- Recomendación PVGIS: 6 paneles (2.70 kWp).
- Capacidad construible por techo: 6 paneles; viabilidad: sí.
- Cobertura anual construible según PVGIS: 115.81 %.
- Cobertura equivalente al contrastar la capacidad recomendada con PVWatts: 133.33 %.
- Diferencia de recomendación PVGIS − PVWatts: 1 panel(es).
- Integridad SHA-256: `efa0b7c2da73e6fbf1b821717755af2810bcffe4483123ab0ada0cc98c43f43f`

### Medellín — consumo de subsistencia en altura

- ID: `medellin_subsistencia_altura`
- Regla de simulación: Serie sintética de 1.560 kWh/año, exactamente 130 kWh/mes en promedio, calibrada al consumo de subsistencia para alturas iguales o superiores a 1.000 m.
- Recomendación PVGIS: 3 paneles (1.35 kWp).
- Capacidad construible por techo: 3 paneles; viabilidad: sí.
- Cobertura anual construible según PVGIS: 120.08 %.
- Cobertura equivalente al contrastar la capacidad recomendada con PVWatts: 118.53 %.
- Diferencia de recomendación PVGIS − PVWatts: 0 panel(es).
- Integridad SHA-256: `01728f8764ff3d6da0f8561ca190f7106fbd2d5ae9aaf44404fce9f481ba387a`

### Quibdó — techo restringido

- ID: `quibdo_techo_restringido`
- Regla de simulación: Serie sintética de 2.640 kWh/año (220 kWh/mes en promedio), equivalente a 1,27 veces el consumo de subsistencia de 173 kWh/mes; se combina con solo 8 m² de techo útil.
- Recomendación PVGIS: 7 paneles (3.15 kWp).
- Capacidad construible por techo: 3 paneles; viabilidad: no.
- Cobertura anual construible según PVGIS: 45.93 %.
- Cobertura equivalente al contrastar la capacidad recomendada con PVWatts: 135.05 %.
- Diferencia de recomendación PVGIS − PVWatts: 1 panel(es).
- Integridad SHA-256: `f93364abb695cb420dc8b72d04dc3fda8588a13dd1e2ba5fcb067846c1b923b0`

## Alcance

Esta evidencia valida reproducibilidad del cálculo y contrasta dos modelos solares oficiales. No reemplaza facturas reales, medición de sombras, visita estructural, diseño eléctrico, cotización ni estudio de conexión a red.
