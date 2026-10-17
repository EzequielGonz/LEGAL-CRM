import { EnlaceDetalle } from "@/components/ui/enlaces-navegacion";
import { followupOverview, type FollowupTaskRow } from "@/lib/seguimiento/panel";
import { FOLLOWUP_TASK_STATUS_LABEL } from "@/lib/seguimiento/circuito";
import { getAutomationPause } from "@/lib/automation-pause";
import { FollowupConfigControl, FollowupReviewActions, RepescaBaseButton } from "@/components/seguimiento/followup-controls";

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
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
      {phone && name ? <span className="ml-1 text-xs text-slate-400">{phone}</span> : null}
      {conversationId && (
        <EnlaceDetalle href={`/inbox/${conversationId}`} className="ml-2 text-xs text-slate-500 hover:underline">
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
        <span className="text-xs text-slate-500">
          Contacto {t.step} · {FOLLOWUP_TASK_STATUS_LABEL[t.status] ?? t.status}
          {t.status === "enviada" ? ` · ${fmt(t.sent_at)}` : t.scheduled_at ? ` · ${fmt(t.scheduled_at)}` : ""}
        </span>
      </div>
      {t.status_reason && <p className="text-xs text-slate-500">{t.status_reason}</p>}
      {actions && <FollowupReviewActions taskId={t.id} status={t.status} />}
    </li>
  );
}

/**
 * Etapa 2 · Bloque 2.3 — Seguimiento de un perfil: configuración, programados,
 * lo que necesita revisión, enviados, detenidos y la base para campaña manual.
 */
export async function FollowupPanel({ rubroId }: { rubroId: string }) {
  const [o, pause] = await Promise.all([followupOverview(rubroId), getAutomationPause()]);
  const pendientesBase = o.agotadas.filter((a: any) => !a.repesca_base_id);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">Cómo funciona</h2>
        <p className="mb-3 text-xs text-slate-500">
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
        {o.error && <p className="mt-2 text-xs text-red-600">No se pudo leer todo el seguimiento: {o.error}</p>}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Necesitan revisión ({o.atencion.length})</h2>
        <ul className="divide-y divide-slate-100">
          {o.atencion.map((t) => (
            <TaskLine key={t.id} t={t} actions />
          ))}
          {o.atencion.length === 0 && <li className="py-2 text-sm text-slate-400">Nada para revisar.</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Programados ({o.programadas.length})</h2>
        <ul className="divide-y divide-slate-100">
          {o.programadas.map((t) => (
            <TaskLine key={t.id} t={t} />
          ))}
          {o.programadas.length === 0 && <li className="py-2 text-sm text-slate-400">No hay seguimientos programados.</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Base para campaña manual</h2>
        <p className="mb-2 text-xs text-slate-500">
          Quienes llegaron al tercer contacto sin avanzar. Generar la base no envía nada: la campaña se arma aparte y, como ya
          fueron contactados, hay que incluirlos a propósito.
        </p>
        <RepescaBaseButton rubroId={rubroId} count={pendientesBase.length} />
        <ul className="mt-2 divide-y divide-slate-100">
          {o.agotadas.slice(0, 50).map((a: any) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <Who name={a.contacts?.full_name} phone={a.contacts?.phone} contactId={a.contact_id} />
              <span className="text-xs text-slate-500">{a.repesca_base_id ? "Ya está en una base" : "Sin base todavía"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Enviados recientes ({o.enviadas.length})</h2>
        <ul className="divide-y divide-slate-100">
          {o.enviadas.map((t) => (
            <TaskLine key={t.id} t={t} />
          ))}
          {o.enviadas.length === 0 && <li className="py-2 text-sm text-slate-400">Todavía no salió ningún seguimiento.</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Detenidos ({o.detenidas.length})</h2>
        <ul className="divide-y divide-slate-100">
          {o.detenidas.map((d: any) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <Who name={d.contacts?.full_name} phone={d.contacts?.phone} contactId={d.contact_id} />
              <span className="text-xs text-slate-500">{d.followup_reason ?? "Detenido"}</span>
            </li>
          ))}
          {o.detenidas.length === 0 && <li className="py-2 text-sm text-slate-400">Ninguno.</li>}
        </ul>
      </section>
    </div>
  );
}
