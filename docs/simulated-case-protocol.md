# Protocolo para cerrar con un caso simulado formal

## Cuándo usarlo

La rúbrica revisada admite validación con datos o condiciones reales o simuladas. Esta ruta evita usar información privada, pero no autoriza presentar el demo arbitrario como evidencia. El escenario debe ser contextualizado, reproducible y declarado como hipotético en todos los artefactos.

## Declaración mínima

> Caso simulado de una vivienda hipotética conectada a red en `[MUNICIPIO]`. No representa una vivienda, factura o instalación existente. Los datos se generaron mediante las reglas y fuentes documentadas a continuación para evaluar el comportamiento matemático del modelo SolarFit Hogar.

## 1. Demanda reproducible

Defina antes de calcular:

- consumo base mensual `C_base`;
- amplitudes `a` y `b`;
- regla de redondeo;
- días de cada periodo;
- propósito de la variación estacional.

Una regla posible, que el equipo debe parametrizar y aprobar, es:

```text
C_m = redondear(C_base · [1 + a·sen(2π(m−1)/12) + b·cos(4π(m−1)/12)])
```

Guarde la fórmula, los parámetros y las doce salidas. No ajuste los parámetros después de ver el número de paneles sin registrar el cambio.

## 2. Vivienda y techo hipotéticos

Declare:

- municipio o contexto climático general;
- área total y área útil supuestas;
- obstáculos excluidos;
- inclinación y orientación;
- factor de instalación;
- razón pedagógica de cada supuesto.

El área simulada no valida capacidad estructural.

## 3. Panel trazable

Seleccione un módulo comercial y archive la ficha PDF oficial del fabricante. Potencia, ancho y alto deben pertenecer a la misma variante. Registre URL, fecha de consulta y número de página de la ficha.

## 4. Recurso solar

Se recomienda usar PVGIS con coordenadas generales del contexto hipotético. Archive:

- latitud y longitud;
- inclinación, azimut y pérdidas;
- fecha, versión y base meteorológica;
- doce rendimientos específicos y total anual;
- URL oficial y JSON exportado por SolarFit.

Si se simulan HSP en lugar de usar PVGIS, documente también la regla generadora y la fuente que justifica su rango.

## 5. Cálculo y validación

1. Ejecute balance anual y criterio conservador.
2. Justifique cuál responde la pregunta del escenario.
3. Reproduzca manualmente un mes, el total anual, `n*`, `N` y `N_max`.
4. Compruebe unidades y monotonicidad.
5. Contraste con PVWatts, otra herramienta o un cálculo independiente si está disponible; si no, explique el límite sin inventar métricas.
6. Discuta incertidumbre, techo, sombras y diferencia entre compensación energética y factura cero.

## 6. Consistencia de artefactos

Copie exactamente los mismos valores a:

- proyecto JSON y resultados CSV;
- informe DOCX;
- póster;
- guion del pitch;
- registro de IA y aportes.

Use siempre la expresión **caso simulado** o **vivienda hipotética**. No escriba “facturas”, “medición” o “producción real” si no existen.

## Registro de decisión

```text
Ruta elegida: caso simulado formal
Fecha de aprobación del equipo: [ ]
Contexto hipotético: [ ]
Regla de demanda y parámetros: [ ]
Supuestos de techo: [ ]
Panel y ficha oficial: [ ]
Fuente solar y configuración: [ ]
Método de validación: [ ]
Integrantes que revisaron: [ ]
```

