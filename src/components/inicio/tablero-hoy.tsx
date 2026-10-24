import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { GRUPOS_PERSONAS, motivoLegible, resumenPersonas, type GrupoPersonas } from "@/lib/estadisticas-personas";
import { consultarEstadosLineas } from "@/lib/whatsapp/estado-linea";
import { getProfileMetrics } from "@/lib/metrics";
import { puntajeBot } from "@/lib/agentes/puntaje";
import { cuandoCorto, enlaceConversacion, iniciales } from "@/lib/cartera";
import { conVolver } from "@/lib/navegacion";
import type { SlugPerfil } from "@/lib/marca";

/**
 * Tablero de «Hoy» (24/10, boceto v3 aprobado): estado de la línea, la
 * campaña y el bot en tres chips; las cinco cifras por personas; y la lista
 * del grupo elegido (por defecto, «Por cerrar»), con acceso directo al chat.
 * Solo lectura.
 */
export async function TableroHoy({ slug, rubroId, areas, grupo }: { slug: SlugPerfil; rubroId: string; areas: string[]; grupo?: string }) {
  const s = createAdminClient();
  const aqui = `/hoy?perfil=${slug}`;
  const baseCampanas = slug === "juridico" ? "/campanas" : `/panel/${slug}/campanas`;
  const baseAgentes = slug === "juridico" ? "/agentes" : `/panel/${slug}/agentes`;

  const [personas, { data: lineas }, metricas, { data: camps }] = await Promise.all([
    resumenPersonas(rubroId, areas),
    s.from("profile_lines").select("label, credential_key, active").eq("rubro_id", rubroId).eq("active", true),
    getProfileMetrics(rubroId).catch(() => null),
    s
      .from("campaigns")
      .select("id, name, status, pause_reason")
      .in("area", areas)
      .is("archived_at", null)
      .in("status", ["en_curso", "pausada"])
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const lineasActivas = ((lineas ?? []) as any[]).filter((l) => l.credential_key);
  const estados = lineasActivas.length ? await consultarEstadosLineas(lineasActivas.map((l) => l.credential_key), { memoria: true }).catch(() => ({} as Record<string, any>)) : {};
  const linea = lineasActivas[0];
  const informe = linea ? (estados as any)[linea.credential_key] : null;
  const chipLinea = !linea
    ? { tono: "rojo", texto: "Sin línea de WhatsApp" }
    : !informe
    ? { tono: "gris", texto: `Línea ${linea.label} · sin comprobar` }
    : informe.ok
    ? { tono: informe.calidad === "baja" ? "rojo" : informe.calidad === "media" ? "amarillo" : "verde", texto: `Línea ${linea.label} · calidad ${informe.calidad ?? "sin calificar"}` }
    : { tono: "rojo", texto: `Línea ${linea.label} · ${String(informe.etiqueta ?? "con problema").toLowerCase()}` };

  const lista = (camps ?? []) as any[];
  const camp = lista.find((c) => c.status === "en_curso") ?? lista[0] ?? null;
  const chipCampana = !camp
    ? { tono: "gris", texto: "Ninguna campaña activa", href: baseCampanas }
    : camp.status === "en_curso"
    ? { tono: "verde", texto: `Campaña enviando · ${camp.name}`, href: `${baseCampanas}/${camp.id}` }
    : { tono: "amarillo", texto: `Campaña pausada · ${camp.pause_reason ? String(camp.pause_reason).slice(0, 60) : camp.name}`, href: `${baseCampanas}/${camp.id}` };

  const p = puntajeBot(metricas as any);
  const chipBot = { tono: p.puntaje === null ? "gris" : p.puntaje >= 60 ? "verde" : p.puntaje >= 35 ? "amarillo" : "rojo", texto: `Bot ${p.puntaje === null ? "sin puntaje aún" : `${p.puntaje}/100`}`, href: baseAgentes };

  const elegido: GrupoPersonas = (GRUPOS_PERSONAS.find((g) => g.clave === grupo)?.clave ?? "por_cerrar") as GrupoPersonas;
  const filas = personas.listas[elegido] ?? [];
  const infoGrupo = GRUPOS_PERSONAS.find((g) => g.clave === elegido)!;

  return (
    <section aria-labelledby="hoy-tablero" className="tablero-hoy space-y-4">
      <h2 id="hoy-tablero" className="sr-only">
        Tablero de hoy
      </h2>
      <ul className="flex flex-wrap gap-2" aria-label="Estado de la línea, la campaña y el bot">
        <Chip tono={chipLinea.tono} texto={chipLinea.texto} />
        <Chip tono={chipCampana.tono} texto={chipCampana.texto} href={chipCampana.href} />
        <Chip tono={chipBot.tono} texto={chipBot.texto} href={chipBot.href} />
      </ul>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {GRUPOS_PERSONAS.map((g, i) => {
          const n = personas.conteos[g.clave];
          const activo = g.clave === elegido;
          return (
            <li key={g.clave} className={i === 0 ? "col-span-2 md:col-span-1" : undefined}>
              <Link
                href={g.clave === "no_interesado" ? `/oportunidades?perfil=${slug}&indicador=detencion_reciente&volver=${encodeURIComponent(aqui)}` : `${aqui}&grupo=${g.clave}#hoy-lista`}
                aria-current={activo ? "true" : undefined}
                className={`kpi-hoy flex h-full flex-col rounded-2xl border p-4 ${g.clave === "por_cerrar" ? "kpi-destacado" : ""} ${g.tarea ? "" : "kpi-apagado"} ${activo ? "kpi-activo" : ""}`}
              >
                <span className="text-xs font-medium text-slate-600">{g.titulo}</span>
                <span className="cifra-premium mt-1.5 text-3xl font-semibold tabular-nums text-slate-950">{n === null ? "—" : n.toLocaleString("es-AR")}</span>
                <span className="mt-1 text-[11.5px] text-slate-500">{g.detalle}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div id="hoy-lista" className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          <p className="text-sm font-semibold text-slate-950">
            {infoGrupo.titulo} <span className="ml-1 tabular-nums text-slate-500">{personas.conteos[elegido] ?? "—"}</span>
          </p>
          <p className="text-xs text-slate-500">{elegido === "por_cerrar" ? "Lo único que te pide intervenir: el bot queda en pausa en ese chat hasta que respondas." : "Más reciente primero"}</p>
        </div>
        {filas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-600">{elegido === "por_cerrar" ? "Nadie está por cerrar ahora. Cuando alguien tenga una duda que el bot no sabe, aparece acá." : "Nada en este grupo por ahora."}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filas.map((f, i) => (
              <li key={`${f.conversationId ?? f.contactId ?? i}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                <span aria-hidden="true" className="avatar-ficha grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold">
                  {iniciales(f.nombre)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950">{f.nombre ?? "Sin nombre"}</p>
                  <p className="truncate text-xs text-slate-500">
                    {motivoLegible(f.motivo)}
                    {f.at ? ` · ${cuandoCorto(f.at)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {f.conversationId && (
                    <Link href={conVolver(enlaceConversacion(slug, f.conversationId), aqui)} className="btn-gold-sm">
                      Abrir chat
                    </Link>
                  )}
                  {f.contactId && (
                    <Link href={conVolver(`/ficha/${f.contactId}`, aqui)} className="btn-suave-sm">
                      Ficha
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

const TONO: Record<string, string> = {
  verde: "bg-emerald-500",
  amarillo: "bg-amber-400",
  rojo: "bg-red-500",
  gris: "bg-slate-400",
};

function Chip({ tono, texto, href }: { tono: string; texto: string; href?: string }) {
  const cuerpo = (
    <>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${TONO[tono] ?? TONO.gris}`} />
      <span className="truncate">{texto}</span>
    </>
  );
  const clase = "chip-estado inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700";
  return <li className="max-w-full">{href ? <Link href={href} className={clase}>{cuerpo}</Link> : <span className={clase}>{cuerpo}</span>}</li>;
}
