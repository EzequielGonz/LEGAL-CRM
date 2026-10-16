import { NextResponse } from "next/server";
import { AgentesError } from "@/lib/agentes/servicio";

/** Respuesta uniforme de error para las rutas de agentes (Etapa 3). */
export function responderError(err: unknown) {
  if (err instanceof AgentesError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error("[agentes] Error no previsto:", err);
  return NextResponse.json({ error: "No se pudo completar la acción." }, { status: 500 });
}
