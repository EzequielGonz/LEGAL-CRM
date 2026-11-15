"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { ChatAsistenteGeneral, type AccesoAsistente } from "@/components/asistente/chat-asistente-general";
import { AREA, AYUDA, BTN, BTN_PRINCIPAL, CAMPO, ETIQUETA, Mensajes, pedir, RUBROS, TARJETA, type Biblioteca, type Resumen, type Rubro } from "./comun";
import { Confirmar, GraficoVersiones, ResultadoPrueba, SelectorModelo, useSimulacion } from "./piezas";
import { aplicacionParaVolver, modeloEnPalabras, variableDeProveedor, versionesDelPerfil, versionVigente, type CifrasVersion } from "@/lib/laboratorio/simple";

/**
 * Laboratorio del bot, versión simple (15/11). Pedido de la responsable:
 * «demasiado técnico; que sea una sección donde entres, hables con el
 * asistente y te ayude a crear una versión nueva», y después «lo técnico
 * tampoco va escondido: simplificalo con gráficos sencillos». Una sola
 * pantalla, de arriba a abajo: el asistente, cómo viene cada versión, las
 * versiones, el bot de hoy, cambiar algo, probar, roles y proveedores.
 *
 * Nada de lo que hoy rige cambia solo: crear una versión no la usa; usarla,
 * cambiar el bot de hoy, probar en una campaña o aplicar un rol piden
 * confirmar y tienen «Volver a la anterior». Probar con charlas inventadas no
 * le escribe a nadie.
 */
const AVISO_REAL = "Esto cambia cómo responde hoy el bot en las charlas reales (en hasta 1 minuto). Podés volver a la anterior cuando quieras.";

const ACCESOS_LAB: AccesoAsistente[] = [
  { titulo: "Que hable más corto y cálido", descripcion: "Arma una versión nueva con ese tono.", accion: "enviar", texto: "Quiero que el bot hable más corto y más cálido. Armame una versión nueva." },
  { titulo: "Sumar una respuesta preparada", descripcion: "Para una pregunta o una duda que se repite.", accion: "rellenar", texto: "Quiero que el bot sepa responder cuando le preguntan por " },
  { titulo: "¿Cómo viene el bot?", descripcion: "Las versiones y qué conviene probar.", accion: "enviar", texto: "¿Cómo viene el bot de este perfil? ¿Qué versiones hay y qué me conviene probar?" },
];

function Seccion({ titulo, bajada, children }: { titulo: string; bajada?: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="border-t border-slate-200 pt-5">
      <h4 id={id} className="text-base font-semibold text-slate-900">
        {titulo}
      </h4>
      {bajada && <p className="mt-0.5 text-sm text-slate-600">{bajada}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function LaboratorioBot({ nombres, id }: { nombres: Record<string, string>; id: string }) {
  const [perfil, setPerfil] = useState<Rubro>("juridico");
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [biblioteca, setBiblioteca] = useState<Biblioteca | null>(null);
  const [modelos, setModelos] = useState<string[]>([]);
  const [cifras, setCifras] = useState<CifrasVersion[] | null>(null);
  const [bots, setBots] = useState<{ id: string; area: string; nombre: string; instrucciones: string; sePuedeVolver: boolean }[] | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ids = useId();

  useEffect(() => {
    try {
      const p = localStorage.getItem("laboratorio-bot-perfil");
      if (p && (RUBROS as string[]).includes(p)) setPerfil(p as Rubro);
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const recargar = useCallback(async () => {
    try {
      const [r, b, c, bb] = await Promise.all([
        pedir<Resumen>("vista=resumen"),
        pedir<Biblioteca>("vista=biblioteca"),
        pedir<{ versiones: CifrasVersion[] }>(`vista=comparativa&perfiles=${perfil}&dias=30`).catch(() => ({ versiones: [] })),
        pedir<{ bots: any[] }>(`vista=bots&perfil=${perfil}`).catch(() => ({ bots: [] })),
      ]);
      setResumen(r);
      setBiblioteca(b);
      setCifras(c.versiones ?? []);
      setBots(bb.bots ?? []);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [perfil]);

  useEffect(() => {
    setCifras(null);
    setBots(null);
    recargar();
    try {
      localStorage.setItem("laboratorio-bot-perfil", perfil);
    } catch {
      /* nada */
    }
  }, [perfil, recargar]);

  useEffect(() => {
    pedir<{ modelos: string[] }>("vista=modelos")
      .then((m) => setModelos(m.modelos ?? []))
      .catch(() => setModelos([]));
  }, []);

  /** Corre una acción, muestra el resultado y recarga. */
  async function hacer(f: () => Promise<string>) {
    setOk(null);
    setError(null);
    try {
      setOk(await f());
      await recargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const nombrePerfil = nombres[perfil] ?? perfil;
  const vigente = resumen ? versionVigente(resumen.asignaciones, perfil) : 2;
  const versiones = useMemo(() => (resumen ? versionesDelPerfil(resumen.versiones as any, perfil, vigente) : []), [resumen, perfil, vigente]);
  const nombresVersion = useMemo(() => Object.fromEntries((resumen?.versiones ?? []).map((v) => [v.version, v.nombre])), [resumen]);
  const paraVolver = resumen ? aplicacionParaVolver(resumen.aplicaciones, perfil) : null;
  const bloqueado = !!resumen?.experimentoGlobal;

  return (
    <div id={id} className="mt-4 space-y-5 rounded-2xl border border-slate-300 bg-white p-4 text-slate-900 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900">Laboratorio del bot</h3>
          <p className="mt-1 max-w-3xl text-sm text-slate-700">
            Contale al asistente qué querés cambiar del bot. Él arma una versión nueva, la prueba sin escribirle a nadie y vos decidís si la usás.
          </p>
        </div>
        <label className="block" htmlFor={`${ids}-perfil`}>
          <span className={ETIQUETA}>Perfil</span>
          <select id={`${ids}-perfil`} className={`${CAMPO} sm:w-60`} value={perfil} onChange={(e) => setPerfil(e.target.value as Rubro)}>
            {RUBROS.map((r) => (
              <option key={r} value={r}>
                {nombres[r] ?? r}
              </option>
            ))}
          </select>
        </label>
      </div>

      {bloqueado && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Hay una comparación general de bots en curso. Mientras dure, desde acá no se usan versiones nuevas ni se arman pruebas en campañas.
        </p>
      )}
      <Mensajes ok={ok} error={error} />

      <ChatAsistenteGeneral
        contexto={{ tipo: "laboratorio", perfil }}
        accesos={ACCESOS_LAB}
        titulo="Asistente del laboratorio"
        bajada={`${nombrePerfil} · nada cambia sin tu confirmación`}
        vacio="Decime qué querés que cambie el bot: cómo habla, qué responde a una pregunta, qué no tiene que decir. Te armo una versión nueva para probar."
        placeholder="Ej.: que salude más corto y pregunte el nombre al principio"
        alto="h-[min(60vh,32rem)]"
        alCambiarPropuesta={recargar}
      />

      <Seccion titulo="Cómo viene cada versión" bajada={`${nombrePerfil}: la que rige ahora contra las nuevas que ya atendieron charlas.`}>
        <GraficoVersiones cifras={cifras} vigente={vigente} nombres={nombresVersion} />
      </Seccion>

      <Seccion titulo="Versiones de este perfil" bajada="Probalas sin escribirle a nadie y usá la que te convenza.">
        {!resumen ? (
          <p role="status" className="text-sm text-slate-600">
            Cargando…
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {versiones.map((v) => (
                <TarjetaVersion key={v.version} v={v} perfil={perfil} nombrePerfil={nombrePerfil} cubreTodos={RUBROS.every((r) => (resumen.versiones.find((x) => x.version === v.version)?.rubros ?? []).includes(r))} bloqueado={bloqueado} hacer={hacer} />
              ))}
            </ul>
            {versiones.length <= 1 && <p className="mt-2 text-sm text-slate-600">Todavía no hay versiones nuevas para este perfil. Pedile una al asistente o usá «Cambiar algo».</p>}
            {paraVolver && (
              <div className="mt-3">
                <Confirmar
                  etiqueta="Volver a la anterior"
                  peligro
                  aviso={<p>El bot de {nombrePerfil} deja la v{vigente} y vuelve a la versión que regía antes del último cambio. {AVISO_REAL}</p>}
                  alConfirmar={() => hacer(async () => (await pedir({ accion: "volver_atras", id: paraVolver.id, confirmado: true }), "Listo: volvió a la versión anterior."))}
                />
              </div>
            )}
          </>
        )}
      </Seccion>

      <Seccion titulo="El bot de hoy" bajada="Las instrucciones con las que responde ahora. Si las cambiás, rige enseguida; siempre se guarda la anterior.">
        <BotsDeHoy bots={bots} perfil={perfil} hacer={hacer} />
      </Seccion>

      <Seccion titulo="Cambiar algo" bajada="Arma una versión nueva, copia de la que rige. No se usa hasta que la elijas en «Versiones».">
        <CambiarAlgo perfil={perfil} nombrePerfil={nombrePerfil} vigente={vigente} modelos={modelos} hacer={hacer} />
      </Seccion>

      <Seccion titulo="Probar antes de usar" bajada="Con charlas inventadas (no le escribe a nadie) o con una parte de las charlas de una campaña.">
        {resumen && biblioteca && <Probar perfil={perfil} resumen={resumen} biblioteca={biblioteca} modelos={modelos} vigente={vigente} bloqueado={bloqueado} hacer={hacer} />}
      </Seccion>

      <Seccion titulo="Rol para un caso puntual" bajada="Un rol le da al bot un objetivo especial (por ejemplo, para una base o una campaña).">
        {resumen && biblioteca && <RolPuntual perfil={perfil} resumen={resumen} biblioteca={biblioteca} hacer={hacer} />}
      </Seccion>

      <Seccion titulo="Otros proveedores de IA" bajada="Para más adelante: se guardan preparados, todavía sin conectar.">
        {resumen && <Proveedores resumen={resumen} hacer={hacer} />}
      </Seccion>
    </div>
  );
}

type Hacer = (f: () => Promise<string>) => Promise<void>;

function TarjetaVersion({ v, perfil, nombrePerfil, cubreTodos, bloqueado, hacer }: { v: ReturnType<typeof versionesDelPerfil>[number]; perfil: Rubro; nombrePerfil: string; cubreTodos: boolean; bloqueado: boolean; hacer: Hacer }) {
  const sim = useSimulacion();
  return (
    <li className={TARJETA}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-slate-900">
          {v.nombre} <span className="font-normal text-slate-600">(v{v.version})</span>
        </p>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${v.rige ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-300 bg-white text-slate-800"}`}>
          {v.rige ? "Rige ahora" : "Sin usar"}
        </span>
      </div>
      {v.descripcion && <p className="mt-1 text-sm text-slate-700">{v.descripcion}</p>}
      <p className="mt-1 text-xs text-slate-600">Modelo: {v.modelo ? modeloEnPalabras(v.modelo).nombre : "el de siempre"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={BTN} disabled={sim.estado === "corriendo"} onClick={() => sim.correr({ rubros: [perfil], version: v.version })}>
          {sim.estado === "corriendo" ? "Probando…" : "Probar"}
        </button>
        {!v.rige && v.nueva && (
          <Confirmar
            etiqueta="Usar en este perfil"
            deshabilitado={bloqueado}
            aviso={<p>El bot de {nombrePerfil} pasa a responder con «{v.nombre}». {AVISO_REAL}</p>}
            alConfirmar={() => hacer(async () => (await pedir({ accion: "aplicar_version", perfil, version: v.version, confirmado: true }), `Listo: ${nombrePerfil} usa «${v.nombre}».`))}
          />
        )}
        {v.nueva && cubreTodos && (
          <Confirmar
            etiqueta="Usar en los 4 perfiles"
            peligro
            deshabilitado={bloqueado}
            aviso={<p>Los bots de los cuatro perfiles pasan a responder con «{v.nombre}». {AVISO_REAL}</p>}
            alConfirmar={() =>
              hacer(async () => {
                const hechos: string[] = [];
                for (const r of RUBROS) {
                  try {
                    await pedir({ accion: "aplicar_version", perfil: r, version: v.version, confirmado: true });
                    hechos.push(r);
                  } catch (e) {
                    throw new Error(`${hechos.length ? `Se aplicó en ${hechos.length} perfil(es). ` : ""}En ${r} no se pudo: ${(e as Error).message}`);
                  }
                }
                return `Listo: los cuatro perfiles usan «${v.nombre}».`;
              })
            }
          />
        )}
      </div>
      <ResultadoPrueba estado={sim.estado} resumen={sim.resumen} error={sim.error} />
    </li>
  );
}

function BotsDeHoy({ bots, perfil, hacer }: { bots: { id: string; area: string; nombre: string; instrucciones: string; sePuedeVolver: boolean }[] | null; perfil: Rubro; hacer: Hacer }) {
  if (!bots) return <p role="status" className="text-sm text-slate-600">Cargando…</p>;
  if (!bots.length) return <p className="text-sm text-slate-600">Este perfil no tiene un bot configurado.</p>;
  return (
    <div className="space-y-4">
      {bots.map((b) => (
        <BotDeHoy key={`${b.id}-${b.instrucciones.length}`} b={b} perfil={perfil} hacer={hacer} />
      ))}
    </div>
  );
}

function BotDeHoy({ b, perfil, hacer }: { b: { id: string; area: string; nombre: string; instrucciones: string; sePuedeVolver: boolean }; perfil: Rubro; hacer: Hacer }) {
  const [texto, setTexto] = useState(b.instrucciones);
  const id = useId();
  const cambio = texto.trim() !== b.instrucciones.trim();
  return (
    <div className={TARJETA}>
      <label htmlFor={id} className={ETIQUETA}>
        {b.nombre} <span className="font-normal text-slate-600">({b.area})</span>
      </label>
      <textarea id={id} className={`${AREA} min-h-40`} rows={8} value={texto} onChange={(e) => setTexto(e.target.value)} />
      <p className={AYUDA}>Escribí en palabras simples qué tiene que hacer y qué no. No sumes teléfonos ni correos de personas.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Confirmar
          etiqueta="Guardar cambios"
          deshabilitado={!cambio}
          aviso={<p>{AVISO_REAL}</p>}
          alConfirmar={() => hacer(async () => (await pedir({ accion: "instrucciones_bot", perfil, agente_id: b.id, instrucciones: texto, anterior: b.instrucciones, confirmado: true }), "Listo: el bot ya usa las instrucciones nuevas."))}
        />
        {cambio && (
          <button type="button" className={BTN} onClick={() => setTexto(b.instrucciones)}>
            Descartar lo escrito
          </button>
        )}
        {b.sePuedeVolver && (
          <Confirmar
            etiqueta="Volver a la anterior"
            peligro
            aviso={<p>El bot vuelve a las instrucciones que tenía antes del último cambio. {AVISO_REAL}</p>}
            alConfirmar={() => hacer(async () => (await pedir({ accion: "volver_instrucciones", perfil, agente_id: b.id, confirmado: true }), "Listo: el bot volvió a sus instrucciones anteriores."))}
          />
        )}
      </div>
    </div>
  );
}

function CambiarAlgo({ perfil, nombrePerfil, vigente, modelos, hacer }: { perfil: Rubro; nombrePerfil: string; vigente: number; modelos: string[]; hacer: Hacer }) {
  const [nombre, setNombre] = useState("");
  const [tono, setTono] = useState("");
  const [reglas, setReglas] = useState("");
  const [modelo, setModelo] = useState("");
  const [todos, setTodos] = useState(false);
  const id = useId();
  const listo = nombre.trim().length >= 2 && (tono.trim() || reglas.trim() || modelo);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label htmlFor={`${id}-nombre`} className={ETIQUETA}>
          Nombre de la versión
        </label>
        <input id={`${id}-nombre`} className={CAMPO} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Más breve y cálida" maxLength={70} />
        <p className={AYUDA}>Un nombre corto para reconocerla.</p>
      </div>
      <div>
        <label htmlFor={`${id}-modelo`} className={ETIQUETA}>
          Modelo de IA
        </label>
        <SelectorModelo id={`${id}-modelo`} modelos={modelos} valor={modelo} alCambiar={setModelo} />
      </div>
      <div>
        <label htmlFor={`${id}-tono`} className={ETIQUETA}>
          Cómo habla
        </label>
        <textarea id={`${id}-tono`} className={AREA} rows={3} value={tono} onChange={(e) => setTono(e.target.value)} placeholder="Ej.: cercano, frases cortas, sin tecnicismos" />
        <p className={AYUDA}>El tono en pocas palabras.</p>
      </div>
      <div>
        <label htmlFor={`${id}-reglas`} className={ETIQUETA}>
          Reglas extra
        </label>
        <textarea id={`${id}-reglas`} className={AREA} rows={3} value={reglas} onChange={(e) => setReglas(e.target.value)} placeholder="Una por línea. Ej.: preguntá el nombre antes de dar información" />
        <p className={AYUDA}>Lo que tiene que hacer siempre o no hacer nunca.</p>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm text-slate-800 md:col-span-2">
        <input type="checkbox" className="h-5 w-5" checked={todos} onChange={(e) => setTodos(e.target.checked)} />
        Crearla para los 4 perfiles (si no, solo para {nombrePerfil})
      </label>
      <div className="md:col-span-2">
        <button
          type="button"
          className={BTN_PRINCIPAL}
          disabled={!listo}
          onClick={() =>
            hacer(async () => {
              const r = await pedir<{ version: number }>({ accion: "crear_version", nombre, base_version: vigente, rubros: todos ? RUBROS : [perfil], tono, reglas, modelo: modelo || undefined, descripcion: [tono && "cambia cómo habla", reglas && "suma reglas", modelo && `usa ${modeloEnPalabras(modelo).nombre}`].filter(Boolean).join(", ") });
              setNombre("");
              setTono("");
              setReglas("");
              setModelo("");
              return `Versión creada (v${r.version}). Todavía no rige: probala en «Versiones».`;
            })
          }
        >
          Crear versión nueva
        </button>
        {!listo && <p className={AYUDA}>Poné un nombre y cambiá al menos una cosa.</p>}
      </div>
    </div>
  );
}

function Probar({ perfil, resumen, biblioteca, modelos, vigente, bloqueado, hacer }: { perfil: Rubro; resumen: Resumen; biblioteca: Biblioteca; modelos: string[]; vigente: number; bloqueado: boolean; hacer: Hacer }) {
  const id = useId();
  const opciones = resumen.versiones.filter((v) => v.estado !== "archivada" && (!v.laboratorio || v.rubros.includes(perfil)));
  const [version, setVersion] = useState(String(vigente));
  const [modelo, setModelo] = useState("");
  const [casos, setCasos] = useState("");
  const [campana, setCampana] = useState("");
  const [porcentaje, setPorcentaje] = useState(20);
  const [dias, setDias] = useState(7);
  const sim = useSimulacion();
  const campanas = biblioteca.campanas.filter((c) => c.rubro === perfil);
  const enCurso = resumen.pruebas.filter((p) => p.rubro === perfil && p.vigente);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-version`} className={ETIQUETA}>
            Versión
          </label>
          <select id={`${id}-version`} className={CAMPO} value={version} onChange={(e) => setVersion(e.target.value)}>
            {opciones.map((v) => (
              <option key={v.version} value={v.version}>
                {v.nombre} (v{v.version}){v.version === vigente ? " · rige ahora" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-modelo`} className={ETIQUETA}>
            Modelo de IA para la prueba
          </label>
          <SelectorModelo id={`${id}-modelo`} modelos={modelos} valor={modelo} alCambiar={setModelo} vacio="El de la versión" />
        </div>
      </div>

      <div className={TARJETA}>
        <p className="font-semibold text-slate-900">Con charlas inventadas</p>
        <label htmlFor={`${id}-casos`} className={`${ETIQUETA} mt-2`}>
          Tus propias charlas (opcional)
        </label>
        <textarea id={`${id}-casos`} className={AREA} rows={3} value={casos} onChange={(e) => setCasos(e.target.value)} placeholder={"Un mensaje por línea; dejá una línea vacía entre charlas.\nEj.: Hola, ¿cuánto sale la consulta?"} />
        <p className={AYUDA}>Si lo dejás vacío, usa charlas de ejemplo del perfil. Sin teléfonos ni correos.</p>
        <button type="button" className={`${BTN} mt-2`} disabled={sim.estado === "corriendo"} onClick={() => sim.correr({ rubros: [perfil], version: Number(version), modelo: modelo || undefined, casos_propios: casos || undefined })}>
          {sim.estado === "corriendo" ? "Probando…" : "Probar con charlas inventadas"}
        </button>
        <ResultadoPrueba estado={sim.estado} resumen={sim.resumen} error={sim.error} />
      </div>

      <div className={TARJETA}>
        <p className="font-semibold text-slate-900">Probar en una campaña</p>
        <p className="text-sm text-slate-700">Una parte de las charlas nuevas de la campaña usa esta versión y el resto sigue igual. Así se comparan con charlas reales.</p>
        {campanas.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Este perfil no tiene campañas para probar.</p>
        ) : (
          <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor={`${id}-campana`} className={ETIQUETA}>
                Campaña
              </label>
              <select id={`${id}-campana`} className={CAMPO} value={campana} onChange={(e) => setCampana(e.target.value)}>
                <option value="">Elegí una campaña</option>
                {campanas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-pct`} className={ETIQUETA}>
                A cuántas charlas nuevas: {porcentaje} de cada 100
              </label>
              <input id={`${id}-pct`} type="range" min={5} max={50} step={5} value={porcentaje} onChange={(e) => setPorcentaje(Number(e.target.value))} className="h-11 w-full" />
            </div>
            <div>
              <label htmlFor={`${id}-dias`} className={ETIQUETA}>
                Durante cuántos días
              </label>
              <input id={`${id}-dias`} type="number" min={1} max={30} className={CAMPO} value={dias} onChange={(e) => setDias(Number(e.target.value) || 7)} />
            </div>
            <div className="md:col-span-3">
              <Confirmar
                etiqueta="Empezar la prueba en la campaña"
                deshabilitado={!campana || bloqueado || Number(version) === vigente && !modelo}
                aviso={<p>{porcentaje} de cada 100 charlas nuevas de la campaña van a responder con la versión elegida durante {dias} días. Son charlas reales. Podés cortarla cuando quieras.</p>}
                alConfirmar={() => hacer(async () => (await pedir({ accion: "crear_ab", perfil, campaign_id: campana, version: Number(version), modelo: modelo || undefined, porcentaje, dias, confirmado: true }), "Listo: la prueba en la campaña empezó."))}
              />
              {Number(version) === vigente && !modelo && <p className={AYUDA}>Para comparar, elegí otra versión u otro modelo.</p>}
            </div>
          </div>
        )}
        {enCurso.length > 0 && (
          <ul className="mt-3 space-y-2">
            {enCurso.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm">
                <span>
                  En curso: «{p.campana}» con v{p.version}, {p.porcentaje} de cada 100 charlas.
                </span>
                <Confirmar etiqueta="Cortar la prueba" peligro aviso={<p>Todas las charlas de la campaña vuelven a la versión de siempre.</p>} alConfirmar={() => hacer(async () => (await pedir({ accion: "cortar_ab", id: p.id }), "Listo: la prueba se cortó."))} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RolPuntual({ perfil, resumen, biblioteca, hacer }: { perfil: Rubro; resumen: Resumen; biblioteca: Biblioteca; hacer: Hacer }) {
  const id = useId();
  const roles = biblioteca.roles.filter((r) => r.rubro === perfil);
  const [rol, setRol] = useState("");
  const [donde, setDonde] = useState<"rol_perfil" | "rol_base" | "rol_campana">("rol_perfil");
  const [destino, setDestino] = useState("");
  const opciones = donde === "rol_base" ? biblioteca.bases.filter((b) => b.rubro === perfil) : donde === "rol_campana" ? biblioteca.campanas.filter((c) => c.rubro === perfil) : [];
  const aplicados = resumen.aplicaciones.filter((a) => a.rubro === perfil && a.tipo !== "version_perfil");
  const elegido = roles.find((r) => r.id === rol);
  return (
    <div className="space-y-3">
      {roles.length === 0 ? (
        <p className="text-sm text-slate-600">Este perfil no tiene roles. Pedile uno al asistente (por ejemplo: «armá un rol para la base de autos usados»).</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor={`${id}-rol`} className={ETIQUETA}>
              Rol
            </label>
            <select id={`${id}-rol`} className={CAMPO} value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="">Elegí un rol</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
            {elegido?.objetivo && <p className={AYUDA}>{elegido.objetivo}</p>}
          </div>
          <div>
            <label htmlFor={`${id}-donde`} className={ETIQUETA}>
              Dónde
            </label>
            <select id={`${id}-donde`} className={CAMPO} value={donde} onChange={(e) => (setDonde(e.target.value as typeof donde), setDestino(""))}>
              <option value="rol_perfil">Todo el perfil</option>
              <option value="rol_base">Una base</option>
              <option value="rol_campana">Una campaña</option>
            </select>
          </div>
          {donde !== "rol_perfil" && (
            <div>
              <label htmlFor={`${id}-destino`} className={ETIQUETA}>
                {donde === "rol_base" ? "Base" : "Campaña"}
              </label>
              <select id={`${id}-destino`} className={CAMPO} value={destino} onChange={(e) => setDestino(e.target.value)}>
                <option value="">Elegí</option>
                {opciones.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="md:col-span-3">
            <Confirmar
              etiqueta="Aplicar el rol"
              deshabilitado={!rol || (donde !== "rol_perfil" && !destino)}
              aviso={<p>El bot usa el rol «{elegido?.nombre}» {donde === "rol_perfil" ? "en todo el perfil" : donde === "rol_base" ? "con esa base" : "en esa campaña"}. {AVISO_REAL}</p>}
              alConfirmar={() =>
                hacer(async () => (await pedir({ accion: "aplicar_rol", perfil, tipo: donde, rol_id: rol, base_id: donde === "rol_base" ? destino : undefined, campaign_id: donde === "rol_campana" ? destino : undefined, confirmado: true }), "Listo: el rol quedó aplicado."))
              }
            />
          </div>
        </div>
      )}
      {aplicados.length > 0 && (
        <ul className="space-y-2">
          {aplicados.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm">
              <span>
                Rol «{a.rol ?? "sin rol"}» {a.base ? `con la base «${a.base}»` : a.campana ? `en la campaña «${a.campana}»` : "en el perfil"}.
              </span>
              <Confirmar etiqueta="Volver a la anterior" peligro aviso={<p>Vuelve lo que había antes de aplicar este rol.</p>} alConfirmar={() => hacer(async () => (await pedir({ accion: "volver_atras", id: a.id, confirmado: true }), "Listo: volvió a lo anterior."))} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Proveedores({ resumen, hacer }: { resumen: Resumen; hacer: Hacer }) {
  const id = useId();
  const [nombre, setNombre] = useState("");
  const [enlace, setEnlace] = useState("");
  const variable = variableDeProveedor(nombre);
  return (
    <div className="space-y-3">
      {resumen.proveedores.length > 0 && (
        <ul className="space-y-2">
          {resumen.proveedores.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm">
              <span>
                <span className="font-semibold">{p.nombre}</span> <span className="text-slate-600">· {p.endpoint}</span>
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${p.configurada ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
                {p.configurada ? "Listo para conectar" : "Falta la clave"}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-nombre`} className={ETIQUETA}>
            Nombre
          </label>
          <input id={`${id}-nombre`} className={CAMPO} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Otro proveedor" maxLength={60} />
        </div>
        <div>
          <label htmlFor={`${id}-enlace`} className={ETIQUETA}>
            Enlace (dirección del servicio)
          </label>
          <input id={`${id}-enlace`} type="url" inputMode="url" className={CAMPO} value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="https://…" />
        </div>
      </div>
      <p className={AYUDA}>
        La clave no se pega acá: se carga en la configuración del servidor con el nombre <code className="font-mono">{variable}</code> (siempre empieza con LAB_PROVEEDOR_).
      </p>
      <button
        type="button"
        className={BTN}
        disabled={nombre.trim().length < 2 || !enlace.trim()}
        onClick={() =>
          hacer(async () => {
            await pedir({ accion: "proveedor", nombre, endpoint: enlace.trim(), variable_clave: variable });
            setNombre("");
            setEnlace("");
            return "Proveedor agregado. Todavía no se conecta.";
          })
        }
      >
        Agregar proveedor
      </button>
    </div>
  );
}
