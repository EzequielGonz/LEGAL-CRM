"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { abrirAsistente } from "@/components/asistente/asistente-panel";
import { AYUDA, BTN, BTN_PRINCIPAL, SUBTITULO, fecha } from "./comun";
import type { PropsPestana } from "./laboratorio-bot";

// El asistente de siempre, del perfil elegido; se monta solo al pedirlo.
const AsistentePanel = dynamic(() => import("@/components/asistente/asistente-panel").then((m) => m.AsistentePanel), { ssr: false });

const PEDIDOS = [
  "Leé la comparativa de versiones y decime qué conviene probar.",
  "Proponé una versión nueva con un tono más breve y cálido, sin cambiar las reglas.",
  "¿Qué rol sumarías para la campaña con peores resultados?",
  "Armá una ficha nueva para la objeción más frecuente de las últimas dos semanas.",
];

/** Pestaña «Asistente»: abre el asistente del perfil con el contexto de los bots ya escrito (la persona lo revisa y lo manda). */
export function PestanaAsistente({ sel, nombres, resumen }: PropsPestana) {
  const [montado, setMontado] = useState(false);
  const [pendiente, setPendiente] = useState<string | null>(null);

  useEffect(() => {
    if (!montado || pendiente == null) return;
    // Se espera a que el panel esté escuchando antes de abrirlo.
    const t = window.setTimeout(() => {
      abrirAsistente(pendiente);
      setPendiente(null);
    }, 150);
    return () => window.clearTimeout(t);
  }, [montado, pendiente]);

  if (sel === "todos") {
    return <p className="text-sm text-slate-700">El asistente trabaja con un perfil por vez: elegí uno arriba.</p>;
  }

  const asig = resumen.asignaciones.find((a) => a.rubro === sel);
  const pruebas = resumen.pruebas.filter((p) => p.rubro === sel && p.vigente);
  const delLab = resumen.versiones.filter((v) => v.laboratorio && v.rubros.includes(sel) && v.estado !== "archivada");
  const contexto = [
    `Contexto del laboratorio del bot de ${nombres[sel] ?? sel}:`,
    `- Rige v${asig?.version ?? 2}${asig?.comparar_con ? ` repartida con v${asig.comparar_con}` : ""}; modelo del servidor ${resumen.modeloServidor}.`,
    delLab.length ? `- Versiones del laboratorio: ${delLab.map((v) => `${v.nombre} (${v.estado.replace("_", " ")}${v.modelo ? `, ${v.modelo}` : ""})`).join("; ")}.` : "- Sin versiones del laboratorio todavía.",
    pruebas.length ? `- Pruebas A/B en curso: ${pruebas.map((p) => `${p.campana}: v${p.version} al ${p.porcentaje} % hasta el ${fecha(p.fin)}`).join("; ")}.` : "- Sin pruebas A/B en curso.",
    "Recordá: nada de lo que rige cambia sin que yo lo confirme; lo nuevo se crea aparte (versión nueva, rol nuevo o ficha nueva) como propuesta.",
    "",
    "Mi pedido: ",
  ].join("\n");

  function abrir(pedido = "") {
    setPendiente(`${contexto}${pedido}`);
    setMontado(true);
  }

  return (
    <div className="space-y-4">
      <section aria-labelledby="lab-asistente">
        <h4 id="lab-asistente" className={SUBTITULO}>Pedile consejos al asistente</h4>
        <p className="mt-1 text-sm text-slate-700">
          Se abre el asistente de {nombres[sel] ?? sel} con el estado de sus bots ya escrito. Lo que proponga vuelve como propuesta con «Confirmar»: no se ejecuta nada sin tu clic.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={BTN_PRINCIPAL} onClick={() => abrir()}>
            Abrir el asistente con contexto de bots
          </button>
        </div>
        <p className={`${AYUDA} mt-3`}>Pedidos rápidos:</p>
        <ul className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {PEDIDOS.map((p) => (
            <li key={p}>
              <button type="button" className={`${BTN} text-left`} onClick={() => abrir(p)}>
                {p}
              </button>
            </li>
          ))}
        </ul>
      </section>
      {montado && <AsistentePanel key={sel} slug={sel} />}
    </div>
  );
}
