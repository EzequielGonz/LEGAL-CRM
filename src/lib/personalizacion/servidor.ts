import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { seccionesDePerfil } from "@/lib/menu";
import { slugDeRubro } from "@/lib/rubros";
import type { SlugPerfil } from "@/lib/marca";
import { fusionarMenu, validarMenuPersonal, type MenuPersonal } from "@/lib/personalizacion/menu";

/**
 * Lectura y guardado del menú a medida de cada perfil (13/11). Cada cambio
 * queda en `ops_change_log` con el antes y el después, y se puede deshacer.
 */
const ETIQUETA = "menu-personal";

export async function leerMenuDirecto(rubroId: string): Promise<MenuPersonal | null> {
  try {
    const { data, error } = await (createAdminClient().from("personalizacion_perfil" as any) as any).select("valor").eq("rubro_id", rubroId).eq("clave", "menu").maybeSingle();
    if (error || !data) return null;
    const v = validarMenuPersonal((data as any).valor);
    return v.secciones || v.orden ? v : null;
  } catch {
    return null;
  }
}

/** Menú a medida del perfil (null = el de fábrica). En memoria un minuto; se refresca al cambiarlo. */
export const leerMenuPersonal = unstable_cache(leerMenuDirecto, ["menu-personal"], { revalidate: 60, tags: [ETIQUETA] });

async function guardar(rubroId: string, valor: MenuPersonal, antes: MenuPersonal | null, por: string, accion: string) {
  const s = createAdminClient();
  const { error } = await (s.from("personalizacion_perfil" as any) as any).upsert({ rubro_id: rubroId, clave: "menu", valor, updated_at: new Date().toISOString(), updated_by: por }, { onConflict: "rubro_id,clave" });
  if (error) throw new Error(`No se pudo guardar el menú: ${error.message}`);
  await s.from("ops_change_log").insert({ actor: por, action: accion, target: `personalizacion_perfil:${rubroId}:menu`, before: (antes ?? {}) as any, after: valor as any });
  revalidateTag(ETIQUETA);
}

/** Aplica cambios al menú del perfil. Devuelve el antes, para poder deshacer. */
export async function aplicarPersonalizacionMenu(rubroId: string, cambios: unknown, por: string) {
  const slug = slugDeRubro(rubroId) as SlugPerfil;
  const antes = await leerMenuDirecto(rubroId);
  const f = fusionarMenu(antes, cambios, seccionesDePerfil(slug));
  if (!f.ok) throw new Error(f.error);
  await guardar(rubroId, f.valor, antes, por, "personalizar_menu");
  return { aplicado: true, cambios: f.descripcion, antes: antes ?? {}, despues: f.valor, se_puede_deshacer: true };
}

/** Vuelve el menú al estado anterior a un cambio (solo si nadie lo cambió después). */
export async function deshacerPersonalizacionMenu(rubroId: string, antes: unknown, despuesEsperado: unknown, por: string): Promise<boolean> {
  const actual = await leerMenuDirecto(rubroId);
  if (JSON.stringify(validarMenuPersonal(actual ?? {})) !== JSON.stringify(validarMenuPersonal(despuesEsperado ?? {}))) return false;
  await guardar(rubroId, validarMenuPersonal(antes ?? {}), actual, por, "deshacer_personalizar_menu");
  return true;
}

/** Menú de fábrica: borra lo personalizado del perfil (queda registrado). */
export async function restablecerMenu(rubroId: string, por: string) {
  const antes = await leerMenuDirecto(rubroId);
  await guardar(rubroId, {}, antes, por, "restablecer_menu");
  return { aplicado: true, cambios: ["El menú vuelve a ser el original"], antes: antes ?? {}, despues: {}, se_puede_deshacer: true };
}
