"use client";

import { useEffect, useId, useState } from "react";
import { pedirConfirmacion } from "@/components/ui/dialogo-confirmar";
import { AREA, AVISO_EN_VIVO, AYUDA, BTN, BTN_PRINCIPAL, CAMPO, ETIQUETA, Mensajes, RUBROS, SUBTITULO, TARJETA, TIPOS_CONSULTA, fecha, pedir, perfilesDe, type Biblioteca, type Rubro } from "./comun";
import type { PropsPestana } from "./laboratorio-bot";

type Rol = Biblioteca["roles"][number];
const DESTINOS = [
  { id: "rol_perfil", label: "Todo el perfil" },
  { id: "rol_tipo_consulta", label: "Un tipo de consulta" },
  { id: "rol_base", label: "Una base" },
  { id: "rol_campana", label: "Una campaña" },
] as const;
const TEXTO_DESTINO: Record<string, string> = {
  rol_perfil: "todo el perfil",
  rol_tipo_consulta: "un tipo de consulta",
  rol_base: "una base",
  rol_campana: "una campaña",
};

/**
 * Pestaña «Roles y fichas»: biblioteca de roles de los cuatro perfiles y
 * generales, con filtro; aplicar un rol (perfil, tipo de consulta, base o
 * campaña) con confirmación y vuelta atrás; copiar a otro perfil; «editar»
 * crea una copia (el original puede estar en uso). Fichas de cada versión
 * para consultar.
 */
export function PestanaRoles({ sel, nombres, resumen, biblioteca, recargar }: PropsPestana) {
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [abierto, setAbierto] = useState<{ id: string; modo: "aplicar" | "copiar" | "editar" } | null>(null);
  const perfiles = perfilesDe(sel);
  const q = filtro.trim().toLowerCase();
  const coincide = (r: { nombre: string; objetivo: string; instrucciones: string }) => !q || `${r.nombre} ${r.objetivo} ${r.instrucciones}`.toLowerCase().includes(q);
  const roles = (biblioteca?.roles ?? []).filter((r) => r.rubro && perfiles.includes(r.rubro) && coincide(r));
  const generales = (biblioteca?.generales ?? []).filter(coincide);
  const aplicados = resumen.aplicaciones.filter((a) => a.tipo !== "version_perfil" && perfiles.includes(a.rubro));

  async function accion(f: () => Promise<string>) {
    setOk(null);
    setError(null);
    setOcupado(true);
    try {
      setOk((await f()) || null);
      setAbierto(null);
      await recargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  function describir(a: (typeof aplicados)[number]): string {
    if (a.tipo === "rol_perfil") return `«${a.rol}» en todo el perfil`;
    if (a.tipo === "rol_tipo_consulta") return `«${a.rol}» en ${TIPOS_CONSULTA.find((t) => t.id === a.tipo_consulta)?.label.toLowerCase() ?? a.tipo_consulta}`;
    if (a.tipo === "rol_base") return a.rol ? `«${a.rol}» en la base «${a.base}»` : `sin rol en la base «${a.base}»`;
    return a.rol ? `«${a.rol}» en la campaña «${a.campana}»` : `sin rol en la campaña «${a.campana}»`;
  }

  return (
    <div className="space-y-6">
      <Mensajes ok={ok} error={error} />
      <Aplicados aplicados={aplicados} nombres={nombres} describir={describir} ocupado={ocupado} accion={accion} />

      <section aria-labelledby="lab-roles-lista">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h4 id="lab-roles-lista" className={SUBTITULO}>Biblioteca de roles</h4>
          <label className="block w-full sm:w-72">
            <span className={ETIQUETA}>Buscar</span>
            <input type="search" className={CAMPO} value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Nombre, objetivo o instrucciones" />
          </label>
        </div>
        <p className={AYUDA}>
          Un rol se suma al guion del bot. Orden de lo que manda: prueba A/B de la campaña, rol de la campaña, rol de la base, rol por tipo de consulta y, por último, rol de todo el perfil.
        </p>
        {!biblioteca && <p className="mt-2 text-sm text-slate-700" role="status">Cargando roles…</p>}
        {biblioteca && roles.length === 0 && generales.length === 0 && <p className="mt-2 text-sm text-slate-700">{q ? "Ningún rol coincide con la búsqueda." : "Todavía no hay roles. Creá uno abajo."}</p>}
        <ul className="mt-2 grid gap-3 lg:grid-cols-2">
          {roles.map((r) => (
            <li key={r.id} className={TARJETA}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{r.nombre}</p>
                <span className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-800">{nombres[r.rubro!] ?? r.rubro}</span>
              </div>
              {r.objetivo && <p className="mt-1 text-sm text-slate-800">Objetivo: {r.objetivo}</p>}
              <details className="mt-1 text-sm">
                <summary className="min-h-11 cursor-pointer py-2 font-medium text-slate-800">Ver instrucciones</summary>
                <p className="whitespace-pre-wrap text-slate-800">{r.instrucciones}</p>
              </details>
              <p className={AYUDA}>{r.usos ? `En uso en ${r.usos} lugar(es).` : "Sin usar."}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["aplicar", "copiar", "editar"] as const).map((m) => (
                  <button key={m} type="button" className={BTN} aria-expanded={abierto?.id === r.id && abierto.modo === m} onClick={() => setAbierto(abierto?.id === r.id && abierto.modo === m ? null : { id: r.id, modo: m })}>
                    {m === "aplicar" ? "Aplicar…" : m === "copiar" ? "Copiar a otro perfil…" : "Editar como copia…"}
                  </button>
                ))}
              </div>
              {abierto?.id === r.id && abierto.modo === "aplicar" && <AplicarRol rol={r} biblioteca={biblioteca!} nombres={nombres} ocupado={ocupado} accion={accion} />}
              {abierto?.id === r.id && abierto.modo === "copiar" && <CopiarRol origen={{ rol_id: r.id }} excluir={r.rubro} nombres={nombres} ocupado={ocupado} accion={accion} />}
              {abierto?.id === r.id && abierto.modo === "editar" && (
                <FormRol
                  inicial={r}
                  boton="Guardar como rol nuevo"
                  nota="El rol original no cambia (puede estar en uso). Se crea uno nuevo con estos cambios, sin aplicar."
                  ocupado={ocupado}
                  alGuardar={(datos) =>
                    accion(async () => {
                      const x = await pedir<any>({ accion: "rol_copia_editada", rol_id: r.id, ...datos });
                      return `Se creó «${x.rol.nombre}». No se aplica a nada hasta que lo apliques.`;
                    })
                  }
                />
              )}
            </li>
          ))}
          {generales.map((g) => (
            <li key={g.id} className={TARJETA}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{g.nombre}</p>
                <span className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-800">General</span>
              </div>
              {g.objetivo && <p className="mt-1 text-sm text-slate-800">Objetivo: {g.objetivo}</p>}
              <p className={AYUDA}>Para usarlo en un perfil, copialo: queda como rol de ese perfil, listo para aplicar.</p>
              <button type="button" className={`${BTN} mt-2`} aria-expanded={abierto?.id === g.id} onClick={() => setAbierto(abierto?.id === g.id ? null : { id: g.id, modo: "copiar" })}>
                Copiar a un perfil…
              </button>
              {abierto?.id === g.id && <CopiarRol origen={{ general_id: g.id }} excluir={null} nombres={nombres} ocupado={ocupado} accion={accion} />}
            </li>
          ))}
        </ul>
      </section>

      <NuevoRol sel={sel} nombres={nombres} ocupado={ocupado} accion={accion} />
      <Fichas sel={sel} nombres={nombres} resumen={resumen} />
    </div>
  );
}

function Aplicados({ aplicados, nombres, describir, ocupado, accion }: { aplicados: PropsPestana["resumen"]["aplicaciones"]; nombres: Record<string, string>; describir: (a: PropsPestana["resumen"]["aplicaciones"][number]) => string; ocupado: boolean; accion: (f: () => Promise<string>) => Promise<void> }) {
  if (!aplicados.length) return null;
  return (
    <section aria-labelledby="lab-roles-aplicados">
      <h4 id="lab-roles-aplicados" className={SUBTITULO}>Aplicado desde el laboratorio</h4>
      <ul className="mt-2 space-y-2">
        {aplicados.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <span>
              {nombres[a.rubro] ?? a.rubro}: {describir(a)} · desde el {fecha(a.aplicada_at)}
            </span>
            <button
              type="button"
              className={BTN}
              disabled={ocupado}
              onClick={() =>
                accion(async () => {
                  if (!(await pedirConfirmacion({ titulo: "¿Volver a lo anterior?", texto: `${describir(a)}.\n\n${AVISO_EN_VIVO}`, confirmar: "Volver a lo anterior" }))) return "";
                  const r = await pedir<any>({ accion: "volver_atras", id: a.id });
                  return `Listo: volvió lo anterior. ${r.aviso}`;
                })
              }
            >
              Volver a lo anterior
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AplicarRol({ rol, biblioteca, nombres, ocupado, accion }: { rol: Rol; biblioteca: Biblioteca; nombres: Record<string, string>; ocupado: boolean; accion: (f: () => Promise<string>) => Promise<void> }) {
  const id = useId();
  const rubro = rol.rubro as Rubro;
  const [destino, setDestino] = useState<(typeof DESTINOS)[number]["id"]>("rol_perfil");
  const [tipo, setTipo] = useState("entrante");
  const [baseId, setBaseId] = useState("");
  const [campId, setCampId] = useState("");
  const bases = biblioteca.bases.filter((b) => b.rubro === rubro);
  const camps = biblioteca.campanas.filter((c) => c.rubro === rubro);
  const listo = destino === "rol_base" ? !!baseId : destino === "rol_campana" ? !!campId : true;

  function aplicar() {
    accion(async () => {
      const donde =
        destino === "rol_perfil"
          ? `todas las charlas de ${nombres[rubro] ?? rubro} que no tengan rol de campaña ni de base`
          : destino === "rol_tipo_consulta"
            ? `las charlas de tipo «${TIPOS_CONSULTA.find((t) => t.id === tipo)?.label}» que no tengan rol de campaña ni de base`
            : destino === "rol_base"
              ? `la base «${bases.find((b) => b.id === baseId)?.nombre}» (reemplaza el rol que tenga)`
              : `la campaña «${camps.find((c) => c.id === campId)?.nombre}» (reemplaza el rol que tenga)`;
      if (!(await pedirConfirmacion({ titulo: `¿Aplicar «${rol.nombre}» a ${TEXTO_DESTINO[destino]}?`, texto: `Rige en ${donde}.\n\n${AVISO_EN_VIVO}`, confirmar: "Aplicar rol" }))) return "";
      const r = await pedir<any>({ accion: "aplicar_rol", perfil: rubro, tipo: destino, rol_id: rol.id, tipo_consulta: tipo, base_id: baseId, campaign_id: campId, confirmado: true });
      return `Listo: «${rol.nombre}» aplicado. ${r.aviso}`;
    });
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-3">
      <fieldset>
        <legend className={ETIQUETA}>¿Dónde?</legend>
        <div className="grid gap-1 sm:grid-cols-2">
          {DESTINOS.map((d) => (
            <label key={d.id} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-800">
              <input type="radio" name={`${id}-destino`} className="h-4 w-4" checked={destino === d.id} onChange={() => setDestino(d.id)} />
              {d.label}
            </label>
          ))}
        </div>
      </fieldset>
      {destino === "rol_tipo_consulta" && (
        <label className="block">
          <span className={ETIQUETA}>Tipo de consulta</span>
          <select className={CAMPO} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_CONSULTA.filter((t) => !t.soloJuridico || rubro === "juridico").map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {destino === "rol_base" && (
        <label className="block">
          <span className={ETIQUETA}>Base</span>
          <select className={CAMPO} value={baseId} onChange={(e) => setBaseId(e.target.value)}>
            <option value="">Elegí una base</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
                {b.rol_id ? " (ya tiene un rol)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      {destino === "rol_campana" && (
        <label className="block">
          <span className={ETIQUETA}>Campaña</span>
          <select className={CAMPO} value={campId} onChange={(e) => setCampId(e.target.value)}>
            <option value="">Elegí una campaña</option>
            {camps.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.rol_id ? " (ya tiene un rol)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      <button type="button" className={BTN_PRINCIPAL} disabled={ocupado || !listo} onClick={aplicar}>
        Aplicar con confirmación
      </button>
    </div>
  );
}

function CopiarRol({ origen, excluir, nombres, ocupado, accion }: { origen: { rol_id?: string; general_id?: string }; excluir: Rubro | null; nombres: Record<string, string>; ocupado: boolean; accion: (f: () => Promise<string>) => Promise<void> }) {
  const opciones = RUBROS.filter((r) => r !== excluir);
  const [destino, setDestino] = useState<Rubro>(opciones[0]);
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
      <label className="block min-w-48 flex-1">
        <span className={ETIQUETA}>Perfil de destino</span>
        <select className={CAMPO} value={destino} onChange={(e) => setDestino(e.target.value as Rubro)}>
          {opciones.map((r) => (
            <option key={r} value={r}>
              {nombres[r] ?? r}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className={BTN_PRINCIPAL}
        disabled={ocupado}
        onClick={() =>
          accion(async () => {
            const x = await pedir<any>({ accion: "copiar_rol", ...origen, destino });
            return `Se copió como «${x.rol.nombre}» en ${nombres[destino] ?? destino}. No se aplica a nada hasta que lo apliques.`;
          })
        }
      >
        Copiar
      </button>
    </div>
  );
}

function FormRol({ inicial, boton, nota, ocupado, alGuardar }: { inicial?: Partial<Rol>; boton: string; nota?: string; ocupado: boolean; alGuardar: (d: { nombre: string; objetivo: string; tono: string; instrucciones: string }) => void }) {
  const [d, setD] = useState({ nombre: inicial?.nombre ? `${inicial.nombre} (nueva)`.slice(0, 80) : "", objetivo: inicial?.objetivo ?? "", tono: inicial?.tono ?? "", instrucciones: inicial?.instrucciones ?? "" });
  return (
    <form
      className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-3"
      onSubmit={(e) => {
        e.preventDefault();
        alGuardar(d);
      }}
    >
      {nota && <p className="text-sm text-slate-700">{nota}</p>}
      <label className="block">
        <span className={ETIQUETA}>Nombre</span>
        <input className={CAMPO} value={d.nombre} maxLength={80} required onChange={(e) => setD({ ...d, nombre: e.target.value })} />
      </label>
      <label className="block">
        <span className={ETIQUETA}>Objetivo (opcional)</span>
        <input className={CAMPO} value={d.objetivo} maxLength={500} onChange={(e) => setD({ ...d, objetivo: e.target.value })} />
      </label>
      <label className="block">
        <span className={ETIQUETA}>Tono (opcional)</span>
        <input className={CAMPO} value={d.tono} maxLength={300} onChange={(e) => setD({ ...d, tono: e.target.value })} />
      </label>
      <label className="block">
        <span className={ETIQUETA}>Instrucciones</span>
        <textarea className={AREA} rows={5} value={d.instrucciones} maxLength={6000} required onChange={(e) => setD({ ...d, instrucciones: e.target.value })} />
        <span className={AYUDA}>Sin teléfonos ni correos de personas.</span>
      </label>
      <button type="submit" className={BTN_PRINCIPAL} disabled={ocupado}>
        {boton}
      </button>
    </form>
  );
}

function NuevoRol({ sel, nombres, ocupado, accion }: { sel: PropsPestana["sel"]; nombres: Record<string, string>; ocupado: boolean; accion: (f: () => Promise<string>) => Promise<void> }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [perfil, setPerfil] = useState<Rubro | "general">(sel === "todos" ? "general" : sel);
  useEffect(() => setPerfil(sel === "todos" ? "general" : sel), [sel]);
  return (
    <section aria-labelledby={`${id}-t`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id={`${id}-t`} className={SUBTITULO}>Crear un rol</h4>
        <button type="button" className={BTN} aria-expanded={abierto} onClick={() => setAbierto((x) => !x)}>
          {abierto ? "Cerrar" : "Nuevo rol"}
        </button>
      </div>
      {abierto && (
        <div className="mt-2">
          <label className="block sm:w-72">
            <span className={ETIQUETA}>De qué perfil</span>
            <select className={CAMPO} value={perfil} onChange={(e) => setPerfil(e.target.value as Rubro | "general")}>
              <option value="general">General (sirve para copiar a cualquier perfil)</option>
              {RUBROS.map((r) => (
                <option key={r} value={r}>
                  {nombres[r] ?? r}
                </option>
              ))}
            </select>
          </label>
          <FormRol
            boton="Crear rol"
            nota="Queda guardado sin aplicar: no cambia ninguna charla hasta que lo apliques."
            ocupado={ocupado}
            alGuardar={(datos) =>
              accion(async () => {
                const x = await pedir<any>(perfil === "general" ? { accion: "rol_general", ...datos } : { accion: "rol_nuevo", perfil, ...datos });
                setAbierto(false);
                return `Se creó «${x.rol.nombre}».`;
              })
            }
          />
        </div>
      )}
    </section>
  );
}

function Fichas({ sel, nombres, resumen }: { sel: PropsPestana["sel"]; nombres: Record<string, string>; resumen: PropsPestana["resumen"] }) {
  const [perfil, setPerfil] = useState<Rubro>(sel === "todos" ? "juridico" : sel);
  const [version, setVersion] = useState<number>(resumen.asignaciones.find((a) => a.rubro === perfil)?.version ?? 2);
  const [fichas, setFichas] = useState<any[] | null>(null);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (sel !== "todos") setPerfil(sel);
  }, [sel]);
  useEffect(() => {
    let vivo = true;
    setFichas(null);
    pedir<{ fichas: any[] }>(`vista=fichas&perfil=${perfil}&version=${version}`)
      .then((r) => vivo && (setFichas(r.fichas), setError(null)))
      .catch((e) => vivo && setError((e as Error).message));
    return () => {
      vivo = false;
    };
  }, [perfil, version]);
  const q = filtro.trim().toLowerCase();
  const visibles = (fichas ?? []).filter((f) => !q || `${f.titulo} ${f.contenido} ${(f.disparadores ?? []).join(" ")}`.toLowerCase().includes(q));
  const CAPA: Record<string, string> = { general: "Base general", rubro: "Base del perfil", tema: "Tema", objecion: "Objeción" };
  return (
    <section aria-labelledby="lab-fichas">
      <h4 id="lab-fichas" className={SUBTITULO}>Fichas de conocimiento</h4>
      <p className={AYUDA}>Para consultar. Las de v1 y v2 se editan en «Conocimiento del bot»; para sumar fichas nuevas, creá una versión nueva.</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className={ETIQUETA}>Perfil</span>
          <select className={CAMPO} value={perfil} onChange={(e) => setPerfil(e.target.value as Rubro)}>
            {RUBROS.map((r) => (
              <option key={r} value={r}>
                {nombres[r] ?? r}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={ETIQUETA}>Versión</span>
          <select className={CAMPO} value={version} onChange={(e) => setVersion(Number(e.target.value))}>
            {resumen.versiones.filter((v) => v.rubros.includes(perfil)).map((v) => (
              <option key={v.version} value={v.version}>
                {v.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={ETIQUETA}>Buscar</span>
          <input type="search" className={CAMPO} value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="precio, ART, usado…" />
        </label>
      </div>
      <Mensajes ok={null} error={error} />
      <div role="region" aria-label="Fichas de la versión" tabIndex={0} className="mt-2 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
        {!fichas && !error && <p className="text-sm text-slate-700" role="status">Cargando fichas…</p>}
        {fichas && visibles.length === 0 && <p className="text-sm text-slate-700">{fichas.length ? "Ninguna ficha coincide con la búsqueda." : "Esta versión no tiene fichas (v1 es el bot sin biblioteca)."}</p>}
        {visibles.map((f) => (
          <details key={f.clave} className={`rounded-lg border border-slate-200 bg-white p-2 ${f.activo ? "" : "opacity-70"}`}>
            <summary className="min-h-11 cursor-pointer py-2 text-sm text-slate-900">
              <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-700">{CAPA[f.capa] ?? f.capa}</span>
              {f.titulo}
              {!f.activo && <span className="ml-2 text-xs text-slate-700">(apagada)</span>}
            </summary>
            {(f.disparadores ?? []).length > 0 && <p className="text-xs text-slate-700">Se usa con: {f.disparadores.join(", ")}</p>}
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{f.contenido}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
