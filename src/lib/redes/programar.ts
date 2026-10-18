/**
 * Programación de publicaciones desde el panel (18/10).
 *
 * Cada pieza confirmada se guarda en la cola de Contenido (con sus
 * controles: texto, enlace autorizado, imagen con texto alternativo,
 * afirmaciones sensibles) y, si la política del canal está habilitada y la
 * marca de Metricool conectada, se programa en Metricool con su fecha. Lo
 * que no cumple queda «lista» o «retenida» con el motivo a la vista: nunca
 * se publica algo que no pasó los controles.
 */
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearPieza, politica } from "@/lib/contenido/cola";
import type { Canal, Formato } from "@/lib/contenido/politica";
import { MetricoolError, programarEnMetricool } from "@/lib/redes/metricool";

export interface PiezaPlan {
  canal: Extract<Canal, "instagram" | "facebook">;
  formato: Extract<Formato, "post" | "carrusel" | "historia">;
  /** ISO (UTC). */
  fecha: string;
  titular: string;
  texto: string;
  /** Carrusel: el texto de cada diapositiva (2 a 6). */
  diapositivas?: string[];
  tema?: string;
}

/** Dirección pública del panel (para que Metricool pueda leer las imágenes). */
export function urlPublica(env: Record<string, string | undefined> = process.env): string | null {
  const directa = (env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/$/, "");
  if (/^https:\/\//.test(directa)) return directa;
  const vercel = (env.VERCEL_PROJECT_PRODUCTION_URL ?? "").trim();
  return vercel ? `https://${vercel}` : null;
}

/** Imágenes de una pieza: una por diapositiva (o una sola). Pura. */
export function mediaDePieza(base: string | null, id: string, p: Pick<PiezaPlan, "formato" | "titular" | "diapositivas">): { tipo: "imagen"; ref: string; alt: string; texto: string }[] {
  if (!base) return [];
  const textos = p.formato === "carrusel" && p.diapositivas?.length ? [p.titular, ...p.diapositivas].slice(0, 7) : [p.titular];
  return textos.map((t, i) => ({ tipo: "imagen", ref: `${base}/piezas/${id}/${i + 1}.png`, alt: t.slice(0, 200), texto: t.slice(0, 280) }));
}

export interface ResultadoProgramacion {
  id: string | null;
  canal: string;
  formato: string;
  fecha: string;
  estado: string;
  motivo: string | null;
  metricool: "programada" | "no_conectado" | "error" | "no_corresponde";
}

export interface CtaCanal {
  /** Enlace autorizado (el de la política del canal). */
  url: string;
  /** Línea que se agrega al final del texto. */
  linea: string;
}

export async function programarPiezas(rubroId: string, piezas: PiezaPlan[], ctaPorCanal: Record<string, CtaCanal | null>, autor = "asistente"): Promise<ResultadoProgramacion[]> {
  const supabase = createAdminClient();
  const base = urlPublica();
  const out: ResultadoProgramacion[] = [];
  for (const p of piezas) {
    const id = randomUUID();
    const cta = ctaPorCanal[p.canal] ?? null;
    const media = mediaDePieza(base, id, p);
    const texto = cta && p.formato !== "historia" ? `${p.texto.trim()}\n\n${cta.linea}` : p.texto.trim();
    const r: any = await crearPieza({
      id,
      rubroId,
      canal: p.canal,
      formato: p.formato,
      titulo: p.titular,
      texto,
      cta_url: cta?.url ?? null,
      media,
      afirmaciones: [],
      programadaPara: p.fecha,
      createdBy: autor,
    });
    const fila: ResultadoProgramacion = { id: r?.id ?? null, canal: p.canal, formato: p.formato, fecha: p.fecha, estado: r?.estado ?? "error", motivo: r?.motivo ?? null, metricool: "no_corresponde" };
    if (r?.id && r.estado === "programada" && !r.duplicada) {
      const pol = await politica(rubroId, p.canal);
      if (pol.proveedor === "metricool" && pol.destino_ref) {
        try {
          const m = await programarEnMetricool(pol.destino_ref, {
            canal: p.canal,
            formato: p.formato,
            texto,
            media: media.map((x) => x.ref),
            alt: media.map((x) => x.alt),
            fecha: p.fecha,
            zonaHoraria: pol.zona_horaria,
          });
          await supabase.from("content_pieces").update({ proveedor_id: m.id, url_publicada: m.url, motivo: null, updated_at: new Date().toISOString() }).eq("id", r.id);
          await supabase.from("content_publish_attempts").insert({ pieza_id: r.id, resultado: "omitida", detalle: "Programada en Metricool para su fecha", proveedor_id: m.id, url: m.url });
          fila.metricool = "programada";
        } catch (err) {
          const e = err as MetricoolError;
          const motivo = String(e?.message ?? err).slice(0, 300);
          const sinConexion = e?.tipo === "sin_conexion";
          await supabase
            .from("content_pieces")
            .update({ estado: sinConexion ? "lista" : "error", motivo, updated_at: new Date().toISOString() })
            .eq("id", r.id);
          fila.estado = sinConexion ? "lista" : "error";
          fila.motivo = motivo;
          fila.metricool = sinConexion ? "no_conectado" : "error";
        }
      } else {
        fila.metricool = "no_conectado";
      }
    }
    out.push(fila);
  }
  return out;
}
