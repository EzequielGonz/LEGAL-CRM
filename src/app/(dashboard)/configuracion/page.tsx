import { ProfileSettingsSection } from "@/components/perfiles/profile-settings-section";
import { TemplatesSection } from "@/components/plantillas/templates-section";
import { createClient } from "@/lib/supabase/server";
import { AreaBadge } from "@/components/ui/badge";
import { StudioForm } from "@/components/configuracion/studio-form";
import { AdminPhoneForm } from "@/components/configuracion/admin-phone-form";
import { NotificationPhonesForm } from "@/components/configuracion/notification-phones-form";
import { AccessSettings } from "@/components/configuracion/access-settings";
import { PauseControl } from "@/components/configuracion/pause-control";
import { PushSettingsSection } from "@/components/configuracion/push-settings-section";
import { getAutomationPause } from "@/lib/automation-pause";
import { CalendarSettings } from "@/components/configuracion/calendar-settings";
import { TareasServidorControl } from "@/components/configuracion/tareas-servidor-control";
import { Conexiones } from "@/components/configuracion/conexiones";
import { AvailabilityEditor } from "@/components/agenda/availability-editor";
import { getTareasServidor } from "@/lib/tareas-servidor";
import { listCalendarExceptions } from "@/lib/contacto/calendario";
import Link from "next/link";
import { SeccionAjustes } from "@/components/configuracion/seccion-ajustes";
import { GrupoAjustes } from "@/components/configuracion/grupo-ajustes";
import { NavegacionAjustes, type GrupoNav } from "@/components/configuracion/navegacion-ajustes";
import { BriefMarca } from "@/components/contenido/contenido-etapa3";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const supabase = createClient();

  // Filtrado a civil/penal en canales y estudios: sin esto, el canal de
  // WhatsApp de los rubros nuevos (Agencia 0KM, etc.) aparecía mezclado
  // acá — cada rubro ahora tiene su propia Configuración en su panel
  // dedicado (/panel/<rubro>/configuracion). Notificaciones y números
  // adicionales siguen siendo globales (no tienen columna de área), así
  // que se quedan acá sin cambios.
  const [
    { data: channels },
    { data: studios },
    { data: adminProfile },
    { data: notificationPhones },
    { data: pinRow },
    { data: accessEvents },
    { count: retenidos },
    pause,
  ] = await Promise.all([
    supabase.from("channels").select("*").in("area", ["civil", "penal"]).order("area").order("type"),
    supabase.from("studios").select("*").in("area", ["civil", "penal"]).order("area"),
    // Con el PIN general ya no hay usuario logueado: se muestra el teléfono
    // del perfil de administrador que ya existía.
    supabase.from("admin_profiles").select("phone").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("notification_phones").select("*").order("created_at", { ascending: true }),
    supabase.from("access_pin").select("source, updated_at").eq("id", true).maybeSingle(),
    supabase.from("access_events").select("id, at, kind, device").order("at", { ascending: false }).limit(15),
    supabase.from("webhook_quarantine").select("id", { count: "exact", head: true }).is("reviewed_at", null),
    getAutomationPause(),
  ]);
  const calendar = await listCalendarExceptions();
  const tareas = await getTareasServidor();
  const [{ data: civilRules }, { data: penalRules }] = await Promise.all([
    supabase.from("availability_rules").select("*").eq("area", "civil").order("weekday"),
    supabase.from("availability_rules").select("*").eq("area", "penal").order("weekday"),
  ]);

  const adminPhone: string | null = adminProfile?.phone ?? null;

  const conectados = (channels ?? []).filter((c) => c.is_connected).length;
  const pausaActiva = pause.aiRepliesPaused || pause.outboundPaused;
  const grupos: GrupoNav[] = [
    { id: "marca", titulo: "Perfil y marca", resumen: "Nombre, logo, colores, líneas y estudios" },
    { id: "canales", titulo: "Canales, líneas y plantillas", resumen: `${conectados} de ${(channels ?? []).length} canales conectados` },
    { id: "agenda", titulo: "Agenda, disponibilidad, horarios y excepciones", resumen: `${calendar.upcoming?.length ?? 0} excepciones próximas` },
    { id: "automatizaciones", titulo: "Automatizaciones y pausas", resumen: pausaActiva ? "Pausa general activa" : "Pausa general levantada" },
    { id: "agentes", titulo: "Agentes, versiones, modelos y evaluaciones", resumen: "En Agentes IA y Comparación de agentes" },
    { id: "notificaciones", titulo: "Notificaciones y dispositivos", resumen: `${(notificationPhones ?? []).length + (adminPhone ? 1 : 0)} números de aviso` },
    { id: "acceso", titulo: "Acceso, PIN y sesiones", resumen: pinRow?.source ? "PIN configurado" : "PIN sin configurar" },
    { id: "sistema", titulo: "Sistema, tareas e integraciones", resumen: (retenidos ?? 0) > 0 ? `${retenidos} eventos retenidos sin revisar` : "Sin eventos retenidos" },
  ];
  const resumenDe = (id: string) => grupos.find((g) => g.id === id)?.resumen;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-700">
          <span className="solo-simple">Los ajustes de todos los días. El resto está en la configuración completa.</span>
          <span className="solo-avanzado">Todos los ajustes, en ocho grupos. Cada sección se guarda por separado y dice si vale para este perfil o para todos.</span>
        </p>
      </div>

      <NavegacionAjustes grupos={grupos} />

      <GrupoAjustes id="marca" titulo="Perfil y marca" resumen={resumenDe("marca")}>
        <SeccionAjustes id="marca-perfil" titulo="Marca del perfil" alcance="perfil" nivel="simple" palabras="logo colores nombre identidad">
          <BriefMarca perfil="juridico" soloMarca />
        </SeccionAjustes>
        <SeccionAjustes id="perfil" titulo="Perfil, nombres y líneas" alcance="perfil" palabras="nombre foto líneas whatsapp">
          <ProfileSettingsSection slug="juridico" />
        </SeccionAjustes>
        <SeccionAjustes id="estudios" titulo="Estudios jurídicos" alcance="perfil" palabras="derivación estudio abogado">
          <ul className="divide-y divide-slate-100">
            {(studios ?? []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <AreaBadge area={s.area} />
                  <span className="text-slate-800 [overflow-wrap:anywhere]">{s.name}</span>
                </div>
                <span className="text-sm text-slate-600">{s.contact_phone}</span>
              </li>
            ))}
            {(studios ?? []).length === 0 && <li className="py-2 text-sm text-slate-600">Sin estudios cargados.</li>}
          </ul>
          <StudioForm />
        </SeccionAjustes>
      </GrupoAjustes>

      <GrupoAjustes id="canales" titulo="Canales, líneas y plantillas" resumen={resumenDe("canales")} soloAvanzado>
        <SeccionAjustes
          id="canales"
          titulo="Canales"
          alcance="perfil"
          palabras="whatsapp instagram facebook conexión"
          descripcion="El estado de conexión se actualiza solo al configurar las credenciales en las variables privadas del servidor."
        >
          <ul className="divide-y divide-slate-100">
            {(channels ?? []).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <AreaBadge area={c.area} />
                  <span className="text-slate-800 [overflow-wrap:anywhere]">{c.label}</span>
                </div>
                <span className={`text-sm font-medium ${c.is_connected ? "text-green-700" : "text-slate-600"}`}>
                  {c.is_connected ? "Conectado" : "Sin conectar"}
                </span>
              </li>
            ))}
          </ul>
        </SeccionAjustes>
        <SeccionAjustes id="plantillas" titulo="Plantillas de WhatsApp" alcance="perfil" palabras="meta mensajes aprobadas">
          <TemplatesSection slug="juridico" />
        </SeccionAjustes>
      </GrupoAjustes>

      <GrupoAjustes id="agenda" titulo="Agenda, disponibilidad, horarios y excepciones" resumen={resumenDe("agenda")}>
        <SeccionAjustes id="disponibilidad" titulo="Disponibilidad para citas" alcance="perfil" nivel="simple" palabras="horarios turnos días">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AvailabilityEditor area="civil" initialRules={civilRules ?? []} />
            <AvailabilityEditor area="penal" initialRules={penalRules ?? []} />
          </div>
        </SeccionAjustes>
        <SeccionAjustes id="calendario" titulo="Horario de contacto y calendario" alcance="general" palabras="feriados excepciones horario 8 21">
          <CalendarSettings upcoming={calendar.upcoming} archived={calendar.archived} loadError={calendar.error} />
        </SeccionAjustes>
      </GrupoAjustes>

      <GrupoAjustes id="automatizaciones" titulo="Automatizaciones y pausas" resumen={resumenDe("automatizaciones")}>
        <SeccionAjustes id="pausa" titulo="Pausa general" alcance="general" nivel="simple" palabras="detener agentes envíos">
          <PauseControl
            aiPaused={pause.aiRepliesPaused}
            outboundPaused={pause.outboundPaused}
            since={pause.since}
            reason={pause.reason}
            configProblem={pause.configProblem ?? (pause.readError ? `No se pudo leer la pausa general (${pause.readError}): se asume todo en pausa.` : null)}
          />
        </SeccionAjustes>
      </GrupoAjustes>

      <GrupoAjustes id="agentes" titulo="Agentes, versiones, modelos y evaluaciones" resumen={resumenDe("agentes")} soloAvanzado>
        <SeccionAjustes id="agentes-config" titulo="Dónde se configuran los agentes" alcance="perfil" palabras="modelo versión prompt evaluación entrenamiento">
          <p className="text-sm text-slate-700">
            La configuración de cada agente (versión, modelo, parámetros y biblioteca) está en{" "}
            <Link href="/agentes" className="font-medium underline">Agentes IA</Link>; las evaluaciones y el experimento, en{" "}
            <Link href="/comparacion-agentes?perfil=juridico" className="font-medium underline">Comparación de agentes</Link>. Cambiarlos no se hace desde acá.
          </p>
        </SeccionAjustes>
      </GrupoAjustes>

      <GrupoAjustes id="notificaciones" titulo="Notificaciones y dispositivos" resumen={resumenDe("notificaciones")}>
        <SeccionAjustes id="notificaciones" titulo="Teléfono principal de avisos" alcance="general" nivel="simple" palabras="whatsapp aviso administrador">
          <AdminPhoneForm initialPhone={adminPhone} />
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
          <NotificationPhonesForm phones={notificationPhones ?? []} />
        </SeccionAjustes>
        <SeccionAjustes id="avisos" titulo="Avisos web en este dispositivo" alcance="general" palabras="push notificaciones navegador teléfono">
          <PushSettingsSection />
        </SeccionAjustes>
      </GrupoAjustes>

      <GrupoAjustes id="acceso" titulo="Acceso, PIN y sesiones" resumen={resumenDe("acceso")} soloAvanzado>
        <SeccionAjustes id="acceso" titulo="Acceso" alcance="general" palabras="pin sesiones ingresos">
          <AccessSettings
            pinSource={pinRow?.source ?? null}
            pinUpdatedAt={pinRow?.updated_at ?? null}
            events={(accessEvents ?? []) as any}
          />
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
          <TareasServidorControl citas={tareas.citas} contenido={tareas.contenido} configProblem={tareas.configProblem ?? null} />
        </SeccionAjustes>
        <SeccionAjustes id="conexiones" titulo="Conexiones" alcance="general" palabras="integraciones google calendar metricool search console">
          <Conexiones />
        </SeccionAjustes>
        <SeccionAjustes id="cuarentena" titulo="Mensajes retenidos por seguridad" alcance="general" palabras="meta webhooks firma cuarentena">
          {(retenidos ?? 0) > 0 ? (
            <p className="text-sm text-amber-900">
              Hay {retenidos} evento(s) de Meta retenidos sin revisar.{" "}
              <Link href="/revision?vista=retenidos" className="font-semibold underline">
                Revisarlos
              </Link>
            </p>
          ) : (
            <p className="text-sm text-slate-700">No hay eventos de Meta retenidos sin revisar.</p>
          )}
        </SeccionAjustes>
      </GrupoAjustes>
    </div>
  );
}
