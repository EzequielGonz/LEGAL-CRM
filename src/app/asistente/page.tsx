import { Suspense } from "react";
import Link from "next/link";
import { requirePageSession } from "@/lib/acceso/pagina";
import { ChatAsistenteGeneral, type AccesoAsistente } from "@/components/asistente/chat-asistente-general";
import { resumenSemanaEnMemoria } from "@/lib/asistente/semana-cache";
import { NOMBRE_PERFIL } from "@/lib/asistente/general";
import { propuestasPendientes } from "@/lib/jarvis/servidor";
import { SLUGS_PERFIL } from "@/lib/marca";
import { JvBentoGeneral } from "@/components/jarvis/jv-bento-general";
import { OrbeVivo } from "@/components/jarvis/jv-orbe-vivo";
import { Cartel, Pildora } from "@/components/jarvis/jv-cartel";
import { AccesosNeumorficos, JvParallax, PropuestasVidrio } from "@/components/jarvis/jv-pantalla";
import "@/components/jarvis/jarvis.css";
import "@/components/jarvis/jarvis-vivo.css";

export const metadata = { title: "Jarvis" };
export const dynamic = "force-dynamic";

/**
 * Jarvis en pantalla completa (vuelta 6, 22/11). Mismo lenguaje visual que el modo Jarvis: cabecera con
 * degradé de colores en capas que se mueven (parallax), orbe vivo y cartel animado; arriba, la semana de
 * los cuatro perfiles en bento de colores con gráficos; abajo, la charla y a la derecha los botones
 * neumórficos y lo que espera tu OK en tarjetas de vidrio. Todo cambio queda como propuesta hasta el Sí.
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

async function Semana() {
  const datos = await resumenSemanaEnMemoria().catch(() => null);
  if (!datos) return <p className="jv-b-aviso">No se pudo leer la semana. Probá recargar en un rato.</p>;
  return <JvBentoGeneral perfiles={datos.perfiles.map((p) => ({ perfil: p.perfil, nombre: NOMBRE_PERFIL[p.perfil], cifras: p.cifras }))} />;
}

async function Pendientes() {
  const grupos = await Promise.all(
    SLUGS_PERFIL.map(async (slug) => {
      const r = await propuestasPendientes(slug).catch(() => ({ visibles: [] }));
      return { perfil: slug, nombre: NOMBRE_PERFIL[slug], propuestas: r.visibles.slice(0, 3).map((p) => ({ ...p })) };
    })
  );
  return <PropuestasVidrio grupos={grupos} />;
}

export default async function AsistentePage({ searchParams }: { searchParams: Promise<{ pedido?: string | string[] }> }) {
  const sp = await searchParams;
  const pedido = typeof sp.pedido === "string" ? sp.pedido.slice(0, 1000) : "";
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  return (
    <main id="asistente" className="jv-escenario">
      <div className="jv-pantalla">
        <JvParallax className="jv-hero">
          <div className="jv-mesh" aria-hidden="true" data-profundidad="0.35">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="jv-hero-capa jv-hero-texto" data-profundidad="0.12">
            <p>
              <Pildora>Jarvis · los cuatro perfiles</Pildora>
            </p>
            <Cartel como="h1" texto="Tu *secretario* de todo el panel" className="jv-hero-titulo" />
            <Cartel texto="Propone con datos reales y vos confirmás: *nada cambia* sin tu «Sí»." className="jv-hero-sub" retrasoMs={420} />
            <div className="jv-hero-botones">
              <Link href="/perfiles" prefetch={false} className="jv-ctrl">
                Volver a Perfiles
              </Link>
            </div>
          </div>
          <div className="jv-hero-capa jv-hero-orbe" data-profundidad="0.6">
            <OrbeVivo tamano={190} />
          </div>
        </JvParallax>

        <Suspense fallback={<p role="status" className="jv-b-aviso">Cargando la semana…</p>}>
          <Semana />
        </Suspense>

        <div className="jv-pantalla-grilla">
          <section id="asistente-chat" aria-labelledby="asistente-pedir">
            <h2 id="asistente-pedir" className="sr-only">
              Pedile algo a Jarvis
            </h2>
            <ChatAsistenteGeneral
              variante="jarvis"
              ocultarAccesos
              pedidoInicial={pedido}
              accesos={ACCESOS}
              titulo="Jarvis"
              bajada="Charla con los cuatro perfiles: propone, vos confirmás"
              vacio="Preguntame lo que quieras o pedime algo de los cuatro perfiles. Podés adjuntar planillas (Excel o CSV): de cada una veo solo un resumen, con los teléfonos ocultos. Antes de cambiar cualquier cosa te pregunto «¿Lo hago?»."
              placeholder="Escribile a Jarvis, por ejemplo: con estas planillas armá una campaña por perfil"
            />
          </section>
          <aside className="jv-pantalla-lado" aria-label="Acciones y propuestas">
            <section aria-labelledby="jv-hacer-g" className="jv-lado-sec">
              <h2 id="jv-hacer-g" className="jv-sec-titulo">
                Hacer ahora <span>te pregunto antes</span>
              </h2>
              <AccesosNeumorficos accesos={ACCESOS.map((a) => ({ titulo: a.titulo, texto: a.texto }))} />
            </section>
            <Suspense fallback={<p role="status" className="jv-b-aviso">Buscando propuestas…</p>}>
              <Pendientes />
            </Suspense>
          </aside>
        </div>
      </div>
    </main>
  );
}
