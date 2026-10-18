import Link from "next/link";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { Cabecera } from "@/components/ui/cabecera";
import { BotonAsistente } from "@/components/asistente/boton-asistente";
import { ConexionRedes } from "@/components/redes/conexion-redes";
import { CalendarioPublicaciones, type PiezaCalendario } from "@/components/redes/calendario-publicaciones";
import { createAdminClient } from "@/lib/supabase/admin";
import { leerConexion } from "@/lib/redes/conexion";
import { perfilDePagina } from "@/lib/redes/perfil-pagina";

export const dynamic = "force-dynamic";
export const metadata = { title: "Publicaciones" };

/**
 * Redes y contenido › Publicaciones (18/10): el calendario de lo que sale en
 * Instagram y Facebook, la conexión con Metricool y el pedido al asistente.
 */
export default async function PublicacionesPage({ searchParams }: { searchParams: { perfil?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const { slug, rubroId } = perfilDePagina(searchParams.perfil);
  const desde = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
  const [conexion, { data: proximas }, { data: recientes }] = await Promise.all([
    leerConexion(rubroId),
    createAdminClient()
      .from("content_pieces")
      .select("id, canal, formato, titulo, texto, estado, motivo, programada_para, publicada_at, proveedor_id, url_publicada, media")
      .eq("rubro_id", rubroId)
      .in("canal", ["instagram", "facebook"])
      .in("estado", ["programada", "lista", "retenida", "error", "incierta", "publicando"])
      .order("programada_para", { ascending: true, nullsFirst: false })
      .limit(400),
    createAdminClient()
      .from("content_pieces")
      .select("id, canal, formato, titulo, texto, estado, motivo, programada_para, publicada_at, proveedor_id, url_publicada, media")
      .eq("rubro_id", rubroId)
      .eq("estado", "publicada")
      .gte("publicada_at", desde)
      .order("publicada_at", { ascending: false })
      .limit(30),
  ]);
  const aVista = (p: any): PiezaCalendario => ({ ...p, imagen: Array.isArray(p.media) && p.media[0]?.ref ? String(p.media[0].ref) : null });
  const lista = (proximas ?? []).map(aVista);
  const programadas = lista.filter((p) => p.estado === "programada").length;
  const esperan = lista.length - programadas;

  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-6xl">
        <Cabecera
          titulo="Publicaciones"
          bajada={
            lista.length
              ? `${programadas} programada(s)${esperan ? ` · ${esperan} esperan algo (mirá el motivo en cada una)` : ""}. Posteos con imagen, carruseles e historias.`
              : "Pedile al asistente un calendario: lo arma, lo revisás y con un clic queda programado."
          }
        >
          <BotonAsistente texto="Programá 1 post y 1 historia por día durante 30 días, y un carrusel cada 2 días, en Instagram y Facebook">Programar publicaciones</BotonAsistente>
        </Cabecera>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-8">
            <CalendarioPublicaciones piezas={lista} />
            {(recientes ?? []).length > 0 && (
              <section>
                <h2 className="mb-3 text-base font-semibold text-slate-950">Publicadas en los últimos días</h2>
                <CalendarioPublicaciones piezas={(recientes ?? []).map(aVista)} />
              </section>
            )}
          </div>
          <aside className="space-y-4">
            <ConexionRedes perfil={slug} inicial={conexion} />
            <p className="px-1 text-xs text-slate-500">
              Para crear una pieza suelta o ajustar la marca de las imágenes, usá{" "}
              <Link href={`/contenido?perfil=${slug}`} className="font-medium text-slate-700 underline">
                Contenido
              </Link>
              .
            </p>
          </aside>
        </div>
      </div>
    </MarcoPerfil>
  );
}
