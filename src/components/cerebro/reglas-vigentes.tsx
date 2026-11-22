"use client";

import { useState } from "react";
import { MAX_PEDIDO, pareceDatoPersonal } from "@/lib/bandeja-claude";
import { REGLAS_VIGENTES, pedidoCambioRegla } from "@/lib/cerebro/recomendaciones";

const PERFILES = [
  { slug: "juridico", nombre: "VITA (Jurídico)" },
  { slug: "marketing", nombre: "Kocos Marketing" },
  { slug: "coberturas_medicas", nombre: "Coberturas médicas" },
  { slug: "agencia_0km", nombre: "Autos 0 km" },
] as const;

/**
 * «Reglas vigentes»: lista corta de las reglas del dueño. «Proponer cambio» arma una propuesta en la
 * Bandeja para Claude (misma ruta que «Entrenar al cerebro»), con confirmación antes de enviar.
 * No cambia ninguna regla por sí sola.
 */
export function ReglasVigentesCerebro() {
  const [abierta, setAbierta] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [perfil, setPerfil] = useState<string>("juridico");
  const [confirmar, setConfirmar] = useState(false);
  const [estado, setEstado] = useState<"listo" | "enviando" | "ok" | "error">("listo");
  const [mensaje, setMensaje] = useState("");

  const regla = REGLAS_VIGENTES.find((r) => r.clave === abierta);

  function cerrar() {
    setAbierta(null);
    setTexto("");
    setConfirmar(false);
  }

  function revisar(e: React.FormEvent) {
    e.preventDefault();
    if (!regla) return;
    if (!texto.trim()) {
      setEstado("error");
      setMensaje("Escribí qué cambio querés.");
      return;
    }
    if (pareceDatoPersonal(texto)) {
      setEstado("error");
      setMensaje("Sacá teléfonos, documentos o correos: el cerebro no guarda datos de personas.");
      return;
    }
    if (pedidoCambioRegla(regla.texto, texto).length > MAX_PEDIDO) {
      setEstado("error");
      setMensaje("Quedó muy largo: acortalo un poco.");
      return;
    }
    setEstado("listo");
    setMensaje("");
    setConfirmar(true);
  }

  async function enviar() {
    if (!regla) return;
    setEstado("enviando");
    try {
      const r = await fetch("/api/bandeja-claude", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ perfil, pedido: pedidoCambioRegla(regla.texto, texto) }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "No se pudo guardar la propuesta.");
      setEstado("ok");
      setMensaje("Listo: quedó como propuesta en la Bandeja para Claude. La regla no cambia hasta que la confirmes.");
      cerrar();
    } catch (err) {
      setEstado("error");
      setMensaje(err instanceof Error ? err.message : "No se pudo guardar la propuesta.");
      setConfirmar(false);
    }
  }

  return (
    <div className="cz-reglas">
      <ul className="cz-list">
        {REGLAS_VIGENTES.map((r) => (
          <li key={r.clave} className="cz-regla">
            <span>{r.texto}</span>
            <button type="button" className="cz-btn sec chico" aria-expanded={abierta === r.clave} onClick={() => (abierta === r.clave ? cerrar() : (setAbierta(r.clave), setConfirmar(false), setEstado("listo"), setMensaje("")))}>
              Proponer cambio
            </button>
          </li>
        ))}
      </ul>
      {regla ? (
        <form onSubmit={revisar} className="cz-form" aria-label={`Proponer un cambio a la regla: ${regla.texto}`}>
          <p className="cz-muted">Regla: {regla.texto}</p>
          <label>
            Qué cambio querés
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} maxLength={600} placeholder="Ej.: que la excepción X también se permita." />
          </label>
          <label>
            Perfil donde se anota
            <select value={perfil} onChange={(e) => setPerfil(e.target.value)}>
              {PERFILES.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          {confirmar ? (
            <div className="cz-confirma" role="alertdialog" aria-label="Confirmar propuesta">
              <p>¿Dejar este cambio como propuesta en la Bandeja? No se aplica nada hasta que lo confirmes.</p>
              <div className="cz-confirma__botones">
                <button type="button" className="cz-btn" disabled={estado === "enviando"} onClick={enviar}>
                  {estado === "enviando" ? "Enviando…" : "Sí, dejar como propuesta"}
                </button>
                <button type="button" className="cz-btn sec" onClick={() => setConfirmar(false)}>
                  Seguir editando
                </button>
              </div>
            </div>
          ) : (
            <div className="cz-confirma__botones">
              <button type="submit" className="cz-btn">
                Revisar propuesta
              </button>
              <button type="button" className="cz-btn sec" onClick={cerrar}>
                Cancelar
              </button>
            </div>
          )}
        </form>
      ) : null}
      <p role="status" aria-live="polite" className={estado === "error" ? "cz-err" : "cz-ok"}>
        {estado === "ok" || estado === "error" ? mensaje : ""}
      </p>
    </div>
  );
}
