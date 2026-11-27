"use client";

import type { Sugerencia } from "@/lib/jarvis/pantallas";
import { Icono } from "@/components/ui/icono-seccion";

type NombreIcono = Parameters<typeof Icono>[0]["nombre"];

/** Ícono de cada acción según lo que hace (sin depender del orden). */
export function iconoDeAccion(etiqueta: string): NombreIcono {
  const e = etiqueta.toLowerCase();
  if (/cerebro/.test(e)) return "cerebro";
  if (/oficina|claude/.test(e)) return "agentes";
  if (/cita/.test(e)) return "agenda";
  if (/etapa|retomar|enfriaron|seguimiento/.test(e)) return "seguimiento";
  if (/derivar|captad/.test(e)) return "captacion";
  if (/responder|borrador|persona|chat/.test(e)) return "inbox";
  if (/base/.test(e)) return "bases";
  if (/campa|lanzar|pausar|límite|limite/.test(e)) return "campanas";
  if (/línea|linea|falla/.test(e)) return "salud";
  if (/bot|rol|informe/.test(e)) return "agentes";
  if (/posteo|program|publica/.test(e)) return "redes";
  if (/resum|decid/.test(e)) return "estadisticas";
  return "flecha";
}

/**
 * Botones neumórficos de Jarvis (vuelta 6, marca 3 del dueño en el video): sobre una placa clara, botones
 * que «salen de la pantalla» con doble sombra suave (luz arriba a la izquierda, sombra abajo a la derecha),
 * ícono en un círculo de color y, al apretar, se hunden. Cada uno manda un pedido a Jarvis, que vuelve
 * con la tarjeta «¿Lo hago?».
 */
export function BotonesNeumorficos({ acciones, deshabilitado, alElegir }: { acciones: Sugerencia[]; deshabilitado?: boolean; alElegir: (a: Sugerencia) => void }) {
  return (
    <div className="jv-neu-placa">
      <ul className="jv-neu-grilla">
        {acciones.map((a, i) => (
          <li key={a.etiqueta} style={{ ["--i" as string]: i }}>
            <button type="button" className="jv-neu" disabled={deshabilitado} onClick={() => alElegir(a)}>
              <span className={`jv-neu-icono jv-neu-c${i % 5}`} aria-hidden="true">
                <Icono nombre={iconoDeAccion(a.etiqueta)} className="h-4 w-4" />
              </span>
              <span className="jv-neu-texto">{a.etiqueta}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
