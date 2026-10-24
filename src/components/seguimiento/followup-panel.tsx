import { EnlaceDetalle } from "@/components/ui/enlaces-navegacion";
import { followupOverview, type FollowupTaskRow } from "@/lib/seguimiento/panel";
import { FOLLOWUP_TASK_STATUS_LABEL } from "@/lib/seguimiento/circuito";
import { getAutomationPause } from "@/lib/automation-pause";
import { FollowupConfigControl, FollowupReviewActions, RepescaBaseButton } from "@/components/seguimiento/followup-controls";
import { ResumenSeccion } from "@/components/nivel/resumen-seccion";
import { RecontactoControl } from "@/components/seguimiento/recontacto-control";
import { leerConfigRecontacto } from "@/lib/recontacto/motor";
import { slugDeRubro } from "@/lib/rubros";

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

function Who({ name, phone, contactId, conversationId }: { name?: string | null; phone?: string | null; contactId: string; conversationId?: string | null }) {
  return (
    <span>
      <EnlaceDetalle href={`/ficha/${contactId}`} className="font-medium text-slate-800 hover:underline">
        {name || phone || "Sin nombre"}
      </EnlaceDetalle>
      {phone && name ? <span className="ml-1 text-xs tabular-nums text-slate-600">{phone}</span> : null}
      {conversationId && (
        <EnlaceDetalle href={`/inbox/${conversationId}`} className="ml-2 text-xs font-medium text-slate-700 underline-offset-2 hover:underline">
          conversación
        </EnlaceDetalle>
      )}
    </span>
  );
}

function TaskLine({ t, actions }: { t: FollowupTaskRow; actions?: boolean }) {
  return (
    <li className="space-y-1 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Who name={t.contacts?.full_name} phone={t.contacts?.phone} contactId={t.contact_id} conversationId={t.conversation_id} />
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

      <ResumenSeccion
        id="seg"
        estado={encendido ? "El seguimiento automático está encendido" : "El seguimiento automático está apagado"}
        detalle={
          <p>
            {encendido
              ? `Se le vuelve a escribir a quien respondió y dejó de contestar: a las ${o.config.targetHours} h, de lunes a sábado, hasta dos veces.`
              : "No se programa ni se envía ningún seguimiento. Lo que ves abajo es lo que quedó de antes."}
            {pause.outboundPaused ? " La pausa general de envíos está activa: no sale nada." : ""}
          </p>
        }
        tono={o.atencion.length ? "atencion" : "info"}
        puntos={[
          { texto: "Necesitan revisión", cantidad: o.atencion.length, href: "#seg-revision", tono: o.atencion.length ? "atencion" : "ok" },
          { texto: "Programados", cantidad: o.programadas.length, href: "#seg-programados", tono: "info" },
          { texto: "Para una campaña manual", cantidad: pendientesBase.length, href: "#seg-base", tono: "info" },
        ]}
        personalizar={{ href: "#seg-config", texto: encendido ? "Personalizar o apagar" : "Ver cómo se enciende" }}
      />

      <section id="seg-recontacto" aria-labelledby="seg-recontacto-t" className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 id="seg-recontacto-t" className="mb-1 text-base font-semibold text-slate-900">Recontacto del bot en las 24 h</h2>
        <p className="mb-3 text-sm text-slate-700">
          Si la persona mostró interés y dejó de responder, el bot le vuelve a escribir con texto libre dentro de la ventana de 24 h de Meta:
          a las 2 h retoma lo último que se habló y, si sigue sin contestar, a las 2 h más la saluda y queda a disposición. Después no insiste.
          Lunes a sábado de 8 a 21: si el plazo cae después del cierre, sale 10 minutos antes; si ya cerró, a las 8 del día hábil siguiente.
          Antes de escribir revisa la charla y no escribe si no hay interés real. No usa plantillas: es distinto del seguimiento de abajo.
        </p>
        {recontacto ? <RecontactoControl perfil={perfil} encendido={recontacto[perfil] !== false} /> : <p className="text-sm text-red-700">No se pudo leer la configuración.</p>}
      </section>

      <section id="seg-config" tabIndex={-1} className="solo-avanzado rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Cómo funciona</h2>
        <p className="mb-3 text-sm text-slate-700">
          Solo para quien respondió. Si la conversación se interrumpe, el contacto 2 sale a las {o.config.targetHours} horas
          (entre 48 y 72, en la franja permitida de lunes a sábado de 8 a 21). Sin respuesta al contacto 2, se detiene. Si
          responde y se vuelve a interrumpir, sale el contacto 3; después, quien no avanzó pasa a la base para campaña manual.
          Los mensajes de una conversación activa no cuentan como intentos, y agotar el circuito no es una baja.
        </p>
        <FollowupConfigControl
          rubroId={rubroId}
          enabledSince={o.config.enabledSince}
          targetHours={o.config.targetHours}
          outboundPaused={pause.outboundPaused}
        />
      </section>

      <section id="seg-revision" tabIndex={-1} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Necesitan revisión ({o.atencion.length})</h2>
        <ul className="divide-y divide-slate-100">
          {o.atencion.map((t) => (
            <TaskLine key={t.id} t={t} actions />
          ))}
          {o.atencion.length === 0 && <li className="py-2 text-sm text-slate-600">Nada para revisar.</li>}
        </ul>
      </section>

      <section id="seg-programados" tabIndex={-1} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Programados ({o.programadas.length})</h2>
        <ul className="divide-y divide-slate-100">
          {o.programadas.map((t) => (
            <TaskLine key={t.id} t={t} />
          ))}
          {o.programadas.length === 0 && <li className="py-2 text-sm text-slate-600">No hay seguimientos programados.</li>}
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

      <section className="solo-avanzado rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Enviados recientes ({o.enviadas.length})</h2>
        <ul className="divide-y divide-slate-100">
          {o.enviadas.map((t) => (
            <TaskLine key={t.id} t={t} />
          ))}
          {o.enviadas.length === 0 && <li className="py-2 text-sm text-slate-600">Todavía no salió ningún seguimiento.</li>}
        </ul>
      </section>

      <section className="solo-avanzado rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Detenidos ({o.detenidas.length})</h2>
        <ul className="divide-y divide-slate-100">
          {o.detenidas.map((d: any) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <Who name={d.contacts?.full_name} phone={d.contacts?.phone} contactId={d.contact_id} />
              <span className="text-xs text-slate-700">{d.followup_reason ?? "Detenido"}</span>
            </li>
          ))}
          {o.detenidas.length === 0 && <li className="py-2 text-sm text-slate-600">Ninguno.</li>}
        </ul>
      </section>
    </div>
  );
}
