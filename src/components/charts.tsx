import type { MonthlySolarResult, SensitivityResult } from "@/domain/solar/types";
import { formatNumber } from "@/domain/solar/format";

interface CoverageChartProps {
  months: MonthlySolarResult[];
  useBuildable: boolean;
}

export function CoverageChart({ months, useBuildable }: CoverageChartProps) {
  const width = 760;
  const height = 294;
  const plotTop = 24;
  const plotBottom = 238;
  const plotHeight = plotBottom - plotTop;
  const maxValue = Math.max(
    1,
    ...months.flatMap((month) => [
      month.consumptionKwh,
      useBuildable ? month.buildableGenerationKwh : month.recommendedGenerationKwh,
    ]),
  );
  const groupWidth = 58;
  const startX = 42;
  const scaleY = (value: number) => plotBottom - (value / maxValue) * plotHeight;

  return (
    <figure className="chart-shell">
      <div className="chart-heading">
        <div>
          <p className="eyebrow">Balance mensual</p>
          <h3>Demanda frente a producción</h3>
        </div>
        <div className="chart-legend" aria-label="Leyenda">
          <span><i className="legend-demand" />Consumo</span>
          <span><i className="legend-solar" />Producción</span>
        </div>
      </div>
      <svg
        aria-labelledby="coverage-chart-title coverage-chart-desc"
        className="coverage-chart"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title id="coverage-chart-title">Consumo y producción mensual estimada</title>
        <desc id="coverage-chart-desc">
          Doce pares de barras comparan el consumo de la vivienda con la producción fotovoltaica.
        </desc>
        {[0, 0.5, 1].map((ratio) => {
          const y = plotBottom - ratio * plotHeight;
          return (
            <g key={ratio}>
              <line className="chart-grid" x1="36" x2="744" y1={y} y2={y} />
              <text className="chart-axis" x="30" y={y + 4} textAnchor="end">
                {formatNumber(maxValue * ratio, 0)}
              </text>
            </g>
          );
        })}
        {months.map((month, index) => {
          const x = startX + index * groupWidth;
          const generation = useBuildable
            ? month.buildableGenerationKwh
            : month.recommendedGenerationKwh;
          return (
            <g key={month.month}>
              <rect
                className="bar-demand"
                height={plotBottom - scaleY(month.consumptionKwh)}
                rx="4"
                width="17"
                x={x}
                y={scaleY(month.consumptionKwh)}
              >
                <title>{`${month.monthLabel}: consumo ${formatNumber(month.consumptionKwh, 0)} kWh`}</title>
              </rect>
              <rect
                className="bar-solar"
                height={plotBottom - scaleY(generation)}
                rx="4"
                width="17"
                x={x + 20}
                y={scaleY(generation)}
              >
                <title>{`${month.monthLabel}: producción ${formatNumber(generation, 0)} kWh`}</title>
              </rect>
              <text className="chart-axis month-label" x={x + 18} y="263" textAnchor="middle">
                {month.monthLabel.slice(0, 3)}
              </text>
            </g>
          );
        })}
        <text className="chart-unit" x="40" y="15">kWh</text>
      </svg>
      <figcaption>
        La producción mostrada usa {useBuildable ? "el máximo instalable por área" : "la recomendación energética"}.
      </figcaption>
    </figure>
  );
}

export function SensitivityChart({ sensitivity }: { sensitivity: SensitivityResult }) {
  const width = 760;
  const height = 270;
  const left = 52;
  const right = 732;
  const top = 22;
  const bottom = 218;
  const minX = sensitivity.points[0].hsp;
  const maxX = sensitivity.points.at(-1)?.hsp ?? minX + 1;
  const maxY = Math.max(...sensitivity.points.map((point) => point.continuousPanels));
  const minY = Math.min(...sensitivity.points.map((point) => point.continuousPanels));
  const x = (value: number) => left + ((value - minX) / (maxX - minX)) * (right - left);
  const y = (value: number) => bottom - ((value - minY) / (maxY - minY)) * (bottom - top);
  const path = sensitivity.points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.hsp).toFixed(1)} ${y(point.continuousPanels).toFixed(1)}`)
    .join(" ");
  const referencePanels = sensitivity.kConstant / sensitivity.referenceHsp;

  return (
    <figure className="chart-shell sensitivity-shell">
      <div className="chart-heading">
        <div>
          <p className="eyebrow">Cálculo diferencial</p>
          <h3>Sensibilidad n({sensitivity.resourceSymbol}) = K / {sensitivity.resourceSymbol}</h3>
        </div>
        <span className="formula-chip">n′({sensitivity.resourceSymbol}) &lt; 0</span>
      </div>
      <svg
        aria-labelledby="sensitivity-title sensitivity-desc"
        className="sensitivity-chart"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title id="sensitivity-title">Curva de paneles continuos frente al recurso solar</title>
        <desc id="sensitivity-desc">
          La curva es decreciente y convexa. Un mayor valor de {sensitivity.resourceLabel} reduce la necesidad continua de paneles.
        </desc>
        <line className="chart-grid" x1={left} x2={right} y1={bottom} y2={bottom} />
        <line className="chart-grid" x1={left} x2={left} y1={top} y2={bottom} />
        <path className="sensitivity-line" d={path} fill="none" />
        <line
          className="reference-line"
          x1={x(sensitivity.referenceHsp)}
          x2={x(sensitivity.referenceHsp)}
          y1={top}
          y2={bottom}
        />
        <circle
          className="reference-dot"
          cx={x(sensitivity.referenceHsp)}
          cy={y(referencePanels)}
          r="6"
        />
        <text className="chart-axis" x={left} y="242">{formatNumber(minX, 1)}</text>
        <text className="chart-axis" x={right} y="242" textAnchor="end">{formatNumber(maxX, 1)}</text>
        <text className="chart-axis" x={(left + right) / 2} y="258" textAnchor="middle">{sensitivity.resourceUnit}</text>
        <text className="chart-axis" x={left - 8} y={top + 4} textAnchor="end">
          {formatNumber(maxY, 1)}
        </text>
        <text className="chart-axis" x={left - 8} y={bottom + 4} textAnchor="end">
          {formatNumber(minY, 1)}
        </text>
      </svg>
      <figcaption>
        Evaluación en {sensitivity.referenceLabel}. La derivada local es {formatNumber(sensitivity.derivativeAtReference, 2)} paneles por {sensitivity.resourceUnit}.
      </figcaption>
    </figure>
  );
}
