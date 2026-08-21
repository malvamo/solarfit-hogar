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

## 10. Cálculo diferencial y sensibilidad

### 10.1 Función base

Manteniendo consumo, potencia, días, objetivo y rendimiento constantes:

```text
n(h) = K / h
```

En el modo manual:

```text
K = q · C / (P · PR · d)
```

El dominio físico es `h > 0`. Sus derivadas son:

```text
n'(h) = −K / h²
n''(h) = 2K / h³
```

Para `K > 0` y `h > 0`:

- `n'(h) < 0`: al aumentar el recurso solar disminuye la necesidad de paneles;
- `n''(h) > 0`: la curva es convexa y la reducción marginal se hace menos intensa;
- `lim h→0+ n(h) = +∞`;
- `lim h→∞ n(h) = 0`.

La elasticidad es constante:

```text
ε_n,h = n'(h) · h / n(h) = −1
```

Por tanto, en el modelo continuo, un cambio relativo pequeño del 1 % en `h` produce aproximadamente un cambio de −1 % en `n`, con los demás factores constantes.

### 10.2 Aproximación lineal

Alrededor de un valor de referencia `h₀`:

```text
n(h₀ + Δh) ≈ n(h₀) + n'(h₀) · Δh
```

La aplicación expone la estimación para `Δh = 0.1` mediante:

```text
Δn ≈ n'(h₀) · 0.1
```

El gráfico evalúa 25 puntos desde aproximadamente `0.55h₀` hasta `1.55h₀`, con un mínimo numérico de 0.25 para el extremo izquierdo.

### 10.3 Referencia usada por el software

- Criterio conservador: se usa el mes con mayor `n_m*`.
- Balance anual manual: `h₀` es el promedio de HSP ponderado por los días facturados.
- Balance anual PVGIS: `h₀ = Σ(Y_m)/Σ(d_m)`, un rendimiento específico diario neto equivalente.

En PVGIS, esa última variable no es una HSP manual independiente; es una parametrización diaria equivalente de la producción específica. La derivada conserva el significado “paneles por unidad adicional de rendimiento diario”, pero debe nombrarse correctamente al sustentar.

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

## 12. Métricas de validación disponibles

Para una serie modelada `M_i` y una serie de referencia `R_i`, `compareEnergySeries` calcula:

```text
MAE = (1/n) · Σ|M_i − R_i|

RMSE = sqrt[(1/n) · Σ(M_i − R_i)²]

MAPE = (100/n⁺) · Σ|M_i − R_i|/R_i, solo donde R_i > 0

Sesgo anual = 100 · [ΣM_i − ΣR_i] / ΣR_i
```

Si ninguna referencia es positiva, MAPE es `null`. Si el total de referencia es cero, el sesgo es `null`. La interfaz calcula estas métricas al contrastar la serie actual con PVWatts; no ofrece todavía carga manual de una tercera serie medida.

## 13. Periodos de facturación que cruzan meses

`calendarizeBills` puede distribuir una factura entre meses calendario suponiendo consumo diario uniforme:

```text
consumo_diario = consumo_factura / días_facturados
```

Luego asigna el mismo consumo diario a cada fecha del intervalo `[inicio, fin)`. Rechaza periodos superpuestos y advierte sobre huecos. La hipótesis uniforme es una aproximación y debe declararse. Esta utilidad todavía no está conectada al formulario visible.

## 14. Optimización de inclinación

El backend `/api/pvgis/optimize` evalúa una malla de entre 2 y 13 inclinaciones. Para cada ángulo `θ_i`, PVGIS entrega un rendimiento anual neto `Y_i`. El criterio implementado es:

```text
θ_seleccionado = arg maxθ_i Y_i
```

Si existe una inclinación de referencia incluida en la malla:

```text
ganancia % = 100 · (Y_seleccionado − Y_referencia) / Y_referencia
```

En puntos interiores, la primera derivada se aproxima con una diferencia central que también funciona para espaciados no uniformes en su versión secante entre vecinos:

```text
Y'(θ_i) ≈ (Y_(i+1) − Y_(i−1)) / (θ_(i+1) − θ_(i−1))
```

En los extremos usa diferencia hacia adelante o hacia atrás. La segunda derivada interior se estima mediante:

```text
Y''(θ_i) ≈ 2 · [
  (Y_(i+1)−Y_i)/(θ_(i+1)−θ_i)
  − (Y_i−Y_(i−1))/(θ_i−θ_(i−1))
] / (θ_(i+1)−θ_(i−1))
```

Los extremos no reciben segunda derivada (`null`). Si hay empate numérico, se conserva el menor ángulo porque los candidatos se ordenan de menor a mayor y solo se reemplaza el máximo ante una mejora estricta mayor que `10⁻⁹`.

Es una búsqueda discreta y una aproximación por diferencias finitas, no una demostración de que el máximo continuo no esté entre candidatos. La interfaz evalúa una malla de 0° a 40° cada 5° e incluye el ángulo actual cuando no pertenece a la malla; después permite aplicar la serie mensual seleccionada. `analysis.ts` conserva además un helper anterior, `optimizeTilt`, que compara proyectos completos y minimiza `continuousPanelCount`.

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
| Inclinaciones para optimizar | 2 a 13 valores únicos, cada uno entre 0° y 90° |

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
- Material local de la materia: `...\Material de apoyo\Plantilla para planteamiento de modelos.pdf` y presentaciones S4, S5, S12–S15 del directorio oficial del curso.
- [PVGIS de la Comisión Europea](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en)
- [Manual oficial de PVGIS 5](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/pvgis-5-user-manual_en)
- [PVWatts V8 API](https://developer.nlr.gov/docs/solar/pvwatts/v8/)
