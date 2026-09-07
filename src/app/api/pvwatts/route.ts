import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchPvwattsYield } from "@/services/pvwatts";
import { SolarProviderConfigurationError } from "@/services/solar-yield";

const requestSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  tiltDeg: z.number().finite().min(0).max(90),
  azimuthDeg: z.number().finite().min(0).lt(360),
  systemLossPct: z.number().finite().min(0).max(99),
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
          error: "Los parámetros para contrastar con PVWatts no son válidos.",
          details: body.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await fetchPvwattsYield(body.data);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof SolarProviderConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const message = error instanceof Error
      ? error.message
      : "No fue posible consultar PVWatts.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
