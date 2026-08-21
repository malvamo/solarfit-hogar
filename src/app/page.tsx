import { BrandMark } from "@/components/brand-mark";
import { SolarFitApp } from "@/components/solar-fit-app";

export default function Home() {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="SolarFit Hogar, ir al inicio">
          <BrandMark />
          <span><strong>SolarFit</strong><em>Hogar</em></span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#calculadora">Calculadora</a>
          <a href="#metodologia">Metodología</a>
          <a href="#alcance">Alcance</a>
        </nav>
        <span className="header-edition">MVP académico · 2026</span>
      </header>

      <main id="inicio">
        <section className="hero">
          <div className="hero-orbit" aria-hidden="true"><span /><span /><span /></div>
          <div className="hero-copy">
            <p className="hero-kicker"><span>01</span> Dimensionamiento solar explicable</p>
            <h1>Energía que se puede <em>defender,</em> cifra por cifra.</h1>
            <p className="hero-lead">
              Convierte doce consumos, el recurso solar y el espacio disponible en una recomendación preliminar de paneles —con fórmulas, sensibilidad, fuentes y límites visibles.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#calculadora">Evaluar una vivienda <span>↓</span></a>
              <a className="button button-line" href="#metodologia">Ver cómo se calcula</a>
            </div>
          </div>
          <div className="hero-visual" aria-label="Diagrama conceptual de radiación, vivienda y resultados">
            <div className="sun-disc"><span>HSP</span><strong>h</strong><small>recurso solar</small></div>
            <div className="energy-path" aria-hidden="true"><i /><i /><i /><i /></div>
            <div className="house-card">
              <div className="roof-array"><span /><span /><span /><span /><span /><span /></div>
              <div className="house-body"><span /><span /></div>
              <p>Vivienda conectada a red</p>
            </div>
            <div className="result-ticket">
              <span>salida explicable</span>
              <strong>N = ⌈n*⌉</strong>
              <small>paneles · kWp · cobertura</small>
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Características del producto">
          <article><span>01</span><div><strong>Dos métodos</strong><small>Modelo HSP o simulación PVGIS</small></div></article>
          <article><span>02</span><div><strong>Doce meses</strong><small>Sin esconder la estacionalidad</small></div></article>
          <article><span>03</span><div><strong>Techo finito</strong><small>Recomendación y viabilidad separadas</small></div></article>
          <article><span>04</span><div><strong>Cálculo visible</strong><small>Derivada, sensibilidad y supuestos</small></div></article>
        </section>

        <SolarFitApp />

        <section className="methodology-section" id="metodologia">
          <div className="methodology-heading">
            <p className="eyebrow">Método verificable</p>
            <h2>De la factura a la decisión, sin caja negra.</h2>
            <p>Cada etapa conserva unidades, fuente y criterio matemático. El resultado puede reproducirse manualmente y contrastarse con una herramienta independiente.</p>
          </div>
          <div className="methodology-flow">
            <article><span>01</span><h3>Caracterizar</h3><p>Doce consumos, días facturados, coordenadas generales y área útil.</p><code>C₁ … C₁₂</code></article>
            <article><span>02</span><h3>Modelar</h3><p>Producción específica por HSP o por rendimiento neto oficial.</p><code>Gₘ = P · Yₘ</code></article>
            <article><span>03</span><h3>Dimensionar</h3><p>Comparar balance anual y cobertura conservadora de cada mes.</p><code>n* = qC / G</code></article>
            <article><span>04</span><h3>Restringir</h3><p>Redondear una vez y comprobar el límite físico del techo.</p><code>N · Aₚ ≤ Aᵤ</code></article>
            <article><span>05</span><h3>Validar</h3><p>Revisar unidades, monotonicidad, simuladores y diferencias.</p><code>MAE · sesgo</code></article>
          </div>
        </section>

        <section className="scope-section" id="alcance">
          <div className="scope-card scope-positive">
            <p className="eyebrow">Lo que sí entrega</p>
            <h2>Una prefactibilidad energética trazable.</h2>
            <ul><li>Capacidad continua y paneles enteros.</li><li>Producción y cobertura mensual.</li><li>Restricción preliminar de área.</li><li>Sensibilidad e intervalo de incertidumbre.</li><li>Archivo exportable con datos y fuentes.</li></ul>
          </div>
          <div className="scope-card scope-negative">
            <p className="eyebrow">Límite profesional</p>
            <h2>No reemplaza un diseño certificado.</h2>
            <ul><li>No dimensiona inversor ni protecciones.</li><li>No verifica estructura o sombras cercanas.</li><li>No calcula autonomía ni baterías.</li><li>No garantiza factura cero ni ahorro tarifario.</li><li>Requiere evaluación de profesionales competentes.</li></ul>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="brand footer-brand"><BrandMark /><span><strong>SolarFit</strong><em>Hogar</em></span></div>
        <p>Proyecto académico de Cálculo Diferencial · Ingeniería de Sistemas</p>
        <p>Modelo transparente · datos mínimos · decisiones explicables</p>
      </footer>
    </>
  );
}
