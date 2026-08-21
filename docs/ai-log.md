# Registro de uso de inteligencia artificial

## 1. Estado del registro

Este archivo es un borrador trazable para cumplir la política CAP+IA de semáforo amarillo. Contiene usos observables durante la construcción digital, pero el equipo debe revisarlo, corregirlo y agregar las interacciones que haya realizado fuera de este espacio.

No se han inventado nombres ni aportes. Los campos entre corchetes deben completarse con hechos verificables.

## 2. Declaración breve sugerida

> El equipo utilizó OpenAI Codex como apoyo para analizar los archivos oficiales del curso, estructurar el modelo matemático, investigar documentación técnica oficial, implementar y probar el prototipo web, redactar y diseñar borradores del informe, póster y guion, y preparar el paquete técnico. El equipo conserva la responsabilidad sobre la selección de datos, revisión de fórmulas, decisiones, validación, redacción final y sustentación. Los datos de demostración son sintéticos y no se presentan como resultados de la vivienda estudiada.

Editar la declaración si otra herramienta de IA fue usada.

## 3. Herramientas

| Herramienta | Proveedor/versión | Uso | Datos compartidos | Revisión humana |
|---|---|---|---|---|
| OpenAI Codex | `[MODELO/VERSIÓN MOSTRADA EN LA SESIÓN, SI ESTÁ DISPONIBLE]` | Análisis de archivos, modelación, código, pruebas y documentación | Archivos académicos y código del proyecto; no se deben cargar facturas sin anonimizar | `[INTEGRANTE Y FECHA]` |
| `[OTRA IA, SI EXISTIÓ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |

## 4. Interacciones principales observadas

La tabla resume tareas, no sustituye el historial completo. Cuando la rúbrica exija prompts, adjunte el texto realmente enviado o una exportación de la conversación.

| ID | Fecha | Prompt o solicitud | Resultado de la IA | Decisión del equipo | Verificación |
|---|---|---|---|---|---|
| IA-01 | Antes del 18-08-2026 | “Paneles solares: ¿cuántos paneles necesita una vivienda para cubrir su consumo? … consumo mensual, potencia del panel, horas de sol, energía producida.” | Estructuración como prefactibilidad conectada a red con variables, pérdidas y área | El equipo y el profesor aprobaron la idea y el planteamiento | `[DESCRIBIR REVISIÓN REAL]` |
| IA-02 | Antes del 18-08-2026 | Solicitud de propuesta en Word y primer entregable | Borradores académicos del proyecto | `[ACEPTADO/MODIFICADO Y POR QUIÉN]` | `[ARCHIVO REVISADO, FECHA]` |
| IA-03 | 18-08-2026 | “Ahora quiero que construyas TODO el proyecto, el proyecto completo” | Arquitectura Next.js, motor, interfaz, APIs, pruebas y documentación | Se adoptó un MVP trazable con demo explícitamente sintética | Código revisable y comandos `pnpm check`; registrar último resultado |
| IA-04 | 18-08-2026 | Analizar los archivos del curso y requisitos de los tres hitos | Matriz de requisitos, conflictos de fechas y reglas del pitch | Se mantuvieron las contradicciones para confirmarlas en AVATA | Comparación contra rúbricas y sílabo locales |
| IA-05 | 18-08-2026 | Investigar datos solares y APIs oficiales | Parámetros y límites de PVGIS 5.3 y PVWatts V8 | PVGIS como fuente primaria; PVWatts como contraste opcional con clave de servidor | Enlaces oficiales; las consultas de prueba no son resultados del caso real |
| IA-06 | 18-08-2026 | Auditar el modelo matemático | Dos modos excluyentes, dos criterios de tamaño, derivada `K/h`, restricción de techo y métricas | Se evitó aplicar PR dos veces y se separó recomendación de factibilidad | Pruebas unitarias y desarrollo en `mathematical-model.md` |
| IA-07 | 18-08-2026 | Crear documentación técnica honesta basada en el código real | README, arquitectura, modelo, diccionario, plan, trazabilidad y guía | Marcadores explícitos para todo dato humano o empírico faltante | Revisión de rutas, tipos y fuentes del repositorio |
| IA-08 | 18–21-08-2026 | Construir el informe completo, póster y guion del pitch | DOCX de 25 páginas, póster editable de una diapositiva y guion de 416 palabras | Se conservaron marcadores donde faltan nombres, aportes y evidencia; el demo no se declaró caso final | Renderización y revisión visual; revisión humana del equipo pendiente |
| IA-09 | 21-08-2026 | “Continuar con la ejecución y el cierre de la construcción” | Importador JSON, esquema Zod, invalidación de consultas antiguas, accesibilidad, pruebas, documentación y empaquetado reproducible | Se cerró el producto técnico sin inventar el caso académico ni aportes personales | `pnpm check`, 32 pruebas, cobertura V8, QA escritorio/móvil y humo PVGIS |
| IA-10 | 21-08-2026 | Sincronizar y cerrar los artefactos académicos | Informe Word, póster, pitch y checklist alineados con 102 %, 32 pruebas y la ruta real/simulada permitida | Se mantuvieron campos editables y se corrigieron paginación, notación, declaración de IA y estado de la evidencia | Render de 25 páginas, prueba de desbordamiento/fidelidad del PPTX e inspección visual |

## 5. Decisiones influenciadas por IA

### Aceptadas

| Decisión | Razón técnica | Evidencia |
|---|---|---|
| Limitar el MVP a una vivienda conectada a red y sin batería | Mantiene el problema en energía mensual y evita afirmar autonomía | `README.md`; modelo matemático |
| Conservar doce periodos | Evita esconder la variación mensual | `SolarProjectInput.months` |
| Separar balance anual y criterio conservador mensual | Responden preguntas distintas | `SizingStrategy` |
| Mantener `n*` continua y redondear al final | Permite aplicar cálculo diferencial correctamente | `calculate.ts` |
| Separar recomendación y máximo por techo | Evita presentar una meta truncada como si se cumpliera | `roofFeasible`, `buildablePanelCount` |
| Usar dos rutas solares mutuamente excluyentes | Impide duplicar pérdidas | `SolarSourceMode` |
| Consultar PVGIS desde el servidor | PVGIS bloquea AJAX directo por CORS | `/api/pvgis`; documentación oficial |
| Rotular la demostración como sintética | Evita confundir prueba de software con evidencia | `demo-project.ts`; interfaz |
| Guardar borrador local y minimizar datos | Reduce tratamiento de datos personales | `project-storage.ts`; interfaz |

### Modificadas por el equipo o durante la revisión

| Idea inicial | Ajuste | Motivo |
|---|---|---|
| “Horas de sol” | Horas solares pico o rendimiento específico | Las horas de luz no miden directamente energía disponible |
| “Cubrir consumo” | Compensar energía mensual/anual | No implica autonomía, factura cero o coincidencia horaria |
| Un único promedio | Doce meses y dos criterios | Hace visible estacionalidad y mes crítico |
| Área como ajuste de producción | Área como restricción independiente | Evita contabilizar dos veces eficiencia o pérdidas |
| Cálculo directo entero | Solución continua y decisión discreta | La derivada corresponde a la función continua |

### Rechazadas o evitadas

| Sugerencia o riesgo | Motivo de rechazo |
|---|---|
| Multiplicar `E_m` de PVGIS por otro PR | Duplicaría las pérdidas ya configuradas |
| Llamar “autoconsumo” a la cobertura mensual | No existe perfil horario de carga ni generación |
| Presentar el demo como validación | Los valores son sintéticos |
| Inventar estudiantes, roles, facturas, medidas o resultados | Viola trazabilidad e integridad académica |
| Afirmar diseño certificado | El prototipo no estudia estructura ni sistema eléctrico |
| Usar presentación de diapositivas en el pitch final | La rúbrica específica permite únicamente el póster |

## 6. Verificación del contenido asistido

| Elemento | Cómo se verificó o debe verificarse | Estado |
|---|---|---|
| Requisitos académicos | Lectura del sílabo, instructivos y rúbricas originales | Revisado técnicamente; `[APROBACIÓN DEL EQUIPO]` pendiente |
| Fórmulas y unidades | Derivación manual, análisis dimensional y pruebas controladas | Codificado; registrar revisión humana |
| Implementación | Lint, tipos, pruebas y build mediante `pnpm check` | 32/32 pruebas, lint, typegen, TypeScript y build aprobados el 21-08-2026; evidencia en `verification-log-2026-08-21.md` |
| Parámetros PVGIS | Documentación de JRC y validación del contrato | Revisado en fuente oficial |
| Parámetros PVWatts | Documentación vigente de NLR | Revisado en fuente oficial; requiere clave para consulta real |
| Caso definitivo real o simulado | Facturas y medición, o protocolo de simulación con regla, propósito y supuestos | Pendiente |
| Ficha de panel | PDF del fabricante | Pendiente |
| Resultados cruzados | Segunda herramienta o medición | Pendiente |
| Texto final | Lectura y reescritura por cada integrante | Pendiente |

## 7. Registro detallado reutilizable

Copie una fila por interacción relevante. No registre contraseñas, claves de API ni datos personales.

| ID | Fecha/hora | Integrante | Herramienta | Prompt completo o anexo | Archivo/salida afectada | Aceptado | Modificado | Rechazado | Método de verificación |
|---|---|---|---|---|---|---|---|---|---|
| `[IA-008]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |

Si el prompt es largo, use un anexo con identificador y escriba aquí su ruta.

## 8. Contribuciones del equipo

Completar únicamente con trabajo real. Evitar porcentajes iguales inventados. Una persona puede contribuir en varias áreas y todos deben comprender el proyecto completo.

| Integrante | Aportes verificables | Archivos/evidencia | Fecha | Revisión de otro integrante |
|---|---|---|---|---|
| `[NOMBRE 1]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| `[NOMBRE 2]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| `[NOMBRE 3, SI APLICA]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |

## 9. Responsabilidad humana

Antes de entregar, cada integrante debe poder explicar sin leer:

- qué pregunta responde el modelo;
- por qué HSP no significa horas de luz;
- cuándo se usa PR y cuándo no;
- diferencia entre `n*`, `N` y `N_max`;
- por qué la derivada es negativa;
- qué datos son reales y cuáles sintéticos;
- cómo se validó el resultado;
- qué no puede garantizar el prototipo;
- qué aportó y qué revisó personalmente.

## 10. Fuentes de política

- `...\Instructivos para evaluaciones\Proyecto CAP^MIA CD.pdf`
- `...\Instructivos para evaluaciones\Amarillo Uso permitido del apoyo IA.png`
- `...\Instructivos para evaluaciones\Rúbrica proyectos.pdf`
- `...\Proyecto integrador bajo la metodología CAP+IA\Rúbrica proyectos tercera entrega semana 14.pdf`

La ruta base de `...` es la carpeta oficial de Cálculo Diferencial indicada en [requirements-traceability.md](requirements-traceability.md).
