# Guía de usuario

## 1. Antes de empezar

SolarFit Hogar produce una **prefactibilidad energética**. Úselo para estimar paneles, capacidad, producción, cobertura y área bajo supuestos visibles. No lo use para ordenar equipos o ejecutar una instalación sin revisión eléctrica, estructural y normativa de profesionales competentes.

La aplicación inicia con un escenario didáctico. La etiqueta **Demo · no es evidencia** significa que sus consumos, HSP, coordenadas y módulo son sintéticos.

## 2. Preparar los datos

Reúna:

- doce facturas eléctricas consecutivas;
- consumo en kWh y días facturados de cada periodo;
- municipio y coordenadas generales, sin dirección exacta;
- medición del área realmente útil del techo;
- inclinación y orientación aproximadas del arreglo;
- ficha oficial del módulo que desea evaluar;
- una fuente trazable de HSP mensuales, si usará el método manual.

Anonimice las facturas antes de compartir evidencia: elimine nombres, direcciones, cuentas, códigos de pago y cualquier dato personal.

## 3. Ejecutar localmente

Desde la carpeta del proyecto:

```bash
pnpm install
pnpm dev
```

Abra `http://localhost:3000`.

Para habilitar el endpoint opcional de PVWatts, copie `.env.example` a `.env.local` y agregue una clave de NLR:

```text
NLR_API_KEY=[CLAVE PRIVADA]
```

No use el prefijo `NEXT_PUBLIC_`, no confirme `.env.local` en control de versiones y no comparta la clave en capturas. La interfaz envía la validación a una ruta de servidor y la clave viaja al proveedor mediante `X-Api-Key`.

## 4. Empezar un caso real

Pulse **Usar datos reales**. Esta acción elimina el borrador local anterior y carga campos pendientes. Una vez empiece a escribir, los cambios se guardan otra vez en el navegador.

### A. Vivienda y meta

- **Nombre del escenario:** use un código no identificable, por ejemplo `[CASO-01]`.
- **Municipio o referencia general:** ciudad y país; no escriba la dirección.
- **Cobertura objetivo:** fracción del consumo que se desea compensar, entre 1 % y 100 %.
- **Latitud/longitud:** necesarias para PVGIS; oeste y sur son negativos.
- **Área útil del techo:** superficie aprovechable después de descontar obstáculos.
- **Criterio:**
  - *Balance energético anual* compensa el objetivo en el total del año.
  - *Meta en cada mes* selecciona el mes más exigente.

No confunda una meta anual del 100 % con energía disponible durante cada hora.

### B. Doce periodos de consumo

Puede escribir los valores o importar un CSV.

- **Consumo:** kWh del periodo.
- **Días:** duración real indicada en la factura.
- **HSP/día:** recurso solar del modo manual, no horas de luz.

Si las facturas no coinciden con meses calendario, documente esa limitación. El motor acepta periodos de 1 a 45 días, pero la tabla los etiqueta enero–diciembre; el equipo debe explicar su correspondencia.

### C. Módulo fotovoltaico

Copie del mismo documento oficial:

- fabricante y modelo;
- potencia nominal en Wp;
- ancho y alto en metros.

El **factor de instalación** multiplica el área geométrica. Un valor mayor que 1 reserva espacio, pero no reemplaza un diseño de distribución. Conserve la ficha PDF o URL y la fecha de consulta.

## 5. Importar CSV

Pulse **Descargar plantilla**. El encabezado obligatorio es:

```csv
month,consumption_kwh,billing_days,hsp
```

El archivo debe tener exactamente doce filas de datos y una sola fila para cada mes del 1 al 12.

Reglas prácticas:

- con coma como separador de columnas, use punto decimal;
- si necesita coma decimal, use punto y coma como separador;
- no cambie los cuatro nombres obligatorios;
- una importación cambia el método solar a HSP manual;
- después de importar, revise visualmente las doce filas y las unidades.

Errores comunes:

- guardar valores monetarios en `consumption_kwh`;
- escribir potencia en lugar de energía;
- incluir once o trece meses;
- repetir un número de mes;
- confundir HSP con duración del día.

## 6. Elegir la fuente solar

### Método educativo: HSP × días × PR

Use este método cuando tenga una serie mensual de HSP defendible y quiera mostrar con claridad la función y su derivada.

1. Cargue las HSP de los doce periodos.
2. Defina un factor global de rendimiento.
3. Documente qué pérdidas incluye el PR y de dónde procede.
4. Defina el porcentaje de incertidumbre para los escenarios.

La ecuación es:

```text
G_m = P · h_m · d_m · PR
```

### Simulación oficial: PVGIS

Use este método para obtener producción específica mensual para una configuración.

1. Ingrese latitud y longitud.
2. Defina inclinación desde la horizontal.
3. Defina azimut de brújula:
   - 0° norte;
   - 90° este;
   - 180° sur;
   - 270° oeste.
4. Defina las pérdidas que se enviarán a PVGIS.
5. Pulse **Consultar PVGIS 5.3**.
6. Espere la confirmación con energía anual y nombre de la base meteorológica.
7. Compruebe que la procedencia cambia a `official` y abra la fuente.

PVGIS ya incorpora las pérdidas configuradas en su energía `E_m`. SolarFit no vuelve a aplicar el PR manual.

La consulta transmite al servicio de la Comisión Europea coordenadas, inclinación, orientación y pérdidas. Los consumos y la ficha del panel no forman parte de esa solicitud.

## 7. Leer el modelo

La pestaña **Modelo** presenta cuatro pasos:

1. producción de un panel;
2. necesidad continua `n*`;
3. redondeo entero `N = ceil(n*)`;
4. restricción `N · A_panel · factor ≤ A_útil`.

El gráfico `n(h)=K/h` muestra una curva decreciente. La derivada negativa significa que más recurso solar reduce la cantidad continua necesaria, manteniendo lo demás constante.

En modo PVGIS, la abscisa debe interpretarse como rendimiento específico diario neto equivalente, aunque la interfaz conserve la etiqueta abreviada HSP.

## 8. Interpretar resultados

### Decisión preliminar

- **Paneles:** recomendación energética entera.
- **kWp:** suma de potencia nominal de esos paneles.
- **VIABLE:** la recomendación cabe en el área escalar declarada.
- **REVISAR:** el techo admite menos paneles que los exigidos por la meta.

“VIABLE” solo se refiere a esta comprobación preliminar de área. No certifica estructura, diseño eléctrico, normativa ni ausencia de sombras.

### Métricas

- **Capacidad continua:** solución antes del redondeo.
- **Cobertura anual:** generación estimada dividida entre consumo anual.
- **Producción anual:** suma de los doce meses.
- **Rango por incertidumbre:** cantidad redondeada ante una variación determinista de producción; no es un intervalo estadístico.

### Gráfico y tabla mensual

Si el techo es suficiente, muestran la recomendación. Si es insuficiente, muestran la cantidad construible por área.

- **Cobertura >100 %:** excedente energético del mes en el modelo.
- **Balance positivo:** producción mensual mayor que consumo mensual.
- **Balance negativo:** déficit mensual.
- **`n* mensual`:** paneles equivalentes requeridos por ese mes antes de redondear.

Un excedente no equivale automáticamente a ahorro o ingreso; depende de coincidencia horaria, tarifa y regulación, factores no modelados.

## 9. Guardar y compartir

### Borrador local

El proyecto se guarda bajo `solarfit:project:v1` en el navegador. No se sincroniza entre equipos ni usuarios. Borrar datos del navegador puede eliminarlo.

### JSON del proyecto

Contiene:

- todas las entradas;
- procedencia;
- resultado completo;
- serie recomendada y construible;
- fecha de exportación.

Revíselo antes de compartir porque puede contener coordenadas.

Para restaurarlo, pulse **Abrir JSON** y seleccione el archivo. SolarFit admite el esquema v1, limita el archivo a 1 MB, valida sus campos y vuelve a calcular todos los resultados. Si el JSON fue alterado, está incompleto o pertenece a otra versión, el proyecto actual se conserva y aparece un mensaje de error.

### CSV de resultados

Contiene consumo, rendimiento específico, producción, cobertura y balance mensuales. La columna `scenario` indica `recommended_energy`; si el techo es inviable, exporta `buildable_by_roof` y usa la serie construible.

### Imprimir / guardar PDF

Use la opción del navegador. Antes de entregar:

- seleccione tamaño y orientación apropiados;
- revise todas las páginas;
- confirme que no se cortaron tabla, fórmulas o advertencias;
- verifique que la etiqueta de datos reales/sintéticos sea visible.

## 10. Optimización y validación independiente

En modo PVGIS, la interfaz ofrece:

- **Optimizar inclinación:** compara la malla visible mediante `POST /api/pvgis/optimize`, informa el máximo discreto y permite aplicar su serie mensual.
- **Contrastar con PVWatts:** usa `POST /api/pvwatts`, si existe `NLR_API_KEY`, y presenta MAE, RMSE, MAPE y diferencia anual.

Una respuesta visible no convierte el caso sintético en evidencia. Para el informe real se deben guardar entradas, configuración, fecha, fuente y captura. Consulte [architecture.md](architecture.md), [data-dictionary.md](data-dictionary.md) y [validation-plan.md](validation-plan.md).

## 11. Solución de problemas

| Mensaje o síntoma | Causa probable | Acción |
|---|---|---|
| “Se requieren exactamente doce registros” | Proyecto o borrador incompatible | Pulse **Usar datos reales** o limpie el almacenamiento y vuelva a cargar |
| “El consumo anual debe ser mayor que cero” | Todos los consumos están vacíos o en cero | Ingrese las doce facturas reales |
| “Ingresa latitud y longitud” | Consulta PVGIS sin coordenadas | Complete ambos campos |
| Error HTTP/servicio PVGIS | Red, límite o proveedor temporalmente no disponible | Espere, reintente y conserve fecha/error; no invente datos |
| PVWatts 503 | Falta `NLR_API_KEY` en el servidor | Configure `.env.local` y reinicie el servidor |
| CSV rechazado | Encabezado, filas, meses o números incorrectos | Compare con la plantilla descargada |
| El resultado desaparece | Algún valor está fuera de rango | Lea el mensaje en la pestaña y corrija el campo |
| “Área insuficiente” | `N > N_max` | Reporte la meta como no viable; no esconda paneles faltantes |
| No recupera borrador | `localStorage` bloqueado o borrado | Pulse **Abrir JSON** y restaure una exportación v1 |
| “La versión … no es compatible” | El archivo no usa el esquema SolarFit v1 | Abra el archivo con la versión que lo creó o migre sus entradas de forma controlada |
| “Borrador inválido descartado” | El almacenamiento contenía JSON corrupto o incompleto | Continúe con la demo, un proyecto nuevo o una exportación válida |

## 12. Flujo para una entrega académica

1. Confirme la versión del proyecto y ejecute `pnpm check`.
2. Cargue datos reales trazables o un caso simulado formal, reproducible y declarado como hipotético; no use el demo arbitrario como evidencia.
3. Exporte JSON y CSV.
4. Reproduzca manualmente al menos un mes y el total anual.
5. Haga la comparación independiente definida en el plan de validación.
6. Archive fuentes, configuración, fecha y capturas.
7. Traslade al documento las ecuaciones y resultados que realmente usó.
8. Actualice el registro de IA y los aportes individuales.
9. Verifique que aplicación, documento, póster y pitch muestran los mismos resultados.
10. Haga que todos los integrantes expliquen el modelo completo.

## 13. Campos que el equipo debe completar

```text
Código del caso: [ ]
Municipio: [ ]
Periodo de facturas: [ ]
Método de anonimización: [ ]
Área útil y método de medición: [ ]
Panel y ficha oficial: [ ]
Fuente solar y configuración: [ ]
Criterio de dimensionamiento elegido: [ ]
Validación independiente: [ ]
Responsables de revisión: [ ]
```
