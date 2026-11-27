/**
 * Resumen de la semana de todo el panel (15/11), arriba del asistente
 * general. Solo conteos (head: true) con las mismas lecturas que ya usan En
 * vivo, Perfiles e Inicio: últimos 7 días contra los 7 anteriores.
 * «Personas que respondieron» se compara con la función personas_que_escribieron
 * (solo tiene «desde»): la semana anterior no se puede separar sin repetir
 * personas, así que esa cifra va sin comparación. Campañas en curso y chats que
 * piden una persona son «ahora mismo».
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS } from "@/lib/rubros";
import { SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { personasQueEscribieron } from "@/lib/estadisticas-personas";
import { aplicarCondiciones } from "@/lib/indicadores";
import { ESPERAN_A_UNA_PERSONA } from "@/lib/definiciones/cifras";
import type { CifrasPerfilSemana } from "./semana-reglas";

const DIA = 86_400_000;

export async function resumenSemana(ahora = new Date()): Promise<{ desde: string; perfiles: { perfil: SlugPerfil; cifras: CifrasPerfilSemana }[] }> {
  const s = createAdminClient();
  const hoy = ahora.getTime();
  const desde = new Date(hoy - 7 * DIA).toISOString();
  const antes = new Date(hoy - 14 * DIA).toISOString();
  const cuenta = async (q: any): Promise<number | null> => {
    const { count, error } = await q;
    return error ? null : count ?? 0;
  };
  const rango = (q: any, col: string, de: string, a: string | null) => (a ? q.gte(col, de).lt(col, a) : q.gte(col, de));
  const enviados = (areas: string[], de: string, a: string | null) =>
    cuenta(
      rango(
        (s.from("campaign_contacts") as any).select("id, campaigns!inner(area)", { count: "exact", head: true }).in("campaigns.area", areas).in("status", ["enviado", "entregado", "leido", "respondio"]),
        "sent_at",
        de,
        a
      )
    );
  const perfiles = await Promise.all(
    SLUGS_PERFIL.map(async (perfil) => {
      const areas = AREAS_DE_PERFIL[perfil] ?? [perfil];
      const rubroId = RUBRO_IDS[perfil];
      const opp = () => s.from("opportunities").select("id", { count: "exact", head: true }).eq("rubro_id", rubroId);
      const citas = () => s.from("appointments").select("id", { count: "exact", head: true }).in("area", areas).neq("status", "cancelada");
      const [envA, envB, resp, capA, capB, citA, citB, derA, derB, camp, piden] = await Promise.all([
        enviados(areas, desde, null),
        enviados(areas, antes, desde),
        personasQueEscribieron(areas, desde),
        cuenta(rango(opp().eq("capture_state", "captado"), "captured_at", desde, null)),
        cuenta(rango(opp().eq("capture_state", "captado"), "captured_at", antes, desde)),
        cuenta(rango(citas(), "created_at", desde, null)),
        cuenta(rango(citas(), "created_at", antes, desde)),
        cuenta(rango(opp().eq("derivation_state", "derivado"), "derived_at", desde, null)),
        cuenta(rango(opp().eq("derivation_state", "derivado"), "derived_at", antes, desde)),
        cuenta(s.from("campaigns").select("id", { count: "exact", head: true }).in("area", areas).eq("status", "en_curso").is("archived_at", null)),
        // 22/11: la misma definición única de «Esperan a una persona» que Perfiles y Estadísticas.
        cuenta(aplicarCondiciones(opp(), ESPERAN_A_UNA_PERSONA)),
      ]);
      const cifras: CifrasPerfilSemana = {
        enviados: { actual: envA, anterior: envB },
        respondieron: { actual: resp, anterior: null },
        captados: { actual: capA, anterior: capB },
        citas: { actual: citA, anterior: citB },
        derivados: { actual: derA, anterior: derB },
        campanas: { actual: camp, anterior: null },
        piden: { actual: piden, anterior: null },
      };
      return { perfil, cifras };
    })
  );
  return { desde, perfiles };
}
