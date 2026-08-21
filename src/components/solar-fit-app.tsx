"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import { CoverageChart, SensitivityChart } from "@/components/charts";
import { DEMO_PROJECT, EMPTY_PROJECT } from "@/data/demo-project";
import {
  compareEnergySeries,
  type EnergySeriesComparison,
} from "@/domain/solar/analysis";
import { calculateSolarProject } from "@/domain/solar/calculate";
import { formatKwh, formatNumber, formatPercent, formatSigned } from "@/domain/solar/format";
import {
  MONTHS,
  type MonthlySolarInput,
  type SolarProjectInput,
} from "@/domain/solar/types";
import {
  getProjectEvidenceStatus,
  parseSolarProjectJson,
} from "@/domain/solar/project-schema";
import {
  downloadCsvTemplate,
  downloadProjectJson,
  downloadResultsCsv,
} from "@/lib/downloads";
import { monthlyCsvTemplate, parseMonthlyCsv } from "@/lib/monthly-csv";
import { loadProjectDraft, removeProjectDraft, saveProjectDraft } from "@/lib/project-storage";
import type { SolarYieldDataset } from "@/services/solar-yield";

type View = "data" | "model" | "results";
type PvgisState = { status: "idle" | "loading" | "success" | "error"; message: string };
type ApiStatus = PvgisState["status"];

const VIEW_DEFINITIONS = [
  ["data", "01", "Datos"],
  ["model", "02", "Modelo"],
  ["results", "03", "Resultados"],
] as const;
const SOLAR_CONFIGURATION_FIELDS = new Set<keyof SolarProjectInput>([
  "latitude",
  "longitude",
  "tiltDeg",
  "azimuthDeg",
  "pvgisSystemLossPct",
]);
const PROJECT_JSON_MAX_BYTES = 1_000_000;

interface TiltEvaluation {
  tiltDeg: number;
  annualKwhPerKwp: number;
  estimatedFirstDerivativeKwhPerKwpDeg: number;
  estimatedSecondDerivativeKwhPerKwpDeg2: number | null;
  isSelectedMaximum: boolean;
  monthlyKwhPerKwp: number[];
  dataset: string;
}

interface TiltOptimizationPayload {
  apiVersion: string;
  evaluatedAt: string;
  selectedTiltDeg: number;
  selectedAnnualKwhPerKwp: number;
  referenceTiltDeg: number | null;
  gainVsReferencePct: number | null;
  evaluations: TiltEvaluation[];
  warnings: string[];
  sourceUrl: string;
  error?: string;
}

interface TiltOptimizationState {
  status: ApiStatus;
  message: string;
  data: TiltOptimizationPayload | null;
}

interface PvwattsValidationState {
  status: ApiStatus;
  message: string;
  dataset: SolarYieldDataset | null;
  metrics: EnergySeriesComparison | null;
}

function cloneProject(project: SolarProjectInput) {
  return structuredClone(project);
}

function provenanceClass(kind: string) {
  return `provenance-badge provenance-${kind}`;
}

function inputNumber(value: number | null) {
  return value ?? "";
}

export function SolarFitApp() {
  const [project, setProject] = useState<SolarProjectInput>(() => cloneProject(DEMO_PROJECT));
  const [activeView, setActiveView] = useState<View>("data");
  const [draftNotice, setDraftNotice] = useState("Escenario sintético activo");
  const [pvgis, setPvgis] = useState<PvgisState>({ status: "idle", message: "" });
  const [tiltOptimization, setTiltOptimization] = useState<TiltOptimizationState>({
    status: "idle",
    message: "",
    data: null,
  });
  const [pvwattsValidation, setPvwattsValidation] = useState<PvwattsValidationState>({
    status: "idle",
    message: "",
    dataset: null,
    metrics: null,
  });
  const [csvError, setCsvError] = useState("");
  const [projectFileError, setProjectFileError] = useState("");
  const storageReady = useRef(false);
  const projectFileInput = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Record<View, HTMLButtonElement | null>>({
    data: null,
    model: null,
    results: null,
  });
  const pvgisRequestId = useRef(0);
  const tiltRequestId = useRef(0);
  const pvwattsRequestId = useRef(0);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const saved = loadProjectDraft();
      if (saved.project) {
        setProject(saved.project);
        setDraftNotice("Borrador local recuperado");
      } else if (saved.status === "discarded") {
        setDraftNotice("Borrador inválido descartado de forma segura");
      }
      storageReady.current = true;
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!storageReady.current) return;
    const timeoutId = window.setTimeout(() => {
      if (!saveProjectDraft(project)) {
        setDraftNotice("El navegador bloqueó el guardado; exporte JSON como respaldo");
      }
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [project]);

  function resetExternalEvidence() {
    pvgisRequestId.current += 1;
    tiltRequestId.current += 1;
    pvwattsRequestId.current += 1;
    setPvgis({ status: "idle", message: "" });
    setTiltOptimization({ status: "idle", message: "", data: null });
    setPvwattsValidation({ status: "idle", message: "", dataset: null, metrics: null });
  }

  const calculation = useMemo(() => {
    try {
      return { result: calculateSolarProject(project), error: "" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "El modelo contiene datos inválidos.";
      return { result: null, error: message };
    }
  }, [project]);

  function updateProject<K extends keyof SolarProjectInput>(
    field: K,
    value: SolarProjectInput[K],
  ) {
    const invalidatesSolarSeries = SOLAR_CONFIGURATION_FIELDS.has(field);
    if (invalidatesSolarSeries || field === "solarSourceMode") {
      resetExternalEvidence();
    }
    setProject((current) => {
      const next = { ...current, [field]: value };
      if (!invalidatesSolarSeries || current.solarSourceMode !== "pvgis-yield") {
        return next;
      }
      return {
        ...next,
        months: current.months.map((month) => ({
          ...month,
          specificYieldKwhPerKwp: null,
        })),
        solarProvenance: {
          kind: "user",
          label: "Configuración solar modificada; vuelva a consultar PVGIS",
        },
      };
    });
  }

  function updateMonth(monthNumber: number, field: keyof MonthlySolarInput, value: number | null) {
    setProject((current) => ({
      ...current,
      months: current.months.map((month) =>
        month.month === monthNumber ? { ...month, [field]: value } : month,
      ),
      consumptionProvenance:
        field === "consumptionKwh"
          ? { kind: "user", label: "Datos ingresados por el equipo; conservar soporte de facturas" }
          : current.consumptionProvenance,
      solarProvenance:
        field === "hsp"
          ? { kind: "user", label: "HSP ingresadas manualmente; documentar fuente" }
          : current.solarProvenance,
    }));
  }

  function loadDemo() {
    resetExternalEvidence();
    setProject(cloneProject(DEMO_PROJECT));
    setDraftNotice("Escenario sintético activo");
    setProjectFileError("");
  }

  function startRealProject() {
    removeProjectDraft();
    resetExternalEvidence();
    setProject(cloneProject(EMPTY_PROJECT));
    setDraftNotice("Proyecto real: faltan datos verificables");
    setProjectFileError("");
  }

  async function requestPvgis() {
    if (project.latitude === null || project.longitude === null) {
      setPvgis({ status: "error", message: "Ingresa latitud y longitud antes de consultar." });
      return;
    }
    const requestId = ++pvgisRequestId.current;
    tiltRequestId.current += 1;
    pvwattsRequestId.current += 1;
    setTiltOptimization({ status: "idle", message: "", data: null });
    setPvwattsValidation({ status: "idle", message: "", dataset: null, metrics: null });
    setPvgis({ status: "loading", message: "Consultando PVGIS 5.3…" });
    try {
      const response = await fetch("/api/pvgis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: project.latitude,
          longitude: project.longitude,
          tiltDeg: project.tiltDeg,
          azimuthDeg: project.azimuthDeg,
          systemLossPct: project.pvgisSystemLossPct,
        }),
      });
      const payload = (await response.json()) as SolarYieldDataset & { error?: string };
      if (!response.ok) throw new Error(payload.error || "PVGIS no respondió correctamente.");
      if (requestId !== pvgisRequestId.current) return;
      setProject((current) => ({
        ...current,
        solarSourceMode: "pvgis-yield",
        months: current.months.map((month, index) => ({
          ...month,
          hsp: payload.irradiationKwhM2Day?.[index] ?? month.hsp,
          specificYieldKwhPerKwp: payload.monthlyKwhPerKwp[index],
        })),
        solarProvenance: {
          kind: "official",
          label: `PVGIS ${payload.apiVersion} · ${payload.dataset}`,
          sourceUrl: payload.sourceUrl,
          fetchedAt: payload.fetchedAt,
          note: payload.warnings.join(" "),
        },
      }));
      setPvgis({
        status: "success",
        message: `${formatNumber(payload.annualKwhPerKwp, 0)} kWh/kWp·año cargados desde ${payload.dataset}.`,
      });
    } catch (error) {
      if (requestId !== pvgisRequestId.current) return;
      setPvgis({
        status: "error",
        message: error instanceof Error ? error.message : "No fue posible consultar PVGIS.",
      });
    }
  }

  async function requestTiltOptimization() {
    if (project.latitude === null || project.longitude === null) {
      setTiltOptimization({
        status: "error",
        message: "Ingresa latitud y longitud antes de optimizar.",
        data: null,
      });
      return;
    }

    const candidateTiltsDeg = [...new Set([
      ...Array.from({ length: 9 }, (_, index) => index * 5),
      project.tiltDeg,
    ])].toSorted((a, b) => a - b);
    const requestId = ++tiltRequestId.current;
    setTiltOptimization({
      status: "loading",
      message: `Evaluando ${candidateTiltsDeg.length} inclinaciones en PVGIS…`,
      data: null,
    });

    try {
      const response = await fetch("/api/pvgis/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: project.latitude,
          longitude: project.longitude,
          azimuthDeg: project.azimuthDeg,
          systemLossPct: project.pvgisSystemLossPct,
          candidateTiltsDeg,
          referenceTiltDeg: project.tiltDeg,
        }),
      });
      const payload = (await response.json()) as TiltOptimizationPayload;
      if (!response.ok) {
        throw new Error(payload.error || "PVGIS no pudo optimizar la inclinación.");
      }
      if (requestId !== tiltRequestId.current) return;
      setTiltOptimization({
        status: "success",
        message: `Máximo de la malla: ${formatNumber(payload.selectedTiltDeg, 0)}° y ${formatNumber(payload.selectedAnnualKwhPerKwp, 0)} kWh/kWp·año.`,
        data: payload,
      });
    } catch (error) {
      if (requestId !== tiltRequestId.current) return;
      setTiltOptimization({
        status: "error",
        message: error instanceof Error ? error.message : "No fue posible optimizar con PVGIS.",
        data: null,
      });
    }
  }

  function applyOptimizedTilt() {
    const optimization = tiltOptimization.data;
    if (!optimization) return;
    const selected = optimization.evaluations.find((item) => item.isSelectedMaximum);
    if (!selected) return;

    setProject((current) => ({
      ...current,
      tiltDeg: selected.tiltDeg,
      solarSourceMode: "pvgis-yield",
      months: current.months.map((month, index) => ({
        ...month,
        specificYieldKwhPerKwp: selected.monthlyKwhPerKwp[index],
      })),
      solarProvenance: {
        kind: "official",
        label: `PVGIS ${optimization.apiVersion} · inclinación optimizada ${formatNumber(selected.tiltDeg, 0)}° · ${selected.dataset}`,
        sourceUrl: optimization.sourceUrl,
        fetchedAt: optimization.evaluatedAt,
        note: optimization.warnings.join(" "),
      },
    }));
    setPvgis({
      status: "success",
      message: `Se aplicó la serie neta de ${formatNumber(selected.tiltDeg, 0)}° sin PR adicional.`,
    });
    pvwattsRequestId.current += 1;
    setPvwattsValidation({ status: "idle", message: "", dataset: null, metrics: null });
  }

  async function requestPvwattsValidation() {
    if (project.latitude === null || project.longitude === null) {
      setPvwattsValidation({
        status: "error",
        message: "Ingresa latitud y longitud antes de validar.",
        dataset: null,
        metrics: null,
      });
      return;
    }
    if (!result) {
      setPvwattsValidation({
        status: "error",
        message: "Completa primero un modelo válido para poder compararlo.",
        dataset: null,
        metrics: null,
      });
      return;
    }

    const requestId = ++pvwattsRequestId.current;
    setPvwattsValidation({
      status: "loading",
      message: "Consultando la referencia independiente PVWatts V8…",
      dataset: null,
      metrics: null,
    });
    try {
      const response = await fetch("/api/pvwatts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: project.latitude,
          longitude: project.longitude,
          tiltDeg: project.tiltDeg,
          azimuthDeg: project.azimuthDeg,
          systemLossPct: project.pvgisSystemLossPct,
        }),
      });
      const payload = (await response.json()) as SolarYieldDataset & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "PVWatts no respondió correctamente.");
      }
      if (requestId !== pvwattsRequestId.current) return;
      const metrics = compareEnergySeries(
        result.monthly.map((month) => month.specificYieldKwhPerKwpUsed),
        payload.monthlyKwhPerKwp,
      );
      setPvwattsValidation({
        status: "success",
        message: `Referencia ${payload.dataset}: diferencia anual ${formatSigned(metrics.annualBiasPct ?? 0, 1)} %.`,
        dataset: payload,
        metrics,
      });
    } catch (error) {
      if (requestId !== pvwattsRequestId.current) return;
      setPvwattsValidation({
        status: "error",
        message: error instanceof Error ? error.message : "No fue posible validar con PVWatts.",
        dataset: null,
        metrics: null,
      });
    }
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const months = parseMonthlyCsv(await file.text());
      resetExternalEvidence();
      setProject((current) => ({
        ...current,
        months,
        solarSourceMode: "manual-hsp",
        consumptionProvenance: {
          kind: "user",
          label: `Archivo ${file.name}; conservar facturas anonimizadas como soporte`,
        },
        solarProvenance: {
          kind: "user",
          label: `HSP importadas desde ${file.name}; documentar fuente original`,
        },
      }));
      setCsvError("");
      setDraftNotice("Datos mensuales importados");
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : "No fue posible leer el archivo.");
    } finally {
      event.target.value = "";
    }
  }

  async function importProjectJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > PROJECT_JSON_MAX_BYTES) {
        throw new Error("El archivo supera el límite de 1 MB para un proyecto SolarFit.");
      }
      const importedProject = parseSolarProjectJson(await file.text());
      resetExternalEvidence();
      setProject(importedProject);
      setActiveView("data");
      setProjectFileError("");
      setCsvError("");
      setDraftNotice(`Proyecto ${file.name} restaurado y recalculado`);
    } catch (error) {
      setProjectFileError(
        error instanceof Error ? error.message : "No fue posible abrir el proyecto.",
      );
    } finally {
      event.target.value = "";
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentView: View) {
    const currentIndex = VIEW_DEFINITIONS.findIndex(([view]) => view === currentView);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % VIEW_DEFINITIONS.length;
    if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + VIEW_DEFINITIONS.length) % VIEW_DEFINITIONS.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = VIEW_DEFINITIONS.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextView = VIEW_DEFINITIONS[nextIndex][0];
    setActiveView(nextView);
    requestAnimationFrame(() => tabRefs.current[nextView]?.focus());
  }

  const result = calculation.result;
  const evidenceStatus = getProjectEvidenceStatus(project);
  const isSynthetic = evidenceStatus === "synthetic_demo";
  const evidenceLabel = isSynthetic
    ? "DEMO · NO ES EVIDENCIA"
    : "PENDIENTE · VALIDAR SOPORTES";

  return (
    <section className="app-frame" id="calculadora">
      <div className="app-toolbar">
        <div>
          <p className="eyebrow">Evaluación de prefactibilidad</p>
          <h2>{project.projectName || "Proyecto sin nombre"}</h2>
        </div>
        <div className="toolbar-actions">
          <span className={isSynthetic ? "status-pill status-demo" : "status-pill status-pending"}>
            {evidenceLabel}
          </span>
          <button
            className="button button-ghost"
            onClick={() => projectFileInput.current?.click()}
            type="button"
          >
            Abrir JSON
          </button>
          <input
            accept=".json,application/json"
            className="project-file-input"
            onChange={importProjectJson}
            ref={projectFileInput}
            type="file"
          />
          <button className="button button-ghost" onClick={loadDemo} type="button">Cargar demo</button>
          <button className="button button-dark" onClick={startRealProject} type="button">Usar datos reales</button>
        </div>
      </div>

      {projectFileError ? (
        <p className="project-file-alert" role="alert">{projectFileError}</p>
      ) : null}

      <div className="privacy-strip">
        <span className="privacy-icon">◎</span>
        <p><strong>Privacidad por diseño.</strong> El borrador permanece en este navegador. No ingreses dirección exacta ni datos personales de las facturas.</p>
        <span>{draftNotice}</span>
      </div>

      <div className="app-tabs" role="tablist" aria-label="Etapas de la evaluación">
        {VIEW_DEFINITIONS.map(([view, number, label]) => (
          <button
            aria-controls={`panel-${view}`}
            aria-selected={activeView === view}
            className={activeView === view ? "app-tab active" : "app-tab"}
            id={`tab-${view}`}
            key={view}
            onClick={() => setActiveView(view)}
            onKeyDown={(event) => handleTabKeyDown(event, view)}
            ref={(element) => {
              tabRefs.current[view] = element;
            }}
            role="tab"
            tabIndex={activeView === view ? 0 : -1}
            type="button"
          >
            <span>{number}</span>{label}
          </button>
        ))}
      </div>

      <div className="app-body">
        <div className="workspace-column">
          {activeView === "data" ? (
            <div
              aria-labelledby="tab-data"
              className="panel-stack"
              id="panel-data"
              role="tabpanel"
              tabIndex={0}
            >
              <section className="form-card">
                <div className="section-heading">
                  <div><span className="section-index">A</span><div><p className="eyebrow">Identificación</p><h3>Vivienda y meta energética</h3></div></div>
                  <span className="section-note">Sin dirección exacta</span>
                </div>
                <div className="form-grid form-grid-2">
                  <label className="field field-wide"><span>Nombre del escenario</span><input value={project.projectName} onChange={(event) => updateProject("projectName", event.target.value)} /></label>
                  <label className="field"><span>Municipio o referencia general</span><input placeholder="Ej. Bogotá, Colombia" value={project.locationLabel} onChange={(event) => updateProject("locationLabel", event.target.value)} /></label>
                  <label className="field"><span>Cobertura objetivo</span><div className="input-unit"><input max="100" min="1" type="number" value={project.targetCoveragePct} onChange={(event) => updateProject("targetCoveragePct", Number(event.target.value))} /><em>%</em></div></label>
                  <label className="field"><span>Latitud</span><input placeholder="4.711" step="0.0001" type="number" value={inputNumber(project.latitude)} onChange={(event) => updateProject("latitude", event.target.value === "" ? null : Number(event.target.value))} /></label>
                  <label className="field"><span>Longitud</span><input placeholder="-74.0721" step="0.0001" type="number" value={inputNumber(project.longitude)} onChange={(event) => updateProject("longitude", event.target.value === "" ? null : Number(event.target.value))} /></label>
                  <label className="field"><span>Área útil del techo</span><div className="input-unit"><input min="0" step="0.1" type="number" value={project.roofUsableM2} onChange={(event) => updateProject("roofUsableM2", Number(event.target.value))} /><em>m²</em></div></label>
                  <label className="field"><span>Criterio de dimensionamiento</span><select value={project.sizingStrategy} onChange={(event) => updateProject("sizingStrategy", event.target.value as SolarProjectInput["sizingStrategy"])}><option value="annual-balance">Balance energético anual</option><option value="monthly-conservative">Meta en cada mes</option></select></label>
                </div>
              </section>

              <section className="form-card">
                <div className="section-heading">
                  <div><span className="section-index">B</span><div><p className="eyebrow">Demanda</p><h3>Doce periodos de consumo</h3></div></div>
                  <div className="compact-actions">
                    <button className="text-button" onClick={() => downloadCsvTemplate(monthlyCsvTemplate())} type="button">Descargar plantilla</button>
                    <label className="text-button file-button">Importar CSV<input accept=".csv,text/csv" onChange={importCsv} type="file" /></label>
                  </div>
                </div>
                {csvError ? <p className="inline-error" role="alert">{csvError}</p> : null}
                <div className="monthly-table-wrap">
                  <table className="monthly-input-table">
                    <thead><tr><th>Mes</th><th>Consumo</th><th>Días</th><th>HSP/día</th></tr></thead>
                    <tbody>
                      {project.months.map((month) => (
                        <tr key={month.month}>
                          <th scope="row">{MONTHS[month.month - 1].short}</th>
                          <td><div className="table-input"><input aria-label={`Consumo de ${MONTHS[month.month - 1].label}`} min="0" step="0.1" type="number" value={month.consumptionKwh} onChange={(event) => updateMonth(month.month, "consumptionKwh", Number(event.target.value))} /><span>kWh</span></div></td>
                          <td><input aria-label={`Días facturados de ${MONTHS[month.month - 1].label}`} min="1" type="number" value={month.billingDays} onChange={(event) => updateMonth(month.month, "billingDays", Number(event.target.value))} /></td>
                          <td><input aria-label={`Horas solares pico de ${MONTHS[month.month - 1].label}`} disabled={project.solarSourceMode === "pvgis-yield"} min="0" step="0.01" type="number" value={month.hsp ?? ""} onChange={(event) => updateMonth(month.month, "hsp", event.target.value === "" ? null : Number(event.target.value))} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="provenance-row"><span className={provenanceClass(project.consumptionProvenance.kind)}>{project.consumptionProvenance.kind}</span><p>{project.consumptionProvenance.label}</p></div>
              </section>

              <section className="form-card">
                <div className="section-heading"><div><span className="section-index">C</span><div><p className="eyebrow">Equipo</p><h3>Módulo fotovoltaico</h3></div></div></div>
                <div className="form-grid form-grid-3">
                  <label className="field field-wide"><span>Fabricante y modelo</span><input placeholder="Copiar de la ficha oficial" value={project.panelModel} onChange={(event) => { updateProject("panelModel", event.target.value); updateProject("panelProvenance", { kind: "user", label: "Datos ingresados por el equipo; adjuntar ficha técnica oficial" }); }} /></label>
                  <label className="field"><span>Potencia nominal</span><div className="input-unit"><input min="1" type="number" value={project.panelPowerWp} onChange={(event) => updateProject("panelPowerWp", Number(event.target.value))} /><em>Wp</em></div></label>
                  <label className="field"><span>Ancho</span><div className="input-unit"><input min="0.1" step="0.001" type="number" value={project.panelWidthM} onChange={(event) => updateProject("panelWidthM", Number(event.target.value))} /><em>m</em></div></label>
                  <label className="field"><span>Alto</span><div className="input-unit"><input min="0.1" step="0.001" type="number" value={project.panelHeightM} onChange={(event) => updateProject("panelHeightM", Number(event.target.value))} /><em>m</em></div></label>
                  <label className="field"><span>Factor de instalación</span><input min="1" step="0.01" type="number" value={project.installationAreaFactor} onChange={(event) => updateProject("installationAreaFactor", Number(event.target.value))} /><small>1,10 reserva aproximadamente 10 % para separación y acceso.</small></label>
                </div>
                <div className="provenance-row"><span className={provenanceClass(project.panelProvenance.kind)}>{project.panelProvenance.kind}</span><p>{project.panelProvenance.label}</p></div>
              </section>
              <button className="button button-primary next-button" onClick={() => setActiveView("model")} type="button">Continuar al modelo <span>→</span></button>
            </div>
          ) : null}

          {activeView === "model" ? (
            <div
              aria-labelledby="tab-model"
              className="panel-stack"
              id="panel-model"
              role="tabpanel"
              tabIndex={0}
            >
              <section className="form-card model-intro-card">
                <div className="section-heading"><div><span className="section-index">D</span><div><p className="eyebrow">Fuente solar</p><h3>Un método, nunca dos pérdidas</h3></div></div></div>
                <div className="method-switch">
                  <button aria-pressed={project.solarSourceMode === "manual-hsp"} className={project.solarSourceMode === "manual-hsp" ? "method-card selected" : "method-card"} onClick={() => updateProject("solarSourceMode", "manual-hsp")} type="button"><span>Modelo educativo</span><strong>HSP × días × PR</strong><p>Útil para explicar variables, derivadas y sensibilidad.</p></button>
                  <button aria-pressed={project.solarSourceMode === "pvgis-yield"} className={project.solarSourceMode === "pvgis-yield" ? "method-card selected" : "method-card"} onClick={() => updateProject("solarSourceMode", "pvgis-yield")} type="button"><span>Simulación oficial</span><strong>Rendimiento neto PVGIS</strong><p>Usa Eₘ en kWh/kWp; las pérdidas ya están incorporadas.</p></button>
                </div>
                {project.solarSourceMode === "manual-hsp" ? (
                  <div className="form-grid form-grid-2 method-settings"><label className="field"><span>Factor global de rendimiento</span><div className="input-unit"><input max="100" min="1" type="number" value={project.performanceRatioPct} onChange={(event) => updateProject("performanceRatioPct", Number(event.target.value))} /><em>%</em></div></label><label className="field"><span>Incertidumbre de producción</span><div className="input-unit"><input max="50" min="0" type="number" value={project.uncertaintyPct} onChange={(event) => updateProject("uncertaintyPct", Number(event.target.value))} /><em>± %</em></div></label></div>
                ) : (
                  <div className="pvgis-console">
                    <div className="form-grid form-grid-3">
                      <label className="field"><span>Inclinación desde horizontal</span><div className="input-unit"><input max="90" min="0" type="number" value={project.tiltDeg} onChange={(event) => updateProject("tiltDeg", Number(event.target.value))} /><em>°</em></div></label>
                      <label className="field"><span>Azimut de brújula</span><div className="input-unit"><input max="359" min="0" type="number" value={project.azimuthDeg} onChange={(event) => updateProject("azimuthDeg", Number(event.target.value))} /><em>°</em></div><small>0° norte · 90° este · 180° sur · 270° oeste</small></label>
                      <label className="field"><span>Pérdidas configuradas</span><div className="input-unit"><input max="99" min="0" type="number" value={project.pvgisSystemLossPct} onChange={(event) => updateProject("pvgisSystemLossPct", Number(event.target.value))} /><em>%</em></div></label>
                    </div>
                    <button className="button button-primary" disabled={pvgis.status === "loading"} onClick={requestPvgis} type="button">{pvgis.status === "loading" ? "Consultando…" : "Consultar PVGIS 5.3"}</button>
                    {pvgis.message ? <p className={`api-message api-${pvgis.status}`} role="status">{pvgis.message}</p> : null}
                    <div className="validation-actions">
                      <button className="button button-ghost" disabled={tiltOptimization.status === "loading"} onClick={requestTiltOptimization} type="button">{tiltOptimization.status === "loading" ? "Optimizando…" : "Optimizar inclinación"}</button>
                      <button className="button button-ghost" disabled={pvwattsValidation.status === "loading"} onClick={requestPvwattsValidation} type="button">{pvwattsValidation.status === "loading" ? "Contrastando…" : "Contrastar con PVWatts"}</button>
                    </div>
                    {tiltOptimization.message ? <p className={`api-message api-${tiltOptimization.status}`} role="status">{tiltOptimization.message}</p> : null}
                    {tiltOptimization.data ? (
                      <section className="external-result" aria-label="Resultado de optimización de inclinación">
                        <div><span>Inclinación seleccionada</span><strong>{formatNumber(tiltOptimization.data.selectedTiltDeg, 0)}°</strong></div>
                        <div><span>Ganancia frente a referencia</span><strong>{tiltOptimization.data.gainVsReferencePct === null ? "N/A" : formatPercent(tiltOptimization.data.gainVsReferencePct, 2)}</strong></div>
                        <div><span>Malla evaluada</span><strong>{tiltOptimization.data.evaluations.length} ángulos</strong></div>
                        <button className="text-button" onClick={applyOptimizedTilt} type="button">Aplicar serie óptima →</button>
                      </section>
                    ) : null}
                    {pvwattsValidation.message ? <p className={`api-message api-${pvwattsValidation.status}`} role="status">{pvwattsValidation.message}</p> : null}
                    {pvwattsValidation.metrics && pvwattsValidation.dataset ? (
                      <section className="external-result validation-result" aria-label="Comparación con PVWatts">
                        <div><span>MAE específico</span><strong>{formatNumber(pvwattsValidation.metrics.maeKwh, 1)} kWh/kWp</strong></div>
                        <div><span>RMSE específico</span><strong>{formatNumber(pvwattsValidation.metrics.rmseKwh, 1)} kWh/kWp</strong></div>
                        <div><span>MAPE mensual</span><strong>{pvwattsValidation.metrics.mapePct === null ? "N/A" : formatPercent(pvwattsValidation.metrics.mapePct, 1)}</strong></div>
                        <a href={pvwattsValidation.dataset.sourceUrl} rel="noreferrer" target="_blank">Fuente PVWatts ↗</a>
                      </section>
                    ) : null}
                  </div>
                )}
                <div className="provenance-row"><span className={provenanceClass(project.solarProvenance.kind)}>{project.solarProvenance.kind}</span><p>{project.solarProvenance.label}</p>{project.solarProvenance.sourceUrl ? <a href={project.solarProvenance.sourceUrl} rel="noreferrer" target="_blank">Abrir fuente ↗</a> : null}</div>
              </section>

              <section className="formula-board">
                <div className="formula-board-title"><p className="eyebrow">Representación simbólica</p><h3>La recomendación se puede auditar</h3></div>
                <div className="formula-grid">
                  <article><span>01 · Producción</span><code>{project.solarSourceMode === "manual-hsp" ? "Gₘ = P · hₘ · dₘ · PR" : "Gₘ = P · Yₘ(PVGIS)"}</code><p>Energía mensual producida por un panel.</p></article>
                  <article><span>02 · Necesidad continua</span><code>n* = q · C / G</code><p>Se mantiene continua para poder derivar y comparar.</p></article>
                  <article><span>03 · Decisión física</span><code>N = ⌈n*⌉</code><p>El redondeo ocurre una sola vez, al final.</p></article>
                  <article><span>04 · Restricción</span><code>N · Aₚ · f ≤ Aᵤ</code><p>Comprueba área útil con reserva de instalación.</p></article>
                </div>
              </section>

              {result ? <SensitivityChart sensitivity={result.sensitivity} /> : <div className="empty-state"><p className="eyebrow">Modelo en pausa</p><h3>Faltan datos válidos</h3><p>{calculation.error}</p></div>}
              <button className="button button-primary next-button" disabled={!result} onClick={() => setActiveView("results")} type="button">Ver recomendación <span>→</span></button>
            </div>
          ) : null}

          {activeView === "results" ? (
            <div
              aria-labelledby="tab-results"
              className="panel-stack"
              id="panel-results"
              role="tabpanel"
              tabIndex={0}
            >
              {result ? (
                <>
                  <section className="print-evidence" aria-label="Estado y procedencia del escenario">
                    <p className="print-evidence-mark">{evidenceLabel}</p>
                    <h3>{project.projectName || "Proyecto sin nombre"}</h3>
                    <dl>
                      <div><dt>Consumo</dt><dd>{project.consumptionProvenance.label}</dd></div>
                      <div><dt>Fuente solar</dt><dd>{project.solarProvenance.label}</dd></div>
                      <div><dt>Panel</dt><dd>{project.panelModel || "Pendiente"} · {project.panelProvenance.label}</dd></div>
                      <div><dt>Ubicación general</dt><dd>{project.locationLabel || "Pendiente"}</dd></div>
                    </dl>
                    <p>Prefactibilidad académica; no reemplaza un diseño eléctrico o estructural certificado.</p>
                  </section>
                  <section className={result.roofFeasible ? "decision-banner decision-ok" : "decision-banner decision-warning"}>
                    <div><p className="eyebrow">Decisión preliminar</p><h3>{result.recommendedPanelCount} paneles · {formatNumber(result.recommendedCapacityKwp, 2)} kWp</h3><p>{result.roofFeasible ? `La recomendación cabe en el área declarada y ocuparía aproximadamente ${formatNumber(result.requiredRoofAreaM2, 1)} m².` : `El techo admite ${result.maximumPanelsByRoof}; la meta no es viable por área con el módulo elegido.`}</p></div>
                    <span className="decision-seal">{result.roofFeasible ? "VIABLE" : "REVISAR"}</span>
                  </section>
                  <div className="result-metric-grid">
                    <article><span>Capacidad continua</span><strong>{formatNumber(result.continuousCapacityKwp, 2)} kWp</strong><small>Antes de redondear</small></article>
                    <article><span>Cobertura anual</span><strong>{formatPercent(result.roofFeasible ? result.recommendedAnnualCoveragePct : result.buildableAnnualCoveragePct, 0)}</strong><small>{result.roofFeasible ? "Con recomendación" : "Limitada por techo"}</small></article>
                    <article><span>Producción anual</span><strong>{formatKwh(result.roofFeasible ? result.recommendedAnnualGenerationKwh : result.buildableAnnualGenerationKwh, 0)}</strong><small>Estimación del modelo</small></article>
                    <article><span>Rango por incertidumbre</span><strong>{result.uncertaintyPanelRange.optimisticRounded}–{result.uncertaintyPanelRange.conservativeRounded}</strong><small>Paneles enteros</small></article>
                  </div>
                  <CoverageChart months={result.monthly} useBuildable={!result.roofFeasible} />
                  <section className="result-table-card">
                    <div className="section-heading"><div><span className="section-index">E</span><div><p className="eyebrow">Trazabilidad</p><h3>Resultado mes a mes</h3></div></div></div>
                    <div className="result-table-wrap"><table className="result-table"><thead><tr><th>Mes</th><th>Consumo</th><th>Producción</th><th>Cobertura</th><th>Balance</th><th>n* mensual</th></tr></thead><tbody>{result.monthly.map((month) => { const generation = result.roofFeasible ? month.recommendedGenerationKwh : month.buildableGenerationKwh; const coverage = result.roofFeasible ? month.recommendedCoveragePct : month.buildableCoveragePct; const balance = result.roofFeasible ? month.recommendedBalanceKwh : month.buildableBalanceKwh; return <tr key={month.month}><th scope="row">{month.monthLabel}</th><td>{formatKwh(month.consumptionKwh, 0)}</td><td>{formatKwh(generation, 0)}</td><td><span className={(coverage ?? 0) >= project.targetCoveragePct ? "coverage-chip coverage-good" : "coverage-chip coverage-low"}>{coverage === null ? "N/A" : formatPercent(coverage, 0)}</span></td><td className={balance >= 0 ? "positive" : "negative"}>{formatSigned(balance, 0)} kWh</td><td>{formatNumber(month.continuousPanelsRequired, 2)}</td></tr>; })}</tbody></table></div>
                  </section>
                  <section className="warning-card"><p className="eyebrow">Supuestos y límites</p><ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></section>
                  <section className="export-card"><div><p className="eyebrow">Evidencia</p><h3>Exporta el escenario y conserva la trazabilidad</h3><p>El JSON guarda entradas, resultados y fuentes; el CSV facilita la revisión; la impresión genera un reporte legible.</p></div><div className="export-actions"><button className="button button-ghost" onClick={() => downloadResultsCsv(project, result)} type="button">Resultados CSV</button><button className="button button-ghost" onClick={() => downloadProjectJson(project, result)} type="button">Proyecto JSON</button><button className="button button-primary" onClick={() => window.print()} type="button">Imprimir / guardar PDF</button></div></section>
                </>
              ) : <div className="empty-state"><p className="eyebrow">Sin resultado</p><h3>El modelo necesita datos completos</h3><p>{calculation.error}</p><button className="button button-dark" onClick={() => setActiveView("data")} type="button">Volver a los datos</button></div>}
            </div>
          ) : null}
        </div>

        <aside className="summary-rail">
          <p aria-live="polite" className="sr-only">
            {result
              ? `Resultado actualizado: ${result.recommendedPanelCount} paneles; ${result.roofFeasible ? "área compatible" : "área insuficiente"}.`
              : `Modelo sin resultado: ${calculation.error}`}
          </p>
          <p className="eyebrow">Lectura instantánea</p>
          {result ? (
            <>
              <div className="rail-number"><strong>{result.recommendedPanelCount}</strong><span>paneles requeridos</span></div>
              <div className="rail-divider" />
              <dl><div><dt>Potencia instalada</dt><dd>{formatNumber(result.recommendedCapacityKwp, 2)} kWp</dd></div><div><dt>Área necesaria</dt><dd>{formatNumber(result.requiredRoofAreaM2, 1)} m²</dd></div><div><dt>Máximo por techo</dt><dd>{result.maximumPanelsByRoof}</dd></div><div><dt>Mes exigente</dt><dd>{MONTHS[result.limitingMonth - 1].short}</dd></div></dl>
              <div className={result.roofFeasible ? "rail-verdict verdict-ok" : "rail-verdict verdict-warn"}><span>{result.roofFeasible ? "✓" : "!"}</span><p><strong>{result.roofFeasible ? "Área compatible" : "Área insuficiente"}</strong>{result.roofFeasible ? "La comprobación preliminar pasa." : `Cobertura alcanzable: ${formatPercent(result.buildableAnnualCoveragePct, 0)}.`}</p></div>
              <p className="rail-footnote">No es un diseño eléctrico ni estructural certificado.</p>
            </>
          ) : (
            <div className="rail-empty"><span>···</span><p>{calculation.error}</p></div>
          )}
        </aside>
      </div>
    </section>
  );
}
