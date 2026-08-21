"use client";

import {
  getProjectEvidenceStatus,
  SOLAR_PROJECT_SCHEMA_VERSION,
} from "@/domain/solar/project-schema";
import type { SolarProjectInput, SolarProjectResult } from "@/domain/solar/types";

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function safeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "solarfit";
}

export function serializeProjectJson(
  project: SolarProjectInput,
  result: SolarProjectResult,
  exportedAt = new Date(),
) {
  return JSON.stringify(
    {
      schemaVersion: SOLAR_PROJECT_SCHEMA_VERSION,
      exportedAt: exportedAt.toISOString(),
      project,
      result,
    },
    null,
    2,
  );
}

export function downloadProjectJson(project: SolarProjectInput, result: SolarProjectResult) {
  downloadText(
    `${safeName(project.projectName)}.json`,
    serializeProjectJson(project, result),
    "application/json;charset=utf-8",
  );
}

export function downloadResultsCsv(project: SolarProjectInput, result: SolarProjectResult) {
  const useBuildable = !result.roofFeasible;
  const exportedAt = new Date().toISOString();
  const evidenceStatus = getProjectEvidenceStatus(project);
  const csvCell = (value: string | number) => {
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const rows = [
    [
      "project_name",
      "evidence_status",
      "exported_at",
      "panel_model",
      "solar_source_mode",
      "solar_source_label",
      "month",
      "scenario",
      "consumption_kwh",
      "specific_yield_kwh_per_kwp",
      "generation_kwh",
      "coverage_pct",
      "balance_kwh",
    ].map(csvCell).join(","),
    ...result.monthly.map((month) =>
      [
        project.projectName,
        evidenceStatus,
        exportedAt,
        project.panelModel,
        project.solarSourceMode,
        project.solarProvenance.label,
        month.month,
        useBuildable ? "buildable_by_roof" : "recommended_energy",
        month.consumptionKwh.toFixed(3),
        month.specificYieldKwhPerKwpUsed.toFixed(3),
        (useBuildable
          ? month.buildableGenerationKwh
          : month.recommendedGenerationKwh
        ).toFixed(3),
        (useBuildable
          ? month.buildableCoveragePct
          : month.recommendedCoveragePct
        )?.toFixed(3) ?? "",
        (useBuildable
          ? month.buildableBalanceKwh
          : month.recommendedBalanceKwh
        ).toFixed(3),
      ].map(csvCell).join(","),
    ),
  ];
  downloadText(
    `${safeName(project.projectName)}-resultados.csv`,
    `\uFEFF${rows.join("\n")}`,
    "text/csv;charset=utf-8",
  );
}

export function downloadCsvTemplate(content: string) {
  downloadText("plantilla-consumo-solarfit.csv", content, "text/csv;charset=utf-8");
}
