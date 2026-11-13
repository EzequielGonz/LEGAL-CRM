/**
 * Puntaje de interés (13/11). Pedido de la responsable: «necesitamos detectar
 * las oportunidades reales y reconocer lo que no sirve». Ordena a quienes
 * esperan a una persona del equipo: primero los que más cerca están de
 * cerrar, y dice por qué en una frase. Pura.
 */
import { normalizar } from "./reclamos";

export interface DatosInteres {
  ahora: Date;
  /** Motivo con el que el bot pasó el chat a una persona (attention_reason). */
  motivo: string | null;
  captado: boolean;
  /** Textos que escribió la persona, del más viejo al más nuevo. */
  entrantes: string[];
  ultimoEntranteAt: Date | null;
}

const PRECIO = /\b(?:precio|cuanto (?:sale|cuesta|es|seria|saldria|me sale)|valor|cuota|cuotas|financia|anticipo|entrega|honorarios|cobran|tarifa|costo|presupuesto|descuento|promo|plan(?:es)?)\b/;
const TURNO = /\b(?:turno|horario|cuando (?:puedo|podria|podemos|me)|a que hora|llam(?:ame|arme|enme|an)|me (?:pueden|podes|podrian) llamar|paso por|voy (?:a|al)|reunion|cita|agend)\w*/;
const DATOS = /\b(?:dni|cuil|cuit|mi (?:numero|telefono|mail|correo|direccion)|vivo en|soy de|trabajo en|mi nombre es|me llamo|\d{7,})\b/;

export interface Interes {
  puntaje: number;
  /** Una frase: por qué este puntaje. */
  porQue: string;
}

export function puntajeDeInteres(d: DatosInteres): Interes {
  const textos = d.entrantes.map(normalizar).filter(Boolean);
  const todo = textos.join(" · ");
  const razones: string[] = [];
  let p = 0;

  if (d.captado) {
    p += 30;
    razones.push("ya aceptó el siguiente paso");
  }
  if (d.motivo === "pide_persona" || /\b(?:hablar|comunicar\w*) con (?:una persona|alguien|un asesor|una asesora|un abogad[oa]|un vendedor|un humano)\b/.test(todo)) {
    p += 40;
    razones.push("pidió hablar con una persona");
  }
  if (d.motivo === "precio_fuera_alcance" || PRECIO.test(todo)) {
    p += 25;
    razones.push("preguntó precio o condiciones");
  } else if (TURNO.test(todo)) {
    p += 25;
    razones.push("preguntó por un horario o pidió que lo llamen");
  }
  if (DATOS.test(todo)) {
    p += 20;
    razones.push("dejó sus datos");
  }
  if (textos.length >= 3) {
    p += 10;
    razones.push(`escribió ${textos.length} veces`);
  }
  if (d.ultimoEntranteAt) {
    const horas = (d.ahora.getTime() - d.ultimoEntranteAt.getTime()) / 3_600_000;
    if (horas <= 24) {
      p += 15;
      razones.push("escribió en las últimas 24 horas");
    } else if (horas <= 72) {
      p += 5;
      razones.push("escribió en los últimos 3 días");
    }
  }
  if (!razones.length) razones.push("respondió, sin señales claras de interés");
  const frase = razones.join("; ");
  return { puntaje: Math.min(100, p), porQue: frase.charAt(0).toUpperCase() + frase.slice(1) + "." };
}

/** Etiqueta corta del puntaje para las listas. */
export function nivelDeInteres(puntaje: number | null | undefined): "alto" | "medio" | "bajo" | null {
  if (puntaje === null || puntaje === undefined) return null;
  return puntaje >= 60 ? "alto" : puntaje >= 30 ? "medio" : "bajo";
}
