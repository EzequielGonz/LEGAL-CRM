import { Suspense } from "react";
import Link from "next/link";
import { requirePageSession } from "@/lib/acceso/pagina";
import { ChatAsistenteGeneral, type AccesoAsistente } from "@/components/asistente/chat-asistente-general";
import { Icono } from "@/components/ui/icono-seccion";
import "@/components/jarvis/jarvis.css";
import { ResumenSemana } from "@/components/asistente/resumen-semana";

export const metadata = { title: "Jarvis" };
export const dynamic = "force-dynamic";

/**
 * Asistente general en su pantalla propia (15/11, pedido de la responsable:
 * «sencillo pero funcional»). Arriba, la semana de todo el panel; después,
 * accesos directos grandes que llenan el chat o abren el selector de
 * planillas; abajo, el chat. Todo cambio queda como propuesta hasta confirmar.
 */
const ACCESOS: AccesoAsistente[] = [
  { titulo: "¿Qué tengo pendiente hoy?", descripcion: "Lo que espera tu decisión hoy.", accion: "enviar", texto: "¿Qué tengo pendiente hoy en los cuatro perfiles?" },
  { titulo: "Armá una campaña con esta base", descripcion: "Elegí la planilla y te armo la campaña para revisar.", accion: "archivos", texto: "Armá una campaña con esta base" },
  { titulo: "Creá un rol para el bot de …", descripcion: "Completá el perfil y el caso; queda como propuesta.", accion: "rellenar", texto: "Creá un rol para el bot de " },
  { titulo: "Resumen de la semana", descripcion: "Un resumen corto, perfil por perfil.", accion: "enviar", texto: "Hacé un resumen de la semana, perfil por perfil." },
  { titulo: "¿Qué líneas están caídas?", descripcion: "Las líneas de WhatsApp que no andan.", accion: "enviar", texto: "¿Qué líneas de WhatsApp están caídas en los cuatro perfiles?" },
  { titulo: "Buscar captados sin derivar", descripcion: "Quién dejó sus datos y falta derivar.", accion: "enviar", texto: "¿Qué captados falta derivar en los cuatro perfiles?" },
  { titulo: "Chats que piden una persona", descripcion: "Los chats que esperan a alguien del equipo.", accion: "enviar", texto: "Mostrame los chats que piden una persona en los cuatro perfiles." },
];

export default async function AsistentePage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  return (
    <main id="asistente" className="jv-pagina min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="jv-pagina-cabeza">
          <span className="jv-orbe-mini" aria-hidden="true">
            <Icono nombre="asistente" className="jv-orbe-icono-mini" />
          </span>
          <div className="jv-cabeza-texto">
            <h1 className="jv-pagina-titulo">Jarvis</h1>
            <p className="jv-pagina-sub">Tu secretario de todo el panel: propone, vos confirmás</p>
          </div>
          <Link href="/perfiles" prefetch={false} className="jv-boton jv-pagina-volver">
            Volver a Perfiles
          </Link>
        </div>
        <Suspense fallback={<p role="status" className="jv-semana-sub">Cargando la semana…</p>}>
          <ResumenSemana />
        </Suspense>
        <section aria-labelledby="asistente-pedir">
          <h2 id="asistente-pedir" className="sr-only">
            Pedile algo a Jarvis
          </h2>
          <ChatAsistenteGeneral
            variante="jarvis"
            accesos={ACCESOS}
            titulo="Jarvis"
            bajada="Tu secretario de todo el panel: propone, vos confirmás"
            vacio="Preguntame lo que quieras o pedime algo de los cuatro perfiles. Podés adjuntar planillas (Excel o CSV): de cada una veo solo un resumen, con los teléfonos ocultos. Antes de cambiar cualquier cosa te pregunto «¿Lo hago?»."
            placeholder="Escribile a Jarvis, por ejemplo: con estas planillas armá una campaña por perfil"
          />
        </section>
      </div>
    </main>
  );
}
