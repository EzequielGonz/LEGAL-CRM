/**
 * Caídos automáticos (13/11). Decisión de la responsable, textual: «que pasen
 * 3 días y otro mensaje, si no responde en 24 hs, a caídos». Y sobre lo viejo:
 * «en recuperar hay contactos de hace 15 días, eso ya está, se va a caídos».
 *
 * Una persona cae cuando dejó de contestar y el circuito se terminó:
 *  - recibió el mensaje de seguimiento y pasaron 24 horas sin respuesta;
 *  - o nunca llegó a recibirlo y ya pasaron 96 horas (72 + 24) desde nuestro
 *    último mensaje: lo viejo va directo, sin otro mensaje;
 *  - o el seguimiento estaba programado y no pudo salir en 7 días (pausa,
 *    línea caída, sin franja): cae igual y queda anotado como falla.
 *
 * Nunca cae sola: quien no respondió nunca (tiene su propia regla), un
 * captado, un perdido, alguien detenido, quien espera a una persona del
 * equipo, ni un chat donde la última palabra es de la persona (ahí quien
 * debe una respuesta somos nosotros).
 *
 * Función pura: la usan el motor, la limpieza y las pruebas.
 */

const HORA = 3_600_000;

/** Espera después del mensaje de seguimiento. */
export const ESPERA_RESPUESTA_HORAS = 24;
/** Sin mensaje de seguimiento: 72 horas del plazo más las 24 de espera. */
export const SILENCIO_SIN_SEGUIMIENTO_HORAS = 96;
/** Un seguimiento programado que no pudo salir en este plazo se da por caído. */
export const TOPE_SIN_ENVIAR_DIAS = 7;

export type ReglaCaida = "sin_respuesta_al_seguimiento" | "dejo_de_responder" | "no_se_pudo_enviar";

export interface DatosCaida {
  ahora: Date;
  /** contact_state de la oportunidad. */
  contacto: string;
  /** capture_state de la oportunidad. */
  captacion: string;
  /** attention_state de la oportunidad. */
  atencion: string;
  /** followup_state de la oportunidad. */
  seguimiento: string;
  /** De quién es el último mensaje del chat. */
  ultimaPalabra: "persona" | "nosotros" | null;
  ultimoEntranteAt: Date | null;
  ultimoSalienteAt: Date | null;
  /** Detención vigente o clasificada como detención. */
  detenido: boolean;
  /** Seguimiento programado que todavía no salió. */
  tareaAbierta: { estado: string; baseAt: Date } | null;
  /** Último mensaje de seguimiento que salió (o que pudo haber salido). */
  seguimientoEnviadoAt: Date | null;
}

export type DecisionCaida = { caer: false; motivo: string } | { caer: true; regla: ReglaCaida; motivo: string };

export const MOTIVO_CAIDA: Record<ReglaCaida, string> = {
  sin_respuesta_al_seguimiento: "No respondió al seguimiento",
  dejo_de_responder: "Dejó de responder",
  no_se_pudo_enviar: "No se pudo enviar el seguimiento",
};

const no = (motivo: string): DecisionCaida => ({ caer: false, motivo });
const si = (regla: ReglaCaida): DecisionCaida => ({ caer: true, regla, motivo: MOTIVO_CAIDA[regla] });

export function decidirCaida(d: DatosCaida): DecisionCaida {
  if (d.contacto !== "respondio" || !d.ultimoEntranteAt) return no("Nunca respondió: tiene su propia regla");
  if (d.captacion === "captado") return no("Captado: no cae solo");
  if (d.captacion === "perdido") return no("Ya está perdido");
  if (d.detenido) return no("Detenido: ya está en No contactar");
  if (d.seguimiento === "caido" || d.seguimiento === "completado") return no("Ya cayó");
  if (d.atencion === "requiere_humano") return no("Espera a una persona del equipo: no es silencio de la persona");
  if (d.ultimaPalabra !== "nosotros" || !d.ultimoSalienteAt) return no("La última palabra es de la persona: le debemos una respuesta");

  const t = d.ahora.getTime();
  const respondioDespuesDe = (momento: Date) => d.ultimoEntranteAt!.getTime() > momento.getTime();

  if (d.seguimientoEnviadoAt && !respondioDespuesDe(d.seguimientoEnviadoAt)) {
    return t >= d.seguimientoEnviadoAt.getTime() + ESPERA_RESPUESTA_HORAS * HORA ? si("sin_respuesta_al_seguimiento") : no("Esperando respuesta al seguimiento");
  }
  if (d.tareaAbierta) {
    if (d.tareaAbierta.estado === "enviando") return no("El seguimiento está saliendo");
    return t >= d.tareaAbierta.baseAt.getTime() + TOPE_SIN_ENVIAR_DIAS * 24 * HORA ? si("no_se_pudo_enviar") : no("Seguimiento programado");
  }
  return t >= d.ultimoSalienteAt.getTime() + SILENCIO_SIN_SEGUIMIENTO_HORAS * HORA ? si("dejo_de_responder") : no("Todavía dentro del plazo del seguimiento");
}
