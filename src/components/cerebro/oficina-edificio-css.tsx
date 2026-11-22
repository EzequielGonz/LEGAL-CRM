"use client";

/**
 * Plano liviano del edificio (22/11): el mismo edificio que la escena 3D, dibujado en SVG con una
 * leve inclinación CSS. Se usa en el celular, sin WebGL o mientras carga la escena 3D. Las salas
 * se tocan para entrar (el plano hace zoom a la sala); los agentes son puntos de color con su
 * cartel; los mensajeros son carpetas que corren por el pasillo hacia el Cerebro. Es aria-hidden:
 * la lista del panel es la fuente de verdad.
 */
import { memo, useMemo } from "react";
import type { Area } from "@/lib/oficina/reglas";
import { BANDEJA_CEREBRO, ENTRADA, LIMITES, SALAS, SALAS_ORDEN, asientosDeSala, murosDeSala, rutaAlCerebro, type Punto } from "@/lib/oficina/edificio";
import type { SalaVisual } from "@/lib/oficina/panel";
import { COLOR_ESTADO } from "@/lib/oficina/escena";

const PISO: Record<Area, string> = {
  direccion: "#2b2547",
  analisis: "#7a6a58",
  redes: "#7d4a44",
  diseno: "#6a5578",
  seo: "#4c6a5c",
  bots: "#455d7c",
  ingenieria: "#575d66",
  asistente: "#8a6844",
};

const VB = { w: 38.4, h: 32 };

function camino(pts: Punto[]): string {
  return pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
}

export const PlanoEdificio = memo(function PlanoEdificio({
  salas,
  sala,
  resaltada,
  puestoSel,
  hojas,
  animar,
  alElegirSala,
}: {
  salas: Record<Area, SalaVisual>;
  sala: Area | null;
  resaltada: Area | null;
  puestoSel: string | null;
  hojas: number;
  animar: boolean;
  alElegirSala: (a: Area | null) => void;
}) {
  const asientos = useMemo(() => {
    const m = {} as Record<Area, ReturnType<typeof asientosDeSala>>;
    for (const a of SALAS_ORDEN) m[a] = asientosDeSala(a, a === "direccion" ? 6 : 7);
    return m;
  }, []);
  const muros = useMemo(() => SALAS_ORDEN.flatMap((a) => murosDeSala(a).map((m) => ({ a, ...m }))), []);

  let transform = "scale(1) translate(0px, 0px)";
  if (sala) {
    const s = SALAS[sala];
    const k = Math.min(VB.w / (s.x1 - s.x0 + 3), VB.h / (s.z1 - s.z0 + 3.4));
    transform = `scale(${k.toFixed(3)}) translate(${(-s.cx).toFixed(2)}px, ${(-s.cz).toFixed(2)}px)`;
  }

  return (
    <div className="cz-ed-plano" aria-hidden="true">
      <svg viewBox={`${-VB.w / 2} ${-VB.h / 2} ${VB.w} ${VB.h}`} preserveAspectRatio="xMidYMid meet" onClick={() => alElegirSala(null)}>
        <g className="mundo" style={{ transform }}>
          <rect x={LIMITES.x0} y={LIMITES.z0} width={LIMITES.x1 - LIMITES.x0} height={LIMITES.z1 - LIMITES.z0} rx="1.2" fill="#2a2530" />
          <rect x={ENTRADA.x0} y={ENTRADA.z0} width={ENTRADA.x1 - ENTRADA.x0} height={ENTRADA.z1 - ENTRADA.z0} fill="#5b3f28" />
          <rect x={-1.4} y={ENTRADA.z0 + 2.9} width={2.8} height={1.5} rx="0.2" fill="#2f6b4a" stroke="#5a3a22" strokeWidth="0.2" />
          {SALAS_ORDEN.map((a) => {
            const s = SALAS[a];
            const v = salas[a];
            const activa = a === sala;
            const marcada = a === resaltada;
            return (
              <g
                key={a}
                className={`sala${activa ? " activa" : ""}${marcada ? " marcada" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  alElegirSala(a);
                }}
              >
                <rect x={s.x0} y={s.z0} width={s.x1 - s.x0} height={s.z1 - s.z0} fill={PISO[a]} />
                {asientos[a].slice(0, v.puestos.length).map((as, j) => {
                  const p = v.puestos[j];
                  if (!p) return null;
                  const sel = puestoSel === `${a}:${j}`;
                  return (
                    <g key={j}>
                      <rect x={as.mesa[0] - 0.8} y={as.mesa[1] - 0.4} width="1.6" height="0.8" rx="0.1" fill="#d9b27a" opacity="0.92" />
                      <rect x={as.mesa[0] - 0.3} y={as.mesa[1] - 0.25} width="0.6" height="0.22" rx="0.05" fill={p.estado === "trabajando" ? "#8fd8ff" : p.estado === "listo" ? "#79e2a9" : "#262837"} />
                      <circle cx={as.x} cy={as.z} r="0.46" fill={p.estado === "libre" || p.estado === "en_cola" ? "#6A6C7C" : p.color} stroke={sel ? "#F2C531" : "#0d0d12"} strokeWidth={sel ? 0.22 : 0.1} />
                      {p.estado === "trabajando" && animar && (
                        <circle cx={as.x} cy={as.z} r="0.46" fill="none" stroke={COLOR_ESTADO.trabajando} strokeWidth="0.1" className="pulso" />
                      )}
                      {activa && (
                        <text x={as.x} y={as.z + 1.15 + (as.col % 2) * 0.75} textAnchor="middle" className="nombre" fontSize={0.66} fontWeight={600}>
                          {p.nombre.length > 13 ? `${p.nombre.slice(0, 12)}…` : p.nombre}
                        </text>
                      )}
                    </g>
                  );
                })}
                {a === "direccion" && (
                  <g>
                    <circle cx={0} cy={-0.3} r="1.9" fill="#1a1630" stroke="#c9a45a" strokeWidth="0.15" />
                    <circle cx={0} cy={-0.3} r="0.8" fill="#f6d98a" className={animar ? "orbe" : ""} />
                    <rect x={BANDEJA_CEREBRO[0] - 1.3} y={BANDEJA_CEREBRO[1] - 0.45} width="2.6" height="0.9" rx="0.1" fill="#c9a45a" />
                    {Array.from({ length: Math.min(8, hojas) }).map((_, i) => (
                      <rect key={i} x={-0.5 + (i % 3) * 0.06} y={BANDEJA_CEREBRO[1] - 0.2 - i * 0.04} width="1" height="0.7" rx="0.04" fill="#f7f2e6" stroke="#b79b52" strokeWidth="0.04" />
                    ))}
                  </g>
                )}
                {!sala && (
                  <text x={s.cx} y={a === "direccion" ? s.cz + 3.7 : s.cz} textAnchor="middle" className="titulo" fontSize={1.15} fontWeight={700}>
                    {v.titulo}
                    <tspan x={s.cx} dy="1.35" className="sub" fontSize={0.95} fontWeight={500}>
                      {a === "direccion" ? (hojas ? `${hojas} para tu OK` : "Todo al día") : v.trabajando ? `${v.trabajando} trabajando` : "Libre"}
                    </tspan>
                  </text>
                )}
              </g>
            );
          })}
          {muros.map((m, i) => (
            <rect key={i} x={m.p[0] - m.s[0] / 2} y={m.p[2] - m.s[2] / 2} width={m.s[0]} height={m.s[2]} fill="#e6ddd0" pointerEvents="none" />
          ))}
          {/* flujo hacia el Cerebro */}
          {SALAS_ORDEN.filter((a) => salas[a].mensajeros.length).map((a, i) => {
            const j = salas[a].mensajeros[0];
            const as = asientos[a][j];
            if (!as) return null;
            const ruta = rutaAlCerebro(a, as);
            const d = camino(ruta);
            return (
              <g key={a} pointerEvents="none">
                <path d={d} className={animar ? "flujo anima" : "flujo"} />
                {animar && (
                  <g>
                    <rect x="-0.4" y="-0.3" width="0.8" height="0.6" rx="0.08" fill="#e8c46a" stroke="#0d0d12" strokeWidth="0.06" />
                    <animateMotion dur="9s" begin={`${(i * 1.7).toFixed(1)}s`} repeatCount="indefinite" path={d} keyPoints="0;1;1;0;0" keyTimes="0;0.4;0.5;0.9;1" calcMode="linear" />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
});
