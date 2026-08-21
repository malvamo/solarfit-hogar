import { beforeEach, describe, expect, it } from "vitest";

import { DEMO_PROJECT } from "@/data/demo-project";
import {
  loadProjectDraft,
  saveProjectDraft,
  SOLAR_PROJECT_STORAGE_KEY,
} from "./project-storage";

describe("borrador local versionado", () => {
  beforeEach(() => localStorage.clear());

  it("distingue un navegador sin borrador", () => {
    expect(loadProjectDraft()).toEqual({ project: null, status: "empty" });
  });

  it("guarda y recupera un proyecto estructuralmente válido", () => {
    expect(saveProjectDraft(DEMO_PROJECT)).toBe(true);
    expect(loadProjectDraft()).toEqual({ project: DEMO_PROJECT, status: "loaded" });
  });

  it("descarta JSON corrupto sin bloquear la aplicación", () => {
    localStorage.setItem(SOLAR_PROJECT_STORAGE_KEY, "{corrupto");

    expect(loadProjectDraft()).toEqual({ project: null, status: "discarded" });
    expect(localStorage.getItem(SOLAR_PROJECT_STORAGE_KEY)).toBeNull();
  });

  it("descarta objetos incompletos aunque sean JSON válido", () => {
    localStorage.setItem(SOLAR_PROJECT_STORAGE_KEY, JSON.stringify({ projectName: "Incompleto" }));

    expect(loadProjectDraft()).toEqual({ project: null, status: "discarded" });
    expect(localStorage.getItem(SOLAR_PROJECT_STORAGE_KEY)).toBeNull();
  });
});
