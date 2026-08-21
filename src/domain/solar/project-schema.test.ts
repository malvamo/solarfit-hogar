import { describe, expect, it } from "vitest";

import { DEMO_PROJECT } from "@/data/demo-project";
import { calculateSolarProject } from "./calculate";
import {
  parseSolarProjectJson,
  SOLAR_PROJECT_SCHEMA_VERSION,
} from "./project-schema";
import { serializeProjectJson } from "@/lib/downloads";

function cloneDemo() {
  return structuredClone(DEMO_PROJECT);
}

describe("archivo de proyecto SolarFit", () => {
  it("restaura el mismo proyecto desde el JSON realmente exportado", () => {
    const project = cloneDemo();
    const json = serializeProjectJson(
      project,
      calculateSolarProject(project),
      new Date("2026-08-21T12:00:00.000Z"),
    );

    expect(parseSolarProjectJson(json)).toEqual(project);
    expect(JSON.parse(json)).toMatchObject({
      schemaVersion: SOLAR_PROJECT_SCHEMA_VERSION,
      exportedAt: "2026-08-21T12:00:00.000Z",
    });
  });

  it("rechaza versiones futuras en vez de interpretarlas por fuerza", () => {
    expect(() =>
      parseSolarProjectJson(JSON.stringify({ schemaVersion: 2, project: cloneDemo() })),
    ).toThrow("no es compatible");
  });

  it("rechaza meses duplicados", () => {
    const project = cloneDemo();
    project.months[11].month = 11;

    expect(() => parseSolarProjectJson(JSON.stringify(project))).toThrow(
      "no cumple el esquema",
    );
  });

  it("rechaza URLs de procedencia con protocolos no navegables", () => {
    const project = cloneDemo();
    project.solarProvenance.sourceUrl = "javascript:alert(1)";

    expect(() => parseSolarProjectJson(JSON.stringify(project))).toThrow(
      "no cumple el esquema",
    );
  });

  it("explica cuando el texto no es JSON válido", () => {
    expect(() => parseSolarProjectJson("{sin-cerrar")).toThrow("JSON válido");
  });
});
