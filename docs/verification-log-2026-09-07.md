# Registro de verificación — 7 de septiembre de 2026

## 1. Alcance

Este registro verifica la versión corregida de SolarFit Hogar después de incorporar la retroalimentación docente. La versión conserva únicamente el modelo de dimensionamiento `n(Y)=qD/(P·Y)` y su primera derivada `n′(Y)=−qD/(P·Y²)`, porque ambos tienen una interpretación directa en la decisión de cuántos paneles se necesitan. Los cinco casos son **simulaciones calibradas**, no viviendas observadas ni mediciones de campo.

## 2. Verificación del código

Comando ejecutado desde la raíz del repositorio:

```text
pnpm check
```

Resultado:

- ESLint: aprobado.
- Generación de tipos de Next.js y TypeScript: aprobada.
- Pruebas automatizadas: **9 archivos y 38 pruebas aprobadas**.
- Compilación de producción con Next.js 16.3.1: aprobada.
- Rutas verificadas durante la compilación: `/`, `/api/pvgis`, `/api/pvgis/optimize` y `/api/pvwatts`.

No se detectaron errores de compilación, tipos, lint ni pruebas.

## 3. Ejecución reproducible de los cinco casos

La ejecución LIVE se realizó contra `https://solarfit-hogar.vercel.app` entre `2026-09-07T20:00:02.531Z` y `2026-09-07T20:00:13.944Z`. Se completaron **diez consultas externas**: cinco a PVGIS y cinco a PVWatts. La integridad del conjunto quedó registrada con SHA-256 `9b303d80b424ff9a3e119c7140516ae7e16aa41a04d48a2bfd54f3f4aeacc873`.

| Escenario calibrado | Demanda anual | Rendimiento PVGIS | Paneles PVGIS | Paneles construibles | Cobertura PVGIS | Diferencia anual PVGIS frente a PVWatts |
|---|---:|---:|---:|---:|---:|---:|
| Barranquilla, urbano cálido | 3.348 kWh | 1.567,18 kWh/kWp | 5 | 5 | 105,32 % | −4,63 % |
| Bogotá, urbano frío | 1.872 kWh | 1.260,65 kWh/kWp | 4 | 4 | 121,22 % | −0,82 % |
| Cali, urbano templado | 2.136 kWh | 1.235,27 kWh/kWp | 4 | 4 | 104,10 % | −13,14 % |
| Medellín, urbano templado | 2.136 kWh | 1.387,55 kWh/kWp | 4 | 4 | 116,93 % | +1,31 % |
| Quibdó, rural cálido con techo restringido | 1.425,6 kWh | 898,28 kWh/kWp | 4 | 3 | 85,06 % | −20,64 % |

Los consumos no se inventaron como facturas individuales: se derivan de promedios agregados publicados por UPME/CORPOEMA para pisos térmicos y ámbito rural. Las coordenadas son puntos reproducibles de referencia; las áreas de techo son supuestos explícitos. La potencia y dimensiones corresponden a la ficha técnica del módulo LONGi de 450 W. La producción se obtuvo de PVGIS y se contrastó con PVWatts usando la misma capacidad física construible.

El caso de Quibdó confirma que la aplicación no fuerza una respuesta favorable: el modelo necesita cuatro paneles, pero el supuesto de área solo permite tres, por lo que informa que la meta anual no es viable bajo esa restricción. La discrepancia con PVWatts se conserva como advertencia de incertidumbre, no se oculta ni se promedia.

Archivos reproducibles: `cases/fixtures/v1/` y `cases/evidence/latest/`.

## 4. Verificación local de interfaz

Se revisó la aplicación en resoluciones de escritorio (`1440 × 1000`) y móvil (`390 × 844`). Se comprobó lo siguiente:

- la pantalla inicial identifica el ejemplo como **“SIMULACIÓN CALIBRADA · NO ES MEDICIÓN”**;
- el caso de Bogotá carga 156 kWh/mes y conserva las fuentes del consumo, panel y recurso solar;
- la pestaña del modelo muestra únicamente la función `n(Y)` y la sensibilidad mediante `n′(Y)`;
- el cálculo de Bogotá devuelve 4 paneles, 1,80 kWp, 2.269 kWh/año y 121 % de cobertura;
- la comparación discreta de inclinaciones se ejecuta y reporta 5° como máximo para ese caso archivado, con una diferencia aproximada de 0,07 %;
- los estados, botones, tablas y gráficos permanecen legibles en móvil;
- la consola del navegador y el registro de errores quedaron vacíos.

La consulta local a PVWatts mostró correctamente el mensaje de configuración ausente porque `NLR_API_KEY` está definido en Vercel y no en el entorno local. Las cinco consultas PVWatts de la ejecución LIVE confirman que la variable sí estaba disponible en producción.

## 5. Verificación de entregables

Los seis documentos Word se renderizaron a PDF y se inspeccionaron visualmente:

- propuesta aprobada y corregida: 5 páginas;
- Hito 1 corregido: 11 páginas;
- Hito 2: 11 páginas;
- Hito 3: 17 páginas;
- informe completo acumulativo: 26 páginas;
- guía de uso y pruebas: 10 páginas.

También se inspeccionaron el póster académico de una página y el libro de cálculo. El libro recalcula sin errores y contiene cálculos, resumen, series mensuales y guía de fuentes. Una auditoría textual final no encontró referencias a segunda derivada, convexidad, elasticidad, continuidad ni diferencias finitas como contenidos aplicados.

## 6. Producción

El commit corregido `fa86bdd7b226dfdc23ea6fbd077576577378b2e1` se publicó en `main`. Vercel construyó automáticamente el despliegue de producción `dpl_DXHEqboBTRCjfxrDr4vRCqqEPbkk`; la compilación terminó correctamente y el dominio `https://solarfit-hogar.vercel.app` quedó asociado al estado `READY`.

Pruebas realizadas sobre el dominio público:

- carga inicial y navegación por Datos, Modelo y Resultados;
- rótulo visible **“SIMULACIÓN CALIBRADA · NO ES MEDICIÓN”**;
- resultado del caso Bogotá: 4 paneles, 1,80 kWp, 2.269 kWh/año y 121 % de cobertura;
- consulta PVGIS: 1.261 kWh/kWp·año;
- contraste PVWatts: 1.271 kWh/kWp·año, diferencia −0,8 % y decisión 4 frente a 4 paneles;
- comparación discreta de nueve inclinaciones: máximo de la malla en 5°, con ganancia aproximada de 0,07 % frente a 10°;
- revisión móvil a `390 × 844`;
- consola del navegador, errores de página y errores agrupados de Vercel durante la prueba: vacíos.

## 7. Límites de la evidencia

- No se usaron facturas, inspecciones de techo ni mediciones de generación de viviendas reales.
- El sistema es una herramienta de predimensionamiento académico; no reemplaza el diseño eléctrico, estructural, regulatorio ni financiero de un instalador competente.
- PVGIS y PVWatts son modelos independientes y pueden discrepar, especialmente en climas complejos.
- Sombras, orientación real, degradación, temperatura, suciedad, disponibilidad de red y tarifas deben medirse o confirmarse antes de una decisión de inversión.
