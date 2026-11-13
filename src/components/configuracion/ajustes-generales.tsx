import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminPhoneForm } from "@/components/configuracion/admin-phone-form";
import { NotificationPhonesForm } from "@/components/configuracion/notification-phones-form";
import { AccessSettings } from "@/components/configuracion/access-settings";
import { PauseControl } from "@/components/configuracion/pause-control";
import { PushSettingsSection } from "@/components/configuracion/push-settings-section";
import { CalendarSettings } from "@/components/configuracion/calendar-settings";
import { TareasServidorControl } from "@/components/configuracion/tareas-servidor-control";
import { Conexiones } from "@/components/configuracion/conexiones";
import { SeccionAjustes } from "@/components/configuracion/seccion-ajustes";
import { GrupoAjustes } from "@/components/configuracion/grupo-ajustes";
import type { GrupoNav } from "@/components/configuracion/navegacion-ajustes";
import { getAutomationPause } from "@/lib/automation-pause";
import { getTareasServidor } from "@/lib/tareas-servidor";
import { listCalendarExceptions } from "@/lib/contacto/calendario";

/**
 * Ajustes que valen para los cuatro perfiles (13/11 · cada rubro separado).
 * Antes vivían solo en la Configuración de Jurídico y, desde otro perfil, el
 * enlace sacaba a la persona de su panel. Ahora cada perfil los muestra en su
 * propia pantalla de Ajustes, debajo de los suyos y con el rótulo «General».
 */
export async function leerAjustesGenerales() {
  const supabase = createClient();
  const [{ data: adminProfile }, { data: notificationPhones }, { data: pinRow }, { data: accessEvents }, { count: retenidos }, pause, calendar, tareas] = await Promise.all([
    // Con el PIN general ya no hay usuario logueado: se muestra el teléfono del perfil de administrador que ya existía.
    supabase.from("admin_profiles").select("phone").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("notification_phones").select("*").order("created_at", { ascending: true }),
    supabase.from("access_pin").select("source, updated_at").eq("id", true).maybeSingle(),
    supabase.from("access_events").select("id, at, kind, device").order("at", { ascending: false }).limit(15),
    supabase.from("webhook_quarantine").select("id", { count: "exact", head: true }).is("reviewed_at", null),
    getAutomationPause(),
    listCalendarExceptions(),
    getTareasServidor(),
  ]);
  const adminPhone: string | null = adminProfile?.phone ?? null;
  const pausaActiva = pause.aiRepliesPaused || pause.outboundPaused;
  const grupos: GrupoNav[] = [
    { id: "automatizaciones", titulo: "Automatizaciones y pausas", resumen: pausaActiva ? "Pausa general activa" : "Pausa general levantada" },
    { id: "notificaciones", titulo: "Notificaciones y dispositivos", resumen: `${(notificationPhones ?? []).length + (adminPhone ? 1 : 0)} números de aviso` },
    { id: "acceso", titulo: "Acceso, PIN y sesiones", resumen: pinRow?.source ? "PIN configurado" : "PIN sin configurar" },
    { id: "sistema", titulo: "Sistema, tareas e integraciones", resumen: (retenidos ?? 0) > 0 ? `${retenidos} eventos retenidos sin revisar` : "Sin eventos retenidos" },
  ];
  return { adminPhone, notificationPhones: notificationPhones ?? [], pinRow, accessEvents: accessEvents ?? [], retenidos: retenidos ?? 0, pause, calendar, tareas, grupos };
}

export type DatosAjustesGenerales = Awaited<ReturnType<typeof leerAjustesGenerales>>;

/** Sección del calendario general (feriados y excepciones): cada pantalla la ubica en su grupo de agenda. */
export function SeccionCalendarioGeneral({ d }: { d: DatosAjustesGenerales }) {
  return (
    <SeccionAjustes id="calendario" titulo="Horario de contacto y calendario" alcance="general" palabras="feriados excepciones horario 8 21">
      <CalendarSettings upcoming={d.calendar.upcoming} archived={d.calendar.archived} loadError={d.calendar.error} />
    </SeccionAjustes>
  );
}

export function GruposAjustesGenerales({ d, hrefRetenidos }: { d: DatosAjustesGenerales; hrefRetenidos: string }) {
  const resumenDe = (id: string) => d.grupos.find((g) => g.id === id)?.resumen;
  return (
    <>
      <GrupoAjustes id="automatizaciones" titulo="Automatizaciones y pausas" resumen={resumenDe("automatizaciones")}>
        <SeccionAjustes id="pausa" titulo="Pausa general" alcance="general" nivel="simple" palabras="detener agentes envíos">
          <PauseControl
            aiPaused={d.pause.aiRepliesPaused}
            outboundPaused={d.pause.outboundPaused}
            since={d.pause.since}
            reason={d.pause.reason}
            configProblem={d.pause.configProblem ?? (d.pause.readError ? `No se pudo leer la pausa general (${d.pause.readError}): se asume todo en pausa.` : null)}
          />
        </SeccionAjustes>
      </GrupoAjustes>

      <GrupoAjustes id="notificaciones" titulo="Notificaciones y dispositivos" resumen={resumenDe("notificaciones")}>
        <SeccionAjustes id="notificaciones" titulo="Teléfono principal de avisos" alcance="general" nivel="simple" palabras="whatsapp aviso administrador">
          <AdminPhoneForm initialPhone={d.adminPhone} />
        </SeccionAjustes>
        <SeccionAjustes
          id="numeros-adicionales"
          titulo="Números adicionales de notificación"
          alcance="general"
          palabras="avisos whatsapp"
          descripcion={
            <>
              Además del teléfono principal, estos números (no necesitan cuenta en el panel) reciben por WhatsApp el aviso de
              &quot;caso calificado&quot; y &quot;nuevo cliente agendado&quot;.
            </>
          }
        >
          <NotificationPhonesForm phones={d.notificationPhones} />
        </SeccionAjustes>
        <SeccionAjustes id="avisos" titulo="Avisos web en este dispositivo" alcance="general" palabras="push notificaciones navegador teléfono">
          <PushSettingsSection />
        </SeccionAjustes>
      </GrupoAjustes>

      <GrupoAjustes id="acceso" titulo="Acceso, PIN y sesiones" resumen={resumenDe("acceso")} soloAvanzado>
        <SeccionAjustes id="acceso" titulo="Acceso" alcance="general" palabras="pin sesiones ingresos">
          <AccessSettings pinSource={d.pinRow?.source ?? null} pinUpdatedAt={d.pinRow?.updated_at ?? null} events={d.accessEvents as any} />
        </SeccionAjustes>
      </GrupoAjustes>

      <GrupoAjustes id="sistema" titulo="Sistema, tareas e integraciones" resumen={resumenDe("sistema")} soloAvanzado>
        <SeccionAjustes
          id="tareas"
          titulo="Tareas del servidor"
          alcance="general"
          palabras="latido cron citas contenido"
          descripcion="El latido «campaigns-tick» corre cada minuto en Supabase; su estado se ve en Salud del sistema. Acá se encienden las tareas de citas y de contenido."
        >
          <TareasServidorControl citas={d.tareas.citas} contenido={d.tareas.contenido} configProblem={d.tareas.configProblem ?? null} />
        </SeccionAjustes>
        <SeccionAjustes id="conexiones" titulo="Conexiones" alcance="general" palabras="integraciones google calendar metricool search console">
          <Conexiones />
        </SeccionAjustes>
        <SeccionAjustes id="cuarentena" titulo="Mensajes retenidos por seguridad" alcance="general" palabras="meta webhooks firma cuarentena">
          {d.retenidos > 0 ? (
            <p className="text-sm text-amber-900">
              Hay {d.retenidos} evento(s) de Meta retenidos sin revisar.{" "}
              <Link href={hrefRetenidos} className="font-semibold underline">
                Revisarlos
              </Link>
            </p>
          ) : (
            <p className="text-sm text-slate-700">No hay eventos de Meta retenidos sin revisar.</p>
          )}
        </SeccionAjustes>
      </GrupoAjustes>
    </>
  );
}
