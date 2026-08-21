# Registro de verificación — 21 de agosto de 2026

Zona horaria de la ejecución: America/Bogota.

## Entorno

```text
Node.js: 24.16.0
pnpm: 11.19.0
Next.js: 16.3.1
Sistema: Windows
```

## Verificación completa

Comando:

```text
pnpm check
```

Resultado observado a las 07:10:

```text
ESLint: aprobado
Next typegen: aprobado
TypeScript: aprobado
Vitest: 7 archivos, 32 pruebas aprobadas, 0 fallidas
Next build: aprobado
Rutas: /, /api/pvgis, /api/pvgis/optimize, /api/pvwatts
```

El descubrimiento de Vitest quedó limitado a `src/**/*.test.{ts,tsx}` para impedir que copias temporales de QA dentro de `.artifacts` dupliquen artificialmente el conteo.

## Cobertura

Comando `pnpm test:coverage`, observado a las 07:16:

| Métrica | Resultado |
|---|---:|
| Sentencias | 78,08 % |
| Ramas | 68,12 % |
| Funciones | 78,78 % |
| Líneas | 77,53 % |

El alcance instrumentado incluye dominio, utilidades de archivos/almacenamiento y el normalizador puro de rendimiento solar. No se usa un porcentaje de cobertura como sustituto de validación matemática o académica.

## Reproducción desde el paquete limpio

La carpeta `04_aplicacion` generada por el empaquetador se copió a un directorio de QA sin `node_modules`, `.next`, `.artifacts`, tipos generados ni caché del proyecto. Sobre esa copia se ejecutó:

```text
pnpm install --frozen-lockfile --offline
pnpm check
```

Resultado observado a las 07:30: instalación aprobada; typegen, lint, TypeScript, 32 pruebas y build productivo aprobados. Esto confirma que el cierre no depende de archivos generados en la carpeta de desarrollo.

`pnpm audit --prod` informó **No known vulnerabilities found**.

## Humo del proveedor solar

Se envió a la ruta local `/api/pvgis` una configuración de demostración, no una ubicación residencial identificada:

```text
latitud: 4.711
longitud: -74.0721
inclinación: 10°
azimut de brújula: 180°
pérdidas: 14 %
```

Respuesta observada a las 07:16:

```text
proveedor: PVGIS
API: 5.3
base: PVGIS-ERA5
meses: 12
rendimiento anual: 1279,19 kWh/kWp
advertencias: 1
```

Una segunda solicitud con JSON malformado devolvió HTTP 400 y el mensaje “El cuerpo de la solicitud debe ser JSON válido”. Este humo prueba conectividad y contrato; no es el resultado del caso académico definitivo.

## Interfaz

Navegador: Codex in-app Browser.

| Prueba | Resultado |
|---|---|
| Escritorio 1280×720 | Sin desbordamiento horizontal global; resultado demo visible y marcado |
| Móvil 390×844 | Sin desbordamiento horizontal global; acciones, pestañas y resultados utilizables |
| Demo → datos reales | Panel, potencia y dimensiones quedan vacíos/cero; no queda recomendación válida |
| Estado de evidencia | Cambia de `DEMO · NO ES EVIDENCIA` a `PENDIENTE · VALIDAR SOPORTES` |
| Teclado | Flecha derecha cambia Datos → Modelo y actualiza `aria-controls`/`aria-labelledby` |
| Consola | 0 errores y 0 advertencias observados |

## Límites de esta evidencia

- No se ejecutó PVWatts porque no se proporcionó `NLR_API_KEY`.
- No se subieron facturas, fichas o archivos personales durante la prueba.
- El informe, póster y pitch todavía requieren el caso definitivo y revisión humana.

## Sincronización de entregables

El cierre documental se sincronizó con la versión verificada del prototipo:

| Artefacto | Verificación observada |
|---|---|
| Informe Word | 25 páginas renderizadas; 5 paneles, 2,25 kWp y 102 % conservados únicamente como demostración; sin páginas huérfanas ni títulos separados de sus tablas |
| Póster académico | Resultado demostrativo actualizado a 102 %; notación `S*`, `n*` y `Nreq` unificada; 32 pruebas; declaración de IA ampliada |
| Guion y checklist | Ruta de caso real o simulado documentado, métricas y pendientes humanos alineados con el informe |
| Prueba del PPTX | Sin desbordamientos y sin desviaciones de fidelidad respecto de la plantilla heredada |

La inspección visual no convierte la demostración en evidencia del caso definitivo. Nombres, contribuciones y los datos del escenario elegido siguen bajo responsabilidad del grupo.
