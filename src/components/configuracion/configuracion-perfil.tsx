import Link from "next/link";
import { ProfileSettingsSection } from "@/components/perfiles/profile-settings-section";
import { TemplatesSection } from "@/components/plantillas/templates-section";
import { createClient } from "@/lib/supabase/server";
import { AreaBadge } from "@/components/ui/badge";
import { SeccionAjustes } from "@/components/configuracion/seccion-ajustes";
import { GrupoAjustes } from "@/components/configuracion/grupo-ajustes";
import { NavegacionAjustes, type GrupoNav } from "@/components/configuracion/navegacion-ajustes";
import { BriefMarca } from "@/components/contenido/contenido-etapa3";
import type { SlugPerfil } from "@/lib/marca";
import { HorarioAtencion } from "@/components/configuracion/horario-atencion";
import { conEstadoReal } from "@/lib/canales-estado";
import { GruposAjustesGenerales, SeccionCalendarioGeneral, leerAjustesGenerales } from "@/components/configuracion/ajustes-generales";

/**
 * Configuración de Coberturas médicas, Autos 0 km y Marketing (rediseño
 * 17/10, bloque 3): los mismos grupos y el mismo comportamiento que
 * Jurídico. Primero los ajustes de este perfil; al final, los generales
 * (pausa, horario de contacto, avisos, acceso, sistema), que valen para los
 * cuatro perfiles y desde el 13/11 se editan acá mismo, sin salir del perfil.
 */
export async function ConfiguracionPerfil({ slug }: { slug: Exclude<SlugPerfil, "juridico"> }) {
  const supabase = createClient();
  const [{ data: canalesBase }, generales] = await Promise.all([supabase.from("channels").select("*").eq("area", slug).order("type"), leerAjustesGenerales()]);
  const channels = conEstadoReal(canalesBase);
  const conectados = (channels ?? []).filter((c) => c.is_connected).length;
  const grupos: GrupoNav[] = [
    { id: "marca", titulo: "Perfil y marca", resumen: "Nombre, logo, colores y líneas" },
    { id: "canales", titulo: "Canales, líneas y plantillas", resumen: `${conectados} de ${(channels ?? []).length} canales conectados` },
    { id: "agenda", titulo: "Agenda y horario de atención", resumen: "Respuesta 24 h · asesores de lunes a sábado de 8 a 21" },
    { id: "agentes", titulo: "Bot de este perfil", resumen: "En Bot IA" },
    ...generales.grupos,
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Configuración</h1>
        <p className="mt-1 text-sm text-slate-600">Tocá un grupo para abrirlo. Primero, los ajustes de este perfil; al final, los que valen para los cuatro.</p>
      </div>

      <NavegacionAjustes grupos={grupos} />

      <div className="grupos-ajustes">

      <GrupoAjustes id="marca" titulo="Perfil y marca" resumen={grupos[0].resumen}>
        <SeccionAjustes id="marca-perfil" titulo="Marca del perfil" alcance="perfil" nivel="simple" palabras="logo colores nombre identidad">
          <BriefMarca perfil={slug} soloMarca />
        </SeccionAjustes>
        <SeccionAjustes id="perfil" titulo="Perfil, nombres y líneas" alcance="perfil" palabras="nombre foto líneas whatsapp">
          <ProfileSettingsSection slug={slug} />
        </SeccionAjustes>
      </GrupoAjustes>

      <GrupoAjustes id="canales" titulo="Canales, líneas y plantillas" resumen={grupos[1].resumen} soloAvanzado>
        <SeccionAjustes
          id="canales"
          titulo="Canales"
          alcance="perfil"
          palabras="whatsapp conexión"
          descripcion="Conectado: las credenciales del canal están cargadas en Vercel. El formulario de la landing no necesita credenciales."
        >
          <ul className="divide-y divide-slate-100">
            {(channels ?? []).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <AreaBadge area={c.area} />
                  <span className="text-slate-800 [overflow-wrap:anywhere]">{c.label}</span>
                  {c.phone_number && <span className="text-sm text-slate-600">({c.phone_number})</span>}
                </div>
                <span className={`text-sm font-medium ${c.is_connected ? "text-green-700" : "text-slate-600"}`}>{c.is_connected ? "Conectado" : "Sin conectar"}</span>
              </li>
            ))}
            {(channels ?? []).length === 0 && <li className="py-2 text-sm text-slate-600">Sin canales cargados.</li>}
          </ul>
        </SeccionAjustes>
        <SeccionAjustes id="plantillas" titulo="Plantillas de WhatsApp" alcance="perfil" palabras="meta mensajes aprobadas">
          <TemplatesSection slug={slug} />
        </SeccionAjustes>
      </GrupoAjustes>

      <GrupoAjustes id="agenda" titulo="Agenda y horario de atención" resumen={grupos[2].resumen}>
        <SeccionAjustes id="horario-atencion" titulo="Horario de atención" alcance="general" palabras="24 horas fuera de horario asesor 8 21 noche domingo">
          <HorarioAtencion />
        </SeccionAjustes>
        <SeccionAjustes id="agenda-enlaces" titulo="Citas y disponibilidad" alcance="perfil" palabras="citas turnos horarios feriados excepciones">
          <p className="text-sm text-slate-700">
            Las citas de este perfil están en <Link href={`/panel/${slug}/agenda`} className="font-medium underline">Contactos › Citas</Link>. Los feriados y excepciones del horario valen para los cuatro perfiles y se cargan acá abajo.
          </p>
        </SeccionAjustes>
        <SeccionCalendarioGeneral d={generales} />
      </GrupoAjustes>

      <GrupoAjustes id="agentes" titulo="Bot de este perfil" resumen="En Bot IA" soloAvanzado>
        <SeccionAjustes id="agentes-config" titulo="Dónde se configura el bot" alcance="perfil" palabras="modelo versión prompt evaluación entrenamiento agente">
          <p className="text-sm text-slate-700">
            La configuración del bot de este perfil está en <Link href={`/panel/${slug}/agentes`} className="font-medium underline">Bot IA</Link>. No se cambia desde acá.
          </p>
        </SeccionAjustes>
      </GrupoAjustes>

      <p className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700">
        Los grupos que siguen valen para <strong>los cuatro perfiles</strong>: lo que cambies acá cambia en todos.
      </p>
      <GruposAjustesGenerales d={generales} hrefRetenidos={`/salud?perfil=${slug}#fallas`} />
      </div>
    </div>
  );
}
