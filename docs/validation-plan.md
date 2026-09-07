# Plan de validación

## 1. Objetivo

La validación debe responder tres preguntas diferentes:

1. **¿El software ejecuta correctamente las ecuaciones declaradas?**
2. **¿Los resultados son consistentes entre modelos solares independientes?**
3. **¿Las ecuaciones y entradas representan con suficiente fidelidad una vivienda física?**

Una prueba de software positiva no valida las facturas, la geometría del techo ni el recurso solar. Del mismo modo, una similitud con otro simulador no demuestra por sí sola que ambos modelos representen el techo real.

## 2. Estado honesto

El 07-09-2026 se ejecutaron cinco escenarios residenciales `simulated_formal` contra PVGIS y PVWatts: diez consultas externas exitosas, series mensuales, métricas, JSON, CSV y hashes archivados en `cases/evidence/latest/`. También se aprobaron 38 pruebas automatizadas, lint, tipos y build.

La evidencia actual permite afirmar consistencia matemática, ejecución del software y contraste intermodelo. Todavía no incluye:

- facturas de una vivienda física;
- medición profesional del techo, sombras o estructura;
- una serie de producción medida después de una instalación;
- pruebas automatizadas de interfaz de extremo a extremo;
- criterios numéricos de aceptación aprobados por el profesor.

Por tanto, hay una validación simulada reproducible terminada, pero no una validación experimental en campo.

## 3. Niveles de evidencia

| Nivel | Pregunta | Evidencia mínima |
|---|---|---|
| V1. Consistencia matemática | ¿Las fórmulas, unidades y redondeos son correctos? | Desarrollo manual y pruebas unitarias |
| V2. Implementación | ¿La aplicación maneja entradas, errores y exportaciones? | `pnpm check` y pruebas manuales registradas |
| V3. Fuente solar | ¿La respuesta externa es completa y trazable? | Respuesta de 12 meses, metadatos, fecha y configuración |
| V4. Validación cruzada | ¿Otro modelo independiente produce un orden de magnitud comparable? | Dos series normalizadas y métricas de diferencia |
| V5. Escenario simulado formal | ¿El caso es reproducible y declara sus supuestos? | Regla de consumo, ficha, techo hipotético, configuración, salidas y hashes |
| V6. Caso físico | ¿El modelo representa una vivienda observada? | Facturas, visita, medición del techo y producción medida cuando exista |

## 4. Verificación automatizada existente

Los casos siguientes están codificados en archivos `*.test.ts` de `src/domain/solar/`, `src/lib/` y `src/services/`. “Codificado” no debe sustituir el registro de la última ejecución.

| ID | Caso | Afirmación verificada en el test |
|---|---|---|
| UT-01 | Balance anual | `n* > 0`, `N = ceil(n*)`, cobertura anual recomendada al menos 100 % para el caso calibrado y 12 resultados |
| UT-02 | PVGIS sin doble PR | Cambiar el PR manual no altera la producción neta de PVGIS; aparece la advertencia |
| UT-03 | Techo insuficiente | La recomendación se conserva, el escenario construible usa `N_max` y `roofFeasible=false` |
| UT-04 | Impacto del recurso solar | Aumentar todos los rendimientos específicos reduce la necesidad continua |
| UT-05 | Criterio conservador | Con techo amplio, la recomendación alcanza la meta en todos los meses del caso calibrado |
| UT-06 | Primera derivada | La derivada de `K/Y` y el cambio local estimado son negativos |
| UT-07 | Métricas | Un caso controlado produce MAE, RMSE, MAPE y sesgo esperados |
| UT-08 | Capacidad comparable | PVGIS y PVWatts usan la misma capacidad construible cuando el techo limita |
| UT-09 | Prorrateo | Una factura que cruza enero y febrero se distribuye por día de forma esperada |
| UT-10 | Normalización neta | La energía mensual del proveedor se conserva sin aplicar pérdidas otra vez |
| UT-11 | Total anual del proveedor | Se advierte una diferencia mayor que la tolerancia frente a la suma mensual |
| UT-12 | Serie externa incompleta | Se rechaza una serie de once meses |
| UT-13 | Convenio de azimut | Sur, este, oeste y norte se traducen correctamente al aspecto PVGIS |
| UT-14 | Comparación de inclinaciones | Se selecciona el mayor rendimiento entre los ángulos evaluados |
| UT-15 | Empate de inclinación | Se elige el menor ángulo entre máximos iguales |
| UT-16 | Candidatos inválidos | Se rechazan ángulos repetidos y referencias fuera de la malla |
| UT-17 | Valores externos malformados | `null`, booleanos y cadenas vacías no se convierten silenciosamente en cero |
| UT-18 | Proyecto JSON | Exportación/importación conserva entradas; versión futura, meses repetidos, URL insegura y JSON roto se rechazan |
| UT-19 | Borrador local | Distingue ausencia, recupera v1 y descarta JSON corrupto o incompleto |
| UT-20 | CSV regional | Admite coma o punto y coma, coma decimal y rechaza meses incompletos |

Ejecución:

```bash
pnpm test
```

Última ejecución observada durante esta documentación:

```text
Fecha y hora: 2026-09-07 12:32 America/Bogota
Comando: pnpm check
Resultado: lint aprobado; typegen y TypeScript aprobados; 38/38 pruebas aprobadas; build productivo aprobado
Rutas: /, /api/pvgis, /api/pvgis/optimize, /api/pvwatts
Casos LIVE: 5 PVGIS + 5 PVWatts; 0 reintentos
```

El registro detallado de código, interfaz, cinco casos y entregables está en `docs/verification-log-2026-09-07.md`. No sustituye una validación experimental con una vivienda observada.

Para una entrega, registre:

```text
Fecha y hora: [AAAA-MM-DD HH:MM zona]
Commit o copia evaluada: [IDENTIFICADOR]
Comando: pnpm test
Resultado: [NÚMERO DE ARCHIVOS, PRUEBAS APROBADAS/FALLIDAS]
Evidencia: [RUTA DE CAPTURA O TEXTO DEL REPORTE]
Responsable: [INTEGRANTE]
```

## 5. Pruebas automatizadas que conviene agregar

| ID | Prioridad | Caso faltante | Resultado esperado |
|---|---:|---|---|
| FUT-01 | Alta | Todos los consumos son cero | Error “consumo anual mayor que cero” |
| FUT-02 | Alta | Falta un mes o hay duplicados | Rechazo antes del cálculo |
| FUT-03 | Alta | Valores en cada límite y fuera del límite | Aceptación o error consistente por campo |
| FUT-04 | Alta | `n*` exactamente entero y casi entero | Redondeo estable con `ε` |
| FUT-05 | Alta | Consumo mensual cero | Cobertura `null`, sin división por cero |
| FUT-06 | Alta | Integración simulada de respuestas PVGIS/PVWatts | Mapeo completo, errores y metadatos sin red real |
| FUT-07 | Media | Timeout, 429, 529 y 5xx | Reintento limitado y error comprensible |
| FUT-10 | Media | Facturas superpuestas o con huecos | Rechazo de superposición y advertencia de hueco |
| FUT-11 | Media | Optimización con fallos parciales del proveedor | Máximo entre respuestas válidas y advertencias completas |

## 6. Verificación manual de interfaz

Registre cada ejecución con navegador, tamaño de pantalla, fecha, resultado y captura.

| ID | Procedimiento | Resultado esperado |
|---|---|---|
| UI-01 | Abrir sin borrador | Demo visible y rotulado “no es evidencia” |
| UI-02 | Pulsar **Crear caso propio** | Coordenadas, consumos y etiquetas pendientes; no aparece recomendación válida |
| UI-03 | Completar manualmente 12 meses | Se habilitan modelo y resultados sin errores |
| UI-04 | Importar plantilla CSV válida | Se cargan 12 meses y se activa el modo manual |
| UI-05 | Importar CSV con 11 filas o encabezado erróneo | Mensaje de error; el proyecto previo permanece |
| UI-06 | Consultar PVGIS sin coordenadas | Mensaje local; no se llama al proveedor |
| UI-07 | Consultar PVGIS con configuración válida | Procedencia oficial, doce valores y total anual mostrados |
| UI-08 | Reducir el área hasta hacer inviable la meta | Recomendación y máximo por techo aparecen separados |
| UI-09 | Cambiar anual a conservador | `n*` no disminuye respecto al máximo mensual esperado |
| UI-10 | Descargar JSON y CSV | Archivos legibles, columnas/unidades correctas y datos del escenario actual |
| UI-11 | Imprimir/guardar PDF | No se cortan encabezados, tablas ni advertencias importantes |
| UI-12 | Recargar la página | El borrador local se recupera en el mismo origen/navegador |
| UI-13 | Pantalla móvil | Campos, tablas y acciones siguen siendo utilizables |
| UI-14 | Navegación por teclado | Foco visible y orden lógico; botones y pestañas operables |
| UI-15 | Abrir un JSON v1 exportado | Se restauran las entradas y el resultado se recalcula |
| UI-16 | Abrir JSON roto o de otra versión | Mensaje claro; el proyecto actual permanece sin cambios |

## 7. Validación matemática manual

Seleccione un mes real y reproduzca las operaciones con calculadora o hoja de cálculo:

1. Convierta `P_Wp / 1000` a kWp.
2. Calcule `Y_m = h_m d_m PR` o copie `Y_m` de la respuesta PVGIS.
3. Calcule `G_m = P Y_m`.
4. Calcule `T_m = q C_m`.
5. Calcule `n_m* = T_m/G_m`.
6. Repita para los doce meses.
7. Calcule por separado el cociente anual y el máximo mensual.
8. Redondee únicamente el criterio seleccionado.
9. Verifique `N_max = floor(A_u/(w l f_A))`.
10. Compare cada resultado con el JSON exportado usando una tolerancia numérica declarada.

Plantilla:

| Magnitud | Cálculo manual | Aplicación | Diferencia | ¿Coincide? |
|---|---:|---:|---:|---|
| `G_[MES]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| `n*_[MES]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| `n*_anual` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| `N` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| `N_max` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |

## 8. Validación de las entradas reales

### Consumo

- Usar doce facturas consecutivas y registrar sus fechas exactas.
- Anonimizar titular, número de cuenta, dirección, códigos y medios de pago.
- Confirmar que la cifra corresponde a energía activa en kWh, no valor monetario ni potencia.
- Si una factura cruza meses, declarar si se conserva como periodo de facturación o si se prorratea.
- Revisar huecos, superposiciones, cambios de medidor o consumos estimados por la empresa.

Registro pendiente:

```text
Vivienda anonimizada: [CÓDIGO]
Municipio: [ ]
Periodo cubierto: [ ] a [ ]
Número de facturas: [ ]
Tratamiento de periodos irregulares: [ ]
Responsable de verificación: [ ]
```

### Módulo

- Guardar la ficha PDF oficial y URL.
- Verificar que potencia y dimensiones correspondan a la misma variante.
- Registrar fecha de consulta y unidades.
- No mezclar datos de una tienda con una ficha de modelo diferente.

### Techo

- Documentar cómo se obtuvo el área útil.
- Separar área total de área sin obstáculos.
- Registrar orientación e inclinación y el instrumento o método usado.
- Fotografías o croquis deben evitar información que identifique el domicilio.
- Aclarar que el factor de área no valida capacidad estructural.

### Recurso solar

- Guardar coordenadas generales, fecha, inclinación, orientación, pérdidas, base meteorológica y versión del proveedor.
- Confirmar doce meses y valores finitos no negativos.
- Comparar la suma mensual con el total anual reportado.
- No confundir `H(i)_d` con horas de luz.

## 9. Contraste entre modelos

### Configuración comparable

Normalice ambos proveedores a 1 kWp y use la misma:

- ubicación;
- inclinación;
- orientación;
- porcentaje de pérdidas;
- tecnología y montaje, en la medida permitida por ambos modelos.

PVGIS usa sur como aspecto 0°, mientras un azimut de brújula usa sur como 180°:

```text
aspect_PVGIS = azimut_brújula − 180
```

normalizado a `[-180,180]`.

### Herramienta independiente sugerida

PVWatts V8 puede usarse como contraste opcional. Desde el 29 de mayo de 2026, la documentación oficial y el endpoint de desarrolladores usan el dominio `developer.nlr.gov`:

- [PVWatts V8 API](https://developer.nlr.gov/docs/solar/pvwatts/v8/)
- [Uso de claves](https://developer.nlr.gov/docs/api-key/)
- [Calculadora PVWatts y advertencias](https://pvwatts.nlr.gov/)

La clave permanece en servidor y no se escribe en el repositorio ni en el navegador. La interfaz conecta con `/api/pvwatts` mediante `NLR_API_KEY`. El contraste fue ejecutado para los cinco escenarios calibrados y sus respuestas, configuración y métricas quedaron archivadas en `cases/evidence/latest/`; esto no las convierte en mediciones de campo.

### Métricas

Con doce pares mensuales en kWh/kWp, calcular:

- MAE;
- RMSE;
- MAPE, excluyendo referencias iguales a cero;
- sesgo anual;
- diferencia porcentual de energía anual;
- gráfico mensual de ambas series.

No se debe declarar un proveedor como “verdad”. Las diferencias pueden provenir de bases meteorológicas, periodos históricos y modelos de temperatura/pérdidas distintos.

### Criterio de aceptación

No se encontró en los archivos oficiales del curso un umbral numérico obligatorio. Para no inventarlo después de conocer las salidas, esta entrega reporta y explica todas las diferencias sin clasificar un proveedor como “verdad”. Cali y Quibdó muestran las mayores diferencias de rendimiento; solo en Quibdó cambia la cantidad entera recomendada.

```text
Criterio aplicado: reporte descriptivo sin umbral de aprobación inventado
Justificación: la rúbrica no fija umbral y ambos proveedores son modelos
Fecha de ejecución: 2026-09-07
Resultado: MAPE mensual entre 4,43 % y 20,39 %
Conclusión: mismo entero en cuatro casos; Quibdó cambia de 4 a 3 paneles según el proveedor
```

## 10. Validación con producción medida

Esta es la evidencia más fuerte, pero solo es posible si existe un sistema real comparable.

1. Registrar potencia instalada, orientación, inclinación y periodo operativo.
2. Obtener energía mensual del inversor o medidor, identificando indisponibilidad y mantenimientos.
3. Ejecutar el modelo para la misma configuración y meses.
4. Comparar series mediante las métricas anteriores.
5. Investigar causas de error: sombra, suciedad, fallos, recortes del inversor, datos meteorológicos o cambios de consumo.

Si no existen mediciones, escribir explícitamente: **“No se realizó validación contra producción medida por falta de un sistema real comparable.”** No reemplazarlas por datos sintéticos.

## 11. Comprobación de sensibilidad pertinente

Comprobar al menos:

- al aumentar el rendimiento específico `Y`, `n*` disminuye;
- para `K>0`, `n'(Y)=−K/Y²<0`;
- el cambio local mostrado por la interfaz coincide con `n'(Y)·ΔY`;
- el redondeo puede conservar el mismo entero aunque `n*` cambie, y puede cambiarlo si cruza el siguiente entero.

La exposición debe distinguir la tasa de cambio continua de la cantidad física entera.

## 12. Registro de incidencias y ajustes

| ID | Fecha | Evidencia | Hallazgo | Causa | Ajuste | Reprueba | Responsable |
|---|---|---|---|---|---|---|---|
| `[VAL-001]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |

Los ajustes del modelo deben conservar la ecuación anterior, la nueva, la razón del cambio y su impacto cuantitativo. Esto demuestra evolución entre hitos.

## 13. Lista de cierre

- [x] Rotular los cinco consumos y techos como supuestos simulados trazables.
- [x] Ejecutar y archivar `pnpm check` sobre la versión evaluada.
- [x] Verificar manualmente un mes, el total anual y los cálculos del libro de validación.
- [x] Documentar la regla de los doce consumos de cada escenario.
- [x] Guardar y citar la ficha oficial del módulo LONGi.
- [x] Declarar el área útil como supuesto hipotético, no medición.
- [x] Guardar configuración y metadatos de PVGIS y PVWatts.
- [x] Ejecutar el contraste independiente e identificar que no es validación experimental.
- [x] Calcular y explicar métricas sin inventar umbrales.
- [ ] Registrar incidencias, cambios y revisión humana.
- [x] Confirmar que documento, póster y pitch usan los mismos datos y resultados.
- [ ] Completar nombres, aportes, aprobación del equipo y ensayo del pitch.
- [ ] Ejecutar en una fase futura el piloto con facturas, visita y producción medida.
