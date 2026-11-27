"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";
import { NOMBRE_RUBRO } from "@/lib/premium/rubros";
import { cifrasDelBot, type TasasBot } from "@/lib/laboratorio/vista-simple";
import { EJEMPLOS_POR_RUBRO, enlaceMejorarRol, revisarRol } from "@/lib/laboratorio/calidad-rol";

/**
 * Parte de arriba del Laboratorio (22/11): tablero por perfil, «probar en un toque» y checklist de calidad
 * de un rol con «Mejorar este rol» (abre Jarvis con el pedido escrito; Jarvis siempre pide confirmación).
 * Todo es lectura: no envía nada a prospectos ni cambia roles.
 */

interface PerfilStats { rubro: SlugPerfil; v1: TasasBot; v2: TasasBot; asignacion: { version: number; comparar_con: number | null } | null }
export interface RolTablero { id: string; rubro: SlugPerfil | null; nombre: string; objetivo: string; tono: string; instrucciones: string }

const COLOR: Record<SlugPerfil, string> = { juridico: "violeta", coberturas_medicas: "agua", agencia_0km: "amarillo", marketing: "rosa-claro" };

async function leer<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("no disponible");
  return (await r.json()) as T;
}

function fechaCorta(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export function TableroPerfiles({ nombres, roles, cargandoRoles }: { nombres: Record<string, string>; roles: RolTablero[]; cargandoRoles: boolean }) {
  const idT = useId();
  const [semana, setSemana] = useState<PerfilStats[] | null | "error">(null);
  const [ultimo, setUltimo] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let vivo = true;
    leer<{ perfiles: PerfilStats[] }>("/api/perfiles/conocimiento?dias=7")
      .then((j) => vivo && setSemana(j.perfiles ?? []))
      .catch(() => vivo && setSemana("error"));
    for (const p of SLUGS_PERFIL) {
      leer<{ eventos: { cuando: string }[] }>(`/api/laboratorio/historial?perfil=${p}`)
        .then((j) => {
          const t = (j.eventos ?? []).map((e) => e.cuando).sort().pop() ?? null;
          if (vivo) setUltimo((u) => ({ ...u, [p]: t }));
        })
        .catch(() => vivo && setUltimo((u) => ({ ...u, [p]: null })));
    }
    return () => { vivo = false; };
  }, []);

  return (
    <section aria-labelledby={idT} className="space-y-3">
      <h2 id={idT} className="text-xl font-semibold">Tablero de los bots</h2>
      <div className="lab-tablero">
        {SLUGS_PERFIL.map((p) => {
          const nombre = nombres[p] ?? NOMBRE_RUBRO[p];
          const s = Array.isArray(semana) ? semana.find((x) => x.rubro === p) : null;
          const version = s?.asignacion?.version ?? null;
          const hoy = s ? (version === 1 ? s.v1 : s.v2) : null;
          const c = hoy ? cifrasDelBot(hoy) : null;
          const rolesDe = roles.filter((r) => r.rubro === p);
          return (
            <article key={p} className={`vv-celda vv-celda--${COLOR[p]}`} aria-label={`Bot de ${nombre}`}>
              <span className="vv-celda__etiqueta">{nombre}</span>
              <div className="vv-celda__cuerpo">
                <span className="vv-num vv-num--m">{c ? c.atendidas : "—"}</span>
                <p className="vv-celda__texto">charlas atendidas esta semana</p>
                <dl className="lab-tablero-datos">
                  <div><dt>Bot activo</dt><dd>{version ? `Versión ${version}` : "—"}{!cargandoRoles ? ` · ${rolesDe.length} ${rolesDe.length === 1 ? "rol" : "roles"}` : ""}</dd></div>
                  <div><dt>Pasaron a una persona</dt><dd>{c && c.atendidas > 0 ? `${c.tasaDerivados} %` : "—"}</dd></div>
                  <div><dt>Último cambio</dt><dd>{fechaCorta(ultimo[p] ?? null)}</dd></div>
                </dl>
              </div>
            </article>
          );
        })}
      </div>
      {semana === "error" && <p className="lab-t2 text-sm">No pudimos leer las cifras de la semana ahora; mostramos «—».</p>}
    </section>
  );
}

export function PruebaEnUnToque({ perfil, nombre, alProbar }: { perfil: SlugPerfil; nombre: string; alProbar: (texto: string) => void }) {
  const idT = useId();
  return (
    <section aria-labelledby={idT} className="lab-tarjeta lab-entra">
      <h2 id={idT} className="text-xl font-semibold">Probar en un toque · {nombre}</h2>
      <p className="lab-t2 mt-1 max-w-2xl text-sm">Tocá un mensaje de ejemplo y se carga en el simulador de más abajo. Es una prueba: no se envía nada a nadie.</p>
      <div className="lab-chips mt-3">
        {EJEMPLOS_POR_RUBRO[perfil].map((t) => (
          <button key={t} type="button" className="lab-chip" onClick={() => alProbar(t)}>{t}</button>
        ))}
      </div>
    </section>
  );
}

export function CalidadDelRol({ perfil, nombre, roles }: { perfil: SlugPerfil; nombre: string; roles: RolTablero[] }) {
  const idT = useId();
  const idS = useId();
  const [rolId, setRolId] = useState("");
  const rol = roles.find((r) => r.id === rolId) ?? roles[0] ?? null;
  const rev = rol ? revisarRol(rol) : null;
  return (
    <section aria-labelledby={idT} className="lab-tarjeta lab-entra">
      <h2 id={idT} className="text-xl font-semibold">Calidad del rol · {nombre}</h2>
      {!rol || !rev ? (
        <p className="lab-sub mt-3 text-sm">Todavía no hay roles para {nombre}. Cuando crees uno, acá vas a ver qué le falta.</p>
      ) : (
        <>
          <div className="mt-3 max-w-md">
            <label htmlFor={idS} className="lab-etiqueta">Rol a revisar</label>
            <select id={idS} className="lab-select" value={rol.id} onChange={(e) => setRolId(e.target.value)}>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <p className="lab-t2 mt-3 text-sm" role="status">{rev.cumplidos} de {rev.total} puntos cubiertos.</p>
          <ul className="lab-lista mt-2">
            {rev.items.map((i) => (
              <li key={i.clave} className="lab-sub text-sm">
                <strong>{i.ok ? "Listo" : "Falta"} · {i.titulo}</strong>
                {!i.ok && <span className="lab-t2 block">{i.falta}</span>}
              </li>
            ))}
          </ul>
          <div className="lab-acciones mt-3">
            <Link href={enlaceMejorarRol(nombre, rol)} prefetch={false} className="lab-boton">Mejorar este rol con Jarvis</Link>
          </div>
          <p className="lab-ayuda">Se abre Jarvis con el pedido escrito. Propone; no cambia nada sin que lo confirmes.</p>
        </>
      )}
    </section>
  );
}
