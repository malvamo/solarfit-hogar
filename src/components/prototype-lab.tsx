"use client";

import { useMemo, useState } from "react";

import {
  CALIBRATED_CASES,
  PANEL_MODEL,
  type CalibratedCase,
} from "@/lib/cases";
import {
  calculatePrototype,
  type PrototypeInputs,
  type PrototypeResult,
} from "@/lib/model";

const number = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

function caseInputs(item: CalibratedCase): PrototypeInputs {
  return {
    monthlyConsumptionKwh: item.monthlyConsumptionKwh,
    annualSpecificYield: item.annualSpecificYield,
    roofUsableM2: item.roofUsableM2,
    panelPowerWp: item.panelPowerWp,
  };
}

function SensitivitySketch({ result, input }: { result: PrototypeResult; input: PrototypeInputs }) {
  const width = 620;
  const height = 255;
  const padding = { left: 48, right: 26, top: 22, bottom: 38 };
  const minYield = input.annualSpecificYield * 0.62;
  const maxYield = input.annualSpecificYield * 1.38;
  const points = Array.from({ length: 33 }, (_, index) => {
    const yieldValue = minYield + ((maxYield - minYield) * index) / 32;
    return {
      yieldValue,
      panels: result.annualConsumptionKwh / (result.panelPowerKw * yieldValue),
    };
  });
  const maxPanels = points[0].panels;
  const minPanels = points.at(-1)?.panels ?? result.continuousPanels;
  const x = (value: number) =>
    padding.left +
    ((value - minYield) / (maxYield - minYield)) * (width - padding.left - padding.right);
  const y = (value: number) =>
    padding.top +
    ((maxPanels - value) / (maxPanels - minPanels)) * (height - padding.top - padding.bottom);
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.yieldValue).toFixed(1)},${y(point.panels).toFixed(1)}`)
    .join(" ");
  const referenceX = x(input.annualSpecificYield);
  const referenceY = y(result.continuousPanels);

  return (
    <figure className="curve-card" aria-labelledby="curve-title">
      <div className="figure-heading">
        <div>
          <p className="micro-label">Cambio local</p>
          <h3 id="curve-title">Más sol, menos paneles necesarios</h3>
        </div>
        <span className="derivative-chip">n′(Y) = {number.format(result.derivativeAtReference)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Curva decreciente de paneles frente al rendimiento solar">
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} className="axis" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} className="axis" />
        <line x1={referenceX} y1={padding.top} x2={referenceX} y2={height - padding.bottom} className="guide" />
        <path d={path} className="curve" />
        <circle cx={referenceX} cy={referenceY} r="7" className="curve-dot" />
        <text x={padding.left} y={height - 12} className="chart-label">menor Y</text>
        <text x={width - padding.right} y={height - 12} textAnchor="end" className="chart-label">mayor Y</text>
        <text x="13" y={padding.top + 7} className="chart-label">n(Y)</text>
        <text x={referenceX + 10} y={referenceY - 12} className="chart-value">
          {number.format(result.continuousPanels)} paneles
        </text>
      </svg>
      <figcaption>
        Cerca de este punto, aumentar Y en 100 kWh/kWp·año cambia la necesidad continua en
        aproximadamente <strong>{number.format(Math.abs(result.estimatedChangePer100Yield))} paneles menos</strong>.
      </figcaption>
    </figure>
  );
}

export function PrototypeLab() {
  const [selectedId, setSelectedId] = useState<CalibratedCase["id"]>("bogota");
  const selectedCase = CALIBRATED_CASES.find((item) => item.id === selectedId) ?? CALIBRATED_CASES[0];
  const [inputs, setInputs] = useState<PrototypeInputs>(() => caseInputs(selectedCase));
  const [isAdjusted, setIsAdjusted] = useState(false);

  const calculation = useMemo(() => {
    try {
      return { result: calculatePrototype(inputs), error: "" };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "Revisa los valores ingresados.",
      };
    }
  }, [inputs]);

  function selectCase(item: CalibratedCase) {
    setSelectedId(item.id);
    setInputs(caseInputs(item));
    setIsAdjusted(false);
  }

  function updateInput(field: keyof PrototypeInputs, raw: string) {
    const parsed = Number(raw);
    setInputs((current) => ({ ...current, [field]: Number.isFinite(parsed) ? parsed : 0 }));
    setIsAdjusted(true);
  }

  return (
    <main>
      <div className="prototype-ribbon">
        <span>PROTOTIPO ACADÉMICO</span>
        <strong>Hito 2 de 3</strong>
        <span>No es el producto final</span>
      </div>

      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Ir al inicio">
          <span className="sun-mark" aria-hidden="true"><i /><i /><i /><i /><b /></span>
          <span><strong>SolarFit</strong><small>laboratorio de avance</small></span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#simulador">Simulador</a>
          <a href="#casos">3 casos</a>
          <a href="#alcance">Alcance</a>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">Investigación + creación · Semana 10</p>
          <h1>Una pregunta real,<br /><em>un modelo que ya responde.</em></h1>
          <p className="hero-lead">
            Este avance calcula cuántos paneles necesita una vivienda y comprueba si caben en el techo.
            Se concentra en la relación matemática que sí cambia la decisión.
          </p>
          <a className="primary-action" href="#simulador">Probar el prototipo <span aria-hidden="true">↓</span></a>
        </div>
        <aside className="model-note" aria-label="Modelo principal">
          <div className="note-tape" aria-hidden="true" />
          <p>Modelo de balance anual</p>
          <code>n(Y) = D / (P · Y)</code>
          <dl>
            <div><dt>D</dt><dd>consumo anual</dd></div>
            <div><dt>P</dt><dd>potencia del panel</dd></div>
            <div><dt>Y</dt><dd>rendimiento solar anual</dd></div>
          </dl>
          <span className="scribble">redondear al final ↗</span>
        </aside>
      </section>

      <section className="lab-section" id="simulador">
        <div className="section-intro">
          <p className="eyebrow">Prototipo funcional</p>
          <h2>Elige un escenario y sigue el cálculo</h2>
          <p>Los valores iniciales están calibrados con datos agregados y estimaciones oficiales; puedes modificarlos para ensayar tu propio ejemplo.</p>
        </div>

        <div className="case-picker" role="group" aria-label="Selecciona uno de los tres casos simulados">
          {CALIBRATED_CASES.map((item, index) => (
            <button
              className={`case-tab ${item.id === selectedId ? "active" : ""}`}
              key={item.id}
              onClick={() => selectCase(item)}
              aria-pressed={item.id === selectedId}
            >
              <span>0{index + 1}</span>
              <strong>{item.city}</strong>
              <small>{item.context}</small>
            </button>
          ))}
        </div>

        <div className="lab-grid">
          <div className="worksheet">
            <div className="worksheet-heading">
              <div>
                <p className="micro-label">{selectedCase.code}</p>
                <h3>{selectedCase.city}</h3>
                <p>{selectedCase.purpose}</p>
              </div>
              <span className={`data-status ${isAdjusted ? "adjusted" : "calibrated"}`}>
                {isAdjusted ? "Valores ajustados" : "Caso calibrado"}
              </span>
            </div>

            <div className="input-grid">
              <label>
                <span>Consumo mensual</span>
                <div><input type="number" min="1" step="0.1" value={inputs.monthlyConsumptionKwh} onChange={(event) => updateInput("monthlyConsumptionKwh", event.target.value)} /><b>kWh/mes</b></div>
                <small>Dato de demanda</small>
              </label>
              <label>
                <span>Rendimiento solar Y</span>
                <div><input type="number" min="1" step="0.01" value={inputs.annualSpecificYield} onChange={(event) => updateInput("annualSpecificYield", event.target.value)} /><b>kWh/kWp·año</b></div>
                <small>Estimación PVGIS</small>
              </label>
              <label>
                <span>Potencia del panel P</span>
                <div><input type="number" min="1" step="5" value={inputs.panelPowerWp} onChange={(event) => updateInput("panelPowerWp", event.target.value)} /><b>Wp</b></div>
                <small>{PANEL_MODEL}</small>
              </label>
              <label>
                <span>Área útil de techo</span>
                <div><input type="number" min="0" step="0.1" value={inputs.roofUsableM2} onChange={(event) => updateInput("roofUsableM2", event.target.value)} /><b>m²</b></div>
                <small>Supuesto del escenario</small>
              </label>
            </div>

            {calculation.error && <p className="error-message" role="alert">{calculation.error}</p>}

            {calculation.result && (
              <div className="calculation-strip" aria-label="Sustitución en la fórmula">
                <span>n(Y)</span>
                <code>= {number.format(calculation.result.annualConsumptionKwh)} ÷ ({number.format(calculation.result.panelPowerKw)} × {number.format(inputs.annualSpecificYield)})</code>
                <strong>= {number.format(calculation.result.continuousPanels)}</strong>
                <small>antes de redondear</small>
              </div>
            )}

            <details className="source-note">
              <summary>¿De dónde salen los datos de este caso?</summary>
              <p><strong>Consumo:</strong> {selectedCase.consumptionBasis}</p>
              <p><strong>Recurso solar:</strong> {selectedCase.solarBasis}</p>
              <p><strong>Importante:</strong> es una simulación calibrada, no una vivienda observada ni producción medida.</p>
            </details>
          </div>

          <aside className="result-board" aria-live="polite">
            <p className="micro-label">Resultado del avance</p>
            {calculation.result ? (
              <>
                <div className="result-number">
                  <strong>{calculation.result.recommendedPanels}</strong>
                  <span>paneles<br />requeridos</span>
                </div>
                <p className="rounding-note">{number.format(calculation.result.continuousPanels)} → se redondea hacia arriba</p>
                <div className={`verdict ${calculation.result.roofFeasible ? "ok" : "warning"}`}>
                  <span aria-hidden="true">{calculation.result.roofFeasible ? "✓" : "!"}</span>
                  <div>
                    <strong>{calculation.result.roofFeasible ? "La recomendación cabe" : "El techo limita el sistema"}</strong>
                    <p>{calculation.result.maximumPanelsByRoof} paneles caben · {calculation.result.buildablePanels} construibles</p>
                  </div>
                </div>
                <dl className="result-list">
                  <div><dt>Producción construible</dt><dd>{integer.format(calculation.result.buildableGenerationKwh)} kWh/año</dd></div>
                  <div><dt>Cobertura estimada</dt><dd>{number.format(calculation.result.buildableCoveragePct)} %</dd></div>
                  <div><dt>Energía por panel</dt><dd>{integer.format(calculation.result.energyPerPanelKwh)} kWh/año</dd></div>
                </dl>
              </>
            ) : (
              <p>Corrige los valores para obtener un resultado.</p>
            )}
          </aside>
        </div>

        {calculation.result && (
          <div className="analysis-grid">
            <SensitivitySketch result={calculation.result} input={inputs} />
            <article className="why-card">
              <p className="micro-label">Cálculo diferencial esencial</p>
              <h3>La derivada sí responde algo útil</h3>
              <code>n′(Y) = −D / (P · Y²)</code>
              <p>
                Su signo es negativo: si el rendimiento solar aumenta, la cantidad continua de paneles disminuye.
                Su magnitud mide qué tan sensible es la recomendación alrededor del escenario seleccionado.
              </p>
              <div className="why-foot">
                <span>Aplicación directa</span>
                <strong>No calculamos por calcular: usamos la derivada para interpretar una decisión de diseño.</strong>
              </div>
            </article>
          </div>
        )}
      </section>

      <section className="cases-section" id="casos">
        <div className="section-intro compact">
          <p className="eyebrow">Tres aplicaciones simuladas</p>
          <h2>Tres contextos, tres aprendizajes</h2>
          <p>Cada caso prueba una condición diferente del modelo y conserva explícitos sus supuestos.</p>
        </div>
        <div className="case-results">
          {CALIBRATED_CASES.map((item, index) => {
            const result = calculatePrototype(caseInputs(item));
            return (
              <article key={item.id} className={result.roofFeasible ? "" : "limit-case"}>
                <div className="case-index">0{index + 1}</div>
                <p className="micro-label">{item.code}</p>
                <h3>{item.city}</h3>
                <p>{item.context}</p>
                <div className="mini-equation">{number.format(result.continuousPanels)} → <strong>{result.recommendedPanels} paneles</strong></div>
                <dl>
                  <div><dt>Consumo</dt><dd>{integer.format(result.annualConsumptionKwh)} kWh/año</dd></div>
                  <div><dt>Rendimiento Y</dt><dd>{number.format(item.annualSpecificYield)}</dd></div>
                  <div><dt>Cobertura construible</dt><dd>{number.format(result.buildableCoveragePct)} %</dd></div>
                </dl>
                <span className={`case-conclusion ${result.roofFeasible ? "ok" : "warning"}`}>
                  {result.roofFeasible ? "Techo suficiente" : "Solo caben 3: requiere ajuste"}
                </span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="scope-section" id="alcance">
        <div className="scope-main">
          <p className="eyebrow">Frontera del Hito 2</p>
          <h2>Un avance coherente,<br />no una aplicación terminada.</h2>
        </div>
        <div className="scope-columns">
          <article>
            <span>YA DEMUESTRA</span>
            <ul>
              <li>Modelo anual con unidades coherentes</li>
              <li>Redondeo de paneles y restricción de techo</li>
              <li>Derivada e interpretación de sensibilidad</li>
              <li>Tres simulaciones calibradas y trazables</li>
            </ul>
          </article>
          <article>
            <span>SE RESERVA PARA EL HITO 3</span>
            <ul>
              <li>Más de tres escenarios y validación ampliada</li>
              <li>Contraste entre PVGIS y PVWatts</li>
              <li>Series mensuales, importación y exportación</li>
              <li>Producto final, reflexión y anexos completos</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="evidence-section">
        <p className="eyebrow">Trazabilidad</p>
        <h2>Fuentes que sostienen los escenarios</h2>
        <div className="source-grid">
          <a href="https://bdigital.upme.gov.co/handle/001/1367" target="_blank" rel="noreferrer"><span>Demanda</span><strong>UPME / CORPOEMA</strong><small>Promedios SUI 2018 por piso térmico</small></a>
          <a href="https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en" target="_blank" rel="noreferrer"><span>Recurso solar</span><strong>JRC · PVGIS</strong><small>Estimación del rendimiento específico</small></a>
          <a href="https://static.longi.com/Hi_MO_X6_LR_5_54_HTH_445_455_M_V1_30_30_and_15_V19_ES_09bf28ff6d.pdf" target="_blank" rel="noreferrer"><span>Módulo</span><strong>LONGi · 450 Wp</strong><small>Potencia y dimensiones de ficha técnica</small></a>
        </div>
        <p className="evidence-warning">Los datos son hipotéticos, simulados y estimados. Se calibran con referencias oficiales para acercarse a escenarios plausibles, pero no sustituyen facturas, mediciones de sombra, visita estructural ni diseño eléctrico.</p>
      </section>

      <footer>
        <div className="brand footer-brand">
          <span className="sun-mark" aria-hidden="true"><i /><i /><i /><i /><b /></span>
          <span><strong>SolarFit</strong><small>prototipo Hito 2</small></span>
        </div>
        <p>Cálculo Diferencial · Proyecto CAP+IA · 2026-2S</p>
      </footer>
    </main>
  );
}

