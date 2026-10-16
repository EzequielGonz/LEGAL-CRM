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

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Perfil, nombres y líneas</h2>
        <ProfileSettingsSection slug="juridico" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Plantillas de WhatsApp</h2>
        <TemplatesSection slug="juridico" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Pausa general</h2>
        <PauseControl
          aiPaused={pause.aiRepliesPaused}
          outboundPaused={pause.outboundPaused}
          since={pause.since}
          reason={pause.reason}
          configProblem={pause.configProblem ?? (pause.readError ? `No se pudo leer la pausa general (${pause.readError}): se asume todo en pausa.` : null)}
        />
      </div>

      <div id="disponibilidad" className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Disponibilidad para citas</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AvailabilityEditor area="civil" initialRules={civilRules ?? []} />
          <AvailabilityEditor area="penal" initialRules={penalRules ?? []} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Tareas del servidor (citas y contenido)</h2>
        <TareasServidorControl citas={tareas.citas} contenido={tareas.contenido} configProblem={tareas.configProblem ?? null} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Conexiones</h2>
        <Conexiones />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Horario de contacto y calendario (todos los perfiles)</h2>
        <CalendarSettings upcoming={calendar.upcoming} archived={calendar.archived} loadError={calendar.error} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Acceso</h2>
        <AccessSettings
          pinSource={pinRow?.source ?? null}
          pinUpdatedAt={pinRow?.updated_at ?? null}
          events={(accessEvents ?? []) as any}
        />
      </div>

      {(retenidos ?? 0) > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Hay {retenidos} evento(s) de Meta retenidos por seguridad.{" "}
          <Link href="/revision?vista=retenidos" className="font-semibold underline">
            Revisarlos
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Avisos web</h2>
        <PushSettingsSection />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Notificaciones</h2>
        <AdminPhoneForm initialPhone={adminPhone} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Números adicionales de notificación
        </h2>
        <p className="mb-3 text-xs text-slate-400">
          Además del teléfono principal de arriba, acá podés agregar los números
          que quieras — no necesitan cuenta en el panel — para que también reciban el aviso de
          &quot;caso calificado&quot; y &quot;nuevo cliente agendado&quot; por WhatsApp.
        </p>
        <NotificationPhonesForm phones={notificationPhones ?? []} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Canales</h2>
        <p className="mb-3 text-xs text-slate-400">
          El estado de conexión se actualiza automáticamente al configurar las credenciales en
          las variables de entorno del servidor (ver Configuración → guía de Meta API).
        </p>
        <ul className="divide-y divide-slate-100">
          {(channels ?? []).map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2">
                <AreaBadge area={c.area} />
                <span className="text-slate-700">{c.label}</span>
              </div>
              <span
                className={`text-xs font-medium ${
                  c.is_connected ? "text-green-600" : "text-slate-400"
                }`}
              >
                {c.is_connected ? "Conectado" : "Sin conectar"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Estudios jurídicos</h2>
        <ul className="divide-y divide-slate-100">
          {(studios ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2">
                <AreaBadge area={s.area} />
                <span className="text-slate-700">{s.name}</span>
              </div>
              <span className="text-xs text-slate-400">{s.contact_phone}</span>
            </li>
          ))}
          {(studios ?? []).length === 0 && (
            <li className="py-2 text-sm text-slate-400">Sin estudios cargados.</li>
          )}
        </ul>
        <StudioForm />
      </div>
    </div>
  );
}
