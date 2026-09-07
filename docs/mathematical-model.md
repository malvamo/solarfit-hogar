# Modelo matemático

## 1. Pregunta y alcance

El modelo responde:

> ¿Cuántos paneles y qué potencia fotovoltaica nominal necesita una vivienda conectada a red para compensar un porcentaje objetivo de su consumo, de acuerdo con doce periodos mensuales, el recurso solar disponible y el área útil declarada?

“Compensar” significa comparar energía generada y consumida en un mes o en el año. No significa autonomía continua, disponibilidad nocturna, factura cero ni independencia de la red. Para esas afirmaciones se requerirían perfiles horarios, baterías, reglas tarifarias y un diseño eléctrico que están fuera del alcance.

## 2. Supuestos

- La vivienda permanece conectada a la red y no usa batería en el modelo.
- Los doce consumos son representativos del periodo estudiado.
- Todos los módulos son del mismo modelo y potencia.
- El recurso solar mensual corresponde a la ubicación y configuración del arreglo.
- En el modo manual, las pérdidas agregadas se representan con un único `PR`.
- En el modo PVGIS, `E_m` ya representa producción con las pérdidas configuradas; no se multiplica de nuevo por `PR`.
- La producción escala linealmente con la potencia nominal dentro de este nivel de prefactibilidad.
- El área útil ha descontado obstáculos. El factor de instalación agrega una reserva escalar para separación y acceso.
- El resultado energético se estudia de manera mensual; no se modela simultaneidad horaria.

## 3. Variables y unidades

| Símbolo | Campo de código | Significado | Unidad o dominio |
|---|---|---|---|
| `m` | `month` | Índice del mes | `1,…,12` |
| `C_m` | `consumptionKwh` | Consumo del periodo mensual | kWh |
| `d_m` | `billingDays` | Días facturados del periodo | días |
| `h_m` | `hsp` | Horas solares pico promedio diario | h equivalentes/día |
| `Y_m` | `specificYieldKwhPerKwp` | Rendimiento específico neto mensual | kWh/kWp |
| `P` | `panelPowerWp / 1000` | Potencia nominal de un módulo | kWp |
| `PR` | `performanceRatioPct / 100` | Rendimiento global del modo manual | adimensional |
| `q` | `targetCoveragePct / 100` | Fracción objetivo de cobertura | `0 < q ≤ 1` |
| `G_m` | `energyPerPanelKwh` | Producción estimada de un panel | kWh/mes |
| `n_m*` | `continuousPanelsRequired` | Necesidad continua del mes | paneles equivalentes |
| `n*` | `continuousPanelCount` | Necesidad continua del criterio elegido | paneles equivalentes |
| `N` | `recommendedPanelCount` | Recomendación entera | paneles |
| `w`,`l` | ancho y alto | Dimensiones del módulo | m |
| `f_A` | `installationAreaFactor` | Reserva multiplicativa de área | adimensional, `1…3` |
| `A_u` | `roofUsableM2` | Área útil declarada del techo | m² |
| `N_max` | `maximumPanelsByRoof` | Máximo preliminar por área | paneles |
| `u` | `uncertaintyPct / 100` | Variación determinista de producción | `0…0.5` |

Las HSP no son las horas entre amanecer y atardecer. Expresan la irradiación diaria como un número equivalente de horas a 1 kW/m². Potencia (`kW`, `kWp`) y energía (`kWh`) tampoco son intercambiables.

## 4. Producción mensual por panel

### 4.1 Modo manual HSP

El rendimiento específico mensual bruto ajustado es:

```text
Y_m = h_m · d_m · PR
```

Por tanto:

```text
G_m = P · h_m · d_m · PR
```

Comprobación dimensional:

```text
kWp · h/día · día · (adimensional) = kWh
```

En este modo el equipo debe documentar tanto la fuente de `h_m` como lo que incluye el `PR`; no se debe sumar otra pérdida que ya esté contenida en esos datos.

### 4.2 Modo PVGIS

PVGIS se consulta con una potencia normalizada de 1 kWp. Su salida mensual `E_m` se interpreta como `Y_m`, en kWh/kWp:

```text
G_m = P · Y_m
```

Comprobación dimensional:

```text
kWp · kWh/kWp = kWh
```

La aplicación envía a PVGIS un porcentaje de pérdidas y conserva su `E_m`; aplicar adicionalmente el `PR` manual duplicaría las pérdidas. El código fija el factor efectivo en 1 para esta ruta.

### 4.3 PVWatts como contraste

El adaptador opcional de PVWatts solicita energía AC mensual para 1 kWp. La normalización usa la misma ecuación `G_m=P·Y_m` y tampoco aplica PR adicional. Este proveedor sirve para comparar modelos; no reemplaza automáticamente la fuente principal ni convierte una estimación en medición real.

## 5. Necesidad continua

La energía objetivo mensual es:

```text
T_m = q · C_m
```

Siempre que `G_m > 0`, la necesidad continua es:

```text
n_m* = T_m / G_m = q · C_m / G_m
```

Si `C_m = 0`, el código define `n_m* = 0`. El consumo anual total debe ser estrictamente positivo.

La palabra “continua” indica que `n_m*` puede ser fraccionaria. Es una variable matemática intermedia, no una cantidad física instalable.

## 6. Criterios de dimensionamiento

### 6.1 Balance energético anual

```text
n_anual* = q · Σ(C_m) / Σ(G_m)
```

Este criterio busca que la generación anual alcance la fracción objetivo del consumo anual. Puede producir déficit en unos meses y excedente en otros. No garantiza la meta cada mes.

### 6.2 Criterio conservador mensual

```text
n_conservador* = max{n_1*, n_2*, …, n_12*}
```

Este criterio busca alcanzar la fracción objetivo en todos los meses bajo los supuestos del modelo. Suele exigir igual o mayor potencia que el balance anual.

La interfaz permite escoger uno; no combina ni promedia ambos criterios.

## 7. Redondeo y capacidad

El número físico se obtiene una sola vez:

```text
N = ceil(n* − ε),  ε = 10⁻¹⁰
```

El pequeño `ε` evita que un error de punto flotante convierta, por ejemplo, un entero calculado como `5.000000000000001` en seis paneles.

Las capacidades son:

```text
P_continua = n* · P
P_recomendada = N · P
```

No se deriva `N = ceil(n*)`, porque es una función escalonada. El análisis diferencial se realiza sobre `n*` y luego se redondea.

## 8. Restricción de techo

Área geométrica del módulo:

```text
A_panel = ancho · alto
```

Área reservada por módulo:

```text
A_panel,inst = A_panel · f_A
```

Máximo preliminar por área:

```text
N_max = floor(A_u / A_panel,inst)
```

Área requerida por la recomendación:

```text
A_requerida = N · A_panel,inst
```

Cantidad construible bajo esta única restricción:

```text
N_construible = min(N, N_max)
```

Si `N > N_max`, el resultado no modifica la recomendación matemática: reporta que la meta es inviable por área y calcula aparte la cobertura con `N_construible`.

Esta comprobación no demuestra que la instalación quepa geométricamente. No modela la forma del techo, distancias normativas, cargas estructurales, orientación de filas, obstáculos ni sombreado.

## 9. Producción, cobertura y balance

Para una cantidad `K` de paneles:

```text
E_generada,m(K) = K · G_m
Cobertura_m(K) = E_generada,m(K) / C_m · 100 %, si C_m > 0
Balance_m(K) = E_generada,m(K) − C_m
```

Cuando `C_m = 0`, la cobertura mensual es nula en el contrato (`null`) y la interfaz muestra `N/A`. El balance se calcula contra el consumo total, no contra la energía objetivo.

La cobertura puede ser mayor que 100 %. Ese valor expresa un excedente energético mensual del modelo; no demuestra autoconsumo, remuneración de excedentes ni ahorro económico.

Los totales anuales suman los doce valores mensuales:

```text
C_anual = Σ(C_m)
T_anual = q · C_anual
E_anual(K) = Σ(E_generada,m(K))
Cobertura_anual(K) = E_anual(K) / C_anual · 100 %
```

## 10. Cálculo diferencial esencial: sensibilidad al rendimiento solar

La retroalimentación docente indicó que solo deben conservarse los conceptos con interpretación real y significativa. Por ello, el proyecto usa una sola función derivable ligada directamente a la decisión:

```text
n(Y) = q · D / (P · Y) = K / Y
K = q · D / P
```

`D` es la demanda del periodo estudiado, `P` la potencia del panel en kWp, `q` la fracción objetivo y `Y` el rendimiento específico neto en kWh/kWp del mismo periodo. En balance anual se usan `D = ΣC_m` y `Y = ΣY_m`; en el criterio conservador se usan la demanda y el rendimiento del mes crítico.

La primera derivada es:

```text
n'(Y) = −K / Y² = −q · D / (P · Y²)
```

Su utilidad es concreta: `n'(Y) < 0` indica que un mayor rendimiento solar reduce la necesidad continua de paneles, y su magnitud estima cuánto cambia esa necesidad cerca del escenario analizado. La aplicación muestra una variación local de 100 kWh/kWp·año en balance anual o de 10 kWh/kWp·mes en el criterio conservador.

La derivada se interpreta antes del redondeo. El número instalable sigue siendo entero y se obtiene con `N = ceil(n*)`; por eso una variación de `n*` solo cambia la decisión física si cruza el siguiente entero. No se incluyen límites, segunda derivada, elasticidad, reglas de derivación adicionales ni optimización continua porque no son necesarios para resolver o justificar la decisión del proyecto.

El gráfico evalúa 25 puntos alrededor del rendimiento de referencia para visualizar esta relación inversa; no añade una segunda conclusión matemática.

## 11. Incertidumbre

La aplicación usa un escenario determinista de producción `±u`; no es un intervalo de confianza estadístico.

Si la producción real fuera `1+u` veces la base:

```text
n_optimista* = n* / (1 + u)
```

Si fuera `1−u` veces la base:

```text
n_conservador* = n* / (1 − u)
```

Cada extremo se redondea hacia arriba. El formulario limita `u` a 50 %, de modo que el denominador conservador permanece positivo.

## 12. Métricas de contraste disponibles

Para una serie modelada `M_i` y una serie de referencia `R_i`, `compareEnergySeries` calcula:

```text
MAE = (1/n) · Σ|M_i − R_i|

RMSE = sqrt[(1/n) · Σ(M_i − R_i)²]

MAPE = (100/n⁺) · Σ|M_i − R_i|/R_i, solo donde R_i > 0

Sesgo anual = 100 · [ΣM_i − ΣR_i] / ΣR_i
```

Si ninguna referencia es positiva, MAPE es `null`. Si el total de referencia es cero, el sesgo es `null`. Estas métricas describen diferencias entre PVGIS y PVWatts; no miden exactitud frente a una instalación real. La interfaz prioriza el rendimiento anual, la diferencia porcentual y si cambia la cantidad entera de paneles.

## 13. Periodos de facturación que cruzan meses

`calendarizeBills` puede distribuir una factura entre meses calendario suponiendo consumo diario uniforme:

```text
consumo_diario = consumo_factura / días_facturados
```

Luego asigna el mismo consumo diario a cada fecha del intervalo `[inicio, fin)`. Rechaza periodos superpuestos y advierte sobre huecos. La hipótesis uniforme es una aproximación y debe declararse. Esta utilidad todavía no está conectada al formulario visible.

## 14. Comparación discreta de inclinaciones

El backend `/api/pvgis/optimize` conserva su ruta por compatibilidad, pero su función es comparar una malla de entre 2 y 13 inclinaciones. Para cada ángulo `θ_i`, PVGIS entrega un rendimiento anual neto `Y_i`. Se selecciona el mayor valor observado:

```text
θ_seleccionado = arg maxθ_i Y_i
```

Si existe una inclinación de referencia incluida en la malla:

```text
ganancia % = 100 · (Y_seleccionado − Y_referencia) / Y_referencia
```

Si hay empate numérico, se conserva el menor ángulo. La interfaz evalúa de 0° a 40° cada 5° e incluye el ángulo actual cuando no pertenece a la malla. Esta operación es una comparación técnica de escenarios, no una aplicación adicional de cálculo diferencial ni una prueba de máximo continuo.

## 15. Algoritmo implementado

```text
validar 12 meses y parámetros globales
convertir Wp a kWp y porcentajes a fracciones

para cada mes:
    validar consumo y días
    si modo HSP:
        Y_m = h_m · d_m · PR
    si modo PVGIS:
        Y_m = rendimiento específico neto recibido
    G_m = P · Y_m
    n_m* = 0 si C_m = 0; en otro caso q · C_m / G_m

si estrategia anual:
    n* = q · ΣC_m / ΣG_m
si estrategia conservadora:
    n* = max(n_m*)

N = ceil(n*)
N_max = floor(A_u / A_panel,inst)
N_construible = min(N, N_max)

calcular resultados mensuales con N y con N_construible
calcular totales, sensibilidad, incertidumbre y advertencias
```

## 16. Dominio validado por el código

| Magnitud | Intervalo aceptado |
|---|---|
| Cobertura objetivo | 1 % a 100 % |
| PR manual | 1 % a 100 % |
| Pérdidas PVGIS en el motor | 0 % a 100 % |
| Pérdidas en la API PVGIS | 0 % a menos de 100 % |
| Área útil | mayor o igual a 0 m² |
| Factor de instalación | 1 a 3 |
| Potencia del panel | 1 a 2.000 Wp |
| Ancho y alto | 0,1 a 5 m |
| Incertidumbre | 0 % a 50 % |
| Consumo mensual | 0 a 20.000 kWh |
| Días del periodo | 1 a 45 |
| HSP manual | 0,1 a 12 h/día |
| Rendimiento PVGIS mensual | 0,1 a 500 kWh/kWp |
| Latitud de la API | −90° a 90° |
| Longitud de la API | −180° a 180° |
| Inclinación de la API | 0° a 90° |
| Azimut de brújula de la API | 0° a menos de 360° |
| Inclinaciones para comparar | 2 a 13 valores únicos, cada uno entre 0° y 90° |

El motor valida actualmente `PR` y pérdidas PVGIS aunque solo uno participe en el método elegido. Es una restricción de implementación que conviene conservar en valores válidos.

## 17. Qué puede afirmarse y qué no

Sí puede afirmarse, con entradas trazables, que el prototipo:

- calcula una prefactibilidad energética bajo las ecuaciones declaradas;
- muestra la sensibilidad del modelo continuo;
- compara una meta con una restricción escalar de área;
- conserva resultados mensuales y advertencias.

No puede afirmarse que:

- el sistema garantice suministro en cada instante;
- la factura llegue a cero;
- el número sea un diseño definitivo instalable;
- la estructura soporte los módulos;
- PVGIS represente sombras de árboles, muros o construcciones cercanas;
- un escenario sintético valide una vivienda real.

## 18. Fuentes

- Modelo implementado: `src/domain/solar/calculate.ts`, `analysis.ts`, `optimization.ts`, `bills.ts` y `types.ts`.
- Material local de la materia: `...\Material de apoyo\Plantilla para planteamiento de modelos.pdf` y material de derivada disponible en el directorio oficial del curso.
- [UPME/CORPOEMA, estimación de consumos de subsistencia (2019)](https://bdigital.upme.gov.co/handle/001/1367)
- [PVGIS de la Comisión Europea](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en)
- [Manual oficial de PVGIS 5](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/pvgis-5-user-manual_en)
- [PVWatts V8 API](https://developer.nlr.gov/docs/solar/pvwatts/v8/)
