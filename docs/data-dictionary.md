# Diccionario de datos

Este documento describe los contratos implementados en `src/domain/solar/types.ts`, `src/services/solar-yield.ts` y las bibliotecas de intercambio. Los intervalos son los que valida el código actual, no recomendaciones universales de ingeniería.

## 1. Convenciones

- `nullable` significa que el valor puede ser `null` mientras aún no se ha recopilado.
- Los porcentajes de entrada se guardan como números entre 0 y 100; el motor los divide entre 100.
- La potencia de un módulo se ingresa en Wp y se convierte a kWp dentro del cálculo.
- Las matrices mensuales deben contener exactamente doce registros únicos, numerados de 1 a 12.
- `synthetic` identifica datos para demostrar el software. No es evidencia del caso de estudio.

## 2. Enumeraciones

| Tipo | Valor | Significado |
|---|---|---|
| `SolarSourceMode` | `manual-hsp` | Producción calculada con HSP, días y PR |
| `SolarSourceMode` | `pvgis-yield` | Producción calculada con rendimiento neto mensual de PVGIS |
| `SizingStrategy` | `annual-balance` | Meta sobre el total anual |
| `SizingStrategy` | `monthly-conservative` | Meta en cada mes; usa el mayor requerimiento mensual |
| `ProvenanceKind` | `synthetic` | Dato inventado únicamente para la demostración |
| `ProvenanceKind` | `user` | Dato escrito o importado por el equipo |
| `ProvenanceKind` | `official` | Dato cargado desde una fuente oficial integrada |

## 3. Entrada del proyecto: `SolarProjectInput`

| Campo | Tipo | Unidad/rango validado | Descripción y fuente esperada |
|---|---|---|---|
| `projectName` | `string` | Sin límite de dominio actual | Nombre interno del escenario; definido por el equipo |
| `locationLabel` | `string` | Sin límite de dominio actual | Municipio o referencia general; no dirección exacta |
| `latitude` | `number \| null` | API: −90 a 90° | Coordenada para PVGIS; fuente del equipo |
| `longitude` | `number \| null` | API: −180 a 180° | Coordenada para PVGIS; oeste negativo |
| `targetCoveragePct` | `number` | 1 a 100 % | Porcentaje de consumo que se quiere compensar |
| `sizingStrategy` | `SizingStrategy` | Enumeración | Criterio anual o conservador mensual |
| `solarSourceMode` | `SolarSourceMode` | Enumeración | Selecciona una sola ecuación de producción |
| `performanceRatioPct` | `number` | 1 a 100 % | Factor global usado únicamente en el modo HSP; debe documentarse |
| `pvgisSystemLossPct` | `number` | Motor: 0 a 100 %; API: 0 a <100 % | Pérdidas enviadas a PVGIS |
| `tiltDeg` | `number` | API: 0 a 90° | Inclinación desde la horizontal |
| `azimuthDeg` | `number` | API: 0 a <360° | Azimut de brújula: 0 norte, 90 este, 180 sur, 270 oeste |
| `roofUsableM2` | `number` | ≥0 m² | Área útil después de descontar obstáculos; debe medirse y documentarse |
| `installationAreaFactor` | `number` | 1 a 3 | Multiplicador para separación y acceso; no reemplaza un plano |
| `panelModel` | `string` | Sin límite de dominio actual | Fabricante y modelo exacto de una ficha oficial |
| `panelPowerWp` | `number` | 1 a 2.000 Wp | Potencia nominal STC del módulo |
| `panelWidthM` | `number` | 0,1 a 5 m | Ancho de ficha técnica |
| `panelHeightM` | `number` | 0,1 a 5 m | Alto de ficha técnica |
| `uncertaintyPct` | `number` | 0 a 50 % | Variación determinista de producción para escenarios |
| `months` | `MonthlySolarInput[]` | Exactamente 12 | Demanda y recurso por periodo mensual |
| `consumptionProvenance` | `DataProvenance` | Objeto | Trazabilidad de los consumos |
| `solarProvenance` | `DataProvenance` | Objeto | Trazabilidad de HSP o PVGIS |
| `panelProvenance` | `DataProvenance` | Objeto | Trazabilidad de la ficha del módulo |

`projectName`, `locationLabel`, `panelModel` y los objetos de procedencia no tienen validación Zod o límites de longitud en el dominio actual. La interfaz permite campos incompletos; la revisión académica debe verificar su calidad.

## 4. Entrada mensual: `MonthlySolarInput`

| Campo | Tipo | Unidad/rango | Descripción |
|---|---|---|---|
| `month` | `number` | Entero 1 a 12, único | Mes del registro |
| `consumptionKwh` | `number` | 0 a 20.000 kWh | Consumo del periodo, idealmente de factura anonimizada |
| `billingDays` | `number` | 1 a 45 días | Duración real del periodo; no siempre coincide con el mes calendario |
| `hsp` | `number \| null` | Modo manual: 0,1 a 12 h/día | HSP promedio diario; en una respuesta PVGIS puede conservar `H(i)_d` como dato informativo |
| `specificYieldKwhPerKwp` | `number \| null` | Modo PVGIS: 0,1 a 500 kWh/kWp | Producción neta mensual normalizada |

Solo se exige `hsp` en `manual-hsp` y solo se exige `specificYieldKwhPerKwp` en `pvgis-yield`. El campo no usado puede permanecer nulo.

## 5. Procedencia: `DataProvenance`

| Campo | Tipo | Obligatorio | Uso |
|---|---|---:|---|
| `kind` | `synthetic \| user \| official` | Sí | Clasificación visual de la fuente |
| `label` | `string` | Sí | Identificación legible de archivo, fuente o estado pendiente |
| `sourceUrl` | `string` | No | Enlace a la fuente externa |
| `fetchedAt` | `string` | No | Fecha ISO de consulta automática |
| `note` | `string` | No | Limitaciones, soporte que debe conservarse o advertencias |

La clasificación `official` solo se asigna automáticamente a la respuesta PVGIS. No certifica la calidad de las coordenadas ni del resto de la configuración.

## 6. Resultado principal: `SolarProjectResult`

| Campo | Tipo | Unidad | Definición |
|---|---|---|---|
| `strategy` | `SizingStrategy` | — | Estrategia usada |
| `sourceMode` | `SolarSourceMode` | — | Fuente solar usada |
| `continuousPanelCount` | `number` | paneles equivalentes | `n*` antes de redondear |
| `recommendedPanelCount` | `number` | paneles | `ceil(n*)` con tolerancia numérica |
| `buildablePanelCount` | `number` | paneles | `min(recommendedPanelCount, maximumPanelsByRoof)` |
| `limitingMonth` | `number` | 1 a 12 | Mes con mayor `n_m*`; se informa incluso en balance anual |
| `panelPowerKw` | `number` | kWp | Potencia de un módulo convertida desde Wp |
| `continuousCapacityKwp` | `number` | kWp | `continuousPanelCount · panelPowerKw` |
| `recommendedCapacityKwp` | `number` | kWp | Capacidad con paneles enteros recomendados |
| `buildableCapacityKwp` | `number` | kWp | Capacidad limitada por área |
| `panelAreaM2` | `number` | m² | `ancho · alto` |
| `panelAreaWithInstallationM2` | `number` | m²/panel | Área geométrica multiplicada por el factor de instalación |
| `requiredRoofAreaM2` | `number` | m² | Área para la cantidad recomendada |
| `maximumPanelsByRoof` | `number` | paneles | Máximo entero por el área declarada |
| `roofFeasible` | `boolean` | — | Verdadero si la recomendación no excede el máximo |
| `totalConsumptionKwh` | `number` | kWh/año | Suma de los doce consumos |
| `targetAnnualEnergyKwh` | `number` | kWh/año | Cobertura objetivo multiplicada por consumo anual |
| `recommendedAnnualGenerationKwh` | `number` | kWh/año | Generación con paneles recomendados |
| `buildableAnnualGenerationKwh` | `number` | kWh/año | Generación con paneles instalables por área |
| `recommendedAnnualCoveragePct` | `number` | % | Generación recomendada / consumo anual |
| `buildableAnnualCoveragePct` | `number` | % | Generación construible / consumo anual |
| `uncertaintyPanelRange` | `object` | paneles | Extremos continuo y redondeado del escenario `±u` |
| `monthly` | `MonthlySolarResult[]` | 12 registros | Desarrollo mensual completo |
| `sensitivity` | `SensitivityResult` | objeto | Parámetros, derivada y puntos del gráfico |
| `warnings` | `string[]` | — | Límites y condiciones relevantes |

### `uncertaintyPanelRange`

| Campo | Tipo | Significado |
|---|---|---|
| `optimisticContinuous` | `number` | Paneles continuos si la producción aumenta `u` |
| `conservativeContinuous` | `number` | Paneles continuos si la producción disminuye `u` |
| `optimisticRounded` | `number` | Extremo optimista redondeado hacia arriba |
| `conservativeRounded` | `number` | Extremo conservador redondeado hacia arriba |

No es un intervalo probabilístico y no debe llamarse “95 % de confianza”.

## 7. Resultado mensual: `MonthlySolarResult`

Incluye todos los campos de `MonthlySolarInput` y añade:

| Campo | Unidad | Definición |
|---|---|---|
| `monthLabel` | texto | Nombre completo en español |
| `specificYieldKwhPerKwpUsed` | kWh/kWp | Rendimiento específico usado después de elegir el modo |
| `energyPerPanelKwh` | kWh | Producción de un módulo en el mes |
| `targetEnergyKwh` | kWh | `q · C_m` |
| `continuousPanelsRequired` | paneles equivalentes | `q · C_m / G_m` |
| `recommendedGenerationKwh` | kWh | Generación con `recommendedPanelCount` |
| `buildableGenerationKwh` | kWh | Generación con `buildablePanelCount` |
| `recommendedCoveragePct` | `% \| null` | Cobertura recomendada; nula si consumo es cero |
| `buildableCoveragePct` | `% \| null` | Cobertura limitada por techo |
| `recommendedBalanceKwh` | kWh | Generación recomendada menos consumo total |
| `buildableBalanceKwh` | kWh | Generación construible menos consumo total |

## 8. Sensibilidad: `SensitivityResult`

| Campo | Tipo/unidad | Descripción |
|---|---|---|
| `resourceSymbol` | `h \| y_d` | Símbolo usado en la representación visible |
| `resourceLabel` | texto | Nombre de HSP o del rendimiento específico diario equivalente |
| `resourceUnit` | `HSP \| kWh/kWp·día` | Unidad correcta para el modo solar activo |
| `referenceMonth` | `number \| null` | Mes crítico o nulo para balance anual |
| `referenceLabel` | `string` | Etiqueta explicativa del caso de referencia |
| `kConstant` | según parametrización | Constante de `n(h)=K/h` |
| `referenceHsp` | h/día o rendimiento diario equivalente | Punto en el que se evalúa la derivada |
| `derivativeAtReference` | paneles por unidad de `h` | `−K/h²` |
| `changeForPointOneHsp` | paneles | Aproximación `n'(h)·0,1` |
| `elasticity` | adimensional | Siempre −1 para el modelo inverso |
| `points` | 25 pares | Coordenadas `hsp`, `continuousPanels` para SVG |

En modo PVGIS, `referenceHsp` es el rendimiento específico diario neto equivalente. El nombre del campo se conserva por compatibilidad interna, pero no debe presentarse como una medición HSP independiente.

## 9. Contratos de las APIs internas

### Solicitud de rendimiento: `POST /api/pvgis` y `POST /api/pvwatts`

```json
{
  "latitude": 0,
  "longitude": 0,
  "tiltDeg": 0,
  "azimuthDeg": 0,
  "systemLossPct": 0
}
```

Los ceros muestran la estructura, no una ubicación o configuración recomendada.

| Campo | Rango |
|---|---|
| `latitude` | −90 a 90 |
| `longitude` | −180 a 180 |
| `tiltDeg` | 0 a 90 |
| `azimuthDeg` | 0 a menos de 360 |
| `systemLossPct` | 0 a 99 |

### Respuesta `SolarYieldDataset`

| Campo | Tipo/unidad | Descripción |
|---|---|---|
| `provider` | `PVGIS \| PVWATTS` | Proveedor que produjo la serie |
| `apiVersion` | texto | Versión reportada por el adaptador (`5.3` para PVGIS) |
| `dataset` | texto | Base meteorológica reportada o selección automática |
| `fetchedAt` | fecha ISO | Momento de la consulta del servidor |
| `latitude`, `longitude` | grados | Coordenadas solicitadas |
| `sourceLatitude`, `sourceLongitude` | grados opcionales | Coordenadas recibidas en metadatos |
| `sourceDistanceM` | m opcional | Disponible en el contrato común; PVGIS actual no lo rellena |
| `monthlyKwhPerKwp` | 12 números, kWh/kWp | `E_m` ordenado de enero a diciembre |
| `annualKwhPerKwp` | kWh/kWp·año | `E_y` o suma mensual si falta |
| `irradiationKwhM2Day` | 12 números opcionales | `H(i)_d` de PVGIS |
| `interannualSdKwhPerKwp` | 12 números opcionales | `SD_m` de PVGIS |
| `warnings` | textos | Diferencias de totales y límites de sombras |
| `sourceUrl` | URL | Página oficial del proveedor |

Ambos adaptadores están implementados en servidor. PVWatts requiere `NLR_API_KEY`; sin ella, `/api/pvwatts` responde HTTP 503 y la interfaz lo explica sin ocultar el error. El modo PVGIS ofrece consulta directa, optimización de inclinación y contraste con PVWatts.

### Solicitud de optimización: `POST /api/pvgis/optimize`

| Campo | Tipo/rango | Descripción |
|---|---|---|
| `latitude` | −90 a 90° | Coordenada solicitada |
| `longitude` | −180 a 180° | Coordenada solicitada |
| `azimuthDeg` | 0 a <360° | Azimut de brújula común a todos los candidatos |
| `systemLossPct` | 0 a 99 % | Pérdidas comunes |
| `candidateTiltsDeg` | 2 a 13 números únicos, 0 a 90° | Malla de inclinaciones |
| `referenceTiltDeg` | número opcional, 0 a 90° | Debe aparecer también entre los candidatos |

### Respuesta de optimización: `PvgisTiltOptimizationResult`

| Campo | Tipo/unidad | Descripción |
|---|---|---|
| `provider` | `PVGIS` | Proveedor usado |
| `apiVersion` | texto | Versión del adaptador |
| `objective` | `maximize-annual-specific-yield` | Criterio de selección |
| `evaluatedAt` | fecha ISO | Momento del análisis |
| `selectedTiltDeg` | grados | Candidato con mayor energía anual |
| `selectedAnnualKwhPerKwp` | kWh/kWp·año | Rendimiento del candidato elegido |
| `referenceTiltDeg` | grados o `null` | Ángulo base comparable |
| `referenceAnnualKwhPerKwp` | kWh/kWp·año o `null` | Rendimiento base |
| `gainVsReferencePct` | % o `null` | Ganancia frente a referencia positiva |
| `evaluations` | arreglo | Resultados ordenados para cada respuesta válida |
| `failedEvaluations` | arreglo | Ángulo y mensaje de cada consulta fallida |
| `warnings` | arreglo | Malla discreta, pérdidas y fallos parciales |
| `sourceUrl` | URL | Fuente oficial PVGIS |

Cada evaluación añade:

| Campo | Unidad | Significado |
|---|---|---|
| `tiltDeg` | grados | Ángulo candidato |
| `annualKwhPerKwp` | kWh/kWp·año | Rendimiento neto |
| `estimatedFirstDerivativeKwhPerKwpDeg` | kWh/kWp·año por grado | Diferencia finita primera |
| `estimatedSecondDerivativeKwhPerKwpDeg2` | kWh/kWp·año por grado² o `null` | Diferencia finita segunda en puntos interiores |
| `isSelectedMaximum` | booleano | Identifica el máximo elegido |
| `monthlyKwhPerKwp` | 12 números | Serie mensual PVGIS del ángulo |
| `dataset` | texto | Base meteorológica reportada |

## 10. CSV de entrada

Encabezado obligatorio:

```csv
month,consumption_kwh,billing_days,hsp
```

Reglas:

- exactamente un encabezado y doce filas no vacías;
- admite coma o punto y coma como delimitador; si el encabezado contiene `;`, usa punto y coma;
- los nombres de las cuatro columnas son obligatorios, aunque pueden existir columnas adicionales;
- debe aparecer una sola fila para cada mes 1–12;
- los números deben ser finitos;
- importar cambia el proyecto al modo `manual-hsp` y pone el rendimiento específico PVGIS en `null`;
- la validación completa de rangos ocurre después, en el motor matemático.

Si se usa coma decimal, conviene emplear punto y coma como delimitador. Con coma como delimitador, use punto decimal.

## 11. Archivos exportados

### Proyecto JSON

```text
schemaVersion   número, actualmente 1
exportedAt      fecha ISO generada al descargar
project         SolarProjectInput completo
result          SolarProjectResult completo
```

Incluye coordenadas, etiquetas y procedencia. Debe revisarse y anonimizarse antes de compartir.

El importador acepta este sobre v1, valida `project` con Zod, ignora el `result` recibido y lo vuelve a calcular. También rechaza URLs de procedencia que no usen HTTP(S).

### Resultados CSV

Columnas:

| Columna | Unidad | Fuente |
|---|---|---|
| `project_name` | texto | Nombre del escenario |
| `evidence_status` | texto | `synthetic_demo` o `pending_verification` |
| `exported_at` | fecha ISO | Momento de descarga |
| `panel_model` | texto | Panel declarado |
| `solar_source_mode` | texto | `manual-hsp` o `pvgis-yield` |
| `solar_source_label` | texto | Procedencia visible del recurso solar |
| `month` | 1–12 | Mes |
| `scenario` | texto | `recommended_energy` o `buildable_by_roof` |
| `consumption_kwh` | kWh | Entrada |
| `specific_yield_kwh_per_kwp` | kWh/kWp | Rendimiento usado |
| `generation_kwh` | kWh | Generación del escenario indicado |
| `coverage_pct` | % | Cobertura del escenario indicado |
| `balance_kwh` | kWh | Generación del escenario menos consumo |

Ante un techo inviable, el CSV cambia a la cantidad construible y escribe `buildable_by_roof`; el JSON conserva siempre ambas series.

## 12. Almacenamiento local

| Elemento | Valor |
|---|---|
| Clave | `solarfit:project:v1` |
| Contenido | Serialización JSON de `SolarProjectInput` |
| Ubicación | `localStorage` del origen del navegador |
| Caducidad | Ninguna implementada |
| Cifrado | Ninguno implementado |
| Validación al cargar | Esquema Zod v1, doce meses únicos, números finitos y URL HTTP(S) |

El botón **Usar datos reales** elimina el borrador existente y carga una estructura sin consumos, coordenadas, área, modelo, potencia ni dimensiones del panel. Los cambios se guardan con una espera de 300 ms; si el navegador bloquea el almacenamiento, la interfaz lo advierte.

## 13. Datos sintéticos incluidos

`src/data/demo-project.ts` contiene consumos, HSP, coordenadas de demostración y un módulo genérico. Sus tres procedencias están marcadas `synthetic` y sus notas indican que no son evidencia. Ningún valor de ese archivo debe atribuirse a una vivienda, factura, estación o producto real.
