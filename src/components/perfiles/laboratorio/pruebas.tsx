"use client";

import { useEffect, useRef, useState } from "react";
import { pedirConfirmacion } from "@/components/ui/dialogo-confirmar";
import { AREA, AVISO_EN_VIVO, AYUDA, BTN, BTN_PELIGRO, BTN_PRINCIPAL, CAMPO, ETIQUETA, Mensajes, SUBTITULO, TARJETA, fecha, pedir, perfilesDe, type Rubro } from "./comun";
import type { PropsPestana } from "./laboratorio-bot";

/** Pestaña «Pruebas»: simuladas (no le escriben a nadie) y A/B en una campaña. */
export function PestanaPruebas(props: PropsPestana) {
  return (
    <div className="space-y-8">
      {/* Con otro perfil arriba, los formularios arrancan de nuevo (otras versiones y campañas). */}
      <Simuladas key={`s-${props.sel}`} {...props} />
      <PruebasAB key={`ab-${props.sel}`} {...props} />
    </div>
  );
}

function Simuladas({ sel, nombres, resumen, modelos }: PropsPestana) {
  const perfiles = perfilesDe(sel);
  const opciones = resumen.versiones.filter((v) => v.estado !== "archivada" && perfiles.every((r) => v.rubros.includes(r)));
  const [version, setVersion] = useState<number>(opciones.find((v) => v.laboratorio)?.version ?? opciones[opciones.length - 1]?.version ?? 2);
  const [modelo, setModelo] = useState("");
  const [comparar, setComparar] = useState(false);
  const [propios, setPropios] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [sim, setSim] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const espera = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    let vivo = true;
    const leer = async () => {
      try {
        const r = await pedir<any>(`vista=simulacion&id=${id}`);
        if (!vivo) return;
        setSim(r.simulacion);
        if (r.simulacion.estado === "procesando") espera.current = window.setTimeout(leer, 4000);
        else setOcupado(false);
      } catch (e) {
        if (vivo) {
          setError((e as Error).message);
          setOcupado(false);
        }
      }
    };
    leer();
    return () => {
      vivo = false;
      if (espera.current) window.clearTimeout(espera.current);
    };
  }, [id]);

  async function correr(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSim(null);
    setOcupado(true);
    try {
      const r = await pedir<{ id: string }>({ accion: "simular", rubros: perfiles, version, modelo, comparar_con_activa: comparar, casos_propios: propios });
      setId(r.id);
    } catch (err) {
      setError((err as Error).message);
      setOcupado(false);
    }
  }

  const resultados: any[] = sim?.resultado?.resultados ?? [];
  return (
    <section aria-labelledby="lab-simuladas">
      <h4 id="lab-simuladas" className={SUBTITULO}>Pruebas simuladas</h4>
      <p className="mt-1 text-sm text-slate-700">
        Corre casos inventados con el mismo camino que «Probar el bot real»: mismas reglas, misma capa fija de seguridad y mismo control. No le escribe a nadie, no agenda y no cambia estados. Usa la IA, así que tarda uno o dos minutos.
      </p>
      <form onSubmit={correr} className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-800">Perfiles: {perfiles.map((r) => nombres[r] ?? r).join(", ")} (se eligen arriba).</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={ETIQUETA}>Versión a probar</span>
            <select className={CAMPO} value={version} onChange={(e) => setVersion(Number(e.target.value))}>
              {opciones.map((v) => (
                <option key={v.version} value={v.version}>
                  {v.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={ETIQUETA}>Modelo</span>
            <select className={CAMPO} value={modelo} onChange={(e) => setModelo(e.target.value)}>
              <option value="">El de la versión (o el del servidor)</option>
              {(modelos?.modelos ?? []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-800">
          <input type="checkbox" className="h-4 w-4" checked={comparar} onChange={(e) => setComparar(e.target.checked)} />
          Correr los mismos casos con la versión que rige, para comparar
        </label>
        <label className="block">
          <span className={ETIQUETA}>Casos propios (opcional)</span>
          <textarea className={AREA} rows={4} value={propios} onChange={(e) => setPropios(e.target.value)} placeholder={"Un mensaje por línea.\nDejá una línea en blanco entre un caso y otro."} />
          <span className={AYUDA}>Sin datos de personas reales: nada de nombres, teléfonos ni correos. Si lo dejás vacío, se usa la batería del perfil: casos propios del rubro más crisis, enojo, contestador, pedido de ignorar instrucciones y pedido de precio. Con varios perfiles a la vez va una batería corta (casos del rubro y pedido de precio). Máximo 16 charlas por corrida.</span>
        </label>
        <Mensajes ok={null} error={error} />
        <button type="submit" className={BTN_PRINCIPAL} disabled={ocupado || !opciones.length}>
          {ocupado ? "Corriendo…" : "Correr prueba simulada"}
        </button>
      </form>

      {sim && (
        <div className="mt-4" aria-live="polite">
          {sim.estado === "procesando" && <p role="status" className="text-sm text-slate-700">Corriendo los casos… ({fecha(sim.creada_at)})</p>}
          {sim.estado === "error" && <p role="alert" className="text-sm text-amber-900">{sim.error ?? "No se pudo completar la simulación."}</p>}
          {sim.estado === "listo" && (
            <>
              <p className="text-sm font-medium text-slate-900">
                {sim.resultado.resumen.ok} de {sim.resultado.resumen.total} casos sin alertas · tokens {sim.resultado.tokens.entrada.toLocaleString("es-AR")} de entrada y {sim.resultado.tokens.salida.toLocaleString("es-AR")} de salida.
              </p>
              <p className={AYUDA}>La revisión automática es prudente (precio, capa fija, contestador, respuestas retenidas): leé las charlas antes de decidir.</p>
              <ul className="mt-2 space-y-2">
                {resultados.map((r, i) => (
                  <li key={i} className={TARJETA}>
                    <details>
                      <summary className="min-h-11 cursor-pointer py-2 text-sm text-slate-900">
                        <span className={`mr-2 rounded-full border px-2 py-0.5 text-xs font-semibold ${r.evaluacion?.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"}`}>{r.evaluacion?.ok ? "Sin alertas" : "Revisar"}</span>
                        {nombres[r.rubro] ?? r.rubro} · {r.titulo} · {r.variante === "activa" ? `versión que rige (v${r.version})` : `v${r.version}`}
                        {r.modelo ? ` · ${r.modelo}` : ""}
                      </summary>
                      <p className="text-sm text-slate-800">{r.error ?? r.evaluacion?.nota}</p>
                      <ol className="mt-2 space-y-1">
                        {(r.turnos ?? []).map((t: any, j: number) => (
                          <li key={j} className={`rounded-lg px-3 py-2 text-sm ${t.rol === "persona" ? "bg-white text-slate-900" : "bg-slate-200 text-slate-900"}`}>
                            <span className="font-semibold">{t.rol === "persona" ? "Persona" : "Bot"}: </span>
                            <span className="whitespace-pre-wrap">{t.texto}</span>
                            {t.herramientas?.length > 0 && <span className="mt-1 block text-xs text-slate-700">Acciones: {t.herramientas.join(", ")}</span>}
                          </li>
                        ))}
                      </ol>
                    </details>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function PruebasAB({ sel, nombres, resumen, biblioteca, modelos, recargar }: PropsPestana) {
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const perfil = sel === "todos" ? null : (sel as Rubro);
  const activa = perfil ? resumen.asignaciones.find((a) => a.rubro === perfil)?.version ?? 2 : 2;
  const versiones = perfil ? resumen.versiones.filter((v) => v.estado !== "archivada" && v.rubros.includes(perfil)) : [];
  const [campana, setCampana] = useState("");
  const [version, setVersion] = useState<number>(versiones.find((v) => v.laboratorio)?.version ?? activa);
  const [modelo, setModelo] = useState("");
  const [porcentaje, setPorcentaje] = useState(20);
  const [dias, setDias] = useState(7);
  const camps = (biblioteca?.campanas ?? []).filter((c) => c.rubro === perfil);
  const conPrueba = new Set(resumen.pruebas.filter((p) => p.vigente).map((p) => p.campaign_id));
  const lista = resumen.pruebas.filter((p) => perfilesDe(sel).includes(p.rubro));
  const bloqueado = !!resumen.experimentoGlobal;

  async function accion(f: () => Promise<string>) {
    setOk(null);
    setError(null);
    setOcupado(true);
    try {
      setOk((await f()) || null);
      await recargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!perfil) return;
    accion(async () => {
      const nombreCamp = camps.find((c) => c.id === campana)?.nombre ?? "la campaña";
      const texto = [
        `En «${nombreCamp}», el ${porcentaje} % de las charlas NUEVAS las atiende v${version}${modelo ? ` con ${modelo}` : ""}; el resto sigue con v${activa}, como hoy. Cada charla queda siempre con la misma versión.`,
        `Dura ${dias} día(s) y se corta sola: al vencer, todas vuelven a la versión activa. Podés cortarla antes con un clic.`,
        "La capa fija de seguridad (crisis, enojo, amenazas, precios, contestadores, tope por persona, control y cierre) rige igual en las dos variantes.",
        AVISO_EN_VIVO,
      ].join("\n\n");
      if (!(await pedirConfirmacion({ titulo: "¿Empezar la prueba A/B?", texto, confirmar: "Empezar la prueba" }))) return "";
      const r = await pedir<any>({ accion: "crear_ab", perfil, campaign_id: campana, version, modelo, porcentaje, dias, confirmado: true });
      return `Prueba en curso. ${r.aviso}`;
    });
  }

  return (
    <section aria-labelledby="lab-ab">
      <h4 id="lab-ab" className={SUBTITULO}>Prueba A/B en una campaña</h4>
      <p className="mt-1 text-sm text-slate-700">
        Una versión en prueba atiende un porcentaje de las charlas nuevas de UNA campaña durante unos días. Fuera de esa campaña no cambia nada. Cuentan solo las charlas que empiezan desde que arranca la prueba (envíos nuevos de la campaña); las que ya estaban en curso siguen como hoy. Al vencer se corta sola y todo vuelve a la versión activa.
      </p>
      <Mensajes ok={ok} error={error} />

      {lista.length > 0 && (
        <ul className="mt-3 space-y-2">
          {lista.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
              <span>
                <strong className="font-semibold text-slate-900">{p.campana}</strong> ({nombres[p.rubro] ?? p.rubro}): v{p.version}
                {p.modelo ? ` con ${p.modelo}` : ""} al {p.porcentaje} % contra v{p.control_version ?? "—"} ·{" "}
                {p.vigente ? `en curso hasta el ${fecha(p.fin)}` : p.cortada_at ? `cortada el ${fecha(p.cortada_at)}` : `terminó el ${fecha(p.fin)}`}
              </span>
              {p.vigente && (
                <button
                  type="button"
                  className={BTN_PELIGRO}
                  disabled={ocupado}
                  onClick={() =>
                    accion(async () => {
                      if (!(await pedirConfirmacion({ titulo: "¿Cortar la prueba ahora?", texto: `Todas las charlas de «${p.campana}» vuelven a la versión activa. Las cifras de la prueba se conservan.`, confirmar: "Cortar ahora", peligro: true }))) return "";
                      const r = await pedir<any>({ accion: "cortar_ab", id: p.id });
                      return `Prueba cortada. ${r.aviso}`;
                    })
                  }
                >
                  Cortar ahora
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!perfil ? (
        <p className={`${AYUDA} mt-3`}>Para armar una prueba, elegí un perfil arriba.</p>
      ) : bloqueado ? (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Hay una comparación A/B/C general en curso: mientras dure, no se arman pruebas por campaña.</p>
      ) : (
        <form onSubmit={crear} className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={ETIQUETA}>Campaña</span>
            <select className={CAMPO} value={campana} onChange={(e) => setCampana(e.target.value)} required>
              <option value="">Elegí una campaña de {nombres[perfil] ?? perfil}</option>
              {camps.map((c) => (
                <option key={c.id} value={c.id} disabled={conPrueba.has(c.id)}>
                  {c.nombre}
                  {conPrueba.has(c.id) ? " (ya tiene una prueba en curso)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={ETIQUETA}>Versión en prueba</span>
            <select className={CAMPO} value={version} onChange={(e) => setVersion(Number(e.target.value))}>
              {versiones.map((v) => (
                <option key={v.version} value={v.version}>
                  {v.nombre}
                  {v.version === activa ? " (la que rige)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={ETIQUETA}>Modelo en prueba (opcional)</span>
            <select className={CAMPO} value={modelo} onChange={(e) => setModelo(e.target.value)}>
              <option value="">El de la versión</option>
              {(modelos?.modelos ?? []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={ETIQUETA}>Porcentaje de charlas nuevas</span>
            <input className={CAMPO} type="number" min={1} max={90} value={porcentaje} onChange={(e) => setPorcentaje(Number(e.target.value))} />
          </label>
          <label className="block">
            <span className={ETIQUETA}>Días</span>
            <input className={CAMPO} type="number" min={1} max={30} value={dias} onChange={(e) => setDias(Number(e.target.value))} />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={BTN_PRINCIPAL} disabled={ocupado || !campana || (version === activa && !modelo)}>
              Revisar y empezar
            </button>
            {version === activa && !modelo && <p className={AYUDA}>Elegí otra versión u otro modelo: la prueba tiene que cambiar algo.</p>}
          </div>
        </form>
      )}
      <button type="button" className={`${BTN} mt-3`} onClick={recargar}>
        Actualizar estado
      </button>
    </section>
  );
}
