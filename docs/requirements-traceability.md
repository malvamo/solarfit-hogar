# Trazabilidad de requisitos académicos

## 1. Autoridad y fecha de esta matriz

Matriz elaborada el 18 de agosto de 2026 y actualizada el 7 de septiembre de 2026 a partir de los originales de la carpeta de la materia y la retroalimentación escrita del profesor sobre el primer entregable:

```text
CÁLCULO DIFERENCIAL (502116-12-2S-2026)/
```

Orden de autoridad aplicado:

1. rúbrica o instructivo específico de la entrega;
2. `Sylabus CD G-12.pdf`;
3. información operativa exportada de AVATA, informando conflictos;
4. materiales y plantillas docentes.

La retroalimentación posterior al Hito 1 tiene prioridad para la corrección: no se deben tratar todos los contenidos del curso, sino únicamente aquellos con interpretación real y significativa en el modelo. En SolarFit se conserva la derivada de `n(Y)=qD/(P·Y)` porque cuantifica el impacto del recurso solar en la necesidad de paneles; se retiran límites, continuidad, segunda derivada, elasticidad y reglas de derivación que no cambian la decisión.

Fuentes principales:

- `Instructivos para evaluaciones/Proyecto CAP^MIA CD.pdf`;
- `Instructivos para evaluaciones/Rúbrica proyectos.pdf`;
- `Proyecto integrador bajo la metodología CAP+IA/Rúbrica proyectos tercera entrega semana 14.pdf`;
- `Proyecto integrador bajo la metodología CAP+IA/Proyecto integrador bajo la metodología CAP+IA.docx`;
- `Sylabus CD G-12.pdf`;
- `Material de apoyo/Plantilla para planteamiento de modelos.pdf`.

## 2. ¿Es correcto decir “Hito”?

Sí. Los documentos oficiales del proyecto usan el término **hito** para cada uno de los tres avances asociados a los cortes. Puede conservarse en el documento, preferiblemente acompañado de una expresión clara la primera vez: “Hito 1 — primer entregable”. No es una etiqueta inventada por el equipo.

## 3. Política de IA

El proyecto CAP+IA está clasificado con semáforo **amarillo**. La IA puede apoyar el proceso, pero se deben declarar herramienta, uso, decisiones, validación y contribuciones cuando lo pide el instructivo. Un texto o cálculo generado no queda validado por haber sido producido por IA; el equipo debe comprenderlo, revisarlo y poder explicarlo.

El registro editable está en [ai-log.md](ai-log.md).

## 4. Convención de estado

| Estado | Significado |
|---|---|
| **Cubierto** | Existe una implementación o documento verificable en el repositorio |
| **Parcial** | Existe una base, pero faltan datos reales, revisión humana o integración en el entregable |
| **Pendiente** | No existe evidencia suficiente en el repositorio |
| **Por confirmar** | La fuente deja una condición abierta o contradictoria |

Esta matriz describe el repositorio, no garantiza una calificación.

## 5. Hito 1 — primer entregable

| Requisito | Evidencia del proyecto | Estado | Acción antes de entregar |
|---|---|---|---|
| Contextualización del problema y usuario | `README.md`; pregunta y alcance en `docs/mathematical-model.md` | Cubierto | Conservar la distinción entre escenario residencial simulado y vivienda observada |
| Objetivo general y objetivos específicos medibles | La arquitectura y el modelo delimitan variables y salidas | Parcial | Redactar objetivos finales, revisar verbos y asignar criterio de logro |
| Revisión de información y fuentes | UPME/SUI 2018, PVGIS, PVWatts y ficha LONGi citados en la documentación | Cubierto | Verificar enlaces y explicar qué dato respalda cada fuente |
| Variables, restricciones, unidades e incógnita | `docs/mathematical-model.md`; `docs/data-dictionary.md` | Cubierto | Trasladar el cuadro pertinente al entregable y explicarlo con palabras propias |
| Primer modelo matemático | Modos HSP/PVGIS, estrategias anual/mensual, redondeo y área | Cubierto | Usar uno de los cinco escenarios formales y mostrar al menos un cálculo reproducible |
| Representación simbólica y gráfica inicial | Fórmulas visibles en la aplicación y gráfico de sensibilidad | Cubierto | Incorporar captura legible y explicación, no solo imagen |
| Cronograma, roles y responsabilidades | Plantillas en esta matriz y `docs/ai-log.md` | Pendiente | Completar nombres, roles, fechas y productos por integrante |
| Presentación profesional | Interfaz web diseñada y documentación estructurada | Parcial | Revisar el archivo académico final, portada, ortografía, numeración y coherencia visual |
| Declaración de uso de IA | `docs/ai-log.md` | Parcial | Validar entradas, agregar prompts realmente usados y aprobación del equipo |
| Aportes de integrantes | Marcadores explícitos | Pendiente | Registrar contribuciones reales, sin repartir de forma ficticia |

### Riesgo principal del Hito 1

El software abre con uno de los cinco escenarios `simulated_formal`: demanda calibrada con un promedio oficial agregado, techo hipotético, ficha LONGi y salida PVGIS archivada. Ninguno debe presentarse como factura, vivienda observada, producción medida o diseño definitivo.

## 6. Hito 2 — desarrollo intermedio

| Requisito | Evidencia del proyecto | Estado | Acción antes de entregar |
|---|---|---|---|
| Desarrollo matemático pertinente hasta el corte | `docs/mathematical-model.md`; motor en `src/domain/solar/` | Cubierto como base | Mostrar el modelo energético y la derivada de sensibilidad con datos trazables |
| Uso significativo de Cálculo Diferencial | Función `n(Y)=qD/(P·Y)` y primera derivada `n′(Y)=−qD/(P·Y²)` | Cubierto | Explicar cómo la sensibilidad puede cambiar la decisión al cruzar un entero |
| Resultados intermedios | Cinco casos formales con valores mensuales, anuales y restricción de techo | Cubierto | Evidencia en `cases/evidence/latest/` y libro de validación |
| Representaciones simbólica, algorítmica y gráfica | Ecuaciones; algoritmo documentado; gráficos SVG y tablas | Cubierto | Seleccionar evidencias legibles y explicar correspondencia entre ellas |
| Visualización, simulación o prototipo | Aplicación web y consulta PVGIS | Cubierto | Registrar versión, ejecución, capturas y ruta de acceso o instrucciones |
| Ajustes al modelo y su justificación | Separación de modos, redondeo final, restricción de techo y comparación inicial→final | Cubierto | Conservar la evolución en el informe acumulativo |
| Validación | 38 pruebas, cinco consultas PVGIS, cinco PVWatts, métricas y hashes | Cubierto | No confundir contraste intermodelo con medición de campo |
| Registro actualizado de IA | `docs/ai-log.md` | Parcial | Añadir usos del periodo y decisiones humanas |
| Aportes individuales actualizados | Plantilla pendiente | Pendiente | Completar por integrante y conservar soporte |

## 7. Hito 3 — entrega final

La rúbrica específica de semana 14 es la fuente principal de esta sección.

| Requisito | Evidencia actual | Estado | Acción obligatoria |
|---|---|---|---|
| Documento final acumulado | `Proyecto_Final_SolarFit_Hogar_Hito_3.docx` con modelo, casos, validación, conclusiones y anexos | Parcial | Completar nombres/aportes y confirmar formato o límite con el profesor |
| Evolución a través de los cortes | Hito 1→2→3 con ajustes, hallazgos y validaciones | Cubierto | Mantener la secuencia en la versión entregada |
| Integración pertinente de contenidos del curso | Función de necesidad continua y primera derivada respecto del rendimiento solar | Cubierto | Preparar la explicación de su interpretación y no añadir temas sin efecto real |
| Producto funcional | Aplicación Next.js con cálculo, APIs, gráficos, restauración y exportación | Cubierto | Verificación 07-09-2026: lint, tipos, 38 pruebas, build y diez consultas LIVE |
| Resultados y validación | Cinco escenarios formales, PVGIS/PVWatts, métricas, series y restricción de techo | Cubierto | Declarar que es validación intermodelo, no experimental |
| Reflexión y conclusiones | Conclusiones técnicas y reflexión borrador en documento final | Parcial | Cada integrante debe revisarlas y adaptarlas con palabras propias |
| Póster académico | `Poster_Academico_SolarFit_Hogar_Hito_3.pptx`, una diapositiva vertical, sin desbordamientos | Parcial | Completar nombres/aportes y confirmar si el profesor exige plantilla institucional |
| Pitch en vivo de 3 minutos | `Guion_Pitch_3_Minutos_SolarFit_Hogar_Hito_3.md`, 374 palabras habladas | Parcial | Asignar fragmentos y ensayar con cronómetro usando solo el póster |
| Sin diapositivas adicionales en el pitch | Regla documentada | Por cumplir | No usar PowerPoint, Canva ni otras diapositivas durante la sustentación; el archivo de una diapositiva puede ser el póster, no una presentación secuencial |
| Dominio del proyecto por todos | No demostrable mediante archivos | Pendiente | Cada integrante debe poder explicar problema, modelo, resultados, validación, IA y límites |
| Declaración final de IA y contribuciones | Plantilla disponible | Parcial | Completar y revisar colectivamente antes de entregar |

## 8. Evidencia por representación

| Representación | Evidencia disponible | Qué debe explicar el equipo |
|---|---|---|
| Verbal | README y documentos | Qué significa “cubrir consumo” y por qué no es autonomía |
| Simbólica | Ecuaciones en aplicación y modelo | Variables, unidades, dominio y supuestos |
| Numérica | Tabla mensual y exportaciones | De dónde viene cada entrada y cómo se obtiene cada salida |
| Gráfica | Barras demanda/producción y curva `K/h` | Tendencia, mes crítico y efecto marginal |
| Algorítmica | Pseudocódigo y TypeScript | Validación, elección de estrategia, redondeo y restricción |
| Producto | Aplicación web | Flujo completo con caso calibrado o datos propios y manejo de errores |

## 9. Requisitos de formato confirmados y no confirmados

### Confirmados

- Tres hitos o entregables acumulativos.
- Para el Hito 3: documento final, póster y pitch en vivo de tres minutos.
- Durante el pitch final, el apoyo debe ser únicamente el póster.
- Deben evidenciarse contenidos, evolución, producto, validación, IA y aportes.

### No confirmados en los archivos revisados

- Una norma obligatoria APA 7 o IEEE para todo el proyecto.
- Fuente tipográfica, márgenes o interlineado únicos.
- Tipo de archivo obligatorio para cada hito.
- Número fijo definitivo de páginas; la información disponible indica que el límite final debe confirmarse con el profesor.
- Obligatoriedad estricta de usar exactamente la plantilla `Póster Feria.pptx`; está disponible y es conveniente, pero la obligatoriedad exacta no quedó confirmada.

El equipo puede usar un formato académico consistente, pero no debe llamarlo “exigido por la rúbrica” sin confirmación.

## 10. Conflictos de fechas

Las fuentes no coinciden. No se debe seleccionar una fecha silenciosamente.

| Entrega | Sílabo | Rúbrica/semana | Snapshot operativo AVATA | Acción |
|---|---|---|---|---|
| Hito 1 | 10–15 de agosto de 2026 | Semana 5 | 17–20 de agosto, cierre 20 a las 23:55 | Confirmar en la tarea activa de AVATA |
| Hito 2 | 14–19 de septiembre de 2026 | Segundo corte | 5–8 de octubre de 2026 | Confirmar antes de planear el cierre |
| Hito 3 | 26–31 de octubre de 2026 | Semana 14/final | 25 de octubre–3 de noviembre de 2026 | Confirmar fecha de documento, feria y pitch |

La plataforma activa y la comunicación directa del profesor deben resolver la operación, pero la contradicción debe quedar registrada.

## 11. Matriz de artefactos

| Artefacto | H1 | H2 | H3 | Estado actual |
|---|:---:|:---:|:---:|---|
| Documento académico acumulativo | ✓ | ✓ | ✓ | Hito 2 y final construidos; campos humanos pendientes |
| Modelo y desarrollo matemático | ✓ | ✓ | ✓ | Base técnica y cinco escenarios simulados documentados completos |
| Aplicación funcional | — | prototipo | ✓ | Implementada y verificada técnicamente el 07-09-2026 |
| Evidencia de pruebas | — | ✓ | ✓ | 38 pruebas, diez consultas LIVE, métricas, CSV/JSON y SHA-256 registrados |
| Póster | — | — | ✓ | Póster final construido y verificado; nombres/aportes pendientes |
| Guion y ensayo de 3 minutos | — | — | ✓ | Guion final construido; reparto y ensayo humano pendientes |
| Registro de IA | ✓ | ✓ | ✓ | Plantilla y borrador disponibles; revisión humana pendiente |
| Aportes individuales | ✓ | ✓ | ✓ | Pendiente de nombres y hechos reales |

## 12. Lista de acciones humanas no delegables

- [ ] Confirmar integrantes, grupo, docente y datos de portada.
- [ ] Confirmar fechas y formato en la actividad vigente de AVATA.
- [x] Elegir la ruta de cinco casos simulados formales permitida por la rúbrica.
- [x] Documentar la regla reproducible de consumo y el techo hipotético de cada escenario.
- [x] Elegir el módulo LONGi y citar su ficha oficial.
- [x] Aplicar objetivos, supuestos y criterio anual con contraste conservador.
- [x] Ejecutar y documentar la validación intermodelo.
- [ ] Registrar contribuciones reales de cada integrante.
- [ ] Revisar con palabras propias todo contenido asistido por IA.
- [ ] Ensayar el pitch entre todos sin apoyo distinto del póster.

## 13. Control de consistencia final

Antes de entregar, comprobar que documento, aplicación, JSON/CSV, póster y discurso contienen los mismos:

- nombre del proyecto;
- identificador, versión y alcance del escenario simulado;
- modelo de panel;
- criterio anual o mensual;
- porcentaje objetivo;
- cantidad recomendada y cantidad construible;
- producción y cobertura anual;
- fuente solar y fecha;
- resultados de validación;
- limitaciones y conclusiones.

Una diferencia entre artefactos debe corregirse o explicarse como evolución, nunca ocultarse.
