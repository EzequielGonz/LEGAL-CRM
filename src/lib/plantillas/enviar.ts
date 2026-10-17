import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS } from "@/lib/rubros";
import { PLANTILLAS_PROPUESTAS, type PlantillaPropuesta } from "@/lib/plantillas/propuestas";
import { findWabaTemplate, MetaApiError, metaErrorText, META_GRAPH_VERSION } from "@/lib/plantillas/meta";
import { MissingAccessError, wabaEnvName } from "@/lib/plantillas";

/**
 * Envío de las plantillas propuestas de un rubro a Meta para su revisión.
 * NO envía mensajes a ninguna persona: solo registra la plantilla en la
 * cuenta de WhatsApp Business de la línea y Meta decide su aprobación.
 *
 * Sin `confirmar: true` solo informa qué se enviaría (vista previa). Las
 * que ya existen en la cuenta (mismo nombre e idioma) se omiten. El token
 * se lee de la configuración privada del servidor y nunca se devuelve.
 */
const LANGUAGE = "es_AR";
const EJEMPLOS = ["Laura", "Martín", "Estudio Ejemplo", "Consulta"];

export interface ResultadoEnvio {
  nombre: string;
  categoria: string;
  estado: "se_enviaría" | "enviada_a_revision" | "ya_existe" | "error";
  detalle?: string;
}

export function slugDeRubro(rubroId: string): keyof typeof RUBRO_IDS | null {
  const hit = (Object.entries(RUBRO_IDS) as [keyof typeof RUBRO_IDS, string][]).find(([, id]) => id === rubroId);
  return hit ? hit[0] : null;
}

export function payloadMeta(p: PlantillaPropuesta) {
  const vars = new Set(Array.from(p.cuerpo.matchAll(/\{\{(\d+)\}\}/g)).map((m) => Number(m[1])));
  const body: Record<string, unknown> = { type: "BODY", text: p.cuerpo };
  if (vars.size > 0) body.example = { body_text: [EJEMPLOS.slice(0, vars.size)] };
  const components: unknown[] = [body];
  if (p.botones.length > 0) {
    components.push({ type: "BUTTONS", buttons: p.botones.map((text) => ({ type: "QUICK_REPLY", text })) });
  }
  return { name: p.nombre, language: LANGUAGE, category: p.categoria, components };
}

async function crearEnMeta(wabaId: string, token: string, payload: unknown): Promise<void> {
  const res = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(wabaId)}/message_templates`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (res.ok) return;
  let err: any = null;
  try { err = JSON.parse(text)?.error; } catch { /* sin detalle */ }
  throw new MetaApiError(err?.error_user_msg || err?.message || `HTTP ${res.status}`, res.status, err?.code ?? null, err?.error_subcode ?? null);
}

export async function enviarPropuestasALinea(lineId: string, confirmar: boolean): Promise<{ rubro: string; confirmar: boolean; resultados: ResultadoEnvio[] }> {
  const supabase = createAdminClient();
  const { data: line } = await supabase
    .from("profile_lines")
    .select("id, rubro_id, credential_key")
    .eq("id", lineId)
    .maybeSingle();
  if (!line) throw new Error("Línea no encontrada");
  const rubro = slugDeRubro(line.rubro_id);
  if (!rubro) throw new Error("La línea no tiene un rubro reconocido");

  const waba = process.env[wabaEnvName(line.credential_key)]?.trim() || null;
  const token = process.env[`${line.credential_key}_ACCESS_TOKEN`] || null;
  const missing: string[] = [];
  if (!waba) missing.push(wabaEnvName(line.credential_key));
  if (!token) missing.push(`${line.credential_key}_ACCESS_TOKEN`);
  if (missing.length || !waba || !token) throw new MissingAccessError(missing);

  const propuestas = PLANTILLAS_PROPUESTAS.filter((p) => p.rubro === rubro);
  const resultados: ResultadoEnvio[] = [];
  for (const p of propuestas) {
    const base = { nombre: p.nombre, categoria: p.categoria };
    try {
      if (await findWabaTemplate(waba, token, p.nombre, LANGUAGE)) {
        resultados.push({ ...base, estado: "ya_existe" });
        continue;
      }
      if (!confirmar) {
        resultados.push({ ...base, estado: "se_enviaría" });
        continue;
      }
      await crearEnMeta(waba, token, payloadMeta(p));
      resultados.push({ ...base, estado: "enviada_a_revision" });
    } catch (err) {
      resultados.push({ ...base, estado: "error", detalle: metaErrorText(err) });
      // Un token o cuenta inválidos fallarían todas igual: se corta al primero.
      if (err instanceof MetaApiError && (err.code === 190 || err.code === 100 || err.status === 401 || err.status === 403)) break;
    }
  }
  return { rubro, confirmar, resultados };
}
