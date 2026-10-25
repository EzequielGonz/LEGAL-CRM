/**
 * Pedido de carga de plantillas en Meta (25/10). Sirve para registrar en
 * Meta, para su revisión, una lista de plantillas propuestas sin depender
 * del navegador: se deja el pedido en system_settings («plantillas_a_meta»)
 * y el latido lo procesa de a poco (presupuesto de tiempo por latido),
 * retomando donde quedó. No envía mensajes a ninguna persona.
 *
 * Valor esperado: { nombres: string[], pedido_por, pedido_el }. Mientras
 * avanza guarda { hechos: { nombre: resultado } }; al terminar agrega
 * { procesado_el, resultado } y lo registra en ops_change_log. Las que ya
 * existen en Meta se informan como «ya_existe» y no se vuelven a crear.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANTILLAS_PROPUESTAS } from "@/lib/plantillas/propuestas";
import { enviarPlantillasDeArchivo } from "@/lib/plantillas/enviar";

const CLAVE = "plantillas_a_meta";
const BLOQUEO_MS = 90_000;

type Hecho = { rubro: string; estado: string; detalle: string | null };

export async function procesarPedidoPlantillas(presupuestoMs = 20_000): Promise<unknown> {
  const t0 = Date.now();
  const s = createAdminClient();
  const { data, error } = await s.from("system_settings").select("value").eq("key", CLAVE).maybeSingle();
  if (error) throw new Error(error.message);
  const pedido = (data?.value ?? null) as Record<string, any> | null;
  if (!pedido || pedido.procesado_el || !Array.isArray(pedido.nombres)) return "sin pedido";
  if (typeof pedido.bloqueado_hasta === "string" && Date.parse(pedido.bloqueado_hasta) > Date.now()) return "otro latido lo está procesando";

  const hechos: Record<string, Hecho> = { ...(pedido.hechos ?? {}) };
  const nombres: string[] = pedido.nombres.filter((n: unknown): n is string => typeof n === "string");
  const pendientes = PLANTILLAS_PROPUESTAS.filter((p) => nombres.includes(p.nombre) && !hechos[p.nombre]);
  const faltan = nombres.filter((n) => !PLANTILLAS_PROPUESTAS.some((p) => p.nombre === n));

  const guardar = (extra: Record<string, unknown>) =>
    s.from("system_settings").upsert({ key: CLAVE, value: { ...pedido, hechos, ...extra } as any, updated_by: "latido" }, { onConflict: "key" });

  await guardar({ bloqueado_hasta: new Date(Date.now() + BLOQUEO_MS).toISOString() });
  for (const p of pendientes) {
    if (Date.now() - t0 > presupuestoMs) break;
    const [envio] = await enviarPlantillasDeArchivo([p], true);
    const r = envio?.resultados?.[0];
    hechos[p.nombre] = envio?.error
      ? { rubro: p.rubro, estado: "error", detalle: envio.error }
      : { rubro: p.rubro, estado: r?.estado ?? "error", detalle: r?.detalle ?? null };
    await guardar({ bloqueado_hasta: new Date(Date.now() + BLOQUEO_MS).toISOString() });
  }

  const quedan = PLANTILLAS_PROPUESTAS.filter((p) => nombres.includes(p.nombre) && !hechos[p.nombre]).length;
  if (quedan > 0) {
    await guardar({ bloqueado_hasta: null });
    return { avance: Object.keys(hechos).length, quedan };
  }
  const resultado = { hechos, no_encontradas: faltan };
  await guardar({ bloqueado_hasta: null, procesado_el: new Date().toISOString(), resultado });
  await s.from("ops_change_log" as any).insert({
    actor: "latido",
    action: "plantillas_a_meta",
    target: `${Object.keys(hechos).length} plantillas`,
    before: null,
    after: resultado,
    note: "Plantillas registradas en Meta para revisión (pedido de la responsable). No se enviaron mensajes.",
  });
  return resultado;
}
