"use client";

import { useEffect, useId, useState } from "react";
import { BTN, BTN_PRINCIPAL, pedir } from "./comun";
import { graficoVersiones, modeloEnPalabras, resumenPrueba, type CifrasVersion, type ResumenPrueba } from "@/lib/laboratorio/simple";

/**
 * Piezas chicas del laboratorio simple (15/11): confirmación en línea,
 * gráfico de versiones, resultado de una prueba simulada y selector de
 * modelo con nombres amigables.
 */

/**
 * Botón con confirmación en el lugar: el primer toque muestra el aviso y
 * «Sí, confirmar» / «Cancelar». Nada se hace sin el segundo toque.
 */
export function Confirmar({
  etiqueta,
  aviso,
  confirmar = "Sí, confirmar",
  peligro = false,
  deshabilitado = false,
  alConfirmar,
}: {
  etiqueta: string;
  aviso: React.ReactNode;
  confirmar?: string;
  peligro?: boolean;
  deshabilitado?: boolean;
  alConfirmar: () => Promise<void> | void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const id = useId();
  if (!abierto) {
    return (
      <button type="button" className={peligro ? BTN : BTN_PRINCIPAL} disabled={deshabilitado} onClick={() => setAbierto(true)} aria-expanded={false} aria-controls={id}>
        {etiqueta}
      </button>
    );
  }
  return (
    <div id={id} role="group" aria-label={`Confirmar: ${etiqueta}`} className="w-full rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <div>{aviso}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className={BTN_PRINCIPAL}
          disabled={ocupado}
          autoFocus
          onClick={async () => {
            setOcupado(true);
            try {
              await alConfirmar();
            } finally {
              setOcupado(false);
              setAbierto(false);
            }
          }}
        >
          {ocupado ? "Haciendo…" : confirmar}
        </button>
        <button type="button" className={BTN} disabled={ocupado} onClick={() => setAbierto(false)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

/** Gráfico «Cómo viene cada versión»: tres cifras, una barra por versión con el número escrito. */
export function GraficoVersiones({ cifras, vigente, nombres }: { cifras: CifrasVersion[] | null; vigente: number; nombres: Record<number, string> }) {
  if (!cifras) return <p role="status" className="text-sm text-slate-600">Cargando las cifras…</p>;
  const g = graficoVersiones(cifras, vigente, nombres);
  if (!g.hayDatos) return <p className="text-sm text-slate-700">Todavía no hay charlas de este perfil en los últimos 30 días.</p>;
  return (
    <div className="space-y-4">
      {!g.alcanza && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Todavía hay pocas charlas para comparar: las cifras sirven de guía, no para decidir.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {g.metricas.map((m) => (
          <figure key={m.clave} className="rounded-xl border border-slate-200 bg-white p-4">
            <figcaption>
              <span className="block text-sm font-semibold text-slate-900">{m.titulo}</span>
              <span className="block text-xs text-slate-600">{m.ayuda}</span>
            </figcaption>
            <ul className="mt-3 space-y-3">
              {m.barras.map((b) => (
                <li key={b.version}>
                  <div className="flex items-baseline justify-between gap-2 text-xs text-slate-700">
                    <span className="min-w-0 truncate">{b.etiqueta}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                      {b.valor.toLocaleString("es-AR")} de cada 100
                    </span>
                  </div>
                  <div aria-hidden="true" className="mt-1 h-3 rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${b.rige ? "bg-slate-700" : "bg-amber-500"}`} style={{ width: `${Math.max(b.valor > 0 ? 2 : 0, b.valor)}%` }} />
                  </div>
                  <span className="sr-only">{`, sobre ${b.conversaciones} charlas`}</span>
                </li>
              ))}
            </ul>
          </figure>
        ))}
      </div>
      <p className="text-xs text-slate-600">
        Barra oscura: la versión que rige ahora. Barra clara: versiones nuevas. Últimos 30 días.
      </p>
    </div>
  );
}

/** Corre una prueba simulada y muestra el resumen cuando termina (consulta cada 5 s). */
export function useSimulacion() {
  const [id, setId] = useState<string | null>(null);
  const [estado, setEstado] = useState<"nada" | "corriendo" | "listo" | "error">("nada");
  const [resumen, setResumen] = useState<ResumenPrueba | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || estado !== "corriendo") return;
    let vivo = true;
    const t = window.setInterval(async () => {
      try {
        const r = await pedir<any>(`vista=simulacion&id=${id}`);
        if (!vivo) return;
        const s = r.simulacion;
        if (s.estado === "procesando") return;
        if (s.estado === "error") {
          setError(s.error ?? "La prueba no se pudo completar.");
          setEstado("error");
        } else {
          setResumen(resumenPrueba(s.resultado?.resultados ?? []));
          setEstado("listo");
        }
      } catch (e) {
        if (vivo) {
          setError((e as Error).message);
          setEstado("error");
        }
      }
    }, 5000);
    return () => {
      vivo = false;
      window.clearInterval(t);
    };
  }, [id, estado]);

  async function correr(cuerpo: Record<string, unknown>) {
    setResumen(null);
    setError(null);
    try {
      const r = await pedir<{ id: string }>({ accion: "simular", ...cuerpo });
      setId(r.id);
      setEstado("corriendo");
    } catch (e) {
      setError((e as Error).message);
      setEstado("error");
    }
  }
  return { estado, resumen, error, correr };
}

export function ResultadoPrueba({ estado, resumen, error }: { estado: string; resumen: ResumenPrueba | null; error: string | null }) {
  if (estado === "nada") return null;
  return (
    <div role="status" aria-live="polite" className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800">
      {estado === "corriendo" && <p>Probando con charlas inventadas (no le escribe a nadie). Tarda unos minutos…</p>}
      {estado === "error" && <p className="text-amber-900">{error}</p>}
      {estado === "listo" && resumen && (
        <>
          <p className="font-semibold text-slate-900">{resumen.frase}</p>
          <ul className="mt-2 space-y-2">
            {resumen.ejemplos.map((e, i) => (
              <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-xs font-semibold text-slate-700">
                  {e.bien ? "✓ Bien" : "! Para mirar"} · {e.titulo}
                </p>
                {e.pregunta && <p className="mt-1">Persona: «{e.pregunta}»</p>}
                {e.respuesta && <p className="mt-1">Bot: «{e.respuesta}»</p>}
                {!e.bien && e.nota && <p className="mt-1 text-xs text-slate-600">{e.nota}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Lista de modelos con nombre amigable y una línea de ayuda. Vacío = el de siempre. */
export function SelectorModelo({ id, modelos, valor, alCambiar, vacio = "El de siempre" }: { id: string; modelos: string[]; valor: string; alCambiar: (v: string) => void; vacio?: string }) {
  const elegido = valor ? modeloEnPalabras(valor) : null;
  return (
    <>
      <select id={id} className="min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 text-sm text-slate-900" value={valor} onChange={(e) => alCambiar(e.target.value)}>
        <option value="">{vacio}</option>
        {modelos.map((m) => (
          <option key={m} value={m}>
            {modeloEnPalabras(m).nombre}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-slate-600">{elegido ? elegido.linea : "Sigue con el modelo que usa hoy el bot."}</p>
    </>
  );
}
