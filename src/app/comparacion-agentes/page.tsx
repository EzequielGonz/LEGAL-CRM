import Link from "next/link";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { AccionConPin } from "@/components/accion-con-pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { MARCAS, SLUGS_PERFIL, temaDe } from "@/lib/marca";
import { cargarDatos, costoEntrenamiento, experimentoActual } from "@/lib/experimento/servicio";
import { estimarAjusteC, resultadoVotos } from "@/lib/experimento/acciones";
import {
  FILTROS_METRICA,
  MUESTRA_MINIMA,
  calcularMetricas,
  enVentana,
  verificarCandidatos,
  type Letra,
  type MetricasCandidato,
  type Tasa,
} from "@/lib/experimento/reglas";
import { configuracionVertex } from "@/lib/agentes/modelo";
import { PLANTILLAS_PROPUESTAS } from "@/lib/plantillas/propuestas";

export const dynamic = "force-dynamic";

const ESTADO_EXP: Record<string, string> = { preparado: "Preparado (no corre)", en_curso: "En curso", finalizado: "Finalizado", cancelado: "Detenido" };
const ESTADO_CAND: Record<string, string> = { listo: "Listo", pendiente: "Pendiente", detenido: "Detenido" };

function fmtTasa(t: Tasa) {
  return t.valor == null ? `— (${t.numerador}/${t.denominador})` : `${t.valor}% (${t.numerador}/${t.denominador})`;
}
function usd(v: number | null | undefined, dec = 4) {
  return v == null ? "sin dato" : `USD ${v.toFixed(dec)}`;
}

/**
 * Comparación de agentes A/B/C (16/10). Global o por perfil, semana o
 * acumulado; cada indicador abre su lista de prospectos (misma regla que la
 * cifra) y desde ahí la ficha y la conversación.
 */
export default async function ComparacionAgentesPage({ searchParams }: { searchParams: { perfil?: string; vista?: string; semana?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = temaDe(searchParams.perfil);
  const vista = searchParams.vista === "perfil" ? "perfil" : "global";
  const actual = await experimentoActual();

  if (!actual) {
    return (
      <MarcoPerfil slug={perfil}>
        <h1 className="font-serif text-2xl font-semibold text-slate-900">Comparación de agentes</h1>
        <p className="mt-2 text-sm text-slate-600">Falta aplicar la migración 0310 (ver la guía del programador). Hasta entonces no hay experimento preparado.</p>
      </MarcoPerfil>
    );
  }
  const { exp, candidatos } = actual;
  const letras = candidatos.map((c) => c.letra);
  const datos = await cargarDatos(exp.id);
  const inicio = exp.inicio_at;
  const semanasTranscurridas = inicio ? Math.min(exp.semanas, Math.max(1, Math.ceil((Date.now() - new Date(inicio).getTime()) / (7 * 86_400_000)))) : 0;
  const semana = searchParams.semana && /^[1-4]$/.test(searchParams.semana) ? Number(searchParams.semana) : null;
  let desde: string | null = null;
  let hasta: string | null = null;
  if (inicio && semana) {
    desde = new Date(new Date(inicio).getTime() + (semana - 1) * 7 * 86_400_000).toISOString();
    hasta = new Date(new Date(inicio).getTime() + semana * 7 * 86_400_000).toISOString();
  }
  const ops = desde && hasta ? enVentana(datos.ops, desde, hasta) : datos.ops;
  const turnos = desde && hasta ? enVentana(datos.turnos, desde, hasta) : datos.turnos;
  const inc = desde && hasta ? enVentana(datos.incidentes, desde, hasta) : datos.incidentes;
  const m = calcularMetricas(letras, ops, turnos, inc);
  const tabla = vista === "perfil" ? m.porRubro[perfil] ?? {} : m.global;
  const avisos = verificarCandidatos(candidatos, datos.modelosInformados);
  const entrenamiento = await costoEntrenamiento(candidatos);
  const votos = await resultadoVotos(exp.id);

  const s = createAdminClient();
  const { data: informes } = await s.from("agent_experiment_reports" as any).select("id, dia, recomendacion, avisos, generado_at").eq("experiment_id", exp.id).order("dia");
  const { data: votosRows } = await s.from("agent_experiment_votes" as any).select("report_id, candidato, created_at").in("report_id", ((informes ?? []) as any[]).map((i) => i.id).concat(["00000000-0000-0000-0000-000000000000"]));
  const votoDe: Record<string, string> = Object.fromEntries(((votosRows ?? []) as any[]).map((v) => [v.report_id, v.candidato]));
  const { data: incidentes } = await s.from("agent_incidents" as any).select("id, candidato, gravedad, tipo, detalle, conversation_id, created_at, candidato_detenido").eq("experiment_id", exp.id).order("created_at", { ascending: false }).limit(20);
  const { data: evals } = await s.from("template_evaluations" as any).select("plantilla, candidato, puntajes, comentario, sugerencia").eq("experiment_id", exp.id).limit(2000);
  const c = candidatos.find((x) => x.letra === "C");
  const { data: ajuste } = c?.tuning_job_id ? await s.from("tuning_jobs").select("estado, estimacion_usd, diagnostico, proveedor_job_id, updated_at").eq("id", c.tuning_job_id).maybeSingle() : { data: null };
  const vertex = configuracionVertex();
  const est = await estimarAjusteC().catch(() => null);

  const base = `/comparacion-agentes?perfil=${perfil}`;
  const enlace = (q: Record<string, string | null>) => {
    const p = new URLSearchParams({ perfil, vista, ...(semana ? { semana: String(semana) } : {}) });
    for (const [k, v] of Object.entries(q)) (v == null ? p.delete(k) : p.set(k, v));
    return `/comparacion-agentes?${p.toString()}`;
  };
  const lista = (l: Letra, metrica: string) => {
    const p = new URLSearchParams({ perfil, cand: l, metrica, ...(vista === "perfil" ? { rubro: perfil } : {}), ...(desde && hasta ? { desde, hasta } : {}) });
    return `/comparacion-agentes/lista?${p.toString()}`;
  };

  const filasConteo: (keyof MetricasCandidato)[] = ["asignados", "contactados", "respondieron", "citas", "en_fase_avanzada", "captados", "derivados", "cerrados", "presupuestos_pedidos", "rechazos", "bajas", "intervenciones_humanas"];
  const filasTasa: [keyof MetricasCandidato, string][] = [
    ["tasa_respuesta", "Tasa de respuesta (respondieron / contactados)"],
    ["tasa_captacion", "Captación (captados / asignados)"],
    ["tasa_captacion_sobre_respuestas", "Captación sobre respuestas (captados / respondieron)"],
    ["tasa_derivacion", "Derivación (derivados / captados)"],
  ];

  // Resumen de evaluación de plantillas: promedio por candidato.
  const resumenPlantillas: Record<string, { n: number; suma: number; riesgoAlto: number }> = {};
  const porPlantilla: Record<string, Record<string, any>> = {};
  for (const e of (evals ?? []) as any[]) {
    const p = e.puntajes ?? {};
    const vals = ["claridad", "cumplimiento", "tono", "respuesta_esperada"].map((k) => p[k]).filter((x) => typeof x === "number");
    const prom = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
    resumenPlantillas[e.candidato] ??= { n: 0, suma: 0, riesgoAlto: 0 };
    if (prom != null) {
      resumenPlantillas[e.candidato].n++;
      resumenPlantillas[e.candidato].suma += prom;
    }
    if (p.riesgo === "alto") resumenPlantillas[e.candidato].riesgoAlto++;
    porPlantilla[e.plantilla] ??= {};
    porPlantilla[e.plantilla][e.candidato] = { prom, riesgo: p.riesgo, comentario: e.comentario, sugerencia: e.sugerencia };
  }

  return (
    <MarcoPerfil slug={perfil}>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-gold-700">Agentes</p>
            <h1 className="font-serif text-2xl font-semibold text-slate-900">Comparación de agentes</h1>
            <p className="text-sm text-slate-600">
              {exp.nombre} · <strong>{ESTADO_EXP[exp.estado] ?? exp.estado}</strong>
              {inicio ? ` · desde ${new Date(inicio).toLocaleDateString("es-AR")} · semana ${semanasTranscurridas} de ${exp.semanas}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href={enlace({ vista: "global" })} aria-current={vista === "global" ? "page" : undefined} className={`tactil inline-flex items-center rounded-lg px-3 ${vista === "global" ? "bg-slate-900 text-gold-100" : "border border-slate-300 bg-white"}`}>Global</Link>
            <Link href={enlace({ vista: "perfil" })} aria-current={vista === "perfil" ? "page" : undefined} className={`tactil inline-flex items-center rounded-lg px-3 ${vista === "perfil" ? "bg-slate-900 text-gold-100" : "border border-slate-300 bg-white"}`}>{MARCAS[perfil].nombre}</Link>
          </div>
        </header>

        <section aria-labelledby="t-cand" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="t-cand" className="mb-3 font-serif text-lg font-semibold text-slate-900">Candidatos</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {candidatos.map((k) => (
              <div key={k.letra} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">
                  {k.letra} · {k.nombre} <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs">{ESTADO_CAND[k.estado] ?? k.estado}</span>
                </p>
                <p className="mt-1 text-slate-600">{k.descripcion}</p>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 text-xs text-slate-700">
                  <dt>Proveedor</dt>
                  <dd>{k.proveedor === "vertex" ? "Vertex (ajustado)" : "Gemini API"}</dd>
                  <dt>Modelo</dt>
                  <dd className="break-all">{k.modelo ?? "sin modelo todavía"}</dd>
                  <dt>Contexto</dt>
                  <dd>{k.contexto === "actual" ? "Prompt actual" : "Manual + biblioteca"}</dd>
                  <dt>Tarifa</dt>
                  <dd>{k.precio_entrada_millon != null ? `USD ${k.precio_entrada_millon} / ${k.precio_salida_millon} por millón` : "sin cargar (costo sin dato)"}</dd>
                </dl>
                {k.detenido_motivo && <p className="mt-2 text-xs font-medium text-red-700">Detenido: {k.detenido_motivo}</p>}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-slate-700">Cambiar modelo, tarifa o estado</summary>
                  <div className="mt-2">
                    <AccionConPin
                      endpoint="/api/experimento"
                      cuerpo={{ accion: "candidato", letra: k.letra }}
                      etiqueta="Guardar"
                      pidePin
                      exito="Candidato actualizado."
                      campos={[
                        { nombre: "modelo", etiqueta: "Modelo o endpoint", valorInicial: k.modelo ?? "" },
                        { nombre: "precioEntrada", etiqueta: "USD por millón (entrada)", tipo: "number", valorInicial: k.precio_entrada_millon?.toString() ?? "" },
                        { nombre: "precioSalida", etiqueta: "USD por millón (salida)", tipo: "number", valorInicial: k.precio_salida_millon?.toString() ?? "" },
                        { nombre: "estado", etiqueta: "Estado", tipo: "select", opciones: [{ valor: "listo", etiqueta: "Listo" }, { valor: "pendiente", etiqueta: "Pendiente" }, { valor: "detenido", etiqueta: "Detenido" }] },
                      ]}
                    />
                  </div>
                </details>
              </div>
            ))}
          </div>
          {avisos.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-medium text-red-700">
              {avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {exp.estado === "preparado" && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="mb-2 text-sm text-slate-700">
                  Arrancar reparte de forma equilibrada y fija cada oportunidad nueva entre los candidatos listos (por perfil, fuente y frío/actual). <strong>No envía nada ni arranca campañas</strong>: con la pausa general puesta, ningún candidato responde.
                </p>
                <AccionConPin endpoint="/api/experimento" cuerpo={{ accion: "arrancar" }} etiqueta="Arrancar experimento" pidePin confirmacion="¿Arrancar la comparación de 4 semanas?" exito="Experimento en curso." />
              </div>
            )}
            {exp.estado === "en_curso" && (
              <div className="rounded-lg bg-slate-50 p-3">
                <AccionConPin endpoint="/api/experimento" cuerpo={{ accion: "detener" }} etiqueta="Detener experimento" variante="peligro" pidePin confirmacion="¿Detener la comparación? Vuelve a responder el bot de siempre." campos={[{ nombre: "motivo", etiqueta: "Motivo", requerido: true }]} exito="Experimento detenido." />
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="t-ind" className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="t-ind" className="font-serif text-lg font-semibold text-slate-900">
              Indicadores {vista === "perfil" ? `· ${MARCAS[perfil].nombre}` : "· todos los perfiles"} {semana ? `· semana ${semana}` : "· acumulado"}
            </h2>
            <nav aria-label="Período" className="flex flex-wrap gap-1 text-xs">
              <Link href={enlace({ semana: null })} className={`rounded px-2 py-1 ${!semana ? "bg-slate-900 text-gold-100" : "border border-slate-300"}`}>Acumulado</Link>
              {[1, 2, 3, 4].map((w) => (
                <Link key={w} href={enlace({ semana: String(w) })} className={`rounded px-2 py-1 ${semana === w ? "bg-slate-900 text-gold-100" : "border border-slate-300"}`}>Semana {w}</Link>
              ))}
            </nav>
          </div>
          <p className="mb-2 text-xs text-slate-600">
            Captar es mérito del agente; el cierre posterior lo hace el profesional y se muestra aparte. Con menos de {MUESTRA_MINIMA.asignados} asignados o {MUESTRA_MINIMA.respondieron} respuestas por candidato, los números se marcan como muestra chica.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Indicadores por candidato</caption>
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th scope="col" className="py-2 pr-3">Indicador</th>
                  {letras.map((l) => (
                    <th key={l} scope="col" className="py-2 pr-3">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasConteo.map((k) => (
                  <tr key={k} className="border-b border-slate-100">
                    <th scope="row" className="py-1.5 pr-3 text-left font-normal text-slate-700">
                      {FILTROS_METRICA[k as string]?.label ?? k}
                      {k === "cerrados" ? " (posterior)" : ""}
                    </th>
                    {letras.map((l) => {
                      const v = (tabla[l]?.[k] as number | undefined) ?? 0;
                      return (
                        <td key={l} className="py-1.5 pr-3">
                          <Link href={lista(l, k as string)} className="font-medium text-slate-900 underline decoration-slate-300 hover:decoration-gold-500">{v}</Link>
                          {k === "asignados" && v < MUESTRA_MINIMA.asignados ? <span className="ml-1 text-xs text-amber-700">muestra chica</span> : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filasTasa.map(([k, label]) => (
                  <tr key={k} className="border-b border-slate-100 bg-slate-50/60">
                    <th scope="row" className="py-1.5 pr-3 text-left font-normal text-slate-700">{label}</th>
                    {letras.map((l) => (
                      <td key={l} className="py-1.5 pr-3">{tabla[l] ? fmtTasa(tabla[l]![k] as Tasa) : "—"}</td>
                    ))}
                  </tr>
                ))}
                {(
                  [
                    ["errores", "Errores del modelo"],
                    ["fallos_cumplimiento", "Fallos de cumplimiento (respuestas retenidas)"],
                    ["turnos", "Turnos de IA"],
                  ] as const
                ).map(([k, label]) => (
                  <tr key={k} className="border-b border-slate-100">
                    <th scope="row" className="py-1.5 pr-3 text-left font-normal text-slate-700">{label}</th>
                    {letras.map((l) => (
                      <td key={l} className="py-1.5 pr-3">{(tabla[l]?.[k] as number) ?? 0}</td>
                    ))}
                  </tr>
                ))}
                <tr className="border-b border-slate-100">
                  <th scope="row" className="py-1.5 pr-3 text-left font-normal text-slate-700">Incidentes (fatal / grave / leve)</th>
                  {letras.map((l) => (
                    <td key={l} className="py-1.5 pr-3">{tabla[l] ? `${tabla[l]!.incidentes.fatal} / ${tabla[l]!.incidentes.grave} / ${tabla[l]!.incidentes.leve}` : "—"}</td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <th scope="row" className="py-1.5 pr-3 text-left font-normal text-slate-700">Demora de respuesta (mediana / p90)</th>
                  {letras.map((l) => (
                    <td key={l} className="py-1.5 pr-3">{tabla[l]?.latencia_p50_ms != null ? `${(tabla[l]!.latencia_p50_ms! / 1000).toFixed(1)} s / ${(tabla[l]!.latencia_p90_ms! / 1000).toFixed(1)} s` : "sin dato"}</td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <th scope="row" className="py-1.5 pr-3 text-left font-normal text-slate-700">Consumo (tokens entrada / salida)</th>
                  {letras.map((l) => (
                    <td key={l} className="py-1.5 pr-3">{tabla[l] ? `${tabla[l]!.tokens_entrada.toLocaleString("es-AR")} / ${tabla[l]!.tokens_salida.toLocaleString("es-AR")}` : "—"}</td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <th scope="row" className="py-1.5 pr-3 text-left font-normal text-slate-700">Costo de operación</th>
                  {letras.map((l) => (
                    <td key={l} className="py-1.5 pr-3">
                      {usd(tabla[l]?.costo_operacion_usd)}
                      {tabla[l]?.turnos_sin_tarifa ? <span className="ml-1 text-xs text-amber-700">({tabla[l]!.turnos_sin_tarifa} sin tarifa)</span> : null}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-1.5 pr-3 text-left font-normal text-slate-700">Costo por captado (operación)</th>
                  {letras.map((l) => (
                    <td key={l} className="py-1.5 pr-3">{usd(tabla[l]?.costo_por_captado_usd)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Costo de entrenamiento (aparte, candidato C): {entrenamiento.usd == null ? "sin ajuste todavía" : `USD ${entrenamiento.usd}${entrenamiento.estimado ? " (estimado)" : ""}`}.
          </p>
        </section>

        <section aria-labelledby="t-inf" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="t-inf" className="mb-1 font-serif text-lg font-semibold text-slate-900">Informes y votos</h2>
          <p className="mb-3 text-sm text-slate-600">El servidor genera los informes de los días 7, 14, 21 y 28 aunque nadie tenga el panel abierto. Mi recomendación va separada de su voto (uno por informe).</p>
          {((informes ?? []) as any[]).length === 0 && <p className="text-sm text-slate-500">Todavía no hay informes.</p>}
          <ol className="space-y-3">
            {((informes ?? []) as any[]).map((r) => (
              <li key={r.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">Día {r.dia} · {new Date(r.generado_at).toLocaleDateString("es-AR")}</p>
                <p className="mt-1 text-slate-700">
                  <strong>Recomendación:</strong> {r.recomendacion?.candidato ? `${r.recomendacion.candidato}. ` : "sin recomendación. "}
                  {r.recomendacion?.motivo}
                </p>
                {(r.avisos ?? []).length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-xs text-amber-800">
                    {(r.avisos as string[]).map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                )}
                {votoDe[r.id] ? (
                  <p className="mt-2 text-emerald-700">Voto registrado: {votoDe[r.id]}.</p>
                ) : (
                  <div className="mt-2 max-w-sm">
                    <AccionConPin
                      endpoint="/api/experimento"
                      cuerpo={{ accion: "votar", reportId: r.id }}
                      etiqueta="Registrar voto"
                      exito="Voto registrado."
                      campos={[
                        { nombre: "candidato", etiqueta: "Su voto", tipo: "select", requerido: true, opciones: letras.map((l) => ({ valor: l, etiqueta: l })) },
                        { nombre: "nota", etiqueta: "Nota (opcional)", tipo: "textarea" },
                      ]}
                    />
                  </div>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
            <p>
              <strong>Votación:</strong> {votos.motivo}{" "}
              {Object.keys(votos.conteo).length ? `(${Object.entries(votos.conteo).map(([k, v]) => `${k}: ${v}`).join(" · ")})` : ""}
            </p>
            {exp.ganador ? (
              <p className="mt-1 text-emerald-700">Ganador aplicado: {exp.ganador}. La configuración anterior quedó guardada.</p>
            ) : exp.estado === "finalizado" ? (
              <div className="mt-2 max-w-sm">
                <AccionConPin
                  endpoint="/api/experimento"
                  cuerpo={{ accion: "aplicar" }}
                  etiqueta={votos.ganador ? `Aplicar ganador (${votos.ganador})` : "Decidir y aplicar"}
                  pidePin
                  confirmacion="Se comprueban los requisitos y se aplica el ganador. ¿Seguir?"
                  exito="Ganador aplicado."
                  campos={votos.ganador ? [] : [{ nombre: "decision", etiqueta: "Su decisión (empate o votos faltantes)", tipo: "select", requerido: true, opciones: letras.map((l) => ({ valor: l, etiqueta: l })) }]}
                />
              </div>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="t-c" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="t-c" className="mb-1 font-serif text-lg font-semibold text-slate-900">Candidato C · ajuste en Vertex</h2>
          <p className="text-sm text-slate-700">
            Variables de Vertex: {vertex.configurado ? "cargadas" : `faltan ${vertex.faltan.join(", ")}`}. Bucket del corpus: {process.env.GCP_BUCKET ? "cargado" : "falta GCP_BUCKET"}. Límite autorizado: USD 30.
          </p>
          {ajuste ? (
            <p className="mt-1 text-sm text-slate-700">
              Ajuste: <strong>{(ajuste as any).estado}</strong>
              {(ajuste as any).estimacion_usd != null ? ` · estimado USD ${(ajuste as any).estimacion_usd}` : ""}
              {(ajuste as any).diagnostico ? ` · ${(ajuste as any).diagnostico}` : ""}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-600">Todavía no se lanzó el ajuste. Mientras C esté pendiente, la comparación corre entre A y B.</p>
          )}
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-slate-600">1. Suma al corpus las conversaciones reales autorizadas (con nombres; se quitan teléfonos, documentos y correos) y los casos semilla.</p>
              <AccionConPin endpoint="/api/experimento" cuerpo={{ accion: "importar_corpus" }} etiqueta="Importar conversaciones" variante="secundaria" pidePin exito="Corpus actualizado. Revisá la estimación." />
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-600">2. Lanza el ajuste si la estimación no supera USD 30. El servidor lo sigue y, al terminar, deja a C listo con su endpoint.</p>
              <AccionConPin endpoint="/api/experimento" cuerpo={{ accion: "lanzar_ajuste" }} etiqueta="Lanzar ajuste (pago)" pidePin confirmacion="Esto crea un trabajo pago en Google Cloud dentro del límite de USD 30. ¿Seguir?" exito="Ajuste lanzado." />
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-700">
            Estimación actual:{" "}
            {est && est.ejemplos > 0
              ? `${est.ejemplos} ejemplos aprobados · ${est.tokens.toLocaleString("es-AR")} tokens × ${est.epocas ?? 3} épocas ≈ USD ${est.usd}.`
              : "sin corpus importado todavía."}
            {est?.aviso ? <span className="block text-xs text-amber-800">{est.aviso}</span> : null}
          </p>
        </section>

        <section aria-labelledby="t-pl" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="t-pl" className="mb-1 font-serif text-lg font-semibold text-slate-900">Plantillas evaluadas por cada modelo</h2>
          <p className="mb-2 text-sm text-slate-600">
            {PLANTILLAS_PROPUESTAS.length} plantillas propuestas (incluye la apertura y el aviso de presupuesto de Marketing). Cada candidato listo las puntúa de 1 a 5 en claridad, cumplimiento, tono y respuesta esperada, y marca el riesgo. Se procesan de a poco desde el servidor.
          </p>
          <div className="mb-3 flex flex-wrap gap-3 text-sm">
            {letras.map((l) => (
              <span key={l} className="rounded-lg bg-slate-50 px-3 py-1">
                {l}: {resumenPlantillas[l]?.n ? `promedio ${(resumenPlantillas[l].suma / resumenPlantillas[l].n).toFixed(2)} en ${resumenPlantillas[l].n} · riesgo alto ${resumenPlantillas[l].riesgoAlto}` : "sin evaluar"}
              </span>
            ))}
          </div>
          <div className="max-w-xs">
            <AccionConPin endpoint="/api/experimento" cuerpo={{ accion: "evaluar_plantillas" }} etiqueta="Evaluar plantillas" variante="secundaria" exito="Pedido registrado: el servidor las evalúa en los próximos minutos." />
          </div>
          {Object.keys(porPlantilla).length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th scope="col" className="py-1 pr-2">Plantilla</th>
                    {letras.map((l) => (
                      <th key={l} scope="col" className="py-1 pr-2">{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLANTILLAS_PROPUESTAS.filter((p) => porPlantilla[p.nombre]).map((p) => (
                    <tr key={p.nombre} className="border-b border-slate-100 align-top">
                      <th scope="row" className="py-1 pr-2 text-left font-medium text-slate-800">
                        {p.nombre}
                        <span className="block font-normal text-slate-500">{p.rubro} · {p.proposito}</span>
                      </th>
                      {letras.map((l) => {
                        const e = porPlantilla[p.nombre][l];
                        return (
                          <td key={l} className="py-1 pr-2 text-slate-700">
                            {e ? (
                              <>
                                {e.prom != null ? e.prom.toFixed(1) : "—"} · riesgo {e.riesgo ?? "—"}
                                {e.comentario ? <span className="block text-slate-500">{e.comentario}</span> : null}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="t-inc" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="t-inc" className="mb-2 font-serif text-lg font-semibold text-slate-900">Incidentes</h2>
          {((incidentes ?? []) as any[]).length === 0 ? (
            <p className="text-sm text-slate-500">Sin incidentes.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {((incidentes ?? []) as any[]).map((i) => (
                <li key={i.id} className={i.gravedad === "fatal" ? "text-red-700" : "text-slate-700"}>
                  {new Date(i.created_at).toLocaleString("es-AR")} · {i.candidato ?? "—"} · {i.gravedad} · {i.tipo}: {i.detalle}
                  {i.candidato_detenido ? " · candidato detenido" : ""}
                  {i.conversation_id ? (
                    <>
                      {" · "}
                      <Link href={`/inbox/${i.conversation_id}`} className="underline">ver conversación</Link>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-slate-500">
          Perfiles: {SLUGS_PERFIL.map((sl) => (
            <Link key={sl} href={`/comparacion-agentes?perfil=${sl}&vista=perfil`} className="mr-2 underline">{MARCAS[sl].nombre}</Link>
          ))}
          · <Link href={base} className="underline">volver al global</Link>
        </p>
      </div>
    </MarcoPerfil>
  );
}
