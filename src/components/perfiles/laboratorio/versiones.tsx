"use client";

import { useId, useMemo, useState } from "react";
import { pedirConfirmacion } from "@/components/ui/dialogo-confirmar";
import { AREA, AVISO_EN_VIVO, AYUDA, BTN, BTN_PELIGRO, BTN_PRINCIPAL, CAMPO, ETIQUETA, Insignia, Mensajes, RUBROS, SUBTITULO, TARJETA, fecha, pedir, perfilesDe, type Rubro } from "./comun";
import type { PropsPestana } from "./laboratorio-bot";

interface FichaForm {
  capa: "tema" | "objecion";
  rubro: Rubro | "comun";
  titulo: string;
  disparadores: string;
  contenido: string;
}

/** Pestaña «Versiones»: lista con insignias, aplicar con diferencias a la vista, volver atrás y crear una copia nueva. */
export function PestanaVersiones({ sel, nombres, resumen, biblioteca, modelos, recargar }: PropsPestana) {
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const perfiles = perfilesDe(sel);
  const visibles = resumen.versiones.filter((v) => v.rubros.some((r) => perfiles.includes(r)));
  const aplicadas = resumen.aplicaciones.filter((a) => a.tipo === "version_perfil" && perfiles.includes(a.rubro));
  const rige = (r: Rubro) => resumen.asignaciones.find((a) => a.rubro === r);

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

  async function aplicar(version: number, rubro: Rubro) {
    await accion(async () => {
      const d = await pedir<any>(`vista=diferencias&perfil=${rubro}&version=${version}`);
      const lineas = [
        `${nombres[rubro] ?? rubro}: hoy rige v${d.actual}; pasaría a regir v${version} en todas las charlas del perfil.`,
        [
          d.fichasNuevas.length ? `Fichas que se suman (${d.fichasNuevas.length}): ${d.fichasNuevas.slice(0, 6).join(", ")}${d.fichasNuevas.length > 6 ? "…" : ""}.` : "",
          d.fichasQuitadas.length ? `Fichas que dejan de usarse (${d.fichasQuitadas.length}): ${d.fichasQuitadas.slice(0, 6).join(", ")}${d.fichasQuitadas.length > 6 ? "…" : ""}.` : "",
          d.fichasCambiadas.length ? `Fichas con otro texto (${d.fichasCambiadas.length}): ${d.fichasCambiadas.slice(0, 6).join(", ")}.` : "",
          d.modelo ? `Modelo: ${d.modelo.antes} → ${d.modelo.despues}.` : "Modelo: el mismo de hoy.",
          d.tono ? "Cambia el tono." : "",
          d.reglas ? "Cambian las reglas propias de la versión." : "",
          d.roles ? `Roles de la versión: ${d.roles.despues.join(", ") || "ninguno"}.` : "",
        ]
          .filter(Boolean)
          .join(" "),
        AVISO_EN_VIVO,
      ];
      const si = await pedirConfirmacion({ titulo: `¿Aplicar v${version} a todo el perfil?`, texto: lineas.join("\n\n"), confirmar: `Aplicar v${version}` });
      if (!si) return "";
      const r = await pedir<any>({ accion: "aplicar_version", perfil: rubro, version, confirmado: true });
      return `Listo: v${version} rige en ${nombres[rubro] ?? rubro}. ${r.aviso}`;
    });
  }

  async function volver(id: string, texto: string) {
    await accion(async () => {
      const si = await pedirConfirmacion({ titulo: "¿Volver a lo anterior?", texto: `${texto}\n\nVuelve la versión que regía antes de esta aplicación. ${AVISO_EN_VIVO}`, confirmar: "Volver a lo anterior" });
      if (!si) return "";
      const r = await pedir<any>({ accion: "volver_atras", id });
      return `Listo: volvió lo anterior. ${r.aviso}`;
    });
  }

  async function archivar(version: number) {
    await accion(async () => {
      const si = await pedirConfirmacion({ titulo: `¿Archivar v${version}?`, texto: "La versión no se borra: queda archivada y deja de aparecer para aplicar o probar.", confirmar: "Archivar", peligro: true });
      if (!si) return "";
      await pedir({ accion: "archivar_version", version });
      return `v${version} quedó archivada.`;
    });
  }

  return (
    <div className="space-y-6">
      <Mensajes ok={ok} error={error} />

      <section aria-labelledby="lab-versiones-rigen">
        <h4 id="lab-versiones-rigen" className={SUBTITULO}>Qué rige hoy</h4>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {perfiles.map((r) => {
            const a = rige(r);
            return (
              <li key={r} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                <strong className="font-semibold text-slate-900">{nombres[r] ?? r}</strong>: {a ? (a.comparar_con ? `v${a.version} (${a.porcentaje} %) y v${a.comparar_con}` : `v${a.version}`) : "v2"} · modelo{" "}
                {resumen.versiones.find((v) => v.version === a?.version)?.modelo ?? resumen.modeloServidor}
              </li>
            );
          })}
        </ul>
        {aplicadas.length > 0 && (
          <ul className="mt-3 space-y-2">
            {aplicadas.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <span>
                  {nombres[a.rubro] ?? a.rubro}: v{a.version} aplicada desde el laboratorio el {fecha(a.aplicada_at)}.
                </span>
                <button type="button" className={BTN} disabled={ocupado} onClick={() => volver(a.id, `${nombres[a.rubro] ?? a.rubro}: deja de regir v${a.version}.`)}>
                  Volver a lo anterior
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="lab-versiones-lista">
        <h4 id="lab-versiones-lista" className={SUBTITULO}>Versiones</h4>
        <p className={AYUDA}>v1 y v2 son las de siempre (se editan en «Conocimiento del bot»). Las del laboratorio son copias: crearlas no cambia ninguna charla.</p>
        <ul className="mt-2 grid gap-3 lg:grid-cols-2">
          {visibles.map((v) => (
            <li key={v.version} className={TARJETA}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{v.nombre}</p>
                <Insignia estado={v.estado} />
              </div>
              <dl className="mt-2 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-sm text-slate-800">
                {v.base_version != null && (
                  <>
                    <dt className="text-slate-600">Copia de</dt>
                    <dd>v{v.base_version}</dd>
                  </>
                )}
                <dt className="text-slate-600">Perfiles</dt>
                <dd>{v.rubros.map((r) => nombres[r] ?? r).join(", ")}</dd>
                <dt className="text-slate-600">Modelo</dt>
                <dd className="break-all">{v.modelo ?? `el del servidor (${resumen.modeloServidor})`}</dd>
                <dt className="text-slate-600">Fichas</dt>
                <dd className="tabular-nums">{v.fichas}</dd>
                {v.roles.length > 0 && (
                  <>
                    <dt className="text-slate-600">Roles</dt>
                    <dd>{v.roles.map((r) => r.nombre).join(", ")}</dd>
                  </>
                )}
              </dl>
              {(v.tono || v.reglas) && (
                <details className="mt-2 text-sm">
                  <summary className="min-h-11 cursor-pointer py-2 font-medium text-slate-800">Ver tono y reglas</summary>
                  {v.tono && <p className="whitespace-pre-wrap text-slate-800"><strong>Tono:</strong> {v.tono}</p>}
                  {v.reglas && <p className="mt-1 whitespace-pre-wrap text-slate-800"><strong>Reglas:</strong> {v.reglas}</p>}
                </details>
              )}
              {v.laboratorio && v.estado !== "archivada" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {sel !== "todos" && v.rubros.includes(sel) && rige(sel)?.version !== v.version && (
                    <button type="button" className={BTN_PRINCIPAL} disabled={ocupado} onClick={() => aplicar(v.version, sel)}>
                      Aplicar a {nombres[sel] ?? sel}
                    </button>
                  )}
                  {v.estado === "borrador" && (
                    <button type="button" className={BTN_PELIGRO} disabled={ocupado} onClick={() => archivar(v.version)}>
                      Archivar
                    </button>
                  )}
                </div>
              )}
              {v.laboratorio && sel === "todos" && v.estado !== "archivada" && <p className={AYUDA}>Para aplicarla, elegí un perfil arriba.</p>}
            </li>
          ))}
        </ul>
      </section>

      <NuevaVersion sel={sel} nombres={nombres} resumen={resumen} biblioteca={biblioteca} modelos={modelos} recargar={recargar} alTerminar={(t) => setOk(t)} />
    </div>
  );
}

function NuevaVersion({ sel, nombres, resumen, biblioteca, modelos, recargar, alTerminar }: PropsPestana & { alTerminar: (t: string) => void }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const activa = sel !== "todos" ? resumen.asignaciones.find((a) => a.rubro === sel)?.version ?? 2 : 2;
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [base, setBase] = useState<number>(activa);
  const [rubros, setRubros] = useState<Rubro[]>(sel === "todos" ? RUBROS : [sel]);
  const [modelo, setModelo] = useState("");
  const [tono, setTono] = useState("");
  const [reglas, setReglas] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [fichas, setFichas] = useState<FichaForm[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const rolesPosibles = useMemo(
    () => [
      ...(biblioteca?.roles ?? []).filter((r) => r.rubro && rubros.includes(r.rubro)).map((r) => ({ id: r.id, nombre: `${r.nombre} · ${nombres[r.rubro!] ?? r.rubro}` })),
      ...(biblioteca?.generales ?? []).map((r) => ({ id: r.id, nombre: `${r.nombre} · general` })),
    ],
    [biblioteca, rubros, nombres]
  );

  function alternarRubro(r: Rubro) {
    setRubros((x) => (x.includes(r) ? x.filter((y) => y !== r) : [...x, r]));
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOcupado(true);
    try {
      const r = await pedir<{ version: number }>({
        accion: "crear_version",
        nombre,
        descripcion,
        base_version: base,
        rubros,
        modelo,
        tono,
        reglas,
        roles_ids: roles,
        fichas: fichas.map((f) => ({ ...f, disparadores: f.disparadores })),
      });
      alTerminar(`Se creó v${r.version} como Borrador. No responde a nadie hasta que la apliques o la pongas en prueba.`);
      setNombre("");
      setDescripcion("");
      setTono("");
      setReglas("");
      setRoles([]);
      setFichas([]);
      setAbierto(false);
      await recargar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section aria-labelledby={`${id}-t`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id={`${id}-t`} className={SUBTITULO}>Crear una versión nueva</h4>
        <button type="button" className={abierto ? BTN : BTN_PRINCIPAL} aria-expanded={abierto} aria-controls={`${id}-f`} onClick={() => setAbierto((x) => !x)}>
          {abierto ? "Cerrar" : "Nueva versión"}
        </button>
      </div>
      {abierto && (
        <form id={`${id}-f`} onSubmit={crear} className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">Es una copia de la versión que elijas, con lo que le sumes. No edita ninguna versión existente ni el bot de base del perfil.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={ETIQUETA}>Nombre</span>
              <input className={CAMPO} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={70} required placeholder="Por ejemplo: más breve y cálida" />
            </label>
            <label className="block">
              <span className={ETIQUETA}>Parte de</span>
              <select className={CAMPO} value={base} onChange={(e) => setBase(Number(e.target.value))}>
                {resumen.versiones
                  .filter((v) => v.estado !== "archivada")
                  .map((v) => (
                    <option key={v.version} value={v.version}>
                      {v.nombre}
                      {v.version === activa ? " (la que rige)" : ""}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend className={ETIQUETA}>Perfiles</legend>
            <div className="flex flex-wrap gap-2">
              {RUBROS.map((r) => (
                <label key={r} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800">
                  <input type="checkbox" checked={rubros.includes(r)} onChange={() => alternarRubro(r)} className="h-4 w-4" />
                  {nombres[r] ?? r}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className={ETIQUETA}>Modelo de IA</span>
            <select className={CAMPO} value={modelo} onChange={(e) => setModelo(e.target.value)}>
              <option value="">El del servidor ({resumen.modeloServidor})</option>
              {(modelos?.modelos ?? []).filter((m) => m !== resumen.modeloServidor).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={ETIQUETA}>Tono (opcional)</span>
            <textarea className={AREA} rows={2} value={tono} onChange={(e) => setTono(e.target.value)} maxLength={1500} placeholder="Por ejemplo: mensajes más cortos, cálidos, una pregunta por vez." />
          </label>
          <label className="block">
            <span className={ETIQUETA}>Reglas propias (opcional)</span>
            <textarea className={AREA} rows={3} value={reglas} onChange={(e) => setReglas(e.target.value)} maxLength={4000} />
            <span className={AYUDA}>Se suman al guion. Las reglas fijas del sistema (crisis, enojo, amenazas, precios, contestadores, tope por persona, control y cierre) siguen mandando.</span>
          </label>
          {rolesPosibles.length > 0 && (
            <fieldset>
              <legend className={ETIQUETA}>Roles que se suman (se copian; hasta 5)</legend>
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                {rolesPosibles.map((r) => (
                  <label key={r.id} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-800">
                    <input type="checkbox" className="h-4 w-4" checked={roles.includes(r.id)} disabled={!roles.includes(r.id) && roles.length >= 5} onChange={() => setRoles((x) => (x.includes(r.id) ? x.filter((y) => y !== r.id) : [...x, r.id]))} />
                    {r.nombre}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset className="space-y-3">
            <legend className={ETIQUETA}>Fichas de conocimiento nuevas</legend>
            {fichas.map((f, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="block">
                    <span className={ETIQUETA}>Tipo</span>
                    <select className={CAMPO} value={f.capa} onChange={(e) => setFichas((l) => l.map((x, j) => (j === i ? { ...x, capa: e.target.value as FichaForm["capa"] } : x)))}>
                      <option value="objecion">Objeción</option>
                      <option value="tema">Tema</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={ETIQUETA}>Perfil</span>
                    <select className={CAMPO} value={f.rubro} onChange={(e) => setFichas((l) => l.map((x, j) => (j === i ? { ...x, rubro: e.target.value as FichaForm["rubro"] } : x)))}>
                      <option value="comun">Común a los perfiles de la versión</option>
                      {rubros.map((r) => (
                        <option key={r} value={r}>
                          {nombres[r] ?? r}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={ETIQUETA}>Título</span>
                    <input className={CAMPO} value={f.titulo} maxLength={160} onChange={(e) => setFichas((l) => l.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))} />
                  </label>
                </div>
                <label className="block">
                  <span className={ETIQUETA}>Cuándo se usa (frases separadas por coma)</span>
                  <input className={CAMPO} value={f.disparadores} onChange={(e) => setFichas((l) => l.map((x, j) => (j === i ? { ...x, disparadores: e.target.value } : x)))} placeholder="cuánto sale, precio, cobran*" />
                </label>
                <label className="block">
                  <span className={ETIQUETA}>Texto que lee el bot</span>
                  <textarea className={AREA} rows={3} value={f.contenido} maxLength={4000} onChange={(e) => setFichas((l) => l.map((x, j) => (j === i ? { ...x, contenido: e.target.value } : x)))} />
                </label>
                <button type="button" className={BTN} onClick={() => setFichas((l) => l.filter((_, j) => j !== i))}>
                  Quitar esta ficha
                </button>
              </div>
            ))}
            <button type="button" className={BTN} onClick={() => setFichas((l) => [...l, { capa: "objecion", rubro: "comun", titulo: "", disparadores: "", contenido: "" }])} disabled={fichas.length >= 30}>
              Sumar una ficha
            </button>
          </fieldset>
          <label className="block">
            <span className={ETIQUETA}>Para qué es (opcional)</span>
            <textarea className={AREA} rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={900} />
          </label>
          <Mensajes ok={null} error={error} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={BTN_PRINCIPAL} disabled={ocupado || !nombre.trim() || !rubros.length}>
              {ocupado ? "Creando…" : "Crear como borrador"}
            </button>
            <button type="button" className={BTN} onClick={() => setAbierto(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
