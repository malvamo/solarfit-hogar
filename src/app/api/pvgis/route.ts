import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchPvgisYield } from "@/services/pvgis";

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
          error: "Los parámetros solares no son válidos.",
          details: body.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await fetchPvgisYield(body.data);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible consultar PVGIS.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
