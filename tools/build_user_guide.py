from __future__ import annotations

import json
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt

import build_final_report as sf


PROJECT_ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = PROJECT_ROOT.parents[2]
OUTPUT = WORKSPACE / "Entregables" / "CalculoDiferencial" / "Guia_de_Uso_y_Pruebas_SolarFit_Hogar.docx"
EVIDENCE_DIR = PROJECT_ROOT / "cases" / "evidence" / "latest"
APP_URL = "https://solarfit-hogar.vercel.app"


def fmt(value: float, decimals: int = 2) -> str:
    text = f"{value:,.{decimals}f}"
    return text.replace(",", "X").replace(".", ",").replace("X", ".")


def load_cases() -> list[dict]:
    cases = []
    for path in sorted((EVIDENCE_DIR / "cases").glob("*.json")):
        with path.open("r", encoding="utf-8") as stream:
            cases.append(json.load(stream))
    if len(cases) != 5:
        raise RuntimeError(f"Se esperaban 5 casos de evidencia y se encontraron {len(cases)}.")
    return cases


def add_cover(doc: Document) -> None:
    for _ in range(5):
        paragraph = doc.add_paragraph()
        paragraph.paragraph_format.space_after = Pt(10)

    paragraph = doc.add_paragraph("MANUAL DEL EQUIPO", style="SolarFit Kicker")
    paragraph.paragraph_format.space_after = Pt(16)
    paragraph = doc.add_paragraph("SolarFit Hogar", style="SolarFit Cover Title")
    paragraph.paragraph_format.space_after = Pt(8)
    paragraph = doc.add_paragraph(
        "Guía de uso, interpretación y pruebas reproducibles",
        style="SolarFit Cover Subtitle",
    )
    paragraph.paragraph_format.space_after = Pt(28)
    paragraph = doc.add_paragraph(
        "Cómo usar el MVP sin confundir una estimación académica\ncon un diseño técnico o una medición de campo",
        style="SolarFit Lead",
    )
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_after = Pt(42)

    for text, size, color, bold in (
        ("Cálculo Diferencial · Proyecto integrador CAP+IA", 11.5, sf.TEAL, True),
        ("Fundación Universidad de Bogotá Jorge Tadeo Lozano", 11, sf.INK, False),
        ("Periodo académico: 2026-2S", 10.5, sf.MUTED, False),
        ("Aplicación: solarfit-hogar.vercel.app", 10.5, sf.BLUE, True),
    ):
        paragraph = doc.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        paragraph.paragraph_format.space_after = Pt(4)
        sf.set_run_font(paragraph.add_run(text), size=size, color=color, bold=bold)

    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(26)
    sf.set_run_font(
        paragraph.add_run("Versión corregida después de la retroalimentación docente · 7 de septiembre de 2026"),
        size=9.5,
        color=sf.MUTED,
        italic=True,
    )


def build_document() -> Document:
    cases = load_cases()
    doc = Document()
    sf.configure_styles(doc)
    sf.configure_cover_section(doc.sections[0])
    doc.core_properties.title = "SolarFit Hogar - Guía de uso y pruebas"
    doc.core_properties.subject = "Manual de uso del MVP y protocolo de prueba"
    doc.core_properties.author = "Equipo SolarFit Hogar"
    doc.core_properties.keywords = "SolarFit, guía, pruebas, cálculo diferencial, PVGIS, PVWatts"

    bullet_id = sf.add_numbering_definition(doc, ordered=False)
    step_id = sf.add_numbering_definition(doc, ordered=True)
    own_case_id = sf.add_numbering_definition(doc, ordered=True)
    test_id = sf.add_numbering_definition(doc, ordered=True)

    add_cover(doc)
    section = doc.add_section(WD_SECTION.NEW_PAGE)
    section.header.is_linked_to_previous = False
    section.footer.is_linked_to_previous = False
    sf.configure_content_section(section)

    sf.add_section_title(doc, "Antes de empezar")
    sf.add_callout(
        doc,
        "Propósito",
        "Esta guía permite que cualquier integrante reproduzca el caso calibrado, cree un caso propio, interprete el resultado y documente una prueba. SolarFit Hogar es una herramienta de prefactibilidad energética: no reemplaza visita técnica, estudio estructural, diseño eléctrico, análisis de sombras, cotización ni trámite de conexión.",
        fill=sf.PALE_GOLD,
        accent=sf.GOLD,
    )
    sf.add_table(
        doc,
        ["Pregunta", "Respuesta breve"],
        [
            ("¿Qué es?", "Un MVP web que estima paneles, generación, cobertura y uso preliminar del techo."),
            ("¿Para qué sirve?", "Para explorar si una vivienda podría compensar una meta de consumo y explicar qué variables cambian la decisión."),
            ("¿Quién lo usa?", "El equipo académico y, con datos propios, una persona que quiera una primera estimación."),
            ("¿Cuándo se usa?", "Antes de solicitar un diseño profesional o al comparar escenarios de consumo, panel y recurso solar."),
            ("¿Dónde se usa?", APP_URL),
            ("¿Cómo funciona?", "Combina consumo, rendimiento solar, potencia del panel y techo; conserva el valor continuo y luego redondea."),
        ],
        [1900, 7460],
    )
    sf.add_para(
        doc,
        "Necesita conexión a internet para consultar PVGIS y PVWatts. La interfaz puede conservar el proyecto en el navegador, pero el equipo debe exportar los archivos importantes: el almacenamiento local no sustituye una copia de evidencia.",
    )

    sf.add_section_title(doc, "1. Recorrido rápido con el caso calibrado", page_break=True)
    sf.add_para(
        doc,
        "El caso inicial usa 156 kWh mensuales, valor promedio SUI 2018 para poblaciones del SIN ubicadas por encima de 1.500 m s. n. m. según UPME/CORPOEMA. Es un escenario simulado de referencia y no una vivienda ni una factura observada en Bogotá. La serie solar archivada sí procede de PVGIS y el panel LONGi corresponde a una ficha oficial.",
    )
    for text in (
        f"Abra {APP_URL} en un navegador actualizado.",
        "Pulse «Cargar caso calibrado». Si ya hay datos guardados, confirme que el nombre del proyecto menciona Bogotá y piso frío.",
        "En Datos revise los doce consumos, la ubicación de referencia, el techo útil, el panel de 450 W y la procedencia de cada dato.",
        "En Modelo confirme: fuente «PVGIS», meta de cobertura 100 %, estrategia de balance anual, inclinación 10°, azimut 180° y pérdidas PVGIS 14 %.",
        "Pulse «Consultar PVGIS 5.3» si desea refrescar el recurso solar. Anote la fecha; una respuesta futura puede variar si el proveedor actualiza su base.",
        "Abra Resultados. Para la evidencia archivada de esta guía debe observar una necesidad continua cercana a 3,30, una recomendación de 4 paneles y una cobertura anual construible cercana a 121,22 %.",
        "Pulse «Contrastar con PVWatts». Compruebe si el segundo modelo mantiene la decisión de 4 paneles y observe la diferencia de rendimiento, sin llamarla error real.",
        "Use «Comparar inclinaciones» para contrastar los ángulos evaluados. El resultado es el mejor escenario de la lista consultada, no un máximo continuo demostrado con derivadas.",
        "Exporte el proyecto y, si corresponde a una entrega, la evidencia o el resumen. Conserve archivos, fecha y fuentes.",
    ):
        sf.add_step(doc, text, step_id)
    sf.add_callout(
        doc,
        "Resultado esperado",
        "Bogotá: demanda anual 1.872 kWh; rendimiento PVGIS 1.260,65 kWh/kWp·año; 4 paneles; 1,80 kWp; techo viable; producción PVGIS 2.269,17 kWh/año. Las cifras son resultados de modelo, no producción medida.",
    )

    sf.add_section_title(doc, "2. Crear y documentar un caso propio", page_break=True)
    sf.add_para(
        doc,
        "Pulse «Crear caso propio». El sistema limpia los valores del caso simulado calibrado para evitar que un dato heredado se confunda con evidencia. Complete cada campo con una fuente o márquelo expresamente como supuesto.",
    )
    for text in (
        "Reúna doce facturas consecutivas y registre kWh y días facturados. Si no existen, use un promedio oficial pertinente sin agregar estacionalidad inventada, o construya un inventario de equipos, potencias y horas de uso.",
        "Registre solo una ubicación general o coordenada de referencia; no publique una dirección residencial exacta.",
        "Mida o estime el área realmente utilizable del techo. Descuente obstáculos, retiros, sombras y zonas inseguras. Identifique si es medición o supuesto.",
        "Elija un panel con ficha oficial. Copie potencia, ancho y alto; no use valores genéricos si pretende sustentar un resultado concreto.",
        "Use PVGIS para obtener el rendimiento específico mensual con los parámetros visibles. No aplique otra vez el factor de pérdidas si la serie ya es energía AC neta.",
        "Seleccione balance anual para compensación energética anual o criterio conservador si la exigencia es cubrir cada mes. Explique la elección.",
        "Revise advertencias, techo, mes crítico y cobertura. Si el techo no admite la recomendación, reporte la inviabilidad; no reduzca silenciosamente la meta.",
        "Exporte el proyecto y anote responsable, fecha, fuente y cualquier transformación aplicada a los datos.",
    ):
        sf.add_step(doc, text, own_case_id)
    sf.add_table(
        doc,
        ["Dato", "Fuente preferida", "Si no existe"],
        [
            ("Consumo mensual", "12 facturas anonimizadas", "Promedio oficial pertinente o inventario de cargas documentado"),
            ("Recurso solar", "PVGIS con respuesta y fecha", "Otra fuente oficial con unidad y periodo equivalentes"),
            ("Panel", "Ficha técnica del fabricante", "No emitir recomendación definitiva"),
            ("Techo útil", "Medición y croquis", "Supuesto explícito para una prueba, nunca presentado como medición"),
        ],
        [1900, 3450, 4010],
    )

    sf.add_section_title(doc, "3. Cómo funciona el cálculo esencial", page_break=True)
    sf.add_para(
        doc,
        "En balance anual, D es el consumo anual, Y el rendimiento específico anual, P la potencia de un panel en kWp y q la meta de cobertura en forma decimal. El sistema calcula primero una cantidad continua de paneles:",
    )
    sf.add_equation(doc, "n(Y) = qD / (P·Y)")
    sf.add_para(
        doc,
        "La única derivada utilizada en la interpretación académica mide el cambio local de esa necesidad continua cuando cambia el rendimiento solar:",
    )
    sf.add_equation(doc, "n′(Y) = −qD / (P·Y²) < 0")
    sf.add_para(
        doc,
        "El signo negativo significa que un mayor rendimiento solar reduce la necesidad continua. Por ejemplo, en el caso Bogotá, alrededor de Y = 1.260,65 kWh/kWp·año, aumentar Y en 100 kWh/kWp·año reduce n aproximadamente 0,26 panel antes del redondeo. El efecto práctico solo cambia la cantidad física cuando n cruza un entero.",
    )
    sf.add_equation(doc, "N = ⌈n(Y)⌉", note="El redondeo hacia arriba se aplica una sola vez, al final.")
    sf.add_para(
        doc,
        "La producción anual construible se obtiene con la cantidad de paneles que admite el techo. Si el techo admite menos paneles que la recomendación energética, la aplicación muestra ambas cantidades y calcula la cobertura alcanzable; esa diferencia es un resultado, no un error del sistema.",
    )
    sf.add_callout(
        doc,
        "Decisión docente aplicada",
        "No se agregan otros contenidos del curso solo para ampliar el cálculo. La inclinación se trata como comparación discreta porque su resultado sí ayuda a elegir entre configuraciones consultadas.",
    )

    sf.add_section_title(doc, "4. Qué significa cada resultado", page_break=True)
    sf.add_table(
        doc,
        ["Resultado", "Interpretación correcta", "Error que debe evitarse"],
        [
            ("n continuo", "Necesidad matemática antes del redondeo; permite sensibilidad.", "Presentarlo como panel físicamente instalable."),
            ("Paneles recomendados", "Entero mínimo para la meta según el modelo.", "Tomarlo como diseño técnico certificado."),
            ("Paneles construibles", "Máximo preliminar según área útil y factor de instalación.", "Asumir que verifica estructura, sombras o normativa."),
            ("Cobertura", "Relación entre energía modelada y consumo declarado.", "Confundirla con ahorro monetario o autoconsumo instantáneo."),
            ("Mes crítico", "Mes con menor cobertura o mayor exigencia del criterio.", "Afirmar que habrá corte de servicio."),
            ("Contraste", "Diferencia entre dos modelos oficiales bajo capacidad comparable.", "Llamarlo precisión o error frente a una medición real."),
            ("Incertidumbre", "Rango de sensibilidad ante el porcentaje declarado.", "Interpretarlo como intervalo estadístico certificado."),
        ],
        [1900, 3710, 3750],
        font_size=8.8,
    )

    sf.add_section_title(doc, "5. Cinco casos reproducibles", page_break=True)
    rows = []
    for case in cases:
        pvgis = case["results"]["pvgis"]
        pvwatts = case["results"]["pvwatts"]
        validation = case["validation"]
        rows.append(
            (
                case["fixture"]["title"].split(" — ")[0],
                fmt(pvgis["totalConsumptionKwh"], 1),
                fmt(sum(m["specificYieldKwhPerKwp"] for m in case["evaluatedInputs"]["pvgis"]["months"]), 2),
                fmt(sum(m["specificYieldKwhPerKwp"] for m in case["evaluatedInputs"]["pvwatts"]["months"]), 2),
                str(pvgis["recommendedPanelCount"]),
                str(pvgis["buildablePanelCount"]),
                "Sí" if pvgis["roofFeasible"] else "No",
                f"{fmt(pvgis['buildableAnnualCoveragePct'], 2)} %",
                "igual"
                if validation["recommendationDifference"]["roundedPanels"] == 0
                else f"cambia {abs(validation['recommendationDifference']['roundedPanels'])}",
            )
        )
    sf.add_table(
        doc,
        ["Caso", "D", "Y PVGIS", "Y PVWatts", "N", "Máx. por área", "Viable", "Cobertura", "Decisión"],
        rows,
        [1400, 850, 1100, 1100, 600, 700, 750, 1200, 1660],
        font_size=7.9,
    )
    sf.add_table_source(
        doc,
        "D en kWh/año; Y en kWh/kWp·año. Consumos calibrados con promedios SUI 2018 publicados por UPME/CORPOEMA; recurso solar consultado en PVGIS y PVWatts. Áreas de techo: supuestos explícitos de prueba. Evidencia regenerada el 07/09/2026.",
    )
    sf.add_para(
        doc,
        "Bogotá, Barranquilla, Medellín y Cali conservan la misma decisión entera con ambos modelos solares. Quibdó es deliberadamente restrictivo: PVGIS recomienda cuatro paneles, el techo supuesto admite tres y la cobertura construible baja a 85,06 %. Al contrastar exactamente esos mismos tres paneles, PVWatts estima 107,19 %. Esta diferencia muestra incertidumbre intermodelo y justifica no prometer resultados físicos.",
    )

    sf.add_section_title(doc, "6. Protocolo de prueba del equipo", page_break=True)
    for text in (
        "Abra la aplicación en una ventana privada y confirme que carga sin errores visibles.",
        "Cargue el caso calibrado y compare los resultados de Bogotá con la tabla de esta guía.",
        "Compare las dos estrategias. Con balance anual / criterio conservador, verifique estas decisiones: Bogotá 4 / 5; Barranquilla 5 / 6; Medellín 4 / 4; Cali 4 / 5; Quibdó 4 / 5. Explique que el criterio conservador busca cumplir la meta en cada mes.",
        "Cambie únicamente el consumo mensual a 200 kWh. Verifique que n y la recomendación no disminuyan.",
        "Restaure el caso; aumente el rendimiento solar o vuelva a consultar un escenario más productivo. Verifique que n no aumente, coherente con n′(Y) < 0.",
        "Reduzca el techo a un valor que admita menos paneles. Confirme que se distinguen recomendación y cantidad construible, y que la cobertura se recalcula con esta última.",
        "Ejecute el contraste PVWatts. Compruebe que ambos proveedores se comparan con la misma capacidad construible.",
        "Exporte el proyecto, vuelva a importarlo y confirme que los datos principales permanecen.",
        "Registre navegador, fecha, pasos, resultado observado, evidencia y responsable. Si falla, copie el mensaje exacto y no lo reemplace por un resultado inventado.",
    ):
        sf.add_step(doc, text, test_id)
    sf.add_table(
        doc,
        ["Prueba", "Resultado esperado", "Cumple / evidencia"],
        [
            ("Carga inicial", "Etiqueta «Simulación calibrada · no es medición».", "[ ] ____________________"),
            ("Bogotá", "4 paneles; techo viable; cobertura ≈ 121,22 %.", "[ ] ____________________"),
            ("Estrategia", "Anual / conservador: Bogotá 4/5; Barranquilla 5/6; Medellín 4/4; Cali 4/5; Quibdó 4/5.", "[ ] ____________________"),
            ("Monotonía en D", "Al aumentar consumo, n no disminuye.", "[ ] ____________________"),
            ("Monotonía en Y", "Al aumentar rendimiento, n no aumenta.", "[ ] ____________________"),
            ("Techo restringido", "Se muestra inviabilidad y cobertura construible.", "[ ] ____________________"),
            ("Contraste", "PVGIS y PVWatts usan igual capacidad física.", "[ ] ____________________"),
            ("Exportar/importar", "Se recuperan entradas y procedencia.", "[ ] ____________________"),
        ],
        [1900, 4300, 3160],
        font_size=8.8,
    )

    sf.add_section_title(doc, "7. Cómo sustentar el proyecto", page_break=True)
    sf.add_para(doc, "Una explicación breve y defendible puede seguir este orden:")
    for text in (
        "Problema: una vivienda no sabe cuántos paneles necesita ni si el techo preliminarmente alcanza.",
        "Entradas: consumo, rendimiento solar, potencia y dimensiones del panel, meta y área útil.",
        "Modelo: n(Y)=qD/(P·Y), seguido de N=⌈n⌉ y comprobación del techo.",
        "Cálculo diferencial: n′(Y)<0 cuantifica el impacto local del recurso solar en la necesidad continua.",
        "Evidencia: cinco simulaciones calibradas; consumo respaldado por promedios oficiales, recurso solar de dos modelos oficiales y supuestos declarados.",
        "Resultado: cuatro techos viables y un caso que muestra correctamente una restricción física.",
        "Límite: el contraste de modelos demuestra consistencia comparativa, no exactitud frente a una instalación medida.",
    ):
        sf.add_bullet(doc, text, bullet_id)
    sf.add_callout(
        doc,
        "Frase recomendada",
        "«SolarFit estima una prefactibilidad con datos y supuestos trazables; la recomendación debe confirmarse mediante visita técnica antes de comprar o instalar equipos».",
    )

    sf.add_section_title(doc, "8. Fuentes y trazabilidad", page_break=True)
    references = [
        "UPME/CORPOEMA. (2019). Estimación de los consumos de subsistencia en energía eléctrica, gas natural y GLP en territorio nacional SIN y ZNI: informe final. https://bdigital.upme.gov.co/handle/001/1367",
        "European Commission, Joint Research Centre. Photovoltaic Geographical Information System (PVGIS), versión 5.3. https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en",
        "National Laboratory of the Rockies. PVWatts Calculator y API V8. https://developer.nlr.gov/docs/solar/pvwatts/v8/",
        "LONGi Solar. Hi-MO X6 LR5-54HTH-445–455M, ficha técnica oficial. https://static.longi.com/Hi_MO_X6_LR_5_54_HTH_445_455_M_V1_30_30_and_15_V19_ES_09bf28ff6d.pdf",
        "Repositorio del proyecto SolarFit Hogar. Evidencia reproducible: cases/evidence/latest; documentación matemática: docs/mathematical-model.md.",
    ]
    for reference in references:
        sf.add_bullet(doc, reference, bullet_id)
    sf.add_callout(
        doc,
        "Qué debe conservar el grupo",
        "Facturas o regla de simulación; URL y fecha de cada fuente; parámetros de consulta; versión del escenario; archivos exportados; capturas necesarias; resultados observados; limitaciones y decisiones humanas.",
    )
    sf.add_editable(doc, "añadir nombres y códigos de los integrantes, distribución real de pruebas y fecha definitiva de la sustentación.")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUTPUT)
    return doc


if __name__ == "__main__":
    document = build_document()
    print(f"Guía creada: {OUTPUT}")
    print(f"Secciones: {len(document.sections)} | Párrafos: {len(document.paragraphs)}")
