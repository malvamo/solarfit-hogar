from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt

import build_final_report as sf


PROJECT_ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = PROJECT_ROOT.parents[2]
OUTPUT_DIR = WORKSPACE / "Entregables" / "CalculoDiferencial"
ASSET_DIR = PROJECT_ROOT / "docs" / "assets" / "semester-deliverables"
HITO2_OUTPUT = OUTPUT_DIR / "Hito_2_SolarFit_Hogar_Semana_10.docx"
FINAL_OUTPUT = OUTPUT_DIR / "Proyecto_Final_SolarFit_Hogar_Hito_3.docx"


CASES = [
    {
        "id": "SIM-BOG-001",
        "city": "Bogotá",
        "context": "Hogar de referencia nacional",
        "coords": "4,705583; −74,150667",
        "roof": 20,
        "consumption": [157] * 12,
        "pvgis": 1260.65,
        "pvwatts": 1271.06,
        "n_cont": 3.321,
        "panels": 4,
        "conservative_panels": 5,
        "buildable": 4,
        "max_roof": 9,
        "kwp": 1.80,
        "production": 2269.17,
        "coverage": 120.44,
        "min_coverage": 97.54,
        "mape": 4.65,
        "annual_diff": -0.82,
        "critical": "junio",
        "rule": "157 kWh/mes: referencia histórica de hogar promedio nacional UPME (base 2015).",
    },
    {
        "id": "SIM-BAQ-002",
        "city": "Barranquilla",
        "context": "Vivienda cálida con aire acondicionado",
        "coords": "11,040000; −74,820833",
        "roof": 35,
        "consumption": [350, 360, 380, 400, 420, 440, 450, 445, 430, 400, 370, 355],
        "pvgis": 1567.18,
        "pvwatts": 1643.33,
        "n_cont": 6.806,
        "panels": 7,
        "conservative_panels": 9,
        "buildable": 7,
        "max_roof": 16,
        "kwp": 3.15,
        "production": 4936.62,
        "coverage": 102.85,
        "min_coverage": 84.01,
        "mape": 4.74,
        "annual_diff": -4.63,
        "critical": "junio",
        "rule": "Perfil sintético de 4.800 kWh/año; promedio 400 kWh/mes = 2,31× el umbral cálido de 173 kWh/mes.",
    },
    {
        "id": "SIM-MDE-003",
        "city": "Medellín",
        "context": "Hogar eficiente de clima templado",
        "coords": "6,220611; −75,588972",
        "roof": 14,
        "consumption": [130, 128, 129, 128, 127, 126, 128, 130, 132, 131, 134, 137],
        "pvgis": 1387.55,
        "pvwatts": 1369.68,
        "n_cont": 2.498,
        "panels": 3,
        "conservative_panels": 4,
        "buildable": 3,
        "max_roof": 6,
        "kwp": 1.35,
        "production": 1873.19,
        "coverage": 120.077,
        "min_coverage": 99.75,
        "mape": 4.43,
        "annual_diff": 1.31,
        "critical": "noviembre",
        "rule": "Perfil de 1.560 kWh/año, calibrado alrededor del umbral de subsistencia de 130 kWh/mes para ≥1.000 m.",
    },
    {
        "id": "SIM-CLO-004",
        "city": "Cali",
        "context": "Hogar con teletrabajo y consumo medio-alto",
        "coords": "3,454500; −76,499722",
        "roof": 18,
        "consumption": [230, 228, 232, 238, 242, 245, 250, 252, 248, 244, 240, 231],
        "pvgis": 1235.27,
        "pvwatts": 1422.18,
        "n_cont": 5.181,
        "panels": 6,
        "conservative_panels": 7,
        "buildable": 6,
        "max_roof": 8,
        "kwp": 2.70,
        "production": 3335.23,
        "coverage": 115.808,
        "min_coverage": 99.06,
        "mape": 13.17,
        "annual_diff": -13.14,
        "critical": "junio",
        "rule": "Perfil sintético de 2.880 kWh/año para mayor permanencia, equipos y teletrabajo; no es promedio municipal.",
    },
    {
        "id": "SIM-UIB-005",
        "city": "Quibdó",
        "context": "Bajo recurso solar y techo insuficiente",
        "coords": "5,690556; −76,643778",
        "roof": 8,
        "consumption": [208, 210, 213, 216, 223, 228, 233, 236, 228, 223, 213, 209],
        "pvgis": 898.28,
        "pvwatts": 1131.87,
        "n_cont": 6.531,
        "panels": 7,
        "conservative_panels": 8,
        "buildable": 3,
        "max_roof": 3,
        "kwp": 3.15,
        "production": 1212.68,
        "coverage": 45.935,
        "min_coverage": 38.58,
        "mape": 20.386,
        "annual_diff": -20.64,
        "critical": "junio",
        "rule": "Perfil sintético de 2.640 kWh/año; promedio 220 kWh/mes = 1,27× el umbral cálido. Techo pequeño deliberado.",
    },
]


REFERENCES = [
    ("[1]", "Rúbrica general de proyectos CAP+IA de Cálculo Diferencial, momentos 1–3, archivos oficiales del curso."),
    ("[2]", "Rúbrica de la tercera entrega, semana 14: documento acumulativo, póster y pitch de 3 minutos, archivos oficiales del curso."),
    ("[3]", "JRC, ‘PVGIS 5.3 API non-interactive service’. https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/api-non-interactive-service_en"),
    ("[4]", "NLR, ‘PVWatts V8 API’. https://developer.nlr.gov/docs/solar/pvwatts/v8/"),
    ("[5]", "UPME, ‘Balance de Energía Útil — sector residencial’. https://www1.upme.gov.co/DemandayEficiencia/Documents/Balance_energia_util/BEU-Residencial.pdf"),
    ("[6]", "UPME, Resolución 355 de 2004: consumos de subsistencia de 130 y 173 kWh/mes. https://gestornormativo.creg.gov.co/gestor/entorno/docs/resolucion_upme_0355_2004.htm"),
    ("[7]", "IDEAM, ‘Promedios climatológicos de radiación global’, actualización 2025. https://www.ideam.gov.co/sala-de-prensa/informes/publicacion-dom-04052025-1200"),
    ("[8]", "LONGi, ficha oficial LR5-54HTH-445–455M. https://static.longi.com/Hi_MO_X6_LR_5_54_HTH_445_455_M_V1_30_30_and_15_V19_ES_09bf28ff6d.pdf"),
    ("[9]", "CREG, Resolución 174 de 2021, versión consolidada. https://gestornormativo.creg.gov.co/gestor/entorno/docs/resolucion_creg_0174_2021.htm"),
    ("[10]", "MinEnergía, portal oficial RETIE. https://www.minenergia.gov.co/es/misional/energia-electrica-2/reglamentos-tecnicos/reglamento-t%C3%A9cnico-de-instalaciones-el%C3%A9ctricas-retie/"),
]


def annual_consumption(case: dict) -> int:
    return int(sum(case["consumption"]))


def _font(size: int, *, bold: bool = False):
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def build_yield_chart(path: Path) -> None:
    width, height = 1800, 980
    img = Image.new("RGB", (width, height), "#F7F5EF")
    draw = ImageDraw.Draw(img)
    title = _font(58, bold=True)
    label = _font(34)
    small = _font(26)
    bold_small = _font(28, bold=True)
    draw.text((90, 55), "PVGIS y PVWatts no siempre coinciden", fill="#123F42", font=title)
    draw.text((90, 130), "Rendimiento específico anual · kWh/kWp·año · misma ubicación y supuestos", fill="#52666A", font=small)
    left, top, right, bottom = 150, 245, 1700, 805
    max_value = 1800
    for tick in range(0, max_value + 1, 300):
        y = bottom - (tick / max_value) * (bottom - top)
        draw.line((left, y, right, y), fill="#CBD7D4", width=2)
        draw.text((45, y - 17), f"{tick}", fill="#52666A", font=small)
    group_w = (right - left) / len(CASES)
    bar_w = 74
    for index, case in enumerate(CASES):
        center = left + group_w * (index + 0.5)
        values = [(case["pvgis"], "#1E7B78"), (case["pvwatts"], "#F4B63D")]
        for j, (value, color) in enumerate(values):
            x1 = center + (-bar_w - 8 if j == 0 else 8)
            y1 = bottom - value / max_value * (bottom - top)
            draw.rounded_rectangle((x1, y1, x1 + bar_w, bottom), radius=12, fill=color)
        draw.text((center - 75, bottom + 28), case["city"], fill="#123F42", font=bold_small)
        draw.text((center - 64, bottom + 70), f"{case['annual_diff']:+.1f}%", fill="#B3483D" if abs(case["annual_diff"]) >= 10 else "#52666A", font=small)
    draw.rounded_rectangle((1250, 65, 1300, 110), radius=8, fill="#1E7B78")
    draw.text((1315, 70), "PVGIS 5.3", fill="#123F42", font=small)
    draw.rounded_rectangle((1510, 65, 1560, 110), radius=8, fill="#F4B63D")
    draw.text((1575, 70), "PVWatts V8", fill="#123F42", font=small)
    draw.text((90, 905), "La cifra inferior es la diferencia anual PVGIS respecto de PVWatts. Cali y Quibdó exigen cautela.", fill="#52666A", font=label)
    img.save(path, quality=95)


def build_coverage_chart(path: Path) -> None:
    width, height = 1800, 980
    img = Image.new("RGB", (width, height), "#F7F5EF")
    draw = ImageDraw.Draw(img)
    title = _font(58, bold=True)
    small = _font(28)
    bold_small = _font(30, bold=True)
    draw.text((90, 55), "Cuatro casos cumplen; Quibdó revela la restricción", fill="#123F42", font=title)
    draw.text((90, 132), "Cobertura anual calculada con la cantidad construible por área", fill="#52666A", font=small)
    left, top, right, bottom = 170, 245, 1700, 800
    max_value = 140
    target_y = bottom - 100 / max_value * (bottom - top)
    draw.line((left, target_y, right, target_y), fill="#B3483D", width=5)
    draw.text((left + 8, target_y - 42), "meta 100 %", fill="#B3483D", font=small)
    group_w = (right - left) / len(CASES)
    bar_w = 150
    for index, case in enumerate(CASES):
        center = left + group_w * (index + 0.5)
        value = case["coverage"]
        y1 = bottom - value / max_value * (bottom - top)
        color = "#1E7B78" if value >= 100 else "#D86D59"
        draw.rounded_rectangle((center - bar_w / 2, y1, center + bar_w / 2, bottom), radius=18, fill=color)
        draw.text((center - 58, y1 - 45), f"{value:.1f}%", fill="#123F42", font=bold_small)
        draw.text((center - 75, bottom + 28), case["city"], fill="#123F42", font=bold_small)
        draw.text((center - 65, bottom + 72), f"{case['buildable']}/{case['panels']} paneles", fill="#52666A", font=small)
    draw.text((90, 905), "Paneles usados/requeridos. El modelo conserva 7 requeridos en Quibdó y advierte que solo caben 3.", fill="#52666A", font=small)
    img.save(path, quality=95)


def add_figure(doc: Document, image_path: Path, caption: str, alt_text: str) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next = True
    shape = p.add_run().add_picture(str(image_path), width=Inches(6.25))
    shape._inline.docPr.set("descr", alt_text)
    c = doc.add_paragraph(caption, style="Caption")
    c.paragraph_format.keep_with_next = False


def new_document(title: str, subtitle: str, label: str) -> Document:
    doc = Document()
    sf.configure_styles(doc)
    doc.settings.odd_and_even_pages_header_footer = False
    sf.configure_cover_section(doc.sections[0])
    doc.core_properties.title = title
    doc.core_properties.subject = "Proyecto integrador CAP+IA de Cálculo Diferencial"
    doc.core_properties.author = "Equipo SolarFit Hogar"
    doc.core_properties.keywords = "cálculo diferencial, energía solar, simulación, PVGIS, PVWatts, CAP+IA"
    for _ in range(4):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(11)
    p = doc.add_paragraph("PROYECTO INTEGRADOR CAP+IA", style="SolarFit Kicker")
    p.paragraph_format.space_after = Pt(16)
    p = doc.add_paragraph("SolarFit Hogar", style="SolarFit Cover Title")
    p.paragraph_format.space_after = Pt(8)
    p = doc.add_paragraph(subtitle, style="SolarFit Cover Subtitle")
    p.paragraph_format.space_after = Pt(18)
    p = doc.add_paragraph(label, style="SolarFit Kicker")
    p.paragraph_format.space_after = Pt(42)
    for text, size, color, bold in (
        ("Cálculo Diferencial · Código 502116 · Grupo 12", 11.5, sf.TEAL, True),
        ("Fundación Universidad de Bogotá Jorge Tadeo Lozano", 11, sf.INK, False),
        ("Docente: Orlando Aya Corredor", 10.5, sf.MUTED, False),
        ("Periodo académico: 2026-2S", 10.5, sf.MUTED, False),
    ):
        paragraph = doc.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        paragraph.paragraph_format.space_after = Pt(3)
        sf.set_run_font(paragraph.add_run(text), size=size, color=color, bold=bold)
    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(24)
    sf.set_run_font(paragraph.add_run("Integrantes y códigos: [COMPLETAR ANTES DE ENTREGAR]"), size=10.5, color=sf.RED, bold=True)
    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(14)
    sf.set_run_font(paragraph.add_run("Versión académica: 21 de agosto de 2026"), size=9.5, color=sf.MUTED, italic=True)
    content = doc.add_section(WD_SECTION.NEW_PAGE)
    content.header.is_linked_to_previous = False
    content.footer.is_linked_to_previous = False
    sf.configure_content_section(content)
    return doc


def add_case_summary_table(doc: Document, *, include_conservative: bool = False) -> None:
    headers = ["Caso", "Demanda anual", "PVGIS", "Paneles", "Cobertura / estado"]
    rows = []
    for case in CASES:
        panels = f"{case['panels']} anual"
        if include_conservative:
            panels += f" · {case['conservative_panels']} conserv."
        state = f"{case['coverage']:.2f} %"
        if case["buildable"] < case["panels"]:
            state += f" · REVISAR ({case['buildable']} caben)"
        rows.append((
            f"{case['id']}\n{case['city']}",
            f"{annual_consumption(case):,.0f} kWh".replace(",", "."),
            f"{case['pvgis']:,.2f} kWh/kWp·año".replace(",", "X").replace(".", ",").replace("X", "."),
            panels,
            state.replace(".", ","),
        ))
    sf.add_table(doc, headers, rows, [1900, 1500, 2100, 1700, 2160], font_size=8.7)


def add_references(doc: Document) -> None:
    for key, value in REFERENCES:
        sf.add_para(doc, f"{key} {value}", align=WD_ALIGN_PARAGRAPH.LEFT, after=4)


def add_identity_and_ai(doc: Document) -> None:
    sf.add_section_title(doc, "Declaración de IA y contribuciones", page_break=True)
    sf.add_callout(
        doc,
        "Uso de IA",
        "ChatGPT/Codex se utilizó para analizar requisitos, investigar fuentes oficiales, estructurar el modelo, programar y probar el MVP, ejecutar los escenarios, calcular comparaciones, redactar y diseñar borradores. El grupo conserva la responsabilidad de verificar cifras, revisar fuentes, comprender el modelo y defender oralmente el trabajo.",
        fill=sf.PALE_GOLD,
        accent=sf.GOLD,
    )
    sf.add_editable(doc, "escribir nombres, códigos y aporte real verificable de cada integrante; no asignar aportes ficticios ni idénticos si no ocurrieron.")
    sf.add_table(
        doc,
        ["Integrante", "Aporte real", "Evidencia / revisión"],
        [
            ("[Nombre 1]", "[Completar]", "[Archivo, prueba o sección revisada]"),
            ("[Nombre 2]", "[Completar]", "[Archivo, prueba o sección revisada]"),
            ("[Nombre 3]", "[Completar]", "[Archivo, prueba o sección revisada]"),
            ("[Nombre 4, si aplica]", "[Completar]", "[Archivo, prueba o sección revisada]"),
        ],
        [1900, 3800, 3660],
        font_size=9.0,
    )


def finalize_doc(doc: Document) -> None:
    for paragraph in doc.paragraphs:
        if paragraph.style.name.startswith("Heading"):
            paragraph.paragraph_format.keep_with_next = True
        paragraph.paragraph_format.widow_control = True


def build_hito2() -> Document:
    doc = new_document(
        "SolarFit Hogar - Hito 2",
        "Desarrollo matemático, simulación multicase y revisión del modelo",
        "HITO 2 · INVESTIGACIÓN Y CREACIÓN · SEMANA 10",
    )
    sf.add_section_title(doc, "Ficha de entrega")
    sf.add_callout(
        doc,
        "Estado",
        "Informe de avance cerrado con cinco casos simulados calibrados con fuentes oficiales. Las series de consumo no son facturas ni observaciones de hogares; PVGIS y PVWatts entregan simulaciones solares, no producción medida.",
        fill=sf.PALE_GOLD,
        accent=sf.GOLD,
    )
    sf.add_table(
        doc,
        ["Elemento", "Evidencia incluida", "Estado"],
        [
            ("Desarrollo matemático", "Modelo continuo, derivadas, reglas de derivación y unidades", "Cerrado"),
            ("Resultados intermedios", "Cinco ciudades y dos criterios de dimensionamiento", "Cerrado"),
            ("Visualización / simulación", "Dos gráficas y respuestas oficiales PVGIS/PVWatts", "Cerrado"),
            ("Ajustes del modelo", "Pérdidas sin doble conteo, techo no truncado, comparación externa", "Cerrado"),
            ("Identidad y aportes", "Debe completarlos el grupo", "Pendiente humano"),
        ],
        [2300, 4760, 2300],
        font_size=9.0,
    )

    sf.add_section_title(doc, "1. Evolución desde el Hito 1")
    sf.add_para(doc, "El Hito 1 formuló la pregunta central: cuántos paneles necesita una vivienda para compensar su consumo. El Hito 2 transforma esa pregunta en un modelo ejecutable, distingue potencia de energía, incorpora doce periodos, usa rendimiento solar mensual y separa la recomendación energética de la restricción física del techo.")
    sf.add_table(
        doc,
        ["Versión inicial", "Ajuste realizado", "Razón matemática o técnica"],
        [
            ("Consumo ÷ potencia", "Consumo objetivo ÷ producción específica", "kWh no se divide directamente por kW; se necesita energía por kWp."),
            ("Un promedio solar", "Doce rendimientos mensuales", "Permite reconocer variación y mes limitante."),
            ("PR aplicado siempre", "Modos HSP y PVGIS excluyentes", "PVGIS ya entrega energía con pérdidas configuradas."),
            ("Paneles limitados por techo", "Recomendado y construible separados", "Una restricción no debe ocultar la necesidad matemática."),
            ("Una herramienta", "PVGIS principal + PVWatts contraste", "Dos modelos revelan sensibilidad a bases y algoritmos distintos."),
        ],
        [2400, 2860, 4100],
        font_size=9.0,
    )

    sf.add_section_title(doc, "2. Datos y protocolo de simulación", page_break=True)
    sf.add_para(doc, "Los cinco escenarios son viviendas hipotéticas ubicadas mediante referencias urbanas o estaciones IDEAM. El recurso solar se consultó en servicios oficiales; el área del techo y los perfiles de demanda son supuestos de prueba documentados. Esta combinación permite evaluar el algoritmo sin invadir la privacidad de una familia ni fingir una instalación.")
    sf.add_table(
        doc,
        ["Componente", "Dato confirmado", "Supuesto / transformación", "Impacto"],
        [
            ("Panel", "LONGi LR5-54HTH-450M: 450 Wp; 1,722 × 1,134 m [8]", "Factor de instalación 1,10", "Área reservada: 2,148 m² por panel."),
            ("Demanda", "UPME: 157 kWh/mes histórico [5]; umbrales 130/173 [6]", "Perfiles sintéticos por contexto", "No representan promedios municipales actuales."),
            ("Ubicación", "Referencias IDEAM [7]", "No es dirección de una vivienda", "No modela sombra ni geometría local."),
            ("Producción", "PVGIS 5.3 y PVWatts V8 [3][4]", "10°, sur, 14 % pérdidas", "Contraste intermodelo, no medición."),
            ("Techo", "Ninguna medición física", "8–35 m² útiles según caso", "Prueba lógica de viabilidad preliminar."),
        ],
        [1500, 2940, 2450, 2470],
        font_size=8.7,
    )
    sf.add_para(doc, "Consumos enero–diciembre:", bold_lead="Consumos enero–diciembre:", keep_with_next=True)
    for case in CASES:
        sf.add_para(doc, f"{case['id']} {case['city']}: " + ", ".join(str(v) for v in case["consumption"]) + " kWh. " + case["rule"], align=WD_ALIGN_PARAGRAPH.LEFT, after=4)

    sf.add_section_title(doc, "3. Desarrollo matemático", page_break=True)
    sf.add_para(doc, "Para el modo PVGIS, Yₘ es el rendimiento específico neto del mes m en kWh/kWp. Si P es la potencia de un panel en kWp, q la meta y Cₘ el consumo, entonces:")
    sf.add_equation(doc, "Gₘ = P·Yₘ       y       nₘ* = q·Cₘ / Gₘ")
    sf.add_para(doc, "El criterio anual compensa energía total, mientras el criterio conservador pretende alcanzar la meta en cada mes:")
    sf.add_equation(doc, "n*anual = q·ΣCₘ / (P·ΣYₘ)       n*conservador = máxₘ(q·Cₘ / (P·Yₘ))")
    sf.add_equation(doc, "N = ceil(n*)       Nmáx = floor(Aᵤ /(ancho·alto·fA))")
    sf.add_para(doc, "N se redondea una sola vez al final. Si N > Nmáx, el sistema mantiene N como necesidad energética y calcula por separado Nconstruible = Nmáx.")
    doc.add_paragraph("3.1 Continuidad, límites y tasa de cambio", style="Heading 2")
    sf.add_equation(doc, "n(h) = K/h,  h > 0;     lím h→0⁺ n(h)=+∞;     lím h→∞ n(h)=0")
    sf.add_para(doc, "La función es continua en su dominio físico h>0. Para K constante, la derivada por la regla de la potencia es:")
    sf.add_equation(doc, "n′(h)=−K/h² < 0       n″(h)=2K/h³ > 0")
    sf.add_para(doc, "La primera derivada negativa demuestra que más recurso solar reduce la capacidad continua requerida. La segunda derivada positiva muestra convexidad: la sensibilidad es mayor en zonas con poco recurso.")
    doc.add_paragraph("3.2 Reglas del segundo corte", style="Heading 2")
    sf.add_para(doc, "El cociente anual usa la regla del cociente cuando demanda D(t) y rendimiento Y(t) cambian: n(t)=D(t)/(P·Y(t)).")
    sf.add_equation(doc, "n′(t) = [D′(t)·Y(t) − D(t)·Y′(t)] /(P·Y(t)²)")
    sf.add_para(doc, "La inclinación β introduce una función compuesta n(Y(β)); por regla de la cadena:")
    sf.add_equation(doc, "dn/dβ = −D·Y′(β)/(P·Y(β)²)")
    sf.add_para(doc, "La derivación logarítmica de n = q·D·P⁻¹·Y⁻¹ permite leer elasticidades: un aumento relativo de 1 % en D aumenta n aproximadamente 1 %, mientras un aumento relativo de 1 % en P o Y reduce n aproximadamente 1 %.")

    sf.add_section_title(doc, "4. Representación algorítmica")
    steps = [
        "Validar doce consumos, unidades y parámetros globales.",
        "Consultar PVGIS para 1 kWp y conservar la serie mensual neta y sus metadatos.",
        "Calcular Gₘ y nₘ*; sumar para el criterio anual o tomar el máximo para el conservador.",
        "Redondear n* hacia arriba una sola vez para obtener N.",
        "Calcular Nmáx con el área útil y separar recomendación de cantidad construible.",
        "Simular producción, cobertura y balance de cada mes.",
        "Consultar PVWatts con supuestos comparables y calcular MAE, RMSE, MAPE y sesgo.",
        "Exportar configuración, series, resultados y hashes para reproducibilidad.",
    ]
    for item in steps:
        sf.add_bullet(doc, item, 0)
    sf.add_callout(doc, "Implementación", "El mismo motor TypeScript utilizado por la aplicación web procesa los escenarios; no se usó una calculadora paralela para construir las conclusiones. La versión auditada aprobó 37/37 pruebas automatizadas, ESLint, TypeScript y build productivo el 21 de agosto de 2026.")

    sf.add_section_title(doc, "5. Resultados intermedios de cinco casos", page_break=True)
    add_case_summary_table(doc, include_conservative=True)
    sf.add_table_source(doc, "Fuente: ejecución del MVP el 21 de agosto de 2026. Demanda sintética; producción modelada. La cobertura de Quibdó usa los 3 paneles construibles, no los 7 requeridos.")
    add_figure(doc, ASSET_DIR / "coverage-cases.png", "Figura 1. Cobertura anual con la cantidad construible. Cuatro casos superan la meta anual; Quibdó queda limitado por área.", "Gráfico de barras de cobertura anual para Bogotá, Barranquilla, Medellín, Cali y Quibdó; Quibdó alcanza 45,94 por ciento por la restricción de techo.")
    sf.add_callout(doc, "Lectura principal", "El criterio anual puede dejar meses por debajo de 100 %. Barranquilla obtiene 102,85 % anual, pero su mínimo mensual es 84,01 %; el criterio conservador aumenta de 7 a 9 paneles.")

    sf.add_section_title(doc, "6. Contraste PVGIS–PVWatts", page_break=True)
    sf.add_table(
        doc,
        ["Ciudad", "PVGIS", "PVWatts", "Diferencia anual", "MAPE mensual"],
        [(c["city"], f"{c['pvgis']:.2f}", f"{c['pvwatts']:.2f}", f"{c['annual_diff']:+.2f} %", f"{c['mape']:.2f} %") for c in CASES],
        [1650, 1700, 1700, 2100, 2210],
        font_size=9.1,
    )
    add_figure(doc, ASSET_DIR / "yield-comparison.png", "Figura 2. Rendimiento específico anual calculado por PVGIS y PVWatts bajo una configuración comparable.", "Barras agrupadas que comparan el rendimiento anual de PVGIS y PVWatts en cinco ciudades; las mayores diferencias aparecen en Cali y Quibdó.")
    sf.add_para(doc, "Bogotá, Barranquilla y Medellín conservan la misma decisión entera con ambos proveedores. En Cali, PVGIS recomienda 6 paneles y PVWatts 5; en Quibdó, 7 frente a 6. No se elige automáticamente el valor más favorable: la divergencia se reporta como incertidumbre de modelo.")
    sf.add_callout(doc, "Interpretación correcta", "PVGIS y PVWatts no son verdad de campo. Usan bases meteorológicas y modelos diferentes. Su comparación comprueba orden de magnitud, detecta sensibilidad y evita una confianza falsa en una sola fuente.")

    sf.add_section_title(doc, "7. Importancia académica de las simulaciones")
    for text in (
        "Permiten probar de forma reproducible cinco combinaciones de clima, demanda y área sin fabricar facturas.",
        "Ejercitan casos favorables y uno adverso; el caso de Quibdó demuestra que el software advierte inviabilidad.",
        "Conectan derivadas con una decisión: n′<0, n″>0 y mayor sensibilidad en bajo recurso.",
        "Permiten comparar criterios anual y conservador sin esperar doce meses de una instalación.",
        "Conservan entradas y proveedores para que otro equipo repita la ejecución.",
    ):
        sf.add_bullet(doc, text, 0)
    sf.add_para(doc, "Su límite es igualmente importante: una simulación no valida sombra local, estructura, conexión eléctrica, tarifa ni desempeño medido. La rúbrica permite condiciones simuladas, pero no autoriza llamarlas evidencia empírica.")

    sf.add_section_title(doc, "8. Conclusiones del Hito 2")
    conclusions = [
        "El modelo ya es dimensionalmente coherente y ejecutable con doce periodos.",
        "Las reglas de derivación explican dirección, sensibilidad y convexidad de la necesidad continua.",
        "Cuatro escenarios satisfacen la meta anual con el techo supuesto; uno activa correctamente la advertencia de área.",
        "La validación cruzada descubre divergencias materiales en Cali y Quibdó que deben conservarse como riesgo.",
        "El avance cumple la función del Hito 2: desarrollo matemático, simulación, resultados intermedios y ajustes justificables.",
    ]
    for item in conclusions:
        sf.add_bullet(doc, item, 0)
    add_identity_and_ai(doc)
    sf.add_section_title(doc, "Referencias", page_break=True)
    add_references(doc)
    finalize_doc(doc)
    return doc


def build_final() -> Document:
    doc = new_document(
        "SolarFit Hogar - Informe final acumulativo",
        "Prefactibilidad fotovoltaica residencial explicable y validada con cinco simulaciones",
        "INFORME FINAL ACUMULATIVO · HITOS 1, 2 Y 3 · SEMANA 14",
    )
    sf.add_section_title(doc, "Resumen ejecutivo")
    sf.add_callout(
        doc,
        "Resultado",
        "SolarFit Hogar es un MVP web desplegado que dimensiona paneles por balance anual o criterio conservador, verifica el límite preliminar del techo, explica sensibilidad mediante cálculo diferencial y contrasta PVGIS con PVWatts. Cinco escenarios simulados calibrados muestran cuatro soluciones viables y un caso correctamente rechazado por área.",
    )
    sf.add_para(doc, "El producto responde una pregunta de prefactibilidad: qué potencia y cuántos paneles podrían compensar una meta energética bajo entradas declaradas. No certifica una instalación, no garantiza factura cero y no sustituye el diseño profesional.")
    sf.add_table(
        doc,
        ["Entrega", "Contenido acumulado", "Evidencia"],
        [
            ("Hito 1", "Contexto, pregunta, objetivos, variables y modelo inicial", "Problema y alcance definidos"),
            ("Hito 2", "Derivadas, algoritmo, simulación y ajustes", "Cinco casos + PVGIS/PVWatts"),
            ("Hito 3", "Producto, validación, optimización, reflexión y comunicación", "MVP en Vercel, póster y pitch"),
        ],
        [1700, 4000, 3660],
        font_size=9.2,
    )

    sf.add_section_title(doc, "1. Problema, objetivos y alcance", page_break=True)
    sf.add_para(doc, "Una vivienda no puede dimensionarse dividiendo su consumo por la potencia nominal de un panel. El consumo está en kWh; la potencia, en kWp; y la energía producida cambia con la ubicación, el mes, la inclinación, las pérdidas y el techo disponible. SolarFit integra esas variables y conserva trazabilidad.")
    doc.add_paragraph("1.1 Pregunta", style="Heading 2")
    sf.add_callout(doc, "Pregunta orientadora", "¿Cuántos paneles y qué potencia fotovoltaica nominal necesita una vivienda conectada a red para compensar una fracción de su consumo bajo doce periodos, recurso solar modelado y área útil declarada?")
    doc.add_paragraph("1.2 Objetivo general", style="Heading 2")
    sf.add_para(doc, "Desarrollar y validar un MVP de prefactibilidad que convierta consumos mensuales, recurso solar, características del módulo y área útil en una recomendación explicable de potencia, paneles, cobertura y viabilidad preliminar.")
    doc.add_paragraph("1.3 Objetivos específicos", style="Heading 2")
    for text in (
        "Formular un modelo matemático con variables, unidades, dominio, supuestos y dos criterios de dimensionamiento.",
        "Relacionar límites, continuidad, derivadas, regla del cociente, cadena, diferenciales y optimización con decisiones del proyecto.",
        "Implementar el modelo en una aplicación web con validación, persistencia local y exportaciones.",
        "Evaluar cinco escenarios reproducibles y contrastar la fuente principal con un segundo modelo oficial.",
        "Comunicar resultados, incertidumbre, limitaciones y ruta de escalamiento sin confundir simulación con medición.",
    ):
        sf.add_bullet(doc, text, 0)
    doc.add_paragraph("1.4 Alcance", style="Heading 2")
    sf.add_para(doc, "El sistema estudia compensación energética de una vivienda conectada a red y sin baterías. No modela simultaneidad horaria, autoconsumo, tarifa, excedentes, estructura, sombras cercanas, cableado, inversor específico ni trámite de conexión.")

    sf.add_section_title(doc, "2. Fuentes, datos y supuestos", page_break=True)
    sf.add_table(
        doc,
        ["Entrada", "Fuente", "Tratamiento"],
        [
            ("Consumo", "UPME [5][6]", "Perfiles sintéticos calibrados; nunca facturas reales."),
            ("Radiación de contexto", "IDEAM [7]", "Referencia climática; no se convierte directamente en energía del panel."),
            ("Producción principal", "JRC PVGIS 5.3 [3]", "Serie mensual neta para 1 kWp, inclinación 10°, sur, 14 % pérdidas."),
            ("Contraste", "NLR PVWatts V8 [4]", "Mismos parámetros comparables; base y modelos internos distintos."),
            ("Módulo", "LONGi LR5-54HTH-450M [8]", "450 Wp, 1,722 × 1,134 m; factor de área supuesto 1,10."),
            ("Techo", "Supuesto de escenario", "Área útil escalar; no prueba disposición geométrica ni estructura."),
        ],
        [1700, 2600, 5060],
        font_size=8.8,
    )
    sf.add_callout(doc, "Control de supuestos", "Dato confirmado: especificación del panel y respuestas de APIs. Supuesto: consumo y techo de cada vivienda hipotética. Razón: no se dispone de doce facturas, medición del techo ni un sistema instalado. Impacto: los resultados validan el comportamiento del modelo, no una vivienda real.", fill=sf.PALE_GOLD, accent=sf.GOLD)

    sf.add_section_title(doc, "3. Modelo matemático", page_break=True)
    sf.add_para(doc, "Con Cₘ en kWh, q como meta, P en kWp y Yₘ como rendimiento específico neto en kWh/kWp:")
    sf.add_equation(doc, "Gₘ=P·Yₘ      Tₘ=q·Cₘ      nₘ*=Tₘ/Gₘ")
    sf.add_equation(doc, "n*anual=q·ΣCₘ/(P·ΣYₘ)      n*conservador=máxₘ(q·Cₘ/(P·Yₘ))")
    sf.add_equation(doc, "N=ceil(n*)      Nmáx=floor(Aᵤ/(ancho·alto·fA))      Nconstruible=mín(N,Nmáx)")
    sf.add_para(doc, "En el modo HSP alternativo, Yₘ=hₘ·dₘ·PR. Los modos son excluyentes: si PVGIS ya entrega producción con pérdidas, PR no se aplica otra vez.")
    doc.add_paragraph("3.1 Interpretación diferencial", style="Heading 2")
    sf.add_equation(doc, "n(h)=K/h;   n′(h)=−K/h²;   n″(h)=2K/h³")
    sf.add_para(doc, "n′<0 explica que un mayor recurso reduce la necesidad; n″>0 indica convexidad. La elasticidad es −1: un cambio relativo pequeño de +1 % en el recurso reduce aproximadamente 1 % la necesidad continua antes del redondeo.")
    sf.add_equation(doc, "Δn ≈ n′(h)·Δh")
    sf.add_para(doc, "La aproximación lineal permite construir un intervalo de sensibilidad. El entero N puede permanecer igual aunque n* cambie; por eso se analiza primero la variable continua.")
    doc.add_paragraph("3.2 Optimización de inclinación", style="Heading 2")
    sf.add_equation(doc, "β*=arg máxβ Y(β)      dn/dβ=−D·Y′(β)/(P·Y(β)²)")
    sf.add_para(doc, "El MVP consulta una malla discreta de inclinaciones y aproxima Y′ e Y″ con diferencias finitas. En una prueba de Bogotá, 5° produjo 1.280,17 kWh/kWp·año frente a 1.279,19 a 10°: la ganancia fue apenas 0,077 %, por lo que la optimización debe leerse con precisión razonable y no como certeza geométrica.")

    sf.add_section_title(doc, "4. Producto funcional y arquitectura", page_break=True)
    sf.add_para(doc, "El MVP está desplegado en https://solarfit-hogar.vercel.app y versionado en el repositorio privado malvamo/solarfit-hogar. El frontend recibe los datos; las rutas de servidor consultan proveedores externos sin exponer la clave de PVWatts; el dominio valida y calcula; el navegador conserva un borrador local.")
    sf.add_table(
        doc,
        ["Capa", "Responsabilidad", "Evidencia"],
        [
            ("Interfaz", "Doce consumos, ubicación, panel, techo, meta y estrategia", "Next.js 16 + React 19"),
            ("Dominio", "Unidades, criterios, redondeo, techo, balances y sensibilidad", "TypeScript puro con pruebas"),
            ("PVGIS", "Rendimiento mensual y optimización de inclinación", "API JRC desde backend"),
            ("PVWatts", "Serie AC mensual independiente", "Clave NLR solo en Vercel"),
            ("Evidencia", "JSON/CSV/Markdown por escenario y libro de validación", "Entradas, series, métricas y hash"),
        ],
        [1600, 4020, 3740],
        font_size=9.0,
    )
    sf.add_callout(doc, "Pruebas", "La versión auditada aprobó ESLint, TypeScript, build productivo y 37 pruebas automatizadas. Estas pruebas verifican la implementación; no reemplazan la validación del contexto físico.")

    sf.add_section_title(doc, "5. Protocolo de los cinco casos")
    for case in CASES:
        sf.add_para(doc, f"{case['id']} — {case['city']}. {case['context']}. Coordenada de referencia {case['coords']}; techo útil supuesto {case['roof']} m²; {case['rule']}", align=WD_ALIGN_PARAGRAPH.LEFT, after=4)
    sf.add_para(doc, "Configuración común: panel LONGi de 450 Wp; factor de área 1,10; meta 100 %; criterio anual; 10° de inclinación; azimut brújula 180°; pérdidas 14 %; incertidumbre ±10 %; consulta del 21 de agosto de 2026.")

    sf.add_section_title(doc, "6. Resultados multicase")
    add_case_summary_table(doc, include_conservative=True)
    add_figure(doc, ASSET_DIR / "coverage-cases.png", "Figura 1. Cobertura anual construible en los cinco escenarios simulados.", "Gráfico de cobertura anual que muestra cuatro casos sobre 100 por ciento y Quibdó en 45,94 por ciento.")
    sf.add_para(doc, "El caso negativo de Quibdó es un resultado funcional, no un error. El modelo calcula 6,531 paneles equivalentes, recomienda 7, reconoce que el techo admite 3 y reporta 45,94 % de cobertura construible. No trunca silenciosamente la necesidad.")

    sf.add_section_title(doc, "7. Caso principal: Bogotá")
    bog = CASES[0]
    sf.add_para(doc, "Se selecciona Bogotá como caso principal del póster y el pitch porque utiliza una demanda plana basada en una referencia nacional histórica, facilita la reproducción manual y conserva un margen de techo amplio. No representa el consumo actual de un hogar bogotano.")
    sf.add_table(
        doc,
        ["Magnitud", "Valor", "Cálculo / origen"],
        [
            ("Demanda anual D", "1.884 kWh", "12 × 157 kWh"),
            ("Rendimiento anual Y", "1.260,65 kWh/kWp", "PVGIS 5.3"),
            ("Potencia por panel P", "0,450 kWp", "Ficha LONGi"),
            ("Necesidad continua n*", "3,321", "1.884 /(0,450 × 1.260,65)"),
            ("Recomendación N", "4 paneles", "ceil(3,321)"),
            ("Potencia nominal", "1,80 kWp", "4 × 0,450"),
            ("Producción anual", "2.269,17 kWh", "1,80 × 1.260,65"),
            ("Cobertura anual", "120,44 %", "2.269,17 /1.884"),
            ("Máximo de techo", "9 paneles", "⌊20 /(1,722×1,134×1,10)⌋"),
        ],
        [2600, 2100, 4660],
        font_size=9.2,
    )
    sf.add_callout(doc, "Decisión", "Cuatro paneles compensan la meta anual en el modelo y caben por área. Sin embargo, junio llega a 97,54 % mensual; para garantizar 100 % en todos los meses modelados se requieren 5 paneles. El usuario debe elegir el criterio.")

    sf.add_section_title(doc, "8. Validación cruzada e incertidumbre", page_break=True)
    sf.add_table(
        doc,
        ["Ciudad", "PVGIS", "PVWatts", "Diferencia anual", "Decisión entera"],
        [
            (c["city"], f"{c['pvgis']:.2f}", f"{c['pvwatts']:.2f}", f"{c['annual_diff']:+.2f} %", f"{c['panels']} / " + ("6" if c["city"] == "Quibdó" else "5" if c["city"] == "Cali" else str(c["panels"])))
            for c in CASES
        ],
        [1600, 1500, 1500, 2150, 2610],
        font_size=9.0,
    )
    add_figure(doc, ASSET_DIR / "yield-comparison.png", "Figura 2. Contraste intermodelo del rendimiento específico anual.", "Comparación anual de PVGIS y PVWatts para cinco ubicaciones colombianas.")
    sf.add_para(doc, "Las diferencias absolutas anuales abarcan 0,82 %–20,64 %. Cali y Quibdó superan 10 % y cambian la decisión entera. Esto demuestra por qué un reporte responsable debe conservar proveedor, versión, base meteorológica y rango, en vez de ofrecer un único número como certeza.")
    sf.add_callout(doc, "Sin validación experimental", "No se comparó contra generación medida porque no se dispone de un sistema real comparable. Las cinco ejecuciones validan coherencia matemática, software y robustez entre simuladores; no validan ahorro real ni desempeño del techo.", fill=sf.PALE_GOLD, accent=sf.GOLD)

    sf.add_section_title(doc, "9. Por qué las simulaciones son esenciales")
    sf.add_para(doc, "Una instalación física exige capital, permisos, condiciones seguras y al menos varios meses de medición. Para un curso semestral, la simulación permite explorar inmediatamente condiciones contrastantes, repetir los cálculos y auditar todas las transformaciones. Su importancia no depende de fingir que es realidad; depende de declarar qué valida y qué deja pendiente.")
    sf.add_table(
        doc,
        ["Sí demuestran", "No demuestran"],
        [
            ("Que las ecuaciones producen resultados consistentes", "Que una estructura soporte el sistema"),
            ("Que mayor recurso reduce n* y que la sensibilidad aumenta con bajo recurso", "Que una factura llegue a cero"),
            ("Que el techo inviable se reporta sin ocultar la necesidad", "Que no haya sombras u obstáculos"),
            ("Que dos proveedores pueden cambiar una decisión", "Que un proveedor sea la verdad física"),
            ("Que el proceso es repetible con entradas archivadas", "Que exista disposición a pagar o product–market fit"),
        ],
        [4680, 4680],
        font_size=9.1,
    )

    sf.add_section_title(doc, "10. Conclusiones")
    conclusions = [
        "SolarFit responde la pregunta académica con una potencia continua y una cantidad entera, sin mezclar kW con kWh.",
        "Las derivadas hacen explicable la recomendación: n′<0, n″>0 y Quibdó es el escenario más sensible al recurso.",
        "El balance anual y el criterio conservador resuelven preguntas distintas; el producto no debe ocultar esa decisión.",
        "Cuatro casos satisfacen la meta anual con el área supuesta; Quibdó demuestra la detección correcta de inviabilidad.",
        "PVGIS y PVWatts coinciden en orden de magnitud, pero las diferencias de Cali y Quibdó impiden presentar un único resultado como certeza.",
        "El MVP es una herramienta de prefactibilidad explicable; la fase siguiente debe validar facturas, techos, propuestas profesionales y producción medida.",
    ]
    for item in conclusions:
        sf.add_bullet(doc, item, 0)

    sf.add_section_title(doc, "11. Escalamiento: de MVP a startup", page_break=True)
    sf.add_para(doc, "La siguiente versión no debe limitarse a nuevas pantallas. Debe cerrar el flujo factura → techo → producción → economía → instalador → conexión → monitoreo. La tesis recomendada es B2B2C: prefactibilidad gratuita para hogares y herramientas pagas para instaladores, financiadores o comercializadores.")
    sf.add_table(
        doc,
        ["Fase", "Producto", "Puerta de avance"],
        [
            ("0. Confianza técnica (0–2 meses)", "Carga de facturas, doble modelo, reporte trazable y privacidad", "Cálculos con fuente/versión y cero errores críticos"),
            ("1. Piloto concierge (2–5 meses)", "50–60 hogares + 10–15 instaladores", "Discrepancia mediana ≤1 panel o ≤10 %; ≥25 % pide cotización"),
            ("2. SolarFit v1 B2B2C (5–12 meses)", "OCR, techo, tarifa, economía, CRM y propuestas comparables", "Conversión lead–visita ≥20 % y cotización–venta ≥10 %"),
            ("3. Transacción y monitoreo (12–24 meses)", "Financiación aliada, seguimiento OR e inversor", "≥100 sistemas; error de ahorro medido ≤15 %"),
            ("4. Plataforma (24–36 meses)", "API, white-label, baterías y comunidades", "LTV/CAC ≥3 y dos canales repetibles"),
        ],
        [2300, 3860, 3200],
        font_size=8.6,
    )
    sf.add_para(doc, "Los umbrales son objetivos internos recomendados, no exigencias regulatorias. Antes de vender, SolarFit debe versionar reglas CREG, mantener el informe como prefactibilidad, aplicar RETIE y proteger los datos de facturas. Véanse [9][10].")

    sf.add_section_title(doc, "12. Limitaciones y riesgos")
    for text in (
        "El consumo es sintético y no refleja simultaneidad horaria.",
        "El área útil es un escalar y no sustituye un plano, visita o revisión estructural.",
        "PVGIS y PVWatts no capturan todas las sombras, suciedad, indisponibilidad o decisiones de montaje.",
        "La cobertura energética no equivale a ahorro monetario ni factura cero.",
        "La comparación de proveedores no es calibración contra una instalación medida.",
        "Las APIs y la regulación pueden cambiar; fuente, fecha y versión deben conservarse.",
    ):
        sf.add_bullet(doc, text, 0)

    add_identity_and_ai(doc)
    sf.add_section_title(doc, "Plan del pitch de 3 minutos", page_break=True)
    sf.add_table(
        doc,
        ["Tiempo", "Pregunta", "Mensaje"],
        [
            ("0:00–0:35", "¿Qué problema?", "Consumo y potencia no bastan; importan mes, clima, pérdidas y techo."),
            ("0:35–1:25", "¿Cómo se resolvió?", "Modelo continuo, dos criterios, techo separado, MVP y APIs oficiales."),
            ("1:25–2:25", "¿Por qué es válido?", "Cinco simulaciones, 37 pruebas y contraste PVGIS–PVWatts."),
            ("2:25–3:00", "¿Qué aprendimos?", "Quibdó prueba el rechazo; el siguiente paso es piloto con datos medidos."),
        ],
        [1500, 2300, 5560],
        font_size=9.2,
    )
    sf.add_callout(doc, "Regla de la rúbrica", "Durante el pitch el único apoyo es el póster; no se debe presentar una secuencia de diapositivas.")

    sf.add_section_title(doc, "Referencias", page_break=True)
    add_references(doc)
    sf.add_section_title(doc, "Anexo A · Series de consumo simuladas", page_break=True)
    sf.add_table(
        doc,
        ["Mes"] + [c["city"] for c in CASES],
        [(month, *[str(c["consumption"][i]) for c in CASES]) for i, month in enumerate(("Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"))],
        [1050, 1660, 1660, 1660, 1660, 1670],
        font_size=8.8,
    )
    sf.add_table_source(doc, "Unidad: kWh/mes. Todos los valores son sintéticos y se usan exclusivamente para simulación reproducible.")
    sf.add_section_title(doc, "Anexo B · Checklist de entrega", page_break=True)
    for item in (
        "[ ] Completar nombres, códigos y contribuciones reales en Word, póster y registro de IA.",
        "[ ] Confirmar la fecha y el límite de páginas en la tarea activa de AVATA.",
        "[ ] Mantener la expresión ‘casos simulados calibrados’; no escribir ‘facturas reales’.",
        "[ ] Adjuntar o conservar el libro de validación y la carpeta de evidencia.",
        "[ ] Verificar que póster, pitch e informe usan las mismas cifras.",
        "[ ] Ensayar el pitch a 3 minutos usando únicamente el póster.",
        "[ ] Asegurar que cada integrante pueda explicar modelo, derivadas, algoritmo, resultados y límites.",
    ):
        sf.add_para(doc, item, align=WD_ALIGN_PARAGRAPH.LEFT, after=5)
    finalize_doc(doc)
    return doc


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    build_yield_chart(ASSET_DIR / "yield-comparison.png")
    build_coverage_chart(ASSET_DIR / "coverage-cases.png")
    hito2 = build_hito2()
    hito2.save(HITO2_OUTPUT)
    final = build_final()
    final.save(FINAL_OUTPUT)
    print(f"Created {HITO2_OUTPUT}")
    print(f"Created {FINAL_OUTPUT}")


if __name__ == "__main__":
    main()
