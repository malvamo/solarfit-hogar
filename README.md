# SolarFit Hogar

SolarFit Hogar es un prototipo académico de prefactibilidad fotovoltaica residencial. Recibe doce consumos mensuales, el recurso solar, las características de un módulo y el área útil del techo; entrega una recomendación preliminar de potencia y número de paneles, producción mensual, cobertura, sensibilidad e indicación de viabilidad por área.

El proyecto fue construido para Cálculo Diferencial, grupo 12, semestre 2026-2S. Su valor académico no está solo en obtener un número entero: conserva primero una solución continua, analiza su tasa de cambio y redondea únicamente al tomar la decisión física.

> **Advertencia:** el escenario que aparece al abrir la aplicación es completamente sintético. No corresponde a facturas, mediciones solares ni fichas técnicas reales y no puede presentarse como evidencia del proyecto. Antes de una entrega académica debe reemplazarse por datos trazables del caso estudiado.

## Estado y alcance

La versión actual implementa:

- ingreso manual de doce consumos, días facturados y HSP;
- importación de un CSV mensual;
- consulta de producción específica mensual a PVGIS 5.3 mediante una ruta de servidor;
- control opcional de contraste con PVWatts V8 mediante clave privada de servidor, con MAE, RMSE, MAPE y diferencia anual;
- optimización visible que compara inclinaciones con PVGIS, estima derivadas por diferencias finitas y permite aplicar la serie seleccionada;
- dimensionamiento por balance anual o por el mes más exigente;
- separación entre cantidad recomendada y cantidad instalable por el área declarada;
- producción, cobertura y balance mes a mes;
- análisis de sensibilidad de la forma `n(h) = K/h`;
- intervalo determinista ante una variación porcentual de producción;
- almacenamiento validado del borrador en el navegador, con descarte seguro si está corrupto;
- importación y exportación versionada del proyecto en JSON;
- exportación de resultados mensuales a CSV con estado de evidencia e impresión a PDF con marca de procedencia.

No implementa un diseño eléctrico, estructural o financiero. Tampoco dimensiona inversores, protecciones, conductores, puesta a tierra, baterías ni autonomía. No modela sombras cercanas, perfil horario de consumo, tarifa, flujo de caja o inyección a red.

## Inicio rápido

Requisitos reproducibles:

- Node.js 24.16.0 (archivo `.nvmrc`; Next.js exige como mínimo 20.9.0);
- pnpm 11.19.0 mediante Corepack;
- acceso HTTPS saliente a PVGIS para usar la simulación oficial.

PVWatts es opcional. Para usar su endpoint de validación, copie `.env.example` a `.env.local`, defina `NLR_API_KEY` y reinicie el servidor. Esa variable nunca debe llevar el prefijo `NEXT_PUBLIC_`.

Instalación y ejecución:

```bash
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Abra `http://localhost:3000`.

Comprobación completa del repositorio:

```bash
pnpm check
```

Los comandos disponibles son:

| Comando | Propósito |
|---|---|
| `pnpm dev` | Servidor local de desarrollo |
| `pnpm build` | Compilación de producción |
| `pnpm start` | Ejecución de la compilación |
| `pnpm lint` | Revisión estática con ESLint |
| `pnpm typecheck` | Verificación de tipos sin emitir archivos |
| `pnpm test` | Pruebas unitarias con Vitest |
| `pnpm test:coverage` | Pruebas y reporte de cobertura V8 |
| `pnpm test:watch` | Pruebas en modo interactivo |
| `pnpm typegen` | Generación de tipos de rutas de Next.js |
| `pnpm check` | Lint, tipos, pruebas y compilación, en ese orden |

## Uso recomendado con datos reales

1. Pulse **Usar datos reales** para retirar el escenario sintético, o **Abrir JSON** para restaurar un proyecto SolarFit v1 previamente exportado.
2. Escriba un nombre de escenario y una referencia general del municipio; no use la dirección exacta.
3. Ingrese doce periodos consecutivos de consumo en kWh y sus días facturados, o importe el CSV descargable.
4. Registre el área realmente utilizable del techo, descontando obstáculos.
5. Sustituya el módulo genérico por fabricante, modelo, potencia y dimensiones de una ficha técnica oficial.
6. Seleccione uno de los dos métodos solares:
   - **HSP × días × PR:** requiere HSP mensuales trazables y un factor global documentado.
   - **PVGIS:** requiere coordenadas generales, inclinación, azimut y pérdidas. Su rendimiento específico ya incorpora esas pérdidas; el modelo no aplica PR de nuevo.
7. Compare el criterio de balance anual con el criterio conservador mensual.
8. Revise advertencias, supuestos, fuente de cada dato y restricción de techo.
9. Exporte JSON y CSV; conserve además los soportes del caso real o el protocolo reproducible del caso simulado, la ficha del panel y la respuesta o referencia de la fuente solar.

La guía detallada está en [docs/user-guide.md](docs/user-guide.md).

## Modelo en una vista

Para el método manual, la energía mensual de un panel es:

```text
G_m = P · h_m · d_m · PR
```

Para PVGIS:

```text
G_m = P · Y_m
```

donde `Y_m` es el rendimiento neto mensual de PVGIS en kWh/kWp. La necesidad continua mensual es:

```text
n*_m = q · C_m / G_m
```

El criterio anual agrega consumo y generación antes de dividir. El criterio conservador selecciona el máximo `n*_m`. En ambos casos, el número físico se decide al final:

```text
N = ceil(n*)
```

La comprobación preliminar de área usa:

```text
A_panel_instalación = ancho · alto · factor_instalación
N_máximo_techo = floor(A_útil / A_panel_instalación)
```

El desarrollo completo, con unidades, derivadas, dominio y métricas, está en [docs/mathematical-model.md](docs/mathematical-model.md).

## Arquitectura

La aplicación usa Next.js App Router, React, TypeScript y Zod. El cálculo reside en funciones puras separadas de la interfaz. El navegador guarda el borrador validado en `localStorage`; las fuentes externas pasan por rutas de servidor. PVGIS bloquea llamadas AJAX directas mediante CORS y la clave opcional de PVWatts nunca debe llegar al cliente.

```text
Navegador
  ├─ formulario, gráficos e importación/exportación CSV/JSON
  ├─ borrador local validado con esquema v1
  └─ POST /api/pvgis
           └─ GET PVGIS 5.3 /PVcalc

Endpoints técnicos adicionales
  ├─ POST /api/pvwatts → PVWatts V8, requiere NLR_API_KEY
  └─ POST /api/pvgis/optimize → 2–13 escenarios PVGIS

Entradas validadas → motor matemático puro → resultados y advertencias
```

Consulte [docs/architecture.md](docs/architecture.md) para límites, flujo de datos y decisiones técnicas.

## Privacidad y datos externos

- El borrador se guarda únicamente en el almacenamiento local del navegador; no existe base de datos, cuenta de usuario ni telemetría implementada.
- Al consultar PVGIS, la latitud, longitud, inclinación, orientación y pérdidas configuradas salen del equipo y se envían al servicio de la Comisión Europea por medio del servidor de la aplicación.
- Al consultar PVWatts, esos mismos parámetros se envían al servicio NLR; la clave permanece en el servidor, aunque el proveedor exige incluirla en su solicitud externa.
- No se deben ingresar nombre del titular, número de cuenta, dirección exacta ni otra información personal de la factura.
- El JSON exportado contiene todos los datos del escenario. Debe revisarse antes de compartirlo.

## Estructura principal

```text
src/
  app/                    página, estilos y API de PVGIS
  components/             interfaz y visualizaciones SVG
  data/                   escenario sintético y proyecto vacío
  domain/solar/           tipos, cálculo, análisis y pruebas
  lib/                    CSV, descargas y almacenamiento local
  services/               contrato de rendimiento solar y adaptador PVGIS
docs/                     documentación técnica, académica y de uso
```

## Documentación

- [Arquitectura](docs/architecture.md)
- [Modelo matemático](docs/mathematical-model.md)
- [Diccionario de datos](docs/data-dictionary.md)
- [Plan de validación](docs/validation-plan.md)
- [Trazabilidad frente a los entregables](docs/requirements-traceability.md)
- [Registro de uso de IA](docs/ai-log.md)
- [Guía de usuario](docs/user-guide.md)
- [Instalación en Windows](INSTALL_WINDOWS.md)
- [Notas de cierre técnico](RELEASE_NOTES.md)
- [Última verificación](docs/verification-log-2026-08-21.md)
- [Protocolo para un caso simulado formal](docs/simulated-case-protocol.md)

## Fuentes del proyecto

Fuentes académicas locales principales, relativas a la carpeta original de la materia y no incluidas en el paquete de código:

- `Sylabus CD G-12.pdf`
- `Instructivos para evaluaciones/Proyecto CAP^MIA CD.pdf`
- `Instructivos para evaluaciones/Rúbrica proyectos.pdf`
- `Proyecto integrador bajo la metodología CAP+IA/Rúbrica proyectos tercera entrega semana 14.pdf`
- `Material de apoyo/Plantilla para planteamiento de modelos.pdf`

Fuentes externas oficiales:

- [PVGIS, Joint Research Centre de la Comisión Europea](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en)
- [API no interactiva de PVGIS](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/api-non-interactive-service_en)
- [Manual de PVGIS 5](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/pvgis-5-user-manual_en)
- [PVWatts V8 API, NLR](https://developer.nlr.gov/docs/solar/pvwatts/v8/)

## Trabajo que el equipo debe completar

Antes de presentar resultados como propios del caso de estudio, el equipo debe elegir y declarar una de las dos rutas admitidas por la rúbrica: caso real anonimizado o caso simulado formal, reproducible y explícitamente hipotético. Luego debe completar:

- **Integrantes:** `[NOMBRES COMPLETOS]`.
- **Vivienda o caso anonimizado:** `[MUNICIPIO Y DESCRIPCIÓN GENERAL]`.
- **Doce facturas consecutivas:** `[PERIODO Y SOPORTE]`.
- **Área útil y forma de medición:** `[DATO, FECHA Y MÉTODO]`.
- **Módulo seleccionado y ficha oficial:** `[FABRICANTE, MODELO Y URL/ARCHIVO]`.
- **Fuente solar y fecha de consulta:** `[PVGIS/OTRA, CONFIGURACIÓN Y FECHA]`.
- **Validación independiente:** `[HERRAMIENTA O MEDICIÓN, RESULTADOS Y DIFERENCIAS]`.
- **Aportes individuales y revisión humana:** `[REGISTRO POR INTEGRANTE]`.

Hasta completar esos campos, los resultados del modo demostración son únicamente una prueba de funcionamiento del software. La interfaz mantiene el estado **Pendiente · validar soportes** para cualquier caso no sintético; no afirma por sí sola que la evidencia ya fue revisada.
