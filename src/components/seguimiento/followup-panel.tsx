import { EnlaceDetalle } from "@/components/ui/enlaces-navegacion";
import { followupOverview, type FollowupTaskRow } from "@/lib/seguimiento/panel";
import { FOLLOWUP_TASK_STATUS_LABEL } from "@/lib/seguimiento/circuito";
import { getAutomationPause } from "@/lib/automation-pause";
import { FollowupConfigControl, FollowupReviewActions, RepescaBaseButton } from "@/components/seguimiento/followup-controls";
import { RUTA_SEGUIMIENTO } from "@/lib/seguimiento/criterio";
import { RecontactoControl } from "@/components/seguimiento/recontacto-control";
import { leerConfigRecontacto } from "@/lib/recontacto/motor";
import { slugDeRubro } from "@/lib/rubros";
import { enlaceConversacion } from "@/lib/cartera";
import { esSlugPerfil } from "@/lib/marca";

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires", hourCycle: "h23",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Who({ name, phone, contactId, conversationId, perfil }: { name?: string | null; phone?: string | null; contactId: string; conversationId?: string | null; perfil?: string }) {
  return (
    <span>
      <EnlaceDetalle href={`/ficha/${contactId}`} className="font-medium text-slate-800 hover:underline">
        {name || phone || "Sin nombre"}
      </EnlaceDetalle>
      {phone && name ? <span className="ml-1 text-xs tabular-nums text-slate-600">{phone}</span> : null}
      {conversationId && (
        <EnlaceDetalle href={perfil && esSlugPerfil(perfil) ? enlaceConversacion(perfil, conversationId) : `/inbox/${conversationId}`} className="ml-2 text-xs font-medium text-slate-700 underline-offset-2 hover:underline">
          conversación
        </EnlaceDetalle>
      )}
    </span>
  );
}

function TaskLine({ t, actions, perfil }: { t: FollowupTaskRow; actions?: boolean; perfil?: string }) {
  return (
    <li className="space-y-1 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Who name={t.contacts?.full_name} phone={t.contacts?.phone} contactId={t.contact_id} conversationId={t.conversation_id} perfil={perfil} />
        <span className="text-xs text-slate-700">
          Contacto {t.step} · {FOLLOWUP_TASK_STATUS_LABEL[t.status] ?? t.status}
          {t.status === "enviada" ? ` · ${fmt(t.sent_at)}` : t.scheduled_at ? ` · ${fmt(t.scheduled_at)}` : ""}
        </span>
      </div>
      {t.status_reason && <p className="text-xs text-slate-700">{t.status_reason}</p>}
      {actions && <FollowupReviewActions taskId={t.id} status={t.status} />}
    </li>
  );
}

/**
 * Etapa 2 · Bloque 2.3 — Seguimiento de un perfil: configuración, programados,
 * lo que necesita revisión, enviados, detenidos y la base para campaña manual.
 */
export async function FollowupPanel({ rubroId }: { rubroId: string }) {
  const perfil = slugDeRubro(rubroId);
  const [o, pause, recontacto] = await Promise.all([followupOverview(rubroId), getAutomationPause(), leerConfigRecontacto().catch(() => null)]);
  const pendientesBase = o.agotadas.filter((a: any) => !a.repesca_base_id);

  const encendido = !!o.config.enabledSince;
  return (
    <div className="space-y-6">
      {o.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
          No se pudo leer todo el seguimiento: {o.error}
        </p>
      )}

      {/* 13/11: el seguimiento funciona solo. Primero qué está pasando; después la ruta completa. */}
      <section aria-labelledby="seg-estado" className={`rounded-2xl border p-5 ${encendido && !pause.outboundPaused ? "border-emerald-200 bg-emerald-50/60" : "border-amber-300 bg-amber-50"}`}>
        <h2 id="seg-estado" className="text-lg font-semibold text-slate-950">
          {pause.outboundPaused ? "La pausa general está activa: no sale ningún seguimiento" : encendido ? "El seguimiento funciona solo" : "El seguimiento de este perfil está apagado"}
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-700">
          {encendido
            ? "No hay que activar ni cargar nada. El bot relee cada conversación cortada y decide si corresponde volver a escribir o soltar; vos solo mirás acá qué hizo y con quién."
            : "Alguien lo apagó a mano. Se vuelve a encender desde «Ajustes del seguimiento», más abajo."}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { t: "Programados", n: o.programadas.length, h: "#seg-programados" },
            { t: "Enviados", n: o.enviadas.length, h: "#seg-enviados" },
            { t: "Soltados", n: o.detenidas.length, h: "#seg-soltados" },
            { t: "Para revisar", n: o.atencion.length, h: "#seg-revision" },
          ].map((x) => (
            <a key={x.t} href={x.h} className="rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50">
              <dt className="text-[13px] font-medium text-slate-600">{x.t}</dt>
              <dd className="text-2xl font-semibold tabular-nums text-slate-950">{x.n}</dd>
            </a>
          ))}
        </dl>
      </section>

      <section aria-labelledby="seg-ruta" className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 id="seg-ruta" className="text-base font-semibold text-slate-950">
          La ruta: cuándo insiste y cuándo suelta
        </h2>
        <ol className="mt-4 space-y-0">
          {RUTA_SEGUIMIENTO.map((p, k) => (
            <li key={p.clave} className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 pb-5 last:pb-0">
              {k < RUTA_SEGUIMIENTO.length - 1 ? <span aria-hidden="true" className="absolute left-4 top-8 -ml-px h-[calc(100%-2rem)] w-0.5 bg-slate-200" /> : null}
              <span aria-hidden="true" className={`grid h-8 w-8 place-items-center rounded-full text-[13px] font-semibold ${p.clave === "descarte" ? "bg-slate-200 text-slate-700" : "bg-gold-500/20 text-gold-900"}`}>
                {p.clave === "descarte" ? "×" : k + 1}
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-950">{p.titulo}</h3>
                <p className="mt-0.5 text-sm text-slate-800">{p.cuando}.</p>
                <p className="mt-1 text-[13px] text-slate-600">
                  <span className="font-medium text-slate-800">A quién:</span> {p.quien.charAt(0).toLowerCase() + p.quien.slice(1)}. <span className="font-medium text-slate-800">Cómo:</span>{" "}
                  {p.como.charAt(0).toLowerCase() + p.como.slice(1)}.
                </p>
                <p className="mt-1 text-[13px] text-slate-600">
                  <span className="font-medium text-slate-800">Cuándo suelta:</span> {p.suelta.charAt(0).toLowerCase() + p.suelta.slice(1)}.
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <details id="seg-config" className="rounded-2xl border border-slate-200 bg-white p-5">
        <summary className="tactil flex cursor-pointer items-center text-base font-semibold text-slate-950">Ajustes del seguimiento</summary>
        <div className="mt-3 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Mensajes del mismo día</h3>
            <p className="mb-2 text-sm text-slate-700">El bot retoma la charla a las 2 horas y una vez más 2 horas después.</p>
            {recontacto ? <RecontactoControl perfil={perfil} encendido={recontacto[perfil] !== false} /> : <p className="text-sm text-red-700">No se pudo leer este ajuste. Recargá la página.</p>}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Mensajes a los 2 o 3 días</h3>
            <p className="mb-2 text-sm text-slate-700">
              Hoy salen a las {o.config.targetHours} horas del corte (se puede elegir entre 48 y 72). Apagarlo frena solo estos mensajes en este perfil.
            </p>
            <FollowupConfigControl rubroId={rubroId} enabledSince={o.config.enabledSince} targetHours={o.config.targetHours} outboundPaused={pause.outboundPaused} />
          </div>
        </div>
      </details>

      <section id="seg-revision" tabIndex={-1} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Necesitan revisión ({o.atencion.length})</h2>
        <ul className="divide-y divide-slate-100">
          {o.atencion.map((t) => (
            <TaskLine key={t.id} t={t} actions perfil={perfil} />
          ))}
          {o.atencion.length === 0 && <li className="py-2 text-sm text-slate-600">Nada para revisar: todo salió o se soltó sin problemas.</li>}
        </ul>
      </section>

      <section id="seg-programados" tabIndex={-1} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Programados ({o.programadas.length})</h2>
        <ul className="divide-y divide-slate-100">
          {o.programadas.map((t) => (
            <TaskLine key={t.id} t={t} perfil={perfil} />
          ))}
          {o.programadas.length === 0 && <li className="py-2 text-sm text-slate-600">Nadie tiene un mensaje programado ahora. Aparecen acá cuando una charla con respuesta queda cortada.</li>}
        </ul>
      </section>

      <section id="seg-base" tabIndex={-1} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Base para campaña manual</h2>
        <p className="mb-2 text-sm text-slate-700">
          Quienes llegaron al tercer contacto sin avanzar. Generar la base no envía nada: la campaña se arma aparte y, como ya
          fueron contactados, hay que incluirlos a propósito.
        </p>
        <RepescaBaseButton rubroId={rubroId} count={pendientesBase.length} />
        <ul className="mt-2 divide-y divide-slate-100">
          {o.agotadas.slice(0, 50).map((a: any) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <Who name={a.contacts?.full_name} phone={a.contacts?.phone} contactId={a.contact_id} />
              <span className="text-xs text-slate-700">{a.repesca_base_id ? "Ya está en una base" : "Sin base todavía"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="seg-enviados" tabIndex={-1} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Enviados recientes ({o.enviadas.length})</h2>
        <ul className="divide-y divide-slate-100">
          {o.enviadas.map((t) => (
            <TaskLine key={t.id} t={t} perfil={perfil} />
          ))}
          {o.enviadas.length === 0 && <li className="py-2 text-sm text-slate-600">Todavía no salió ningún seguimiento.</li>}
        </ul>
      </section>

      <section id="seg-soltados" tabIndex={-1} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Soltados ({o.detenidas.length})</h2>
        <p className="mb-2 text-sm text-slate-700">A quiénes se dejó de escribir y por qué. Si alguno vuelve a escribir, el bot lo atiende.</p>
        <ul className="divide-y divide-slate-100">
          {o.detenidas.map((d: any) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <Who name={d.contacts?.full_name} phone={d.contacts?.phone} contactId={d.contact_id} />
              <span className="text-[13px] text-slate-700 [overflow-wrap:anywhere]">{d.followup_reason ?? "Sin respuesta"}</span>
            </li>
          ))}
          {o.detenidas.length === 0 && <li className="py-2 text-sm text-slate-600">Ninguno.</li>}
        </ul>
      </section>
    </div>
  );
}
