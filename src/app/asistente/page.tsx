import { Suspense } from "react";
import Link from "next/link";
import { requirePageSession } from "@/lib/acceso/pagina";
import { ChatAsistenteGeneral, type AccesoAsistente } from "@/components/asistente/chat-asistente-general";
import { ResumenSemana } from "@/components/asistente/resumen-semana";

export const metadata = { title: "Asistente" };
export const dynamic = "force-dynamic";

/**
 * Asistente general en su pantalla propia (15/11, pedido de la responsable:
 * «sencillo pero funcional»). Arriba, la semana de todo el panel; después,
 * accesos directos grandes que llenan el chat o abren el selector de
 * planillas; abajo, el chat. Todo cambio queda como propuesta hasta confirmar.
 */
const ACCESOS: AccesoAsistente[] = [
  { titulo: "Lanzar campañas con planillas", descripcion: "Elegí una planilla por perfil y te armo las campañas para revisar.", accion: "archivos", texto: "Te adjunto una planilla por perfil: armá las campañas" },
  { titulo: "¿Cómo vienen los 4 perfiles?", descripcion: "Un resumen corto de cada perfil.", accion: "enviar", texto: "¿Cómo vienen los cuatro perfiles? Resumilo corto, perfil por perfil." },
  { titulo: "Mejorar un bot", descripcion: "Contame qué cambiar y armo una versión nueva para probar.", accion: "enviar", texto: "Quiero mejorar el bot de un perfil. Preguntame cuál y qué querés cambiar." },
  { titulo: "Programar publicaciones", descripcion: "Posteos e historias para las redes de un perfil.", accion: "enviar", texto: "Quiero programar publicaciones. Preguntame para qué perfil, cuántas y desde cuándo." },
  { titulo: "Buscar captados", descripcion: "Quién dejó sus datos y falta derivar.", accion: "enviar", texto: "¿Qué captados falta derivar en los cuatro perfiles?" },
  { titulo: "Revisar chats que piden una persona", descripcion: "Los chats que esperan a alguien del equipo.", accion: "enviar", texto: "Mostrame los chats que piden una persona en los cuatro perfiles." },
];

export default async function AsistentePage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  return (
    <main id="asistente" className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Asistente general</h1>
            <p className="mt-1 text-sm text-slate-600">Los cuatro perfiles en un solo lugar. Nada cambia hasta que confirmes.</p>
          </div>
          <Link href="/perfiles" prefetch={false} className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-100">
            Volver a Perfiles
          </Link>
        </div>
        <Suspense fallback={<p role="status" className="text-sm text-slate-600">Cargando la semana…</p>}>
          <ResumenSemana />
        </Suspense>
        <section aria-labelledby="asistente-pedir">
          <h2 id="asistente-pedir" className="mb-3 text-lg font-semibold text-slate-900">
            ¿Qué necesitás?
          </h2>
          <ChatAsistenteGeneral accesos={ACCESOS} />
        </section>
      </div>
    </main>
  );
}
