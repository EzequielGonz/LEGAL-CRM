/**
 * Etapa 2 · Bloque 5 — Cola duradera de publicación (preparada, sin conectar).
 *
 *  - crearPieza: guarda la pieza con su clave de deduplicación (perfil,
 *    canal, texto, destino y fecha): repetir la misma pieza no la duplica.
 *  - publicarVencidas: reserva atómica (content_claim), revalida política y
 *    pieza justo antes de publicar, llama al publicador del destino y
 *    guarda el identificador o enlace que devuelve. Un resultado incierto
 *    (sin respuesta) NO se reintenta a ciegas: primero se reconcilia
 *    buscando la pieza en el destino por su clave.
 *  - No hay publicador real conectado: por defecto, «sin conexión» y la
 *    pieza vuelve a «lista» con el motivo.
 */

import { createHash, randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MOTIVO_RETENCION_TEXTO,
  clasificarFalloPublicacion,
  estadoInicial,
  evaluarPieza,
  type Canal,
  type Formato,
  type PiezaContenido,
  type PoliticaContenido,
} from "@/lib/contenido/politica";

export interface ResultadoDestino {
  id: string;
  url?: string | null;
}

export interface Publicador {
  /** Publica o programa en el destino. Error con `tipo` para clasificar. */
  publicar(pieza: { id: string; dedupe_key: string; canal: Canal; formato: Formato; texto: string; titulo?: string | null; cta_url?: string | null; media?: unknown; programada_para?: string | null; zona_horaria: string }, destino: string): Promise<ResultadoDestino>;
  /** Busca en el destino una pieza ya publicada con esa clave (reconciliación). */
  buscar(dedupeKey: string, destino: string): Promise<ResultadoDestino | null>;
}

export class SinConexionError extends Error {
  tipo = "sin_conexion";
  constructor() {
    super("No hay una cuenta conectada para publicar en este destino.");
  }
}

/** Publicador por defecto: no hay ninguna conexión habilitada todavía. */
export const PUBLICADOR_NO_CONECTADO: Publicador = {
  async publicar() {
    throw new SinConexionError();
  },
  async buscar() {
    return null;
  },
};

export function claveDeduplicacion(input: { rubroId: string; canal: string; texto: string; destino?: string | null; programadaPara?: string | null }): string {
  const norm = input.texto.replace(/\s+/g, " ").trim().toLowerCase();
  return createHash("sha256")
    .update([input.rubroId, input.canal, input.destino ?? "", input.programadaPara ?? "", norm].join(String.fromCharCode(0)))
    .digest("hex");
}

export async function politica(rubroId: string, canal: Canal): Promise<PoliticaContenido & { zona_horaria: string; proveedor: string | null }> {
  const { data } = await createAdminClient().from("content_policies").select("*").eq("rubro_id", rubroId).eq("canal", canal).maybeSingle();
  return {
    habilitada: data?.habilitada === true,
    calendario_pausado: data ? data.calendario_pausado !== false : true,
    destino_ref: data?.destino_ref ?? null,
    ctas: Array.isArray(data?.ctas) ? data.ctas : [],
    hechos_autorizados: Array.isArray(data?.hechos_autorizados) ? data.hechos_autorizados : [],
    zona_horaria: data?.zona_horaria ?? "America/Argentina/Buenos_Aires",
    proveedor: data?.proveedor ?? null,
  };
}

export async function crearPieza(input: PiezaContenido & { rubroId: string; programadaPara?: string | null; createdBy?: string; id?: string }) {
  const supabase = createAdminClient();
  const pol = await politica(input.rubroId, input.canal);
  const ev = evaluarPieza(input, pol);
  const estado = estadoInicial(ev, !!input.programadaPara);
  const dedupe_key = claveDeduplicacion({ rubroId: input.rubroId, canal: input.canal, texto: input.texto, destino: pol.destino_ref, programadaPara: input.programadaPara ?? null });
  const { data, error } = await supabase
    .from("content_pieces")
    .insert({
      ...(input.id ? { id: input.id } : {}),
      rubro_id: input.rubroId,
      canal: input.canal,
      formato: input.formato,
      titulo: input.titulo ?? null,
      texto: input.texto,
      cta_url: input.cta_url ?? null,
      media: input.media ?? [],
      afirmaciones: input.afirmaciones ?? [],
      estado,
      motivo: ev.motivos.length ? ev.motivos.map((m) => MOTIVO_RETENCION_TEXTO[m]).join(" · ") : null,
      programada_para: input.programadaPara ?? null,
      zona_horaria: pol.zona_horaria,
      dedupe_key,
      proveedor: pol.proveedor,
      created_by: input.createdBy ?? "sistema",
    })
    .select("id, estado, motivo")
    .maybeSingle();
  if (error && (error as any).code === "23505") {
    const { data: existente } = await supabase.from("content_pieces").select("id, estado, motivo").eq("dedupe_key", dedupe_key).maybeSingle();
    return { ...existente, duplicada: true, evaluacion: ev };
  }
  if (error) throw new Error(`No se pudo guardar la pieza: ${error.message}`);
  return { ...data, duplicada: false, evaluacion: ev };
}

async function registrar(piezaId: string, resultado: string, detalle: string | null, extra: { proveedor_id?: string | null; url?: string | null } = {}) {
  await createAdminClient().from("content_publish_attempts").insert({ pieza_id: piezaId, resultado, detalle, proveedor_id: extra.proveedor_id ?? null, url: extra.url ?? null });
}

async function cerrar(id: string, token: string, cambios: Record<string, unknown>) {
  await createAdminClient()
    .from("content_pieces")
    .update({ ...cambios, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("claim_token", token);
}

export async function publicarVencidas(opts: { publicador?: Publicador; now?: Date; limit?: number } = {}) {
  const publicador = opts.publicador ?? PUBLICADOR_NO_CONECTADO;
  const now = opts.now ?? new Date();
  const supabase = createAdminClient();
  const { data: piezas } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("estado", "programada")
    // Las que ya se programaron en Metricool las publica Metricool en su fecha.
    .is("proveedor_id", null)
    .lte("programada_para", now.toISOString())
    .order("programada_para", { ascending: true })
    .limit(opts.limit ?? 20);
  const out: { id: string; resultado: string; detalle?: string }[] = [];
  for (const p of piezas ?? []) {
    const token = randomUUID();
    const { data: ok } = await supabase.rpc("content_claim", { p_pieza: p.id, p_token: token });
    if (ok !== true) {
      out.push({ id: p.id, resultado: "omitida", detalle: "otra ejecución la tomó" });
      continue;
    }
    // Revalidación inmediatamente antes de publicar.
    const pol = await politica(p.rubro_id, p.canal);
    const ev = evaluarPieza(p, pol);
    if (!ev.publicable) {
      const motivo = ev.motivos.map((m) => MOTIVO_RETENCION_TEXTO[m]).join(" · ");
      await cerrar(p.id, token, { estado: ev.retener ? "retenida" : "lista", motivo, claim_token: null });
      await registrar(p.id, "retenida", motivo);
      out.push({ id: p.id, resultado: ev.retener ? "retenida" : "lista", detalle: motivo });
      continue;
    }
    // Reconciliación: si un intento anterior quedó incierto, puede que ya esté publicada.
    if ((p.intentos ?? 0) > 0) {
      const ya = await publicador.buscar(p.dedupe_key, pol.destino_ref!).catch(() => null);
      if (ya) {
        await cerrar(p.id, token, { estado: "publicada", proveedor_id: ya.id, url_publicada: ya.url ?? null, publicada_at: now.toISOString(), motivo: null });
        await registrar(p.id, "reconciliada", "Ya estaba publicada en el destino", { proveedor_id: ya.id, url: ya.url ?? null });
        out.push({ id: p.id, resultado: "publicada", detalle: "reconciliada" });
        continue;
      }
    }
    try {
      const r = await publicador.publicar(p, pol.destino_ref!);
      if (!r?.id) throw Object.assign(new Error("El destino no devolvió identificador"), { tipo: "sin_respuesta" });
      await cerrar(p.id, token, { estado: "publicada", proveedor_id: r.id, url_publicada: r.url ?? null, publicada_at: new Date().toISOString(), motivo: null });
      await registrar(p.id, "publicada", null, { proveedor_id: r.id, url: r.url ?? null });
      out.push({ id: p.id, resultado: "publicada" });
    } catch (err: any) {
      if (err instanceof SinConexionError || err?.tipo === "sin_conexion") {
        await cerrar(p.id, token, { estado: "lista", motivo: err.message, claim_token: null });
        await registrar(p.id, "omitida", err.message);
        out.push({ id: p.id, resultado: "lista", detalle: "sin_conexion" });
        continue;
      }
      const clase = clasificarFalloPublicacion(err);
      const detalle = String(err?.message ?? err).slice(0, 300);
      if (clase === "token_vencido") {
        // Token vencido: se detiene ese destino y se pide reconexión; nunca se usa otra cuenta.
        await supabase.from("content_policies").update({ calendario_pausado: true, updated_at: new Date().toISOString() }).eq("rubro_id", p.rubro_id).eq("canal", p.canal);
        await cerrar(p.id, token, { estado: "error", motivo: "La conexión venció: hay que volver a conectar la cuenta. El calendario de este canal quedó en pausa." });
      } else {
        await cerrar(p.id, token, { estado: clase, motivo: clase === "incierta" ? `No se sabe si se publicó: se reconcilia antes de repetir. ${detalle}` : detalle });
      }
      await registrar(p.id, clase === "token_vencido" ? "error" : clase, detalle);
      out.push({ id: p.id, resultado: clase, detalle });
    }
  }
  return out;
}

/** Una pieza incierta vuelve a la cola solo para reconciliar (nunca se publica dos veces). */
export async function reconciliarIncierta(piezaId: string) {
  const { data } = await createAdminClient()
    .from("content_pieces")
    .update({ estado: "programada", updated_at: new Date().toISOString() })
    .eq("id", piezaId)
    .eq("estado", "incierta")
    .select("id")
    .maybeSingle();
  return !!data;
}
