import { perfilActivo } from "@/lib/perfil-activo";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { contarIndicador, enlaceIndicador, indicadorPorClave, listarIndicador, rubroIdDe } from "@/lib/indicadores";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { createAdminClient } from "@/lib/supabase/admin";
import { CircuitosMarketing } from "@/components/marketing/circuitos-marketing";
import { BotonAsistente } from "@/components/asistente/boton-asistente";
import { VISTAS_CARTERA, cuandoCorto } from "@/lib/cartera";
import { AREAS_DE_PERFIL, contarGrupo } from "@/lib/cartera-servidor";
import { getCampaignFunnelCounts } from "@/lib/campaigns";
import { TableroHoy } from "@/components/inicio/tablero-hoy";
import { captadoEsperaDeMas, ESPERA_CAPTADO_HORAS } from "@/lib/hoy/colas";
import { EsqueletoHoyBento } from "@/components/inicio/hoy-bento";
import { horaEnBuenosAires, saludoPorHora } from "@/lib/hoy/resumen-hoy";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hoy" };

/**
 * Inicio del perfil. Desde el 13/11 muestra solo lo que lleva a una acción:
 * a quién contestarle, a quién derivar, las citas y los derivados sin cerrar,
 * y una línea con lo que el bot lleva adelante. Las cifras del período están
 * en Resultados. Solo lectura.
 */
export default async function InicioPerfilPage(
  props: { searchParams: Promise<{ perfil?: string; grupo?: string; cola?: string; todo?: string; periodo?: string }> }
) {
  const searchParams = await props.searchParams;
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = await perfilActivo(searchParams.perfil);
  const rubroId = rubroIdDe(perfil);
  if (!rubroId || !esSlugPerfil(perfil)) notFound();
  const slug: SlugPerfil = perfil;
  // 22/11: el saludo se calcula acá, en el servidor, con la hora argentina (sin nombre de persona). Es un texto ya
  // armado que viaja como dato: el navegador no vuelve a leer la hora, así que no hay diferencias de hidratación.
  const saludo = saludoPorHora(horaEnBuenosAires(new Date()));
  return (
    <MarcoPerfil slug={slug} sinSalud>
      <div className="mx-auto max-w-[80rem]">
        <h1 className="sr-only">Hoy</h1>
        {/* 13/11: el marco y el saludo se pintan enseguida; los datos llegan apenas están. */}
        <Suspense fallback={<EsqueletoHoyBento saludo={saludo} />}>
          <CuerpoHoy slug={slug} rubroId={rubroId} searchParams={searchParams} saludo={saludo} />
        </Suspense>
      </div>
    </MarcoPerfil>
  );
}

async function CuerpoHoy({ slug, rubroId, searchParams, saludo }: { slug: SlugPerfil; rubroId: string; saludo: string; searchParams: { grupo?: string; cola?: string; todo?: string; periodo?: string } }) {
  const aqui = `/hoy?perfil=${slug}`;
  const areas = AREAS_DE_PERFIL[slug];
  const s = createAdminClient();
  const conv = VISTAS_CARTERA.conversaciones.grupos;
  const grupo = (clave: string) => conv.find((g) => g.clave === clave)!;

  // 13/11 (pedido de la responsable): en Hoy queda solo lo que lleva a una acción.
  // Las cifras de la semana, la última base y los indicadores sueltos se ven en Resultados.
  // 22/11 (orden del 19/11): sin el bloque «También hoy»; ya no se leen «Derivados sin resultado» ni «Citas próximas» acá
  // (siguen en Resultados y en Chats).
  const claves = ["captado_sin_derivar", "dejaron_de_responder"] as const;
  // 18/11 (velocidad): antes eran cinco tandas de consultas, una detrás de la otra. Ahora son dos.
  const hace24 = new Date(Date.now() - ESPERA_CAPTADO_HORAS * 3_600_000).toISOString();
  const [conteos, captados, hablando, { data: activas }, { data: viejos }] = await Promise.all([
    Promise.all(claves.map(async (c) => [c, await contarIndicador(rubroId as string, indicadorPorClave(c)!)] as const)),
    listarIndicador(rubroId, indicadorPorClave("captado_sin_derivar")!, { orden: "reciente" }),
    contarGrupo(rubroId, areas, grupo("hablando")).catch(() => null),
    // Campañas que están enviando ahora, con su avance. Solo lectura.
    s.from("campaigns").select("id, name, status").in("area", areas).is("archived_at", null).eq("status", "en_curso").order("created_at", { ascending: false }).limit(3),
    // 15/11: captados que esperan el llamado hace más de 24 horas y no tienen cita.
    // Revisión: se cuentan todos (no solo los de la primera página de la lista).
    s.from("opportunities").select("contact_id").eq("rubro_id", rubroId as string).eq("capture_state", "captado").eq("derivation_state", "no_derivado").lt("captured_at", hace24).limit(500),
  ]);
  const baseCampanas = slug === "juridico" ? "/campanas" : `/panel/${slug}/campanas`;
  const cuenta = Object.fromEntries(conteos.map(([c, r]) => [c, r])) as Record<(typeof claves)[number], { count: number | null; error: string | null }>;
  const errores = conteos.filter(([, r]) => r.error).length;

  // Citas próximas de los captados que se muestran, y citas de los que esperan de más.
  const ids = (captados.filas ?? []).map((f: any) => f.contact_id).filter(Boolean);
  const idsViejos = ((viejos ?? []) as any[]).map((o) => o.contact_id).filter(Boolean);
  const [embudos, { data: citas }, { data: conCita }] = await Promise.all([
    Promise.all(((activas ?? []) as any[]).map((c) => getCampaignFunnelCounts(s, c.id).catch(() => null))),
    ids.length
      ? s.from("appointments").select("contact_id, starts_at, status, kind").in("contact_id", ids).gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true })
      : Promise.resolve({ data: [] as any[] }),
    idsViejos.length
      ? s.from("appointments").select("contact_id, status").in("contact_id", idsViejos).gte("starts_at", new Date().toISOString())
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const citaDe = (id: string) => ((citas ?? []) as any[]).find((c) => c.contact_id === id && !/cancel/.test(String(c.status ?? "")));

  // Lo que el bot lleva adelante solo: se informa en una línea, cada dato abre su lista.
  const delBot = [
    { texto: "en charla con el bot", n: hablando, href: `/conversaciones?perfil=${slug}&grupo=hablando` },
    { texto: "en seguimiento", n: cuenta.dejaron_de_responder.count, href: enlaceIndicador(slug, "dejaron_de_responder", aqui) },
    ...((activas ?? []) as any[]).map((c, i) => ({ texto: `enviados de «${c.name}»`, n: embudos[i]?.enviados ?? null, de: embudos[i]?.total ?? null, href: `${baseCampanas}/${c.id}` })),
  ];

  const tienenCita = new Set(((conCita ?? []) as any[]).filter((c) => !/cancel/.test(String(c.status ?? ""))).map((c) => c.contact_id));
  const esperanDeMas = idsViejos.filter((id) => !tienenCita.has(id)).length;

  return (
    <>
      <TableroHoy
        slug={slug}
        rubroId={rubroId}
        areas={areas}
        grupo={searchParams.grupo}
        filtroCola={searchParams.cola}
        verTodo={searchParams.todo === "1"}
        saludo={saludo}
        totalCaptados={cuenta.captado_sin_derivar.count}
        esperanDeMas={esperanDeMas}
        cifrasSinLeer={errores}
        delBot={delBot}
        captados={(captados.filas ?? []).map((o: any) => {
          const cita = citaDe(o.contact_id);
          const tarde = !cita && captadoEsperaDeMas(o.captured_at ?? o.updated_at ?? null);
          return {
            contactId: o.contact_id ?? null,
            conversationId: o.conversation_id ?? null,
            nombre: o.contacts?.full_name ?? null,
            detalle: `${tarde ? "Espera el llamado hace más de 24 h · " : ""}Aceptó el siguiente paso${o.area === "penal" ? " · Penal" : ""}`,
            etiqueta: cita ? `Cita ${cuandoCorto(cita.starts_at)}${cita.kind === "ia" ? " · Fase 2" : ""}` : tarde ? "Más de 24 h" : null,
            at: o.updated_at ?? null,
          };
        })}
      />

      {slug === "marketing" ? <CircuitosMarketing /> : null}

      <p className="text-sm text-slate-600">
        Los números de la semana y del mes, con de dónde vino cada persona, están en{" "}
        <Link prefetch={false} href={`/resultados?perfil=${slug}`} className="font-medium text-slate-900 underline underline-offset-2">
          Resultados
        </Link>
        .
      </p>
    </>
  );
}
