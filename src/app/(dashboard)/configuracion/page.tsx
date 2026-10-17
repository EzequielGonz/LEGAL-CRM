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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>

      <SeccionAjustes id="perfil" titulo="Perfil, nombres y líneas" alcance="perfil">
        <ProfileSettingsSection slug="juridico" />
      </SeccionAjustes>

      <SeccionAjustes id="plantillas" titulo="Plantillas de WhatsApp" alcance="perfil">
        <TemplatesSection slug="juridico" />
      </SeccionAjustes>

      <SeccionAjustes id="pausa" titulo="Pausa general" alcance="general">
        <PauseControl
          aiPaused={pause.aiRepliesPaused}
          outboundPaused={pause.outboundPaused}
          since={pause.since}
          reason={pause.reason}
          configProblem={pause.configProblem ?? (pause.readError ? `No se pudo leer la pausa general (${pause.readError}): se asume todo en pausa.` : null)}
        />
      </SeccionAjustes>

      <SeccionAjustes id="disponibilidad" titulo="Disponibilidad para citas" alcance="perfil">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AvailabilityEditor area="civil" initialRules={civilRules ?? []} />
          <AvailabilityEditor area="penal" initialRules={penalRules ?? []} />
        </div>
      </SeccionAjustes>

      <SeccionAjustes
        id="tareas"
        titulo="Tareas del servidor"
        alcance="general"
        descripcion="El latido «campaigns-tick» corre cada minuto en Supabase; su estado se ve en Salud del sistema. Acá se encienden las tareas de citas y de contenido."
      >
        <TareasServidorControl citas={tareas.citas} contenido={tareas.contenido} configProblem={tareas.configProblem ?? null} />
      </SeccionAjustes>

      <SeccionAjustes id="conexiones" titulo="Conexiones" alcance="general">
        <Conexiones />
      </SeccionAjustes>

      <SeccionAjustes id="calendario" titulo="Horario de contacto y calendario" alcance="general">
        <CalendarSettings upcoming={calendar.upcoming} archived={calendar.archived} loadError={calendar.error} />
      </SeccionAjustes>

      <SeccionAjustes id="acceso" titulo="Acceso" alcance="general">
        <AccessSettings
          pinSource={pinRow?.source ?? null}
          pinUpdatedAt={pinRow?.updated_at ?? null}
          events={(accessEvents ?? []) as any}
        />
      </SeccionAjustes>

      <SeccionAjustes id="cuarentena" titulo="Mensajes retenidos por seguridad" alcance="general">
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

      <SeccionAjustes id="avisos" titulo="Avisos web" alcance="general">
        <PushSettingsSection />
      </SeccionAjustes>

      <SeccionAjustes id="notificaciones" titulo="Notificaciones" alcance="general">
        <AdminPhoneForm initialPhone={adminPhone} />
      </SeccionAjustes>

      <SeccionAjustes
        id="numeros-adicionales"
        titulo="Números adicionales de notificación"
        alcance="general"
        descripcion={
          <>
            Además del teléfono principal, estos números (no necesitan cuenta en el panel) reciben por WhatsApp el aviso de
            &quot;caso calificado&quot; y &quot;nuevo cliente agendado&quot;.
          </>
        }
      >
        <NotificationPhonesForm phones={notificationPhones ?? []} />
      </SeccionAjustes>

      <SeccionAjustes
        id="canales"
        titulo="Canales"
        alcance="perfil"
        descripcion="El estado de conexión se actualiza solo al configurar las credenciales en las variables privadas del servidor."
      >
        <ul className="divide-y divide-slate-100">
          {(channels ?? []).map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2">
                <AreaBadge area={c.area} />
                <span className="text-slate-800">{c.label}</span>
              </div>
              <span className={`text-sm font-medium ${c.is_connected ? "text-green-700" : "text-slate-600"}`}>
                {c.is_connected ? "Conectado" : "Sin conectar"}
              </span>
            </li>
          ))}
        </ul>
      </SeccionAjustes>

      <SeccionAjustes id="estudios" titulo="Estudios jurídicos" alcance="perfil">
        <ul className="divide-y divide-slate-100">
          {(studios ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2">
                <AreaBadge area={s.area} />
                <span className="text-slate-800">{s.name}</span>
              </div>
              <span className="text-sm text-slate-600">{s.contact_phone}</span>
            </li>
          ))}
          {(studios ?? []).length === 0 && <li className="py-2 text-sm text-slate-600">Sin estudios cargados.</li>}
        </ul>
        <StudioForm />
      </SeccionAjustes>
    </div>
  );
}
