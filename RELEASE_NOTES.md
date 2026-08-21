# Notas del cierre técnico — 21 de agosto de 2026

Esta copia mantiene la versión de paquete `0.1.0` porque SolarFit Hogar sigue siendo un prototipo académico de prefactibilidad, no un producto certificado ni una entrega empírica ya completada.

## Producto cerrado dentro del alcance

- Motor mensual con balance anual y criterio conservador.
- Modos HSP y rendimiento neto PVGIS mutuamente excluyentes.
- Restricción de techo sin truncar silenciosamente la recomendación.
- Sensibilidad diferencial con unidad correcta para HSP o PVGIS.
- Consulta PVGIS, optimización discreta de inclinación y contraste opcional PVWatts.
- CSV de entrada, CSV de resultados, JSON versionado e impresión.
- Restauración de JSON v1 con validación Zod y recálculo seguro.
- Borrador local validado, recuperación ante corrupción y aviso si el guardado falla.
- Invalidación de series solares y descarte de respuestas externas tardías.
- Pestañas operables por teclado, foco visible, contraste reforzado y reducción de movimiento.
- Marca explícita de demostración o de soportes pendientes en pantalla, CSV e impresión.

## Evidencia técnica

- `pnpm check`: aprobado.
- Vitest: 7 archivos, 32 pruebas, 0 fallidas.
- Cobertura V8: 78,08 % de sentencias y 77,53 % de líneas en el alcance instrumentado.
- Build productivo Next.js: aprobado.
- QA en 1280×720 y 390×844: sin desbordamiento global ni errores de consola.
- Humo de PVGIS 5.3: 12 meses recibidos; JSON malformado rechazado con HTTP 400.
- Informe Word de 25 páginas y póster sincronizados con la demostración verificada de 5 paneles, 2,25 kWp y 102 %, siempre rotulada como no definitiva.
- Póster validado sin desbordamientos; guion y checklist alineados con la ruta permitida de caso real o simulado documentado.

El detalle está en `docs/verification-log-2026-08-21.md`.

## Límites deliberados

- El servidor no debe exponerse públicamente sin cuota/rate limiting distribuido y política de privacidad.
- No hay base de datos, cuentas, telemetría ni sincronización en nube.
- No se modelan inversor, protecciones, estructura, sombras cercanas, baterías, tarifa ni flujo de caja.
- El caso académico definitivo, nombres y contribuciones no se inventaron.

## Compatibilidad

- Node.js 24.16.0.
- pnpm 11.19.0.
- Next.js 16.3.1.
- Proyecto JSON: esquema v1.
