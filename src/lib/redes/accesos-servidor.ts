import { createAdminClient } from "@/lib/supabase/admin";
import { ACCESOS, direccionValida, type AccesosGuardados, type ClaveAcceso } from "@/lib/redes/accesos";

const CLAVE = "redes_accesos";

async function leerTodo(): Promise<Record<string, AccesosGuardados>> {
  const { data } = await createAdminClient().from("system_settings").select("value").eq("key", CLAVE).maybeSingle();
  const v = (data as any)?.value;
  return v && typeof v === "object" ? (v as Record<string, AccesosGuardados>) : {};
}

export async function leerAccesos(slug: string): Promise<AccesosGuardados> {
  const todo = await leerTodo().catch(() => ({} as Record<string, AccesosGuardados>));
  const guardado = todo[slug] ?? {};
  const limpio: AccesosGuardados = {};
  for (const a of ACCESOS) if (!a.fija && typeof guardado[a.clave] === "string") limpio[a.clave] = guardado[a.clave];
  return limpio;
}

export async function guardarAcceso(slug: string, clave: ClaveAcceso, valor: unknown): Promise<{ ok: true; guardados: AccesosGuardados } | { ok: false; error: string }> {
  const v = direccionValida(clave, valor);
  if (!v.ok) return v;
  const s = createAdminClient();
  const todo = await leerTodo();
  const delPerfil: AccesosGuardados = { ...(todo[slug] ?? {}) };
  if (v.url) delPerfil[clave] = v.url;
  else delete delPerfil[clave];
  const { error } = await (s.from("system_settings") as any).upsert({ key: CLAVE, value: { ...todo, [slug]: delPerfil }, updated_at: new Date().toISOString(), updated_by: "panel" }, { onConflict: "key" });
  if (error) return { ok: false, error: `No se pudo guardar: ${error.message}` };
  return { ok: true, guardados: await leerAccesos(slug) };
}
