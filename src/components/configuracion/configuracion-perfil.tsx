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

/**
 * Configuración de Coberturas médicas, Autos 0 km y Marketing (rediseño
 * 17/10, bloque 3): los mismos grupos y el mismo comportamiento que
 * Jurídico. Acá van los ajustes de este perfil; los generales (pausa,
 * horario de contacto, avisos, acceso, sistema) valen para los cuatro
 * perfiles y se editan en un solo lugar, enlazado desde cada grupo.
 */
export async function ConfiguracionPerfil({ slug }: { slug: Exclude<SlugPerfil, "juridico"> }) {
  const supabase = createClient();
  const { data: channels } = await supabase.from("channels").select("*").eq("area", slug).order("type");
  const conectados = (channels ?? []).filter((c) => c.is_connected).length;
  const grupos: GrupoNav[] = [
    { id: "marca", titulo: "Perfil y marca", resumen: "Nombre, logo, colores y líneas" },
    { id: "canales", titulo: "Canales, líneas y plantillas", resumen: `${conectados} de ${(channels ?? []).length} canales conectados` },
    { id: "generales", titulo: "Ajustes generales (todos los perfiles)", resumen: "Agenda, automatizaciones, avisos, acceso y sistema" },
  ];
  const general = (ancla: string, texto: string) => (
    <Link href={`/configuracion?nivel=avanzado#${ancla}`} className="font-medium underline">
      {texto}
    </Link>
  );
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-700">
          <span className="solo-simple">Los ajustes de todos los días. El resto está en la configuración completa.</span>
          <span className="solo-avanzado">Ajustes de este perfil y acceso a los generales. Cada sección se guarda por separado.</span>
        </p>
      </div>

      <NavegacionAjustes grupos={grupos} />

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
          descripcion="El estado de conexión se actualiza solo al cargar las credenciales del perfil en las variables privadas del servidor (Vercel)."
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

      <GrupoAjustes id="generales" titulo="Ajustes generales (todos los perfiles)" resumen={grupos[2].resumen}>
        <SeccionAjustes id="generales-enlaces" titulo="Dónde están los ajustes que comparten los cuatro perfiles" alcance="general" nivel="simple" palabras="pausa horario avisos pin acceso tareas conexiones agentes">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>{general("pausa", "Pausa general")} y {general("tareas", "tareas del servidor")}</li>
            <li>{general("calendario", "Horario de contacto, feriados y excepciones")}</li>
            <li>{general("notificaciones", "Teléfonos de aviso")} y {general("avisos", "avisos web en este dispositivo")}</li>
            <li>{general("acceso", "Acceso, PIN y sesiones")}</li>
            <li>{general("conexiones", "Conexiones e integraciones")}</li>
            <li>
              Agentes de este perfil:{" "}
              <Link href={`/panel/${slug}/agentes`} className="font-medium underline">Agentes IA</Link> y{" "}
              <Link href={`/comparacion-agentes?perfil=${slug}`} className="font-medium underline">Comparación de agentes</Link>
            </li>
          </ul>
        </SeccionAjustes>
      </GrupoAjustes>
    </div>
  );
}
