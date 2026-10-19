/**
 * Operaciones del asistente sobre campañas, bases, líneas y agentes (19/10).
 * Las de consulta leen y responden. Las «proponer_*» dejan una propuesta que
 * se ejecuta recién cuando la responsable confirma (ver permisos.ts): el
 * asistente nunca envía, lanza ni activa nada por su cuenta.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { AREA_TO_RUBRO_ID } from "@/lib/rubros";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { campaignReadiness } from "@/lib/profiles";
import { consultarEstadosLineas } from "@/lib/whatsapp/estado-linea";
import { resumirColumnas } from "@/lib/asistente/base-resumen";
import { diasDeEjecucion, validarPedidoCampana, type PedidoCampana } from "@/lib/asistente/campanas";
import type { Area } from "@/lib/supabase/database.types";

export interface ContextoOperacion {
  slug: string;
  rubroId: string;
  guardar: (tipo: string, titulo: string, resumen: string, payload: unknown) => Promise<{ id: string }>;
  agregarPropuesta: (id: string) => void;
}

export const NOMBRES_OPERACIONES = [
  "opciones_campana",
  "analizar_base",
  "listar_campanas",
  "proponer_campana",
  "proponer_lanzamiento",
  "proponer_asignar_linea",
  "listar_agentes",
  "proponer_asignar_agente",
] as const;

const norm = (t: unknown) =>
  String(t ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();

/** Busca por id exacto o por nombre (igual, o contenido). Devuelve único / ninguno / varios. */
export function elegirPorNombre<T extends { id: string }>(items: T[], pedido: unknown, nombreDe: (t: T) => string): { uno?: T; varios?: T[] } {
  const q = norm(pedido);
  if (!q) return {};
  const exacto = items.filter((i) => i.id === String(pedido) || norm(nombreDe(i)) === q);
  if (exacto.length === 1) return { uno: exacto[0] };
  const parcial = items.filter((i) => norm(nombreDe(i)).includes(q));
  const lista = exacto.length > 1 ? exacto : parcial;
  if (lista.length === 1) return { uno: lista[0] };
  return lista.length > 1 ? { varios: lista } : {};
}

function areasDe(slug: string): string[] {
  return AREAS_DE_PERFIL[slug] ?? [slug];
}

async function basesDelPerfil(slug: string) {
  const { data } = await createAdminClient()
    .from("imported_bases")
    .select("id, area, name, total_rows, created_rows, created_at")
    .in("area", areasDe(slug))
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(40);
  return (data ?? []) as any[];
}

async function lineasDelPerfil(rubroId: string) {
  const { data } = await createAdminClient()
    .from("profile_lines")
    .select("id, label, area, credential_key, daily_limit, active, use_for_campaigns")
    .eq("rubro_id", rubroId)
    .eq("active", true)
    .eq("use_for_campaigns", true)
    .order("created_at");
  return (data ?? []) as any[];
}

async function plantillasDeLinea(lineId: string) {
  const { data } = await createAdminClient()
    .from("template_assignments")
    .select("template:whatsapp_templates(id, name, status, body_text)")
    .eq("line_id", lineId)
    .eq("purpose", "campana")
    .eq("active", true);
  return ((data ?? []) as any[]).map((r) => r.template).filter(Boolean) as { id: string; name: string; status: string; body_text: string | null }[];
}

async function campanasDelPerfil(slug: string, estados?: string[]) {
  let q = createAdminClient()
    .from("campaigns")
    .select("id, name, status, area, line_id, template_id, daily_send_limit, run_days, created_at")
    .in("area", areasDe(slug))
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(30);
  if (estados) q = q.in("status", estados);
  const { data } = await q;
  return (data ?? []) as any[];
}

export async function ejecutarOperacion(nombre: string, args: Record<string, unknown>, ctx: ContextoOperacion): Promise<Record<string, unknown>> {
  const s = createAdminClient();
  switch (nombre) {
    case "opciones_campana": {
      const [bases, lineas] = await Promise.all([basesDelPerfil(ctx.slug), lineasDelPerfil(ctx.rubroId)]);
      const estados = await consultarEstadosLineas(lineas.map((l) => l.credential_key), { memoria: true });
      const conPlantillas = await Promise.all(
        lineas.map(async (l) => ({
          linea: l.label,
          limite_diario: l.daily_limit,
          estado_en_meta: estados[l.credential_key]?.etiqueta ?? "sin comprobar",
          lista_para_enviar: estados[l.credential_key]?.ok === true,
          plantillas: (await plantillasDeLinea(l.id)).map((t) => ({ nombre: t.name, estado: t.status, texto: t.body_text?.slice(0, 200) ?? null })),
        }))
      );
      return {
        bases: bases.map((b) => ({ nombre: b.name, contactos: b.created_rows ?? b.total_rows, cargada: b.created_at })),
        lineas: conPlantillas,
        nota: "Una línea solo envía si está «Conectada» en Meta y la plantilla está aprobada y asignada a esa línea para campañas.",
      };
    }
    case "analizar_base": {
      const bases = await basesDelPerfil(ctx.slug);
      const b = elegirPorNombre(bases, args.base, (x) => x.name);
      if (!b.uno) return { error: b.varios ? "Hay varias bases que coinciden." : "No encontré esa base.", opciones: (b.varios ?? bases).map((x) => x.name).slice(0, 10) };
      const { data: filas } = await s.from("imported_base_rows").select("raw_data").eq("base_id", b.uno.id).order("row_number", { ascending: true }).limit(2000);
      const r = resumirColumnas(((filas ?? []) as any[]).map((f) => (f.raw_data ?? {}) as Record<string, unknown>));
      return { base: b.uno.name, contactos: b.uno.created_rows ?? b.uno.total_rows, cargada: b.uno.created_at, filas_analizadas: r.filas, columnas: r.columnas, nota: "Solo se muestran categorías; los datos personales no se leen ni se muestran." };
    }
    case "listar_campanas": {
      const camps = await campanasDelPerfil(ctx.slug);
      const out = [];
      for (const c of camps.slice(0, 15)) {
        const { data: cc } = await s.from("campaign_contacts").select("status").eq("campaign_id", c.id).limit(5000);
        const cuenta: Record<string, number> = {};
        for (const r of (cc ?? []) as any[]) cuenta[r.status] = (cuenta[r.status] ?? 0) + 1;
        out.push({ nombre: c.name, estado: c.status, destinatarios: cuenta });
      }
      return { campanas: out };
    }
    case "proponer_campana": {
      const nombreCampana = String(args.nombre ?? "").trim().slice(0, 120);
      if (nombreCampana.length < 3) return { error: "Falta el nombre de la campaña." };
      const bases = await basesDelPerfil(ctx.slug);
      const b = elegirPorNombre(bases, args.base, (x) => x.name);
      if (!b.uno) return { error: b.varios ? "Hay varias bases que coinciden." : "No encontré esa base.", opciones: (b.varios ?? bases).map((x) => x.name).slice(0, 10) };
      const lineas = await lineasDelPerfil(ctx.rubroId);
      const l = elegirPorNombre(lineas, args.linea, (x) => x.label);
      if (!l.uno) return { error: l.varios ? "Hay varias líneas que coinciden." : "No encontré esa línea habilitada para campañas.", opciones: (l.varios ?? lineas).map((x) => x.label) };
      const plantillas = await plantillasDeLinea(l.uno.id);
      const t = elegirPorNombre(plantillas, args.plantilla, (x) => x.name);
      if (!t.uno) return { error: t.varios ? "Hay varias plantillas que coinciden." : "No encontré esa plantilla asignada a la línea para campañas.", opciones: (t.varios ?? plantillas).map((x) => x.name) };
      const area = b.uno.area as Area;
      if (AREA_TO_RUBRO_ID[area] !== ctx.rubroId) return { error: "La base es de otro perfil." };
      const { data: canal } = await s.from("channels").select("id").eq("area", area).order("created_at").limit(1).maybeSingle();
      if (!canal) return { error: "Este perfil no tiene un canal de WhatsApp configurado." };
      const limite = Number(args.limite_diario);
      const pedido: PedidoCampana = {
        nombre: nombreCampana,
        channel_id: canal.id,
        area,
        base_id: b.uno.id,
        line_id: l.uno.id,
        template_id: t.uno.id,
        run_days: diasDeEjecucion(args.dias),
        daily_send_limit: Number.isFinite(limite) && limite > 0 ? Math.round(limite) : null,
      };
      const v = await validarPedidoCampana(pedido);
      const d = v.destinatarios;
      if (d.elegibles === 0) return { error: "No quedaría nadie para contactar: todos están detenidos, ya contactados o sin teléfono válido.", destinatarios: d };
      const resumen = `Base «${v.base.name}»: ${d.elegibles} contactos pendientes (${d.detenidos} detenidos y ${d.contactados_anteriormente} ya contactados quedan afuera). Línea «${v.linea.label}», plantilla «${v.plantilla.name}»${pedido.daily_send_limit ? `, hasta ${pedido.daily_send_limit} por día` : ""}. Se crea en borrador: no envía nada.`;
      const prop = await ctx.guardar("crear_campana", `Preparar «${nombreCampana}»`, resumen, { pedido });
      ctx.agregarPropuesta(prop.id);
      return { propuesta: prop.id, resumen, aviso: "Quedó como propuesta. Al confirmar se crea en borrador; lanzarla es otro paso con otra confirmación." };
    }
    case "proponer_lanzamiento": {
      const camps = await campanasDelPerfil(ctx.slug, ["borrador", "pausada"]);
      const c = elegirPorNombre(camps, args.campana, (x) => x.name);
      if (!c.uno) return { error: c.varios ? "Hay varias campañas que coinciden." : "No encontré esa campaña en borrador o pausada.", opciones: (c.varios ?? camps).map((x) => `${x.name} (${x.status})`) };
      const { data: completa } = await s.from("campaigns").select("area, line_id, message_template_name, template_id").eq("id", c.uno.id).single();
      const r = await campaignReadiness(completa as any);
      if (!r.ready || !r.line) return { no_esta_lista: true, faltantes: r.missing, aviso: "No se puede proponer el envío hasta resolver esto." };
      const { count: pendientes } = await s.from("campaign_contacts").select("id", { count: "exact", head: true }).eq("campaign_id", c.uno.id).eq("status", "pendiente");
      if (!pendientes) return { error: "La campaña no tiene destinatarios pendientes." };
      const accion = c.uno.status === "pausada" ? "Reanudar" : "Lanzar";
      const resumen = `${accion} «${c.uno.name}»: pueden salir mensajes a ${pendientes} personas desde la línea «${r.line.label}» con la plantilla «${r.template?.template.name ?? "—"}»${c.uno.daily_send_limit ? `, hasta ${c.uno.daily_send_limit} por día` : ""}. Se envía solo de lunes a sábado, de 8 a 21 h.`;
      const prop = await ctx.guardar("lanzar_campana", `${accion} «${c.uno.name}»`, resumen, { campana_id: c.uno.id, pendientes, linea: r.line.label });
      ctx.agregarPropuesta(prop.id);
      return { propuesta: prop.id, resumen, aviso: "Quedó como propuesta. Para enviarla hay que marcar la confirmación reforzada y tocar Confirmar." };
    }
    case "proponer_asignar_linea": {
      const camps = await campanasDelPerfil(ctx.slug, ["borrador", "pausada"]);
      const c = elegirPorNombre(camps, args.campana, (x) => x.name);
      if (!c.uno) return { error: c.varios ? "Hay varias campañas que coinciden." : "No encontré esa campaña en borrador o pausada.", opciones: (c.varios ?? camps).map((x) => x.name) };
      const lineas = await lineasDelPerfil(ctx.rubroId);
      const l = elegirPorNombre(lineas, args.linea, (x) => x.label);
      if (!l.uno) return { error: l.varios ? "Hay varias líneas que coinciden." : "No encontré esa línea habilitada para campañas.", opciones: (l.varios ?? lineas).map((x) => x.label) };
      let templateId: string | null = null;
      let plantillaNombre = "sin plantilla (hay que elegirla después)";
      if (args.plantilla) {
        const plantillas = await plantillasDeLinea(l.uno.id);
        const t = elegirPorNombre(plantillas, args.plantilla, (x) => x.name);
        if (!t.uno) return { error: "No encontré esa plantilla asignada a la línea para campañas.", opciones: plantillas.map((x) => x.name) };
        templateId = t.uno.id;
        plantillaNombre = `plantilla «${t.uno.name}»`;
      }
      const resumen = `La campaña «${c.uno.name}» pasa a enviar desde la línea «${l.uno.label}» con ${plantillaNombre}. No envía nada.`;
      const prop = await ctx.guardar("asignar_linea_campana", `Línea para «${c.uno.name}»`, resumen, { campana_id: c.uno.id, line_id: l.uno.id, template_id: templateId });
      ctx.agregarPropuesta(prop.id);
      return { propuesta: prop.id, resumen };
    }
    case "listar_agentes": {
      const [{ data: lib }, { data: asig }] = await Promise.all([
        s.from("agent_library").select("clave, nombre, rol, version, publicacion").eq("rubro_id", ctx.rubroId).neq("rol", "principal"),
        s.from("agent_assignments").select("area, agente_clave, version, estado").eq("rubro_id", ctx.rubroId),
      ]);
      return { agentes: lib ?? [], asignaciones: asig ?? [], nota: "Solo se activa un agente con versión publicada." };
    }
    case "proponer_asignar_agente": {
      const estado = String(args.estado ?? "");
      if (!["activa", "pausada", "apagada"].includes(estado)) return { error: "El estado tiene que ser activa, pausada o apagada." };
      const { data: lib } = await s.from("agent_library").select("clave, nombre, version, publicacion").eq("rubro_id", ctx.rubroId).neq("rol", "principal");
      const a = elegirPorNombre(((lib ?? []) as any[]).map((x) => ({ ...x, id: x.clave })), args.agente, (x) => `${x.nombre} ${x.clave}`);
      if (!a.uno) return { error: a.varios ? "Hay varios agentes que coinciden." : "No encontré ese agente.", opciones: ((a.varios ?? lib ?? []) as any[]).map((x) => x.nombre ?? x.clave) };
      if (estado === "activa" && a.uno.publicacion !== "publicado") return { error: "Ese agente no tiene una versión publicada (aprobada por evaluación): no se puede activar." };
      const areas = areasDe(ctx.slug);
      const area = String(args.area ?? "").trim() || areas[0];
      if (!areas.includes(area)) return { error: `El área tiene que ser una de: ${areas.join(", ")}.` };
      const resumen = `${estado === "activa" ? "Activar" : estado === "pausada" ? "Pausar" : "Apagar"} el agente «${a.uno.nombre}» (versión ${a.uno.version}) en el área ${area}.${estado === "activa" ? " Activar pide el PIN." : ""}`;
      const prop = await ctx.guardar("asignar_agente", `Agente «${a.uno.nombre}»: ${estado}`, resumen, { clave: a.uno.clave, version: a.uno.version, area, estado, motivo: "Desde el asistente" });
      ctx.agregarPropuesta(prop.id);
      return { propuesta: prop.id, resumen };
    }
    default:
      return { error: "Operación desconocida." };
  }
}
