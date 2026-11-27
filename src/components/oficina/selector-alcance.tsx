"use client";

import { TODOS_LOS_RUBROS, type ModoAlcance, type Slug } from "@/lib/alcance";
import { NOMBRE_RUBRO, OPCIONES_DESTINO, alcanceDeSelector, explicarAlcance, type OpcionDestino } from "@/lib/oficina/alcance-ui";

/**
 * Selector de alcance dentro del formulario «Nueva tarea» de la Oficina
 * (27/11). Mismo estilo del formulario (cz-form): un desplegable y, si se
 * eligen varios rubros, las casillas y si van juntos o por separado.
 */
export interface EstadoSelector {
  opcion: OpcionDestino;
  marcados: Slug[];
  modo: ModoAlcance;
}

export const SELECTOR_INICIAL: EstadoSelector = { opcion: "juridico", marcados: [], modo: "separados" };

export function SelectorAlcance({ valor, alCambiar }: { valor: EstadoSelector; alCambiar: (v: EstadoSelector) => void }) {
  const alcance = alcanceDeSelector(valor.opcion, valor.marcados, valor.modo);
  const marcar = (s: Slug, si: boolean) => alCambiar({ ...valor, marcados: si ? [...valor.marcados, s] : valor.marcados.filter((x) => x !== s) });
  return (
    <fieldset className="of3-alcance">
      <label>
        Para
        <select value={valor.opcion} onChange={(e) => alCambiar({ ...valor, opcion: e.target.value as OpcionDestino })} aria-describedby="oficina-alcance-ayuda">
          {OPCIONES_DESTINO.map((g) => (
            <optgroup key={g.grupo} label={g.grupo}>
              {g.opciones.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      {valor.opcion === "varios" && (
        <div className="of3-alcance-varios">
          <div role="group" aria-label="Rubros">
            {TODOS_LOS_RUBROS.map((s) => (
              <label key={s} className="check">
                <input type="checkbox" checked={valor.marcados.includes(s)} onChange={(e) => marcar(s, e.target.checked)} />
                {NOMBRE_RUBRO[s]}
              </label>
            ))}
          </div>
          <div role="radiogroup" aria-label="Cómo se trabajan">
            <label className="check">
              <input type="radio" name="oficina-modo" checked={valor.modo === "juntos"} onChange={() => alCambiar({ ...valor, modo: "juntos" })} />
              Juntos (un solo resultado)
            </label>
            <label className="check">
              <input type="radio" name="oficina-modo" checked={valor.modo === "separados"} onChange={() => alCambiar({ ...valor, modo: "separados" })} />
              Por separado (una tarea por rubro)
            </label>
          </div>
        </div>
      )}
      <small id="oficina-alcance-ayuda" className={alcance ? "cz-muted" : "cz-err"}>
        {explicarAlcance(alcance)}
      </small>
    </fieldset>
  );
}
