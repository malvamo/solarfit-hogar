"use client";

import { parseSolarProjectJson } from "@/domain/solar/project-schema";
import type { SolarProjectInput } from "@/domain/solar/types";

export const SOLAR_PROJECT_STORAGE_KEY = "solarfit:project:v1";

export interface DraftLoadResult {
  project: SolarProjectInput | null;
  status: "empty" | "loaded" | "discarded";
}

export function loadProjectDraft(): DraftLoadResult {
  try {
    const raw = localStorage.getItem(SOLAR_PROJECT_STORAGE_KEY);
    if (!raw) return { project: null, status: "empty" };
    return { project: parseSolarProjectJson(raw), status: "loaded" };
  } catch {
    try {
      localStorage.removeItem(SOLAR_PROJECT_STORAGE_KEY);
    } catch {
      // El almacenamiento puede estar bloqueado; el cálculo continúa en memoria.
    }
    return { project: null, status: "discarded" };
  }
}

export function saveProjectDraft(project: SolarProjectInput) {
  try {
    localStorage.setItem(SOLAR_PROJECT_STORAGE_KEY, JSON.stringify(project));
    return true;
  } catch {
    return false;
  }
}

export function removeProjectDraft() {
  try {
    localStorage.removeItem(SOLAR_PROJECT_STORAGE_KEY);
  } catch {
    // El almacenamiento puede estar bloqueado. No afecta el cálculo en memoria.
  }
}
