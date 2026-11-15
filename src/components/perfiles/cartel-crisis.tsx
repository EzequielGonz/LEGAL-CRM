import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RUBRO_IDS } from "@/lib/rubros";
import type { SlugPerfil } from "@/lib/marca";

/**
 * 15/11 (decisión de la responsable): cartel de urgencia arriba de cada
 * pantalla del perfil mientras haya una persona en crisis sin resolver. Ya se
 * le mandaron las líneas de ayuda y el bot dejó de responder en ese chat; el
 * cartel desaparece cuando la incidencia se marca como resuelta.
 */
export async function CartelCrisis({ slug }: { slug: SlugPerfil }) {
  let abiertas = 0;
  try {
    const supabase = createClient();
    const { count } = await (supabase.from("incidences") as any)
      .select("id", { count: "exact", head: true })
      .eq("rubro_id", RUBRO_IDS[slug])
      .eq("kind", "crisis")
      .eq("status", "abierta");
    abiertas = count ?? 0;
  } catch (err) {
    console.error("[crisis] No se pudo leer el cartel de urgencia:", err);
  }
  if (!abiertas) return null;
  return (
    <div role="alert" className="mb-4 rounded-xl border-2 border-red-600 bg-red-50 px-4 py-3 text-red-900 shadow-sm">
      <p className="text-base font-bold">
        Urgente: {abiertas === 1 ? "una persona escribió" : `${abiertas} personas escribieron`} que está en crisis.
      </p>
      <p className="mt-1 text-sm">
        Ya le mandamos las líneas de ayuda y el bot dejó de responder en ese chat. Escribile o llamala vos cuanto antes.
      </p>
      <Link
        href={`/incidencias?perfil=${slug}&tipo=crisis`}
        className="mt-2 inline-flex min-h-[44px] items-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
      >
        Ver a quién seguir
      </Link>
    </div>
  );
}
