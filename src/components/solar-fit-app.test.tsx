import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SolarFitApp } from "@/components/solar-fit-app";

describe("SolarFitApp", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("presenta el caso calibrado y el contraste sin lenguaje de medición real", () => {
    const { container } = render(<SolarFitApp />);

    expect(screen.getByText("SIMULACIÓN CALIBRADA · NO ES MEDICIÓN")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cargar caso calibrado" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Crear caso propio" })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: /Modelo/ }));

    expect(screen.getByText("Estimación con PVGIS")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Comparar inclinaciones" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Contrastar con PVWatts" })).toBeTruthy();
    expect(container.textContent).not.toMatch(/simulación oficial|datos reales|convexidad/i);
  });
});
