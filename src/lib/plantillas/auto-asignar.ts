/**
 * Asignación automática de plantillas al aprobarse en Meta (24/10). Usa la
 * misma validación que la asignación a mano (createAssignment). Asignar no
 * envía nada. Si una asignación ya existió (aunque se haya desactivado a
 * mano), no se vuelve a crear: se respeta la decisión de la responsable.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { createAssignment, lineAccessStatus, lineWabaId, syncLineTemplates } from "@/lib/plantillas";
import { isSendable } from "@/lib/plantillas/catalogo";
import { slugDeRubro } from "@/lib/rubros";
import { asignacionPorNombre } from "./auto-reglas";

export async function autoAsignarLinea(lineId: string): Promise<{ asignadas: string[]; errores: string[] }> {
  const s = createAdminClient();
  const res = { asignadas: [] as string[], errores: [] as string[] };
  const { data: line } = await s.from("profile_lines").select("id, rubro_id, active, credential_key, label").eq("id", lineId).maybeSingle();
  if (!line || !(line as any).active) return res;
  const waba = lineWabaId((line as any).credential_key);
  if (!waba) return res;
  const perfil = slugDeRubro((line as any).rubro_id);
  const [{ data: tpls }, { data: previas }] = await Promise.all([
    s.from("whatsapp_templates").select("id, name, status, missing_since, variables").eq("waba_id", waba),
    s.from("template_assignments").select("template_id, purpose").eq("line_id", lineId),
  ]);
  const existe = new Set(((previas ?? []) as any[]).map((a) => `${a.template_id}:${a.purpose}`));
  for (const t of (tpls ?? []) as any[]) {
    if (!isSendable(t.status) || t.missing_since) continue;
    const a = asignacionPorNombre(t.name, (t.variables?.bodyVariables ?? []).length);
    if (!a || a.perfil !== perfil) continue;
    if (existe.has(`${t.id}:${a.proposito}`)) continue;
    try {
      await createAssignment({ lineId, templateId: t.id, purpose: a.proposito, sources: a.fuentes, note: "Asignada sola al aprobarse en Meta" });
      res.asignadas.push(`${t.name} → ${a.proposito}`);
    } catch (err: any) {
      res.errores.push(`${t.name}: ${String(err?.message ?? err).slice(0, 120)}`);
    }
  }
  return res;
}

const CLAVE_SYNC = "catalogo_auto_sync";
const CADA_MS = 60 * 60_000;

/** Una vez por hora: relee el catálogo de Meta de cada línea activa y asigna lo aprobado. Solo lee de Meta. */
export async function sincronizarCatalogosSiToca(ahora = new Date()): Promise<unknown> {
  const s = createAdminClient();
  const { data } = await s.from("system_settings").select("value").eq("key", CLAVE_SYNC).maybeSingle();
  const ultima = Date.parse((data as any)?.value?.at ?? "");
  if (Number.isFinite(ultima) && ahora.getTime() - ultima < CADA_MS) return "no toca";
  await s.from("system_settings").upsert({ key: CLAVE_SYNC, value: { at: ahora.toISOString() } as any }, { onConflict: "key" });
  const { data: lineas } = await s.from("profile_lines").select("id, credential_key, label").eq("active", true);
  const out: Record<string, unknown> = {};
  for (const l of (lineas ?? []) as any[]) {
    if (!lineAccessStatus(l.credential_key).ok) continue;
    try {
      const sync: any = await syncLineTemplates(l.id);
      const auto = sync?.ok ? await autoAsignarLinea(l.id) : null;
      out[l.label] = { leidas: sync?.total ?? null, asignadas: auto?.asignadas ?? [], errores: auto?.errores ?? [] };
    } catch (err: any) {
      out[l.label] = { error: String(err?.message ?? err).slice(0, 160) };
    }
  }
  return out;
}
