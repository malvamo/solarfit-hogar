# Notas de la corrección académica — 7 de septiembre de 2026

SolarFit Hogar sigue siendo un prototipo académico de prefactibilidad. Esta revisión aplica la retroalimentación del profesor al primer entregable y no afirma una validación empírica.

## Corrección del enfoque matemático

- Se conserva una sola aplicación de cálculo diferencial con efecto directo: `n(Y)=qD/(P·Y)` y `n′(Y)=−qD/(P·Y²)`.
- La derivada se traduce a un cambio local en la necesidad continua de paneles y se interpreta antes del redondeo.
- Se retiraron de la explicación límites, continuidad, segunda derivada, convexidad, elasticidad, reglas del cociente/cadena y diferencias finitas porque no eran necesarias para la decisión.
- La inclinación se presenta como comparación discreta de escenarios PVGIS, no como optimización por cálculo diferencial.

## Casos simulados calibrados

- Bogotá: 156 kWh/mes, promedio SUI 2018 para piso térmico frío.
- Barranquilla: 279 kWh/mes, promedio SUI 2018 para piso térmico cálido.
- Medellín y Cali: 178 kWh/mes, promedio SUI 2018 para piso térmico templado.
- Quibdó rural: 118,8 kWh/mes, promedio rural SUI 2018 para piso térmico cálido.
- Se repite el promedio en los doce meses porque la fuente no respalda una estacionalidad domiciliaria mensual.
- Coordenadas y áreas de techo se declaran como supuestos de prueba; PVGIS/PVWatts son modelos y no producción medida.

## Correcciones técnicas

- El caso inicial ahora usa demanda calibrada, serie PVGIS archivada y ficha LONGi oficial.
- PVGIS y PVWatts se contrastan con la misma capacidad construible cuando el techo limita.
- La interfaz muestra rendimientos anuales, diferencia porcentual y cambio de paneles, en lugar de presentar métricas como validación de exactitud.
- Los estados visibles distinguen simulación calibrada, demo sintética y caso propio pendiente de soportes.

## Evidencia técnica

- `pnpm check`: aprobado el 7 de septiembre de 2026.
- Vitest: 9 archivos, 38 pruebas, 0 fallidas, incluida una prueba de lenguaje y acciones clave de la interfaz.
- ESLint, TypeScript y build productivo Next.js: aprobados.
- Casos LIVE: 5 consultas PVGIS + 5 consultas PVWatts, archivadas con hashes en `cases/evidence/latest/`.

## Límites deliberados

- No se modelan inversor, protecciones, estructura, sombras cercanas, baterías, tarifa ni flujo de caja.
- Los casos calibrados no representan hogares observados ni sustituyen una visita técnica.
- No hay base de datos, cuentas ni sincronización en nube en esta versión.

## Compatibilidad

- Node.js 24.16.0.
- pnpm 11.19.0.
- Next.js 16.3.1.
- Proyecto JSON: esquema v1.
