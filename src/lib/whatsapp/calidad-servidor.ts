/**
 * Calidad de las líneas en Meta (24/10, decisión de la responsable): si
 * Meta califica una línea de cualquier rubro con calidad BAJA, se pausan
 * sus campañas en curso y se avisa (Salud del sistema y aviso a los
 * dispositivos). Las campañas no se reanudan solas: las retoma una persona
 * cuando la calidad mejora. Solo lee de Meta; no envía mensajes a nadie.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { consultarEstadoLinea } from "@/lib/whatsapp/estado-linea";
import { sendToDevices } from "@/lib/push";

export const CLAVE_CALIDAD = "calidad_lineas";
/** Cada cuánto se le pregunta a Meta (la calificación cambia lento). */
export const CADA_MIN = 10;

export interface EstadoCalidadLinea {
  label: string;
  rubroId: string;
  calidad: string | null;
  /** Desde cuándo está en baja (si lo está). */
  desde: string | null;
  /** Campañas pausadas por la calidad baja. */
  pausadas: string[];
}

export interface EstadoCalidad {
  at: string | null;
  lineas: Record<string, EstadoCalidadLinea>;
}

/** Motivo de pausa que se ve en Campañas. Pura. */
export function motivoPausaCalidad(label: string): string {
  return `Pausada automáticamente: Meta califica la línea ${label} con calidad baja. Retomala cuando la calidad mejore.`;
}

/** ¿Toca consultar a Meta? Pura. */
export function tocaConsultar(ultima: string | null, ahora: Date): boolean {
  return !ultima || ahora.getTime() - Date.parse(ultima) >= CADA_MIN * 60_000;
}

export async function leerEstadoCalidad(): Promise<EstadoCalidad> {
  const { data } = await createAdminClient().from("system_settings").select("value").eq("key", CLAVE_CALIDAD).maybeSingle();
  const v = (data as any)?.value;
  return v && typeof v === "object" ? { at: v.at ?? null, lineas: v.lineas ?? {} } : { at: null, lineas: {} };
}

/** Pausa las campañas en curso de una línea. Devuelve sus nombres. */
export async function pausarCampanasDeLinea(lineId: string, label: string): Promise<string[]> {
  const s = createAdminClient();
  const { data } = await (s.from("campaigns") as any)
    .update({ status: "pausada", pause_reason: motivoPausaCalidad(label), paused_at: new Date().toISOString() })
    .eq("line_id", lineId)
    .eq("status", "en_curso")
    .select("name");
  return ((data ?? []) as { name: string }[]).map((c) => c.name);
}

/** Lo corre el latido. Como mucho una consulta a Meta por línea cada 10 minutos. */
export async function vigilarCalidadLineas(ahora = new Date()): Promise<unknown> {
  const s = createAdminClient();
  const previo = await leerEstadoCalidad();
  if (!tocaConsultar(previo.at, ahora)) return "consultado hace menos de 10 min";
  const { data: lineas } = await s.from("profile_lines").select("id, label, rubro_id, credential_key").eq("active", true);
  const nuevo: EstadoCalidad = { at: ahora.toISOString(), lineas: {} };
  const avisos: string[] = [];
  for (const l of (lineas ?? []) as { id: string; label: string; rubro_id: string; credential_key: string }[]) {
    const inf = await consultarEstadoLinea(l.credential_key, { memoria: true });
    const antes = previo.lineas[l.id];
    // Si Meta no respondió, se conserva lo último conocido (no se levanta ni se agrega nada).
    if (inf.estado === "no_comprobado" || inf.estado === "sin_credenciales") {
      if (antes) nuevo.lineas[l.id] = antes;
      continue;
    }
    if (inf.calidad === "baja") {
      const pausadas = await pausarCampanasDeLinea(l.id, l.label);
      const nuevaBaja = antes?.calidad !== "baja";
      nuevo.lineas[l.id] = {
        label: l.label,
        rubroId: l.rubro_id,
        calidad: "baja",
        desde: nuevaBaja ? ahora.toISOString() : antes?.desde ?? ahora.toISOString(),
        pausadas: Array.from(new Set([...(antes?.pausadas ?? []), ...pausadas])),
      };
      if (nuevaBaja || pausadas.length) {
        avisos.push(`Línea ${l.label}: calidad baja en Meta.${pausadas.length ? ` Se pausó: ${pausadas.join(", ")}.` : " No tenía campañas en curso."}`);
      }
    } else {
      nuevo.lineas[l.id] = { label: l.label, rubroId: l.rubro_id, calidad: inf.calidad, desde: null, pausadas: [] };
    }
  }
  await s.from("system_settings").upsert({ key: CLAVE_CALIDAD, value: nuevo as any }, { onConflict: "key" });
  for (const texto of avisos) {
    try {
      await sendToDevices({ title: "Calidad baja en una línea de WhatsApp", body: texto, url: "/salud", tag: "calidad-linea", kind: "aviso", eventKey: `calidad:${texto}:${ahora.toISOString().slice(0, 13)}` });
    } catch (err) {
      console.error("[calidad] No se pudo enviar el aviso:", err);
    }
  }
  return { lineas: Object.values(nuevo.lineas).map((l) => `${l.label}: ${l.calidad ?? "sin dato"}`), avisos };
}
