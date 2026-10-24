/**
 * Ficha del negocio por rubro (24/10, aprobada por la responsable).
 *
 * Datos reales del negocio que el equipo carga y edita desde Bot IA: qué se
 * ofrece y qué no, zonas, horarios, cómo sigue la gestión, qué nunca se
 * promete y respuestas a objeciones. Se suma a las instrucciones del bot en
 * cada respuesta (en vivo y en «Probar el bot real»). El bot usa solo lo que
 * figura acá: lo que no está, no lo inventa.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export const MAX_FICHA = 6000;

/** Valida el texto de la ficha. Pura. */
export function validarFicha(texto: unknown): { ok: true; ficha: string } | { ok: false; error: string } {
  if (typeof texto !== "string") return { ok: false, error: "La ficha tiene que ser texto." };
  const ficha = texto.replace(/\r\n/g, "\n").trim();
  if (ficha.length > MAX_FICHA) return { ok: false, error: `La ficha es muy larga (máximo ${MAX_FICHA} caracteres).` };
  return { ok: true, ficha };
}

/** Bloque que se suma a las instrucciones del bot. Pura. */
export function bloqueFichaNegocio(ficha: string): string {
  return [
    "FICHA DEL NEGOCIO (datos reales cargados por el equipo; mandan sobre cualquier ejemplo):",
    ficha.trim(),
    "Usá solo lo que figura en esta ficha. Si te preguntan algo que no está, no lo inventes: decí que lo confirma el equipo y seguí con el siguiente paso.",
  ].join("\n");
}

/** Lee la ficha vigente del rubro ("" si no hay). Nunca frena la respuesta. */
export async function leerFichaNegocio(rubroId: string | null): Promise<string> {
  if (!rubroId) return "";
  try {
    const { data } = await createAdminClient().from("rubros").select("*").eq("id", rubroId).maybeSingle();
    const t = (data as any)?.business_sheet;
    return typeof t === "string" ? t.trim() : "";
  } catch (err) {
    console.error("[ficha] No se pudo leer la ficha del negocio:", err);
    return "";
  }
}

/** Guarda la ficha del rubro. */
export async function guardarFichaNegocio(rubroId: string, texto: unknown): Promise<{ ficha: string; actualizada: string }> {
  const v = validarFicha(texto);
  if (!v.ok) throw new Error(v.error);
  const actualizada = new Date().toISOString();
  const { error } = await (createAdminClient().from("rubros") as any)
    .update({ business_sheet: v.ficha, business_sheet_updated_at: actualizada })
    .eq("id", rubroId);
  if (error) throw new Error(error.message);
  return { ficha: v.ficha, actualizada };
}
