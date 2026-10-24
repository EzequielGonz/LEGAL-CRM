import { createAdminClient } from "@/lib/supabase/admin";
import { getAutomationPause } from "@/lib/automation-pause";
import { agentReadiness } from "@/lib/profiles";
import { envPrefixForArea } from "@/lib/rubros";
import { leerEstadoAvisos } from "@/lib/whatsapp/avisos-servidor";
import { evaluarSalud, type DatosSalud, type ItemSalud } from "./reglas";

export { evaluarSalud, resumenSalud, type ItemSalud, type EstadoSalud } from "./reglas";

/** Clave en system_settings donde el latido deja su última corrida. */
export const CLAVE_LATIDO = "ultimo_latido";

const PERFILES: { slug: string; area: string; nombre: string }[] = [
  { slug: "juridico", area: "civil", nombre: "Jurídico" },
  { slug: "coberturas_medicas", area: "coberturas_medicas", nombre: "Coberturas" },
  { slug: "agencia_0km", area: "agencia_0km", nombre: "Autos 0 km" },
  { slug: "marketing", area: "marketing", nombre: "Marketing" },
];

function tieneWhatsapp(area: string): boolean {
  const p = envPrefixForArea(area);
  return Boolean(process.env[`${p}_ACCESS_TOKEN`]?.trim() && process.env[`${p}_PHONE_NUMBER_ID`]?.trim());
}

/** Lo registra el latido al terminar (no frena nada si falla). */
export async function registrarLatido(ok: boolean, detalle: Record<string, unknown> = {}) {
  try {
    await createAdminClient()
      .from("system_settings")
      .upsert({ key: CLAVE_LATIDO, value: { at: new Date().toISOString(), ok, ...detalle } }, { onConflict: "key" });
  } catch (err) {
    console.error("[salud] No se pudo registrar el latido:", err);
  }
}

/** Lee todo lo necesario para el tablero. Cada consulta falla por separado sin romper el tablero. */
export async function leerSalud(ahora = new Date()): Promise<ItemSalud[]> {
  const s = createAdminClient();
  const hace24 = new Date(ahora.getTime() - 24 * 3_600_000).toISOString();
  const hace20 = new Date(ahora.getTime() - 20 * 3_600_000).toISOString();
  const seguro = async <T>(f: () => Promise<T>, def: T): Promise<T> => {
    try {
      return await f();
    } catch {
      return def;
    }
  };

  const [latido, pausa, cuarentena, entrante, agentes, turnos, errores, avisos, presupuestos, ultimoError] = await Promise.all([
    seguro(async () => ((await s.from("system_settings").select("value").eq("key", CLAVE_LATIDO).maybeSingle()).data as any)?.value?.at ?? null, null),
    getAutomationPause(),
    seguro(async () => {
      const { data, count } = await s
        .from("webhook_quarantine")
        .select("detail, reason", { count: "exact" })
        .is("reviewed_at", null)
        .gte("received_at", hace24)
        .order("received_at", { ascending: false })
        .limit(1);
      return { cantidad: count ?? 0, motivo: ((data ?? [])[0] as any)?.detail ?? ((data ?? [])[0] as any)?.reason ?? null };
    }, { cantidad: 0, motivo: null }),
    seguro(async () => ((await s.from("messages").select("created_at").eq("direction", "entrante").order("created_at", { ascending: false }).limit(1).maybeSingle()).data as any)?.created_at ?? null, null),
    seguro(async () => ((await s.from("ai_agents").select("area, active")).data ?? []) as { area: string; active: boolean }[], []),
    seguro(async () => (await s.from("agent_turn_logs" as any).select("id", { count: "exact", head: true }).gte("created_at", hace24)).count ?? 0, 0),
    seguro(async () => (await s.from("agent_turn_logs" as any).select("id", { count: "exact", head: true }).gte("created_at", hace24).eq("resultado", "error")).count ?? 0, 0),
    seguro(() => leerEstadoAvisos(), {} as Awaited<ReturnType<typeof leerEstadoAvisos>>),
    seguro(async () => (await s.from("marketing_budgets" as any).select("id", { count: "exact", head: true }).eq("estado", "pedido").lte("pedido_at", hace20)).count ?? 0, 0),
    // 24/10: el último error, para llevar directo a esa conversación y explicarlo.
    seguro(async () => {
      const { data } = await s
        .from("agent_turn_logs" as any)
        .select("conversation_id, error, created_at, conversations(contact_id, area, contacts(full_name))")
        .gte("created_at", hace24)
        .eq("resultado", "error")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      const d: any = data;
      const area = d.conversations?.area ?? null;
      return {
        conversacionId: d.conversation_id ?? null,
        contactoId: d.conversations?.contact_id ?? null,
        nombre: d.conversations?.contacts?.full_name ?? null,
        perfil: area ? PERFILES.find((p) => p.area === area || (p.slug === "juridico" && area === "penal"))?.nombre ?? area : null,
        error: d.error ?? null,
        at: d.created_at,
      };
    }, null),
  ]);

  const perfiles = await Promise.all(
    PERFILES.map(async (p) => {
      const r = await seguro(() => agentReadiness(p.area as any), { ready: false, missing: ["Perfil"] });
      return {
        slug: p.slug,
        nombre: p.nombre,
        whatsapp: tieneWhatsapp(p.area),
        agenteActivo: agentes.some((a) => (a.area === p.area || (p.slug === "juridico" && a.area === "penal")) && a.active),
        agenteListo: r.ready,
        faltante: r.missing,
      };
    })
  );

  const datos: DatosSalud = {
    ahora,
    ultimoLatido: latido,
    pausa: { ia: pausa.aiRepliesPaused, envios: pausa.outboundPaused, problema: pausa.configProblem ?? pausa.readError ?? null },
    cuarentena24h: cuarentena,
    secretoMeta: Boolean(process.env.META_APP_SECRET?.trim() || process.env.META_APP_SECRETS?.trim()),
    ultimoEntrante: entrante,
    perfiles,
    turnos24h: { errores, total: turnos, ultimo: ultimoError },
    presupuestosAtrasados: presupuestos,
    avisosMeta: Object.values(avisos).map((a) => ({
      nombre: PERFILES.find((p) => p.area === a.area)?.nombre ?? a.area,
      sinAvisos: a.sinAvisos,
      resultado: a.resultado ?? null,
    })),
  };
  return evaluarSalud(datos);
}
