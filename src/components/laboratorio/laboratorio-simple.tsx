"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Anillo } from "@/components/premium/anillo";
import { SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";
import { NOMBRE_RUBRO } from "@/lib/premium/rubros";
import {
  FORMULARIO_VACIO,
  LIMITE_FICHA,
  PLANTILLAS_ROL,
  cifrasDelBot,
  compararEnPalabras,
  cuerpoArchivarRol,
  cuerpoCrearRol,
  cuerpoPedirMejora,
  cuerpoRolACampana,
  deCada10,
  fichaCambio,
  formularioDePlantilla,
  metaDeAtendidas,
  validarFormularioRol,
  type FormularioRol,
  type TasasBot,
} from "@/lib/laboratorio/vista-simple";
import { Confirmar, type PedidoConfirmacion } from "./confirmar";
import { HistorialCambios, PublicarAgente, Simulador } from "./laboratorio-herramientas";
import "./laboratorio.css";

/**
 * Laboratorio de bots simple (22/11). Queja del dueño: «demasiado técnico y no tiene ninguna función
 * en la que se pueda hacer algo». Una sección por perfil (los cuatro rubros, separados): cómo anda el
 * bot, roles del bot (crear, pedir mejora, archivar, usar en una campaña) y ficha del negocio.
 * Toda acción pide confirmación; usar un rol en una campaña la pide reforzada. Nada se borra.
 * Llama a las mismas rutas que ya existen (/api/agentes/roles, /pedidos, /ficha).
 */

interface PerfilStats { rubro: SlugPerfil; v1: TasasBot; v2: TasasBot; asignacion: { version: number; comparar_con: number | null } | null }
interface RolLista { id: string; rubro: SlugPerfil | null; nombre: string; objetivo: string; tono: string; instrucciones: string; usos: number }
interface CampanaLista { id: string; nombre: string; rubro: SlugPerfil | null; estado: string; rol_id: string | null }
interface Biblioteca { roles: RolLista[]; campanas: CampanaLista[] }

const CLASE: Record<SlugPerfil, string> = { juridico: "lab-j", coberturas_medicas: "lab-c", agencia_0km: "lab-a", marketing: "lab-m" };
const ESTADO_CAMPANA: Record<string, string> = { draft: "Borrador", active: "Activa", paused: "Pausada", completed: "Terminada", scheduled: "Programada" };

async function pedirJson<T = any>(url: string, cuerpo?: unknown): Promise<T> {
  const r = await fetch(url, {
    method: cuerpo === undefined ? "GET" : "POST",
    cache: "no-store",
    headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error ?? "No se pudo completar. Probá de nuevo en un momento.");
  return j as T;
}

export function LaboratorioSimple({ nombres }: { nombres: Record<string, string> }) {
  const [perfil, setPerfil] = useState<SlugPerfil>("juridico");
  const [stats, setStats] = useState<PerfilStats[] | null>(null);
  const [biblio, setBiblio] = useState<Biblioteca | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pedido, setPedido] = useState<PedidoConfirmacion | null>(null);
  const [cambios, setCambios] = useState(0);
  const idBase = useId();
  const mensajeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("laboratorio-simple-perfil");
      if ((SLUGS_PERFIL as readonly string[]).includes(p ?? "")) setPerfil(p as SlugPerfil);
    } catch { /* sin almacenamiento */ }
  }, []);

  const cargar = useCallback(async () => {
    try {
      const [c, b] = await Promise.all([pedirJson<{ perfiles: PerfilStats[] }>("/api/perfiles/conocimiento?dias=30"), pedirJson<Biblioteca>("/api/perfiles/laboratorio?vista=biblioteca")]);
      setStats(c.perfiles ?? []);
      setBiblio(b);
      setErrorCarga(null);
    } catch (e) {
      setErrorCarga((e as Error).message);
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  function elegir(p: SlugPerfil) {
    setPerfil(p);
    setOk(null);
    setError(null);
    try { localStorage.setItem("laboratorio-simple-perfil", p); } catch { /* nada */ }
  }

  function teclas(e: React.KeyboardEvent, i: number) {
    const n = SLUGS_PERFIL.length;
    const j = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i + n - 1) % n : null;
    if (j === null) return;
    e.preventDefault();
    elegir(SLUGS_PERFIL[j]);
    document.getElementById(`${idBase}-tab-${SLUGS_PERFIL[j]}`)?.focus();
  }

  function resultado(o: string | null, er: string | null) {
    setOk(o);
    setError(er);
    if (o) {
      cargar();
      setCambios((n) => n + 1);
    }
    setTimeout(() => mensajeRef.current?.focus(), 0);
  }

  const nombre = nombres[perfil] ?? NOMBRE_RUBRO[perfil];
  const s = stats?.find((x) => x.rubro === perfil) ?? null;
  const roles = useMemo(() => (biblio?.roles ?? []).filter((r) => r.rubro === perfil), [biblio, perfil]);
  const campanas = useMemo(() => (biblio?.campanas ?? []).filter((c) => c.rubro === perfil), [biblio, perfil]);

  return (
    <div className="lab space-y-5">
      <ul role="tablist" aria-label="Perfil" className="lab-pestanas">
        {SLUGS_PERFIL.map((p, i) => (
          <li key={p}>
            <button
              type="button"
              role="tab"
              id={`${idBase}-tab-${p}`}
              aria-selected={perfil === p}
              aria-controls={`${idBase}-panel`}
              tabIndex={perfil === p ? 0 : -1}
              className={`lab-pestana ${CLASE[p]}`}
              onClick={() => elegir(p)}
              onKeyDown={(e) => teclas(e, i)}
            >
              {nombres[p] ?? NOMBRE_RUBRO[p]}
            </button>
          </li>
        ))}
      </ul>

      <div ref={mensajeRef} tabIndex={-1} className="space-y-2 empty:hidden focus:outline-none">
        {ok && <p role="status" className="lab-msg lab-msg-ok">{ok}</p>}
        {error && <p role="alert" className="lab-msg lab-msg-error">{error}</p>}
      </div>

      <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-tab-${perfil}`} className={`space-y-5 ${CLASE[perfil]}`}>
        {errorCarga && <p role="alert" className="lab-msg lab-msg-error">{errorCarga}</p>}
        <ComoAnda key={`a-${perfil}`} perfil={perfil} nombre={nombre} s={s} cargando={!stats && !errorCarga} />
        <Roles
          key={`r-${perfil}`}
          perfil={perfil}
          nombre={nombre}
          roles={roles}
          campanas={campanas}
          cargando={!biblio && !errorCarga}
          pedir={setPedido}
        />
        <Simulador key={`s-${perfil}`} perfil={perfil} nombre={nombre} roles={roles} />
        <Ficha key={`f-${perfil}`} perfil={perfil} nombre={nombre} pedir={setPedido} />
        <PublicarAgente key={`p-${perfil}`} perfil={perfil} nombre={nombre} pedirConfirmacion={setPedido} />
        <HistorialCambios perfil={perfil} nombre={nombre} version={cambios} />
      </div>

      {pedido && <Confirmar pedido={pedido} onCerrar={() => setPedido(null)} onResultado={resultado} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Cómo anda el bot
// ---------------------------------------------------------------------------

function ComoAnda({ perfil, nombre, s, cargando }: { perfil: SlugPerfil; nombre: string; s: PerfilStats | null; cargando: boolean }) {
  const idT = useId();
  // Se muestra la versión que rige hoy; la otra es con la que se compara.
  const rigeNueva = (s?.asignacion?.version ?? 2) >= 2;
  const hoy = rigeNueva ? s?.v2 : s?.v1;
  const antes = rigeNueva ? s?.v1 : s?.v2;
  const c = cifrasDelBot(hoy);
  const cmp = compararEnPalabras(hoy, antes);
  return (
    <section aria-labelledby={idT} className="lab-tarjeta lab-entra">
      <h2 id={idT} className="text-xl font-semibold">Cómo anda el bot de {nombre}</h2>
      <p className="lab-t2 mt-1 text-sm">Lo que pasó en los últimos 30 días con las charlas reales.</p>
      {cargando ? (
        <p role="status" className="lab-t2 mt-4 text-sm">Cargando…</p>
      ) : (
        <>
          <div className="lab-anillos mt-4">
            <div className="lab-anillo">
              <Anillo valor={c.atendidas} meta={metaDeAtendidas(c.atendidas)} rubro={perfil} tamano="medio" nombre="Conversaciones atendidas" unidad="en 30 días" mostrarMeta={false} />
              <b>Atendidas</b>
              <span className="lab-t2 text-xs">conversaciones</span>
            </div>
            <div className="lab-anillo">
              <Anillo valor={c.captados} meta={Math.max(c.atendidas, 1)} rubro={perfil} tamano="medio" nombre="Captados" unidad={`de ${c.atendidas} conversaciones`} mostrarMeta={false} retrasoMs={80} />
              <b>Captados</b>
              <span className="lab-t2 text-xs">personas que dejaron sus datos</span>
            </div>
            <div className="lab-anillo">
              <Anillo valor={c.derivados} meta={Math.max(c.atendidas, 1)} rubro={perfil} tamano="medio" nombre="Pasadas a una persona" unidad={`de ${c.atendidas} conversaciones`} mostrarMeta={false} retrasoMs={160} />
              <b>Derivados</b>
              <span className="lab-t2 text-xs">pasaron a una persona</span>
            </div>
            <div className="lab-anillo">
              <Anillo valor={c.tasaCaptacion} rubro={perfil} tamano="medio" sufijo="%" nombre="Tasa de captación" unidad="de las conversaciones" mostrarMeta={false} retrasoMs={240} />
              <b>Tasa</b>
              <span className="lab-t2 text-xs">{c.atendidas ? `${deCada10(c.tasaCaptacion)} charlas` : "sin charlas todavía"}</span>
            </div>
          </div>
          <p className="lab-frase mt-4" data-veredicto={cmp.veredicto}>{cmp.frase}</p>
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Roles del bot
// ---------------------------------------------------------------------------

function Roles({ perfil, nombre, roles, campanas, cargando, pedir }: { perfil: SlugPerfil; nombre: string; roles: RolLista[]; campanas: CampanaLista[]; cargando: boolean; pedir: (p: PedidoConfirmacion) => void }) {
  const idT = useId();
  const [creando, setCreando] = useState(false);
  const [abierto, setAbierto] = useState<{ id: string; modo: "mejora" | "campana" } | null>(null);
  return (
    <section aria-labelledby={idT} className="lab-tarjeta lab-entra">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={idT} className="text-xl font-semibold">Roles del bot de {nombre}</h2>
          <p className="lab-t2 mt-1 max-w-2xl text-sm">Un rol le enseña al bot a atender un tipo de consulta: qué hacer, cómo hablar y qué no prometer. Nada se borra: lo que ya no sirve se archiva.</p>
        </div>
        <button type="button" className="lab-boton" aria-expanded={creando} onClick={() => setCreando((v) => !v)}>
          {creando ? "Cerrar" : "Crear rol nuevo"}
        </button>
      </div>

      {creando && <CrearRol perfil={perfil} nombre={nombre} pedir={pedir} onListo={() => setCreando(false)} />}

      <div className="mt-4">
        {cargando ? (
          <p role="status" className="lab-t2 text-sm">Cargando los roles…</p>
        ) : roles.length === 0 ? (
          <p className="lab-sub text-sm">Todavía no hay roles para {nombre}. Tocá «Crear rol nuevo» y elegí una de las plantillas para empezar.</p>
        ) : (
          <ul className="lab-lista">
            {roles.map((r) => {
              const usadoEn = campanas.filter((c) => c.rol_id === r.id);
              return (
                <li key={r.id} className="lab-sub lab-rol">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-base font-semibold">{r.nombre}</h3>
                    <span className="lab-pildora">{usadoEn.length ? `En ${usadoEn.length} ${usadoEn.length === 1 ? "campaña" : "campañas"}` : "Sin campaña"}</span>
                  </div>
                  {r.objetivo && <p className="lab-t2 text-sm">{r.objetivo}</p>}
                  {r.tono && <p className="text-sm"><span className="lab-t2">Tono: </span>{r.tono}</p>}
                  <div className="lab-acciones">
                    <button type="button" className="lab-boton-sec" aria-expanded={abierto?.id === r.id && abierto.modo === "campana"} onClick={() => setAbierto(abierto?.id === r.id && abierto.modo === "campana" ? null : { id: r.id, modo: "campana" })}>
                      Usar en una campaña
                    </button>
                    <button type="button" className="lab-boton-sec" aria-expanded={abierto?.id === r.id && abierto.modo === "mejora"} onClick={() => setAbierto(abierto?.id === r.id && abierto.modo === "mejora" ? null : { id: r.id, modo: "mejora" })}>
                      Pedir mejora
                    </button>
                    <button
                      type="button"
                      className="lab-boton-peligro"
                      onClick={() =>
                        pedir({
                          titulo: `¿Archivo el rol «${r.nombre}» de ${nombre}?`,
                          detalle: <p>No se borra: queda archivado. Las campañas que lo usaban vuelven al bot general de {nombre}.</p>,
                          textoSi: "Sí, archivar",
                          hacer: async () => {
                            await pedirJson("/api/agentes/roles", cuerpoArchivarRol(perfil, r.id));
                            return `Rol «${r.nombre}» archivado.`;
                          },
                        })
                      }
                    >
                      Archivar
                    </button>
                  </div>
                  {abierto?.id === r.id && abierto.modo === "mejora" && <PedirMejora nombre={nombre} rol={r} pedir={pedir} onListo={() => setAbierto(null)} />}
                  {abierto?.id === r.id && abierto.modo === "campana" && <UsarEnCampana perfil={perfil} nombre={nombre} rol={r} campanas={campanas} pedir={pedir} />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function CrearRol({ perfil, nombre, pedir, onListo }: { perfil: SlugPerfil; nombre: string; pedir: (p: PedidoConfirmacion) => void; onListo: () => void }) {
  const id = useId();
  const [f, setF] = useState<FormularioRol>(FORMULARIO_VACIO);
  const [aviso, setAviso] = useState<string | null>(null);
  const poner = (k: keyof FormularioRol) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const v = validarFormularioRol(f);
    if (!v.ok) return setAviso(v.error);
    setAviso(null);
    pedir({
      titulo: `¿Creo este rol para ${nombre}?`,
      detalle: (
        <>
          <p><strong className="text-white">{f.nombre.trim()}</strong>: {f.paraQue.trim()}</p>
          <p>Queda guardado, sin usar en ninguna campaña. No le escribe a nadie.</p>
        </>
      ),
      textoSi: "Sí, crear",
      hacer: async () => {
        await pedirJson("/api/agentes/roles", cuerpoCrearRol(perfil, f));
        onListo();
        return `Rol «${f.nombre.trim()}» creado para ${nombre}.`;
      },
    });
  }
  return (
    <form onSubmit={enviar} className="lab-sub lab-form mt-4" aria-label="Crear rol nuevo">
      <div>
        <p className="lab-etiqueta">Empezá con una plantilla (o escribí el tuyo)</p>
        <div className="lab-chips">
          {PLANTILLAS_ROL[perfil].map((p) => (
            <button key={p.nombre} type="button" className="lab-chip" onClick={() => { setF(formularioDePlantilla(p)); setAviso(null); }}>
              {p.nombre}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-n`} className="lab-etiqueta">Nombre del rol</label>
        <input id={`${id}-n`} className="lab-campo" value={f.nombre} onChange={poner("nombre")} maxLength={80} autoComplete="off" />
      </div>
      <div>
        <label htmlFor={`${id}-p`} className="lab-etiqueta">¿Para qué sirve?</label>
        <textarea id={`${id}-p`} className="lab-area" value={f.paraQue} onChange={poner("paraQue")} maxLength={500} />
        <p className="lab-ayuda">Contá qué tiene que lograr el bot con este tipo de consulta.</p>
      </div>
      <div>
        <label htmlFor={`${id}-t`} className="lab-etiqueta">¿Cómo tiene que hablar?</label>
        <input id={`${id}-t`} className="lab-campo" value={f.tono} onChange={poner("tono")} maxLength={300} autoComplete="off" />
        <p className="lab-ayuda">Por ejemplo: cercano, breve, sin palabras difíciles.</p>
      </div>
      <div>
        <label htmlFor={`${id}-x`} className="lab-etiqueta">¿Qué no debe prometer?</label>
        <textarea id={`${id}-x`} className="lab-area" value={f.noPrometer} onChange={poner("noPrometer")} maxLength={500} />
        <p className="lab-ayuda">Precios, plazos, resultados… lo que solo puede confirmar una persona. No pongas teléfonos ni correos.</p>
      </div>
      {aviso && <p role="alert" className="lab-msg lab-msg-error">{aviso}</p>}
      <div className="lab-acciones">
        <button type="submit" className="lab-boton">Crear rol</button>
        <button type="button" className="lab-boton-sec" onClick={onListo}>Cancelar</button>
      </div>
    </form>
  );
}

function PedirMejora({ nombre, rol, pedir, onListo }: { nombre: string; rol: RolLista; pedir: (p: PedidoConfirmacion) => void; onListo: () => void }) {
  const id = useId();
  const [texto, setTexto] = useState("");
  return (
    <div className="lab-form border-t border-white/10 pt-3">
      <div>
        <label htmlFor={id} className="lab-etiqueta">¿Qué querés que mejore?</label>
        <textarea id={id} className="lab-area" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1500} />
        <p className="lab-ayuda">Queda anotado para que una persona lo revise. No cambia el bot por sí solo.</p>
      </div>
      <div className="lab-acciones">
        <button
          type="button"
          className="lab-boton"
          disabled={texto.trim().length < 3}
          onClick={() =>
            pedir({
              titulo: `¿Anoto este pedido de mejora para «${rol.nombre}»?`,
              detalle: <p>«{texto.trim()}» Queda anotado como pendiente. El bot de {nombre} no cambia.</p>,
              textoSi: "Sí, anotar",
              hacer: async () => {
                await pedirJson("/api/agentes/pedidos", cuerpoPedirMejora(nombre, rol.nombre, texto));
                onListo();
                return "Pedido anotado.";
              },
            })
          }
        >
          Pedir mejora
        </button>
      </div>
    </div>
  );
}

function UsarEnCampana({ perfil, nombre, rol, campanas, pedir }: { perfil: SlugPerfil; nombre: string; rol: RolLista; campanas: CampanaLista[]; pedir: (p: PedidoConfirmacion) => void }) {
  const id = useId();
  const [campana, setCampana] = useState("");
  const elegible = campanas.filter((c) => c.rol_id !== rol.id);
  const conRol = campanas.filter((c) => c.rol_id === rol.id);
  const cambiar = (c: CampanaLista, quitar: boolean) =>
    pedir({
      reforzada: true,
      titulo: quitar ? `¿Le saco el rol «${rol.nombre}» a la campaña «${c.nombre}»?` : `¿Uso el rol «${rol.nombre}» en la campaña «${c.nombre}»?`,
      detalle: (
        <>
          <p>{quitar ? `Esa campaña vuelve a hablar con el bot general de ${nombre}.` : `El bot de ${nombre} va a hablar con los contactos de esa campaña usando este rol.`}</p>
          <p>No envía ningún mensaje ni lanza la campaña: solo cambia cómo responde el bot.</p>
        </>
      ),
      textoSi: quitar ? "Sí, sacar el rol" : "Sí, usar el rol",
      hacer: async () => {
        await pedirJson("/api/agentes/roles", cuerpoRolACampana(perfil, c.id, quitar ? null : rol.id));
        return quitar ? `Campaña «${c.nombre}» sin rol.` : `Campaña «${c.nombre}» usa el rol «${rol.nombre}».`;
      },
    });
  return (
    <div className="lab-form border-t border-white/10 pt-3">
      {campanas.length === 0 ? (
        <p className="lab-t2 text-sm">{nombre} todavía no tiene campañas. Cuando haya una, la vas a poder elegir acá.</p>
      ) : (
        <>
          <div>
            <label htmlFor={id} className="lab-etiqueta">Elegí la campaña</label>
            <select id={id} className="lab-select" value={campana} onChange={(e) => setCampana(e.target.value)}>
              <option value="">Elegir…</option>
              {elegible.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({ESTADO_CAMPANA[c.estado] ?? c.estado})
                </option>
              ))}
            </select>
          </div>
          <div className="lab-acciones">
            <button type="button" className="lab-boton" disabled={!campana} onClick={() => { const c = elegible.find((x) => x.id === campana); if (c) cambiar(c, false); }}>
              Usar en esta campaña
            </button>
          </div>
        </>
      )}
      {conRol.length > 0 && (
        <div>
          <p className="lab-etiqueta">Hoy lo usan</p>
          <ul className="lab-lista">
            {conRol.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{c.nombre} <span className="lab-t2">({ESTADO_CAMPANA[c.estado] ?? c.estado})</span></span>
                <button type="button" className="lab-boton-sec" onClick={() => cambiar(c, true)}>Sacar el rol</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Ficha del negocio
// ---------------------------------------------------------------------------

function Ficha({ perfil, nombre, pedir }: { perfil: SlugPerfil; nombre: string; pedir: (p: PedidoConfirmacion) => void }) {
  const idT = useId();
  const idA = useId();
  const [actual, setActual] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [fecha, setFecha] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const leer = useCallback(async () => {
    try {
      const j = await pedirJson<{ ficha: string; actualizada: string | null }>(`/api/agentes/ficha?perfil=${perfil}`);
      setActual(j.ficha ?? "");
      setTexto(j.ficha ?? "");
      setFecha(j.actualizada ?? null);
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [perfil]);
  useEffect(() => { leer(); }, [leer]);

  const cambio = actual !== null && fichaCambio(actual, texto);
  return (
    <section aria-labelledby={idT} className="lab-tarjeta lab-entra">
      <h2 id={idT} className="text-xl font-semibold">Ficha del negocio de {nombre}</h2>
      <p className="lab-t2 mt-1 max-w-2xl text-sm">Son los datos reales del negocio que el bot suma a cada respuesta: qué ofrece, zonas, horarios y lo que no se puede prometer.{fecha ? ` Última vez que se cambió: ${new Date(fecha).toLocaleDateString("es-AR")}.` : ""}</p>
      {err && <p role="alert" className="lab-msg lab-msg-error mt-3">{err}</p>}
      {actual === null && !err ? (
        <p role="status" className="lab-t2 mt-3 text-sm">Cargando la ficha…</p>
      ) : (
        <div className="lab-form mt-3">
          <div>
            <label htmlFor={idA} className="lab-etiqueta">Ficha</label>
            <textarea id={idA} className="lab-area" style={{ minHeight: "12rem" }} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={LIMITE_FICHA} />
            <p className="lab-ayuda">{texto.length} de {LIMITE_FICHA} letras. Sin datos de personas.</p>
          </div>
          <div className="lab-acciones">
            <button
              type="button"
              className="lab-boton"
              disabled={!cambio}
              onClick={() =>
                pedir({
                  titulo: `¿Guardo la ficha del negocio de ${nombre}?`,
                  detalle: <p>Desde la próxima respuesta, el bot usa esta ficha. Reemplaza la anterior y no envía ningún mensaje.</p>,
                  textoSi: "Sí, guardar",
                  hacer: async () => {
                    await pedirJson("/api/agentes/ficha", { perfil, ficha: texto });
                    await leer();
                    return `Ficha de ${nombre} guardada.`;
                  },
                })
              }
            >
              Guardar ficha
            </button>
            <button type="button" className="lab-boton-sec" disabled={!cambio} onClick={() => actual !== null && setTexto(actual)}>
              Deshacer cambios
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
