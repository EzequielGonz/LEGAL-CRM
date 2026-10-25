/**
 * Pedido de carga de plantillas en Meta (25/10). Sirve para registrar en
 * Meta, para su revisión, una lista de plantillas propuestas sin depender
 * del navegador: se deja el pedido en system_settings («plantillas_a_meta»)
 * y el latido lo procesa una sola vez. No envía mensajes a ninguna persona.
 *
 * Valor esperado: { nombres: string[], pedido_por, pedido_el }. Al
 * procesarlo se guarda { ...pedido, procesado_el, resultado } y queda
 * registrado en ops_change_log. Las que ya existen en Meta se omiten.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANTILLAS_PROPUESTAS } from "@/lib/plantillas/propuestas";
import { enviarPlantillasDeArchivo } from "@/lib/plantillas/enviar";

const CLAVE = "plantillas_a_meta";

export async function procesarPedidoPlantillas(): Promise<unknown> {
  const s = createAdminClient();
  const { data, error } = await s.from("system_settings").select("value").eq("key", CLAVE).maybeSingle();
  if (error) throw new Error(error.message);
  const pedido = (data?.value ?? null) as { nombres?: unknown; procesado_el?: unknown } | null;
  if (!pedido || pedido.procesado_el || !Array.isArray(pedido.nombres)) return "sin pedido";
  const nombres = new Set(pedido.nombres.filter((n): n is string => typeof n === "string"));
  const lista = PLANTILLAS_PROPUESTAS.filter((p) => nombres.has(p.nombre));
  const faltan = Array.from(nombres).filter((n) => !lista.some((p) => p.nombre === n));

  // Se marca antes de llamar a Meta para que dos latidos no lo procesen a la vez.
  const procesado_el = new Date().toISOString();
  await s.from("system_settings").upsert({ key: CLAVE, value: { ...pedido, procesado_el, resultado: "en curso" } }, { onConflict: "key" });

  const envios = lista.length ? await enviarPlantillasDeArchivo(lista, true) : [];
  type Fila = { rubro: string; nombre: string | null; estado: string; detalle: string | null };
  const resumen: Fila[] = envios.flatMap((e): Fila[] =>
    e.error ? [{ rubro: e.rubro, nombre: null, estado: "error", detalle: e.error }] : e.resultados.map((r) => ({ rubro: e.rubro, nombre: r.nombre, estado: r.estado, detalle: r.detalle ?? null }))
  );
  const resultado = { envios: resumen, no_encontradas: faltan };
  await s.from("system_settings").upsert({ key: CLAVE, value: { ...pedido, procesado_el, resultado } }, { onConflict: "key" });
  await s.from("ops_change_log" as any).insert({
    actor: "latido",
    action: "plantillas_a_meta",
    target: `${lista.length} plantillas`,
    before: null,
    after: resultado,
    note: "Plantillas registradas en Meta para revisión (pedido de la responsable). No se enviaron mensajes.",
  });
  return resultado;
}
