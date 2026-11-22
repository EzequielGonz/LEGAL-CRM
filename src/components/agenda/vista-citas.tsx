import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { agruparPorDia, horaAR, hoyAR, pasoDeVista, parsearVista, rangoDeVista, tituloDia, tituloRango } from "@/lib/agenda-vista";
import { enlaceConversacion } from "@/lib/cartera";
import { conVolver } from "@/lib/navegacion";
import type { SlugPerfil } from "@/lib/marca";
import { AccionesCita, type CitaVista } from "@/components/agenda/acciones-cita";
import { NuevaCita } from "@/components/agenda/nueva-cita";
import "@/app/contactos/contactos.css";
import "./citas.css";

const ESTADO: Record<string, { texto: string; clase: string }> = {
  pendiente: { texto: "Pendiente", clase: "atencion" },
  confirmada: { texto: "Confirmada", clase: "ok" },
  realizada: { texto: "Asistió", clase: "ok" },
  ausente: { texto: "No asistió", clase: "error" },
  cancelada: { texto: "Cancelada", clase: "neutro" },
};

/**
 * Citas del perfil como herramienta de trabajo (22/11): vista por día o por semana, navegación, nueva cita,
 * y por cada cita asistió / no asistió / mover / cancelar (archiva) / recordatorio. Usa `appointments` y sus rutas.
 */
export async function VistaCitas({ slug, areas, basePath, sp }: { slug: SlugPerfil; areas: string[]; basePath: string; sp: { vista?: string; fecha?: string; canceladas?: string } }) {
  const { vista, fecha } = parsearVista(sp.vista, sp.fecha);
  const conCanceladas = sp.canceladas === "1";
  const { dias, desde, hastaExclusivo } = rangoDeVista(vista, fecha);
  let q = createAdminClient().from("appointments").select("*, contacts(full_name, phone)").in("area", areas).gte("starts_at", desde).lt("starts_at", hastaExclusivo).order("starts_at", { ascending: true }).limit(400);
  if (!conCanceladas) q = q.neq("status", "cancelada");
  const { data, error } = await q;
  const citas = ((data ?? []) as any[]);
  const href = (c: Record<string, string | undefined>) => {
    const p = new URLSearchParams({ vista, fecha, ...(conCanceladas ? { canceladas: "1" } : {}) });
    for (const [k, v] of Object.entries(c)) v === undefined ? p.delete(k) : p.set(k, v);
    return `${basePath}?${p.toString()}`;
  };
  const hoy = hoyAR();
  const grupos = agruparPorDia(citas, dias);
  const abiertas = citas.filter((c) => c.status === "pendiente" || c.status === "confirmada").length;
  const porCerrar = citas.filter((c) => (c.status === "pendiente" || c.status === "confirmada") && new Date(c.ends_at) < new Date()).length;
  const aqui = href({});

  return (
    <section aria-label="Agenda de citas" className="ct-citas">
      <div className="ct-barra">
        <div className="ct-barra__nav" role="group" aria-label="Moverse en el calendario">
          <Link prefetch={false} className="pm-boton pm-boton--secundario ct-boton" href={href({ fecha: pasoDeVista(vista, fecha, -1) })} aria-label={vista === "dia" ? "Día anterior" : "Semana anterior"}>←</Link>
          <Link prefetch={false} className="pm-boton pm-boton--secundario ct-boton" href={href({ fecha: hoy })} aria-current={dias.includes(hoy) ? "date" : undefined}>Hoy</Link>
          <Link prefetch={false} className="pm-boton pm-boton--secundario ct-boton" href={href({ fecha: pasoDeVista(vista, fecha, 1) })} aria-label={vista === "dia" ? "Día siguiente" : "Semana siguiente"}>→</Link>
        </div>
        <h2 className="ct-barra__titulo" aria-live="polite">{tituloRango(vista, fecha)}</h2>
        <div className="ct-barra__vistas" role="group" aria-label="Tipo de vista">
          {(["dia", "semana"] as const).map((v) => (
            <Link key={v} prefetch={false} href={href({ vista: v })} aria-current={vista === v ? "true" : undefined} className={`pm-boton ct-boton ${vista === v ? "pm-boton--primario" : "pm-boton--secundario"}`}>{v === "dia" ? "Día" : "Semana"}</Link>
          ))}
        </div>
        <NuevaCita slug={slug} />
      </div>

      <p className="ct-resumen">
        <strong>{abiertas}</strong> {abiertas === 1 ? "cita abierta" : "citas abiertas"} en este período
        {porCerrar > 0 ? <> · <span className="ct-resumen__alerta">{porCerrar} ya {porCerrar === 1 ? "pasó" : "pasaron"}: cargá si asistió</span></> : null}
        {" · "}
        <Link prefetch={false} className="ct-link" href={href({ canceladas: conCanceladas ? undefined : "1" })}>{conCanceladas ? "Ocultar canceladas" : "Ver canceladas"}</Link>
      </p>

      {error ? (
        <div role="alert" className="ct-vacio"><p className="ct-vacio__t">No se pudieron leer las citas.</p><p>No es «cero»: volvé a intentar.</p><Link prefetch={false} href={aqui} className="pm-boton pm-boton--primario">Reintentar</Link></div>
      ) : citas.length === 0 ? (
        <div className="ct-vacio"><p className="ct-vacio__t">No hay citas {vista === "dia" ? "este día" : "esta semana"}</p><p>Agendá una con «Nueva cita» o mirá otra fecha.</p></div>
      ) : (
        <div className="ct-dias">
          {grupos.map(({ dia, citas: delDia }, i) => (
            <article key={dia} className={`ct-citas-dia${dia === hoy ? " ct-citas-dia--hoy" : ""}`} style={{ ["--ct-orden" as string]: i }} aria-label={tituloDia(dia, hoy)}>
              <h3 className="ct-citas-dia__t">{tituloDia(dia, hoy)} <span className="ct-tenue">{delDia.length === 0 ? "· libre" : `· ${delDia.length}`}</span></h3>
              {delDia.length === 0 ? null : (
                <ul className="ct-citas-lista">
                  {delDia.map((c: any) => {
                    const est = ESTADO[c.status] ?? { texto: c.status, clase: "neutro" };
                    const minutos = Math.max(10, Math.round((Date.parse(c.ends_at) - Date.parse(c.starts_at)) / 60000));
                    const v: CitaVista = {
                      id: c.id, status: c.status, kind: c.kind ?? null, nombre: c.contacts?.full_name?.trim() || "Sin nombre", telefono: c.contacts?.phone ?? null, inicio: c.starts_at, minutos, tipo: c.consultation_type ?? null,
                      chatHref: c.conversation_id ? conVolver(enlaceConversacion(slug, c.conversation_id), aqui) : null,
                      fichaHref: c.contact_id ? conVolver(`/ficha/${c.contact_id}`, aqui) : null,
                    };
                    return (
                      <li key={c.id} className={`ct-cita${c.status === "cancelada" ? " ct-cita--baja" : ""}`}>
                        <div className="ct-cita__hora"><strong>{horaAR(c.starts_at)}</strong><span className="ct-tenue">{minutos} min</span></div>
                        <div className="ct-cita__datos">
                          <p className="ct-nombre">{v.nombre}</p>
                          <p className="ct-tel">{v.telefono ?? "Sin teléfono"}{c.consultation_type ? ` · ${c.consultation_type}` : ""}</p>
                          <p>
                            <span className={`pm-pastilla pm-pastilla--${est.clase}`}><span className="pm-pastilla__punto" aria-hidden="true" />{est.texto}</span>
                            {c.kind === "ia" ? <span className="ct-etiqueta">Fase 2 con la IA</span> : null}
                            {c.reschedule_of ? <span className="ct-etiqueta">Reagendada</span> : null}
                          </p>
                        </div>
                        <AccionesCita cita={v} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
