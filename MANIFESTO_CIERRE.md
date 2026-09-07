# Manifiesto de cierre de SolarFit Hogar

## Estado honesto

La construcción técnica y los entregables académicos están terminados dentro del alcance de prefactibilidad energética residencial. La versión corregida responde a la retroalimentación docente: aplica únicamente la función de dimensionamiento y su primera derivada, y sustenta los resultados con cinco simulaciones calibradas y reproducibles.

El equipo todavía debe completar información humana que no puede inferirse: nombres, códigos, aportes reales, revisión personal del uso de IA, fecha vigente de AVATA y ensayo del pitch.

## Artefactos construidos

| Artefacto | Estado |
|---|---|
| Aplicación Next.js | Publicada y verificada en producción |
| Modelo y documentación técnica | Completos dentro del alcance |
| Propuesta e Hito 1 corregido | Construidos en DOCX y PDF |
| Hito 2, Hito 3 e informe acumulativo | Construidos en DOCX y PDF |
| Póster académico | Construido en PPTX y PDF; faltan nombres y aportes |
| Guía de uso y pruebas | Construida en DOCX y PDF |
| Libro de validación y evidencia reproducible | Completos para cinco casos calibrados |
| Registro de pruebas | Actualizado al 07-09-2026: 9 archivos y 38 pruebas aprobadas |

## Alcance de los cinco casos

Los casos de Barranquilla, Bogotá, Cali, Medellín y Quibdó son **simulaciones calibradas**, no viviendas observadas. La demanda se deriva de promedios agregados UPME/CORPOEMA; se mantiene constante durante doce meses para no inventar estacionalidad. Las coordenadas son puntos reproducibles de referencia y las áreas de techo son supuestos declarados. El módulo se apoya en una ficha oficial LONGi y el recurso solar se obtiene de PVGIS, con contraste PVWatts para la misma capacidad física construible.

Esta evidencia valida coherencia matemática, funcionamiento del software y sensibilidad frente al proveedor meteorológico. No valida facturas, sombras, estructura, producción medida, ahorro monetario ni desempeño real de una instalación.

## Corrección matemática

Se conserva:

- `n(Y)=qD/(P·Y)`, necesidad continua de paneles;
- `n′(Y)=−qD/(P·Y²)`, impacto marginal del rendimiento solar;
- `N=ceil(n)`, decisión física entera;
- restricción de área para distinguir necesidad y capacidad construible.

No se añaden contenidos del curso que no cambien la decisión. La comparación de inclinaciones es discreta y energética; no se presenta como optimización mediante derivadas.

## Condiciones humanas antes de entregar

- [ ] Completar nombres, códigos, grupo y docente donde corresponda.
- [ ] Registrar contribuciones reales por integrante.
- [ ] Revisar la declaración de IA y adaptar la reflexión con palabras del equipo.
- [ ] Confirmar fecha, formato y límite de páginas en la actividad vigente de AVATA.
- [ ] Ensayar el pitch a tres minutos usando únicamente el póster.
- [ ] Asegurar que todos puedan explicar datos, modelo, derivada, resultados y límites.

No deben cambiarse cifras aisladas entre informe, póster, guion, libro y aplicación. Si cambia un caso, todos los artefactos correspondientes deben regenerarse.
