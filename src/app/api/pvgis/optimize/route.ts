import { NextResponse } from "next/server";
import { z } from "zod";

import {
  MAX_PVGIS_TILT_CANDIDATES,
  optimizePvgisTilt,
} from "@/services/pvgis-optimization";

const requestSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  azimuthDeg: z.number().finite().min(0).lt(360),
  systemLossPct: z.number().finite().min(0).max(99),
  candidateTiltsDeg: z
    .array(z.number().finite().min(0).max(90))
    .min(2)
    .max(MAX_PVGIS_TILT_CANDIDATES),
  referenceTiltDeg: z.number().finite().min(0).max(90).optional(),
}).superRefine((value, context) => {
  const ordered = [...value.candidateTiltsDeg].toSorted((a, b) => a - b);
  const hasDuplicate = ordered.some(
    (angle, index) => index > 0 && Math.abs(angle - ordered[index - 1]) <= 1e-9,
  );
  if (hasDuplicate) {
    context.addIssue({
      code: "custom",
      path: ["candidateTiltsDeg"],
      message: "Las inclinaciones candidatas no pueden repetirse.",
    });
  }

  const referenceTiltDeg = value.referenceTiltDeg;
  if (
    referenceTiltDeg !== undefined &&
    !ordered.some((angle) => Math.abs(angle - referenceTiltDeg) <= 1e-9)
  ) {
    context.addIssue({
      code: "custom",
      path: ["referenceTiltDeg"],
      message: "La inclinación de referencia debe estar incluida entre las candidatas.",
    });
  }
});

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud debe ser JSON válido." },
        { status: 400 },
      );
    }

    const body = requestSchema.safeParse(payload);
    if (!body.success) {
      return NextResponse.json(
        {
          error: "Los parámetros para optimizar la inclinación no son válidos.",
          details: body.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await optimizePvgisTilt(body.data);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "No fue posible optimizar la inclinación con PVGIS.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
