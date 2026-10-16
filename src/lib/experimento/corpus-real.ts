/**
 * Corpus del candidato C a partir de conversaciones reales (16/10).
 * Autorizado por la responsable para entrenar (no para contactar). Se
 * conservan los nombres, como se pidió, y se quitan teléfonos, documentos y
 * correos, que no aportan al aprendizaje. Puro y probado.
 *
 *  - Un ejemplo por respuesta del asesor que sigue a un mensaje del
 *    prospecto, con la historia hasta ese punto.
 *  - Solo respuestas que pasan el validador de salida.
 *  - Familia = conversación: todos sus ejemplos quedan del mismo lado
 *    (entrenamiento / validación / reservado).
 */
import { anonimizar, particionPara, type Particion } from "@/lib/agentes/corpus";
import { validarTextoSalida } from "@/lib/agentes/contrato";

export interface MensajeReal {
  direction: "entrante" | "saliente" | string;
  body: string | null;
  sender_type?: string | null;
}

export interface CasoReal {
  clave: string;
  familia: string;
  particion: Particion;
  mensajes: { rol: "prospecto" | "asesor"; texto: string }[];
  respuesta_correcta: string;
}

function limpiar(t: string): string {
  return anonimizar(t.replace(/\s+\n/g, "\n").trim());
}

export function casosDesdeConversacion(input: { conversationId: string; rubro: string; mensajes: MensajeReal[]; maxEjemplos?: number }): CasoReal[] {
  // Agrupa mensajes consecutivos de la misma parte.
  const turnos: { rol: "prospecto" | "asesor"; texto: string }[] = [];
  for (const m of input.mensajes) {
    if (!m.body || !m.body.trim()) continue;
    const rol = m.direction === "entrante" ? "prospecto" : "asesor";
    const last = turnos[turnos.length - 1];
    if (last && last.rol === rol) last.texto += `\n${m.body.trim()}`;
    else turnos.push({ rol, texto: m.body.trim() });
  }
  const familia = `real-${input.conversationId}`;
  const particion = particionPara(familia, input.rubro);
  const casos: CasoReal[] = [];
  for (let i = 1; i < turnos.length; i++) {
    const t = turnos[i];
    if (t.rol !== "asesor" || turnos[i - 1].rol !== "prospecto") continue;
    const respuesta = limpiar(t.texto);
    if (!validarTextoSalida(respuesta).ok) continue;
    casos.push({
      clave: `real-${input.conversationId.slice(0, 8)}-${i}`,
      familia,
      particion,
      mensajes: turnos.slice(0, i).map((x) => ({ rol: x.rol, texto: limpiar(x.texto) })),
      respuesta_correcta: respuesta,
    });
    if (casos.length >= (input.maxEjemplos ?? 12)) break;
  }
  return casos;
}

/** Vertex recomienda al menos 100 ejemplos para un ajuste útil. */
export const EJEMPLOS_RECOMENDADOS = 100;
