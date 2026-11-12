import { createAdminClient } from "@/lib/supabase/admin";
import { getAutomationPause } from "@/lib/automation-pause";
import { loadContactCalendar } from "@/lib/contacto/calendario";
import { isContactAllowed } from "@/lib/contacto/reglas";
import { contactBlockReason } from "@/lib/detention";
import { insertMessageRow } from "@/lib/messaging";
import { startOfArgentinaDay } from "@/lib/horario";
import { areasForProfile } from "@/lib/profiles";
import { enviarPorWasender } from "@/lib/wasender/envio";
import { clasificarFallaWasender, cupoDeLinea, frenoDeLinea, notaFallaWasender } from "@/lib/wasender/campanas";
import { prepararEnvioWasender, textoDePlantilla } from "@/lib/seguimiento/wasender";
import { planSegundoIntento, SEGUNDO_INTENTO } from "@/lib/seguimiento/segundo-intento";

/**
 * Segundo intento a quien nunca respondió, por Wasender (decisión del 12/11).
 * Lo corre el latido del servidor. Apagado por defecto: solo trabaja en los
 * perfiles con `segundo_intento_desde` cargado. Como máximo un mensaje por
 * línea en cada vuelta, con una pausa mínima entre uno y otro. Respeta la
 * pausa general, el horario de contacto, el límite del día, el calentamiento
 * y el freno automático de la línea. Cada contacto tiene un solo registro en
 * `wasender_segundos_intentos`: nunca hay un tercero.
 */

type Db = ReturnType<typeof createAdminClient>;

const DIA_MS = 24 * 3_600_000;
/** Pausa mínima entre dos segundos intentos de una misma línea. */
export const PAUSA_ENTRE_SEGUNDOS_MS = 4 * 60_000;

export interface ResultadoSegundoIntento {
  estado: string;
  revisados: number;
  enviados: number;
  detalle: string[];
}

export async function procesarSegundosIntentos(opts: { now?: Date; maxPorVuelta?: number } = {}): Promise<ResultadoSegundoIntento> {
  const ahora = opts.now ?? new Date();
  const r: ResultadoSegundoIntento = { estado: "ok", revisados: 0, enviados: 0, detalle: [] };
  const s = createAdminClient();

  // Sin la migración 0605 (o con todos los perfiles apagados) no hay nada que hacer.
  const { data: perfiles, error: errPerfiles } = await (s.from("rubros") as any).select("id, segundo_intento_desde").not("segundo_intento_desde", "is", null);
  if (errPerfiles) return { ...r, estado: "apagado (falta la migración 0605)" };
  if (!perfiles?.length) return { ...r, estado: "apagado en todos los perfiles" };

  const pausa = await getAutomationPause();
  if (pausa.outboundPaused) return { ...r, estado: "pausa general activa" };
  const { calendar, error: errCal } = await loadContactCalendar(ahora);
  if (errCal) return { ...r, estado: errCal };
  if (!isContactAllowed(ahora, calendar)) return { ...r, estado: "fuera del horario de contacto" };

  const lineasUsadas = new Set<string>();
  for (const perfil of perfiles as { id: string }[]) {
    const areas = areasForProfile(perfil.id);
    const { data: camps } = await (s.from("campaigns") as any).select("id, area, wasender_line_id").eq("proveedor", "wasender").in("area", areas).not("wasender_line_id", "is", null);
    const campanas = (camps ?? []) as { id: string; area: string; wasender_line_id: string }[];
    if (!campanas.length) continue;

    const desde = new Date(ahora.getTime() - SEGUNDO_INTENTO.venceDias * DIA_MS).toISOString();
    const hasta = new Date(ahora.getTime() - SEGUNDO_INTENTO.minDias * DIA_MS).toISOString();
    const { data: filas } = await s
      .from("campaign_contacts")
      .select("id, campaign_id, contact_id, status, sent_at")
      .in("campaign_id", campanas.map((c) => c.id))
      .in("status", ["entregado", "leido"])
      .gte("sent_at", desde)
      .lte("sent_at", hasta)
      .order("sent_at", { ascending: true })
      .limit(60);
    const candidatos = (filas ?? []) as { id: string; campaign_id: string; contact_id: string; status: string; sent_at: string }[];
    if (!candidatos.length) continue;

    const { data: previos } = await (s.from("wasender_segundos_intentos" as any) as any).select("contact_id, status").in("contact_id", candidatos.map((c) => c.contact_id));
    const yaHechos = new Map(((previos ?? []) as any[]).map((p) => [p.contact_id as string, p.status as string]));

    for (const c of candidatos) {
      if (r.enviados >= (opts.maxPorVuelta ?? 2)) return r;
      const campana = campanas.find((x) => x.id === c.campaign_id)!;
      if (lineasUsadas.has(campana.wasender_line_id)) continue;
      const previo = yaHechos.get(c.contact_id);
      if (previo && previo !== "pendiente") continue;
      r.revisados++;

      const { data: conv } = await s.from("conversations").select("id, ai_enabled, area").eq("contact_id", c.contact_id).eq("area", campana.area as any).order("last_message_at", { ascending: false }).limit(1).maybeSingle();
      if (!conv || !(conv as any).ai_enabled) continue;
      const [{ count: entrantes }, bloqueo] = await Promise.all([
        s.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", (conv as any).id).eq("direction", "entrante").is("duplicate_of", null),
        contactBlockReason(c.contact_id),
      ]);
      const plan = planSegundoIntento(
        { porWasender: true, primerEnvioAt: c.sent_at, estadoPrimerEnvio: c.status, respondio: (entrantes ?? 0) > 0, detenido: !!bloqueo, segundosHechos: 0, semilla: c.contact_id },
        ahora
      );
      if (plan.accion !== "enviar") continue;

      const prep = await prepararEnvioWasender({ lineaId: campana.wasender_line_id, rubroId: perfil.id, area: campana.area, proposito: "segundo_intento" }, s);
      if (!prep.ok) {
        r.detalle.push(prep.reason);
        lineasUsadas.add(campana.wasender_line_id);
        continue;
      }
      // Límite del día (con calentamiento), freno automático y pausa entre envíos de la línea.
      const cupo = await cupoDeLinea(prep.linea, startOfArgentinaDay(ahora), ahora, s);
      if (cupo.agotado) {
        r.detalle.push(cupo.detalle);
        lineasUsadas.add(prep.linea.id);
        continue;
      }
      const freno = await frenoDeLinea(prep.linea.id, ahora, s);
      if (freno) {
        r.detalle.push(freno);
        lineasUsadas.add(prep.linea.id);
        continue;
      }
      if (!(await pasoLaPausa(s, prep.linea.id, ahora))) {
        lineasUsadas.add(prep.linea.id);
        continue;
      }

      const { data: contacto } = await s.from("contacts").select("id, full_name, phone").eq("id", c.contact_id).maybeSingle();
      if (!(contacto as any)?.phone) continue;
      const texto = textoDePlantilla(
        prep.plantilla,
        { nombre: (contacto as any).full_name ?? "", asesor: prep.perfil?.agent_presentation_name?.trim() ?? "", marca: prep.perfil?.brand_name?.trim() ?? "" },
        c.contact_id
      );

      // Reserva: el índice único por contacto garantiza que salga una sola vez.
      const registroId = await reservar(s, previo === "pendiente", {
        rubro_id: perfil.id,
        contact_id: c.contact_id,
        conversation_id: (conv as any).id,
        campaign_id: c.campaign_id,
        campaign_contact_id: c.id,
        linea_id: prep.linea.id,
        plantilla: prep.plantilla.nombre,
      });
      if (!registroId) continue;
      lineasUsadas.add(prep.linea.id);

      // Justo antes de enviar: pausa general y detención, leídas de nuevo.
      const [pausaAhora, bloqueoAhora] = await Promise.all([getAutomationPause(), contactBlockReason(c.contact_id)]);
      if (pausaAhora.outboundPaused || bloqueoAhora) {
        await marcar(s, registroId, bloqueoAhora ? "fallido" : "pendiente", bloqueoAhora ? "Contacto detenido: no se envió." : "Pausa general activa: no se envió.");
        continue;
      }

      try {
        const envio = await enviarPorWasender({ lineaId: prep.linea.id, to: (contacto as any).phone, body: texto, plantilla: prep.plantilla.nombre }, { supabase: s });
        if (!envio.externalId) throw new Error("Wasender respondió sin el identificador del mensaje.");
        const sentAt = new Date().toISOString();
        const { data: msg } = await insertMessageRow(
          s,
          {
            conversation_id: (conv as any).id,
            sender_type: "agente_ia",
            direction: "saliente",
            body: texto,
            external_message_id: envio.externalId,
            delivery_status: "enviado",
            delivery_status_at: sentAt,
            created_at: sentAt,
            metadata: { ...envio.metadata, automatico: "segundo_intento", campaign_id: c.campaign_id },
            origin: "seguimiento",
          },
          { select: "id" }
        );
        await (s.from("wasender_segundos_intentos" as any) as any)
          .update({ status: msg?.id ? "enviado" : "a_revisar", error: msg?.id ? null : "Se envió pero no se pudo registrar en la conversación. No se reenvía.", message_id: msg?.id ?? null, external_id: envio.externalId, sent_at: sentAt, updated_at: sentAt })
          .eq("id", registroId);
        await (s.from("conversations") as any).update({ last_message_at: sentAt, wasender_line_id: prep.linea.id }).eq("id", (conv as any).id);
        r.enviados++;
      } catch (err) {
        const f = clasificarFallaWasender(err);
        const nota = notaFallaWasender(f);
        // Problema de la línea o temporal: vuelve a intentarse otro día. Incierto: a revisar, nunca se reenvía solo.
        await marcar(s, registroId, f.kind === "cuenta" || f.kind === "transitorio" ? "pendiente" : f.kind === "contacto" ? "fallido" : "a_revisar", nota);
        r.detalle.push(nota);
      }
    }
  }
  return r;
}

async function pasoLaPausa(s: Db, lineaId: string, ahora: Date): Promise<boolean> {
  const { data } = await (s.from("wasender_segundos_intentos" as any) as any).select("sent_at").eq("linea_id", lineaId).not("sent_at", "is", null).order("sent_at", { ascending: false }).limit(1).maybeSingle();
  const ultimo = (data as any)?.sent_at ? Date.parse((data as any).sent_at) : 0;
  return ahora.getTime() - ultimo >= PAUSA_ENTRE_SEGUNDOS_MS;
}

async function reservar(s: Db, reintento: boolean, fila: Record<string, unknown>): Promise<string | null> {
  if (reintento) {
    const { data } = await (s.from("wasender_segundos_intentos" as any) as any)
      .update({ status: "enviando", error: null, updated_at: new Date().toISOString() })
      .eq("contact_id", fila.contact_id)
      .eq("status", "pendiente")
      .select("id");
    return ((data ?? []) as any[])[0]?.id ?? null;
  }
  const { data, error } = await (s.from("wasender_segundos_intentos" as any) as any).insert({ ...fila, status: "enviando" }).select("id").maybeSingle();
  return error ? null : (data as any)?.id ?? null;
}

async function marcar(s: Db, id: string, status: string, error: string) {
  await (s.from("wasender_segundos_intentos" as any) as any).update({ status, error: error.slice(0, 1000), updated_at: new Date().toISOString() }).eq("id", id);
}
