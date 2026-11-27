import Link from "next/link";
import { ETAPAS, ORDENES_CONTACTOS, enlaceContactos, filtrosActivos, type FiltrosContactos } from "@/lib/contactos/consulta";
import { FUENTES, FUENTE_LABEL } from "@/lib/fuente";
import { ORDENES } from "@/lib/indicadores";

/** Buscador y filtros (formulario GET: funciona sin JavaScript y conserva todo en la dirección). */
export function FiltrosContactos({ slug, f, areas, base = "/contactos" }: { slug: string; f: FiltrosContactos; areas: string[]; base?: string }) {
  const n = filtrosActivos(f);
  return (
    <form method="get" action={base} role="search" aria-label="Buscar y filtrar contactos" className="ct-filtros">
      <input type="hidden" name="perfil" value={slug} />
      {f.etapa ? <input type="hidden" name="etapa" value={f.etapa} /> : null}
      <div className="ct-busca">
        <label htmlFor="ct-q" className="ct-solo-lector">Buscar por nombre o teléfono</label>
        <input id="ct-q" name="q" type="search" defaultValue={f.q} placeholder="Buscar por nombre o teléfono" autoComplete="off" className="ct-input ct-input--busca" />
        <button type="submit" className="pm-boton pm-boton--primario">Buscar</button>
      </div>
      <div className="ct-fila-filtros">
        <div className="ct-campo">
          <label htmlFor="ct-origen">Origen</label>
          <select id="ct-origen" name="origen" defaultValue={f.origen ?? ""} className="ct-input">
            <option value="">Todos</option>
            {FUENTES.map((x) => (<option key={x} value={x}>{FUENTE_LABEL[x]}</option>))}
          </select>
        </div>
        {areas.length > 1 ? (
          <div className="ct-campo">
            <label htmlFor="ct-area">Área</label>
            <select id="ct-area" name="area" defaultValue={f.area ?? ""} className="ct-input">
              <option value="">Todas</option>
              {areas.map((a) => (<option key={a} value={a}>{a === "penal" ? "Penal" : a === "civil" ? "Civil" : a}</option>))}
            </select>
          </div>
        ) : null}
        <div className="ct-campo">
          <label htmlFor="ct-fecha">Fecha por</label>
          <select id="ct-fecha" name="fecha" defaultValue={f.campoFecha} className="ct-input">
            <option value="actividad">Última actividad</option>
            <option value="alta">Fecha de alta</option>
          </select>
        </div>
        <div className="ct-campo">
          <label htmlFor="ct-desde">Desde</label>
          <input id="ct-desde" name="desde" type="date" defaultValue={f.desde ?? ""} className="ct-input" />
        </div>
        <div className="ct-campo">
          <label htmlFor="ct-hasta">Hasta</label>
          <input id="ct-hasta" name="hasta" type="date" defaultValue={f.hasta ?? ""} className="ct-input" />
        </div>
        <div className="ct-campo">
          <label htmlFor="ct-orden">Orden</label>
          <select id="ct-orden" name="orden" defaultValue={f.orden} className="ct-input">
            {ORDENES_CONTACTOS.map((o) => (<option key={o} value={o}>{ORDENES[o].label}</option>))}
          </select>
        </div>
        <button type="submit" className="pm-boton pm-boton--secundario">Aplicar</button>
        {n > 0 ? (
          <Link prefetch={false} href={`${base}?perfil=${slug}`} className="ct-link">Quitar los {n} filtros</Link>
        ) : null}
      </div>
      {f.etapa ? (
        <p className="ct-activos">
          Etapa: <strong>{ETAPAS.find((e) => e.clave === f.etapa)?.rotulo}</strong>{" "}
          <Link prefetch={false} className="ct-link" href={enlaceContactos(base, slug, f, { etapa: undefined })}>quitar</Link>
        </p>
      ) : null}
    </form>
  );
}
