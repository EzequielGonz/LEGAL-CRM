import { createAdminClient } from "@/lib/supabase/admin";
import { descifrar } from "@/lib/wasender/cifrado";
import { cuerpoMensaje, enviarMensaje, type ClienteDeps } from "@/lib/wasender/cliente";

/**
 * Envío de un mensaje de chat por una línea de Wasender (10/11). Lo llama
 * `sendOutboundMessage` solo cuando la conversación habla por Wasender, después
 * de todas las validaciones de siempre (pausa, horario, detención, chat tomado).
 */

type Env = Record<string, string | undefined>;

/** Interruptor general: sin WASENDER_HABILITADO=true, Wasender no envía nada aunque el código esté publicado. */
export function wasenderHabilitado(env: Env = process.env): boolean {
  return (env.WASENDER_HABILITADO ?? "").trim() === "true";
}

/** La línea no puede enviar ahora (apagada, desconectada, sin clave). No es una falla del sistema. */
export class LineaWasenderNoDisponible extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LineaWasenderNoDisponible";
  }
}

export interface LineaParaEnviar {
  id: string;
  nombre: string;
  habilitada: boolean;
  estado: string | null;
  api_key_cifrada: string | null;
  archivada_at: string | null;
}

/** Comprueba que la línea pueda enviar. Pura: se prueba sola. */
export function motivoNoDisponible(linea: LineaParaEnviar | null, env: Env = process.env): string | null {
  if (!wasenderHabilitado(env)) return "Wasender está apagado en este entorno: no se envió.";
  if (!linea) return "La línea de Wasender de esta conversación no existe: no se envió.";
  if (linea.archivada_at) return `La línea de Wasender «${linea.nombre}» está archivada: no se envió.`;
  if (!linea.habilitada) return `La línea de Wasender «${linea.nombre}» está apagada: no se envió.`;
  if ((linea.estado ?? "") !== "connected") return `La línea de Wasender «${linea.nombre}» no está conectada (${linea.estado ?? "sin estado"}): no se envió.`;
  if (!linea.api_key_cifrada) return `La línea de Wasender «${linea.nombre}» no tiene su clave guardada: no se envió.`;
  return null;
}

export interface EnvioWasender {
  lineaId: string;
  to: string;
  body: string;
  media?: { kind: "image" | "video" | "document"; link: string; filename?: string } | null;
  /** Nombre de la plantilla propia, si el texto salió de una (el bot la ve en el historial). */
  plantilla?: string | null;
}

export async function enviarPorWasender(
  envio: EnvioWasender,
  deps: ClienteDeps & { supabase?: ReturnType<typeof createAdminClient> } = {}
): Promise<{ msgId: string | null; externalId: string | null; metadata: Record<string, unknown> }> {
  const env = deps.env ?? process.env;
  if (!wasenderHabilitado(env)) throw new LineaWasenderNoDisponible("Wasender está apagado en este entorno: no se envió.");
  const supabase = deps.supabase ?? createAdminClient();
  const { data, error } = await supabase
    .from("wasender_lineas")
    .select("id, nombre, habilitada, estado, api_key_cifrada, archivada_at")
    .eq("id", envio.lineaId)
    .maybeSingle();
  if (error) throw new LineaWasenderNoDisponible(`No se pudo leer la línea de Wasender: ${error.message}`);
  const linea = (data as LineaParaEnviar | null) ?? null;
  const motivo = motivoNoDisponible(linea, env);
  if (motivo) throw new LineaWasenderNoDisponible(motivo);
  const apiKey = descifrar(linea!.api_key_cifrada, env);
  if (!apiKey) throw new LineaWasenderNoDisponible(`No se pudo leer la clave de la línea «${linea!.nombre}» (¿cambió WASENDER_CLAVE_CIFRADO?): no se envió.`);

  const r = await enviarMensaje(apiKey, cuerpoMensaje({ to: envio.to, body: envio.body, media: envio.media ?? null }), deps);
  return {
    msgId: r.msgId,
    // El aviso de entrega de Wasender trae otro id: cuando llega el eco del envío se reemplaza por ese.
    externalId: r.msgId ? `wasender:${r.msgId}` : null,
    metadata: {
      proveedor: "wasender",
      wasender_line_id: envio.lineaId,
      wasender_msg_id: r.msgId,
      wasender_pendiente: true,
      ...(envio.plantilla ? { plantilla: envio.plantilla } : {}),
    },
  };
}
