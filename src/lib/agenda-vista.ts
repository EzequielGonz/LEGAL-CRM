/**
 * Citas con función (22/11): rangos por día y semana, agrupado, validación de una cita nueva o movida
 * y texto del recordatorio. Todo puro; la hora es la de Argentina (UTC-3, sin horario de verano).
 */
import { diaSiguiente, fechaValida, inicioDiaAR } from "@/lib/contactos/consulta";

export type VistaCitas = "dia" | "semana";

/** Hoy en Argentina como AAAA-MM-DD. */
export function hoyAR(ahora = new Date()): string {
  return new Date(ahora.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

export function sumarDias(fecha: string, n: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Lunes de la semana de una fecha. */
export function lunesDe(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  return sumarDias(fecha, -((d.getUTCDay() + 6) % 7));
}

export function parsearVista(v: unknown, f: unknown, ahora = new Date()): { vista: VistaCitas; fecha: string } {
  return { vista: v === "dia" ? "dia" : "semana", fecha: fechaValida(typeof f === "string" ? f : undefined) ?? hoyAR(ahora) };
}

/** Días que abarca la vista y el rango UTC a consultar. */
export function rangoDeVista(vista: VistaCitas, fecha: string): { dias: string[]; desde: string; hastaExclusivo: string } {
  const primero = vista === "dia" ? fecha : lunesDe(fecha);
  const n = vista === "dia" ? 1 : 7;
  const dias = Array.from({ length: n }, (_, i) => sumarDias(primero, i));
  return { dias, desde: inicioDiaAR(dias[0]), hastaExclusivo: inicioDiaAR(diaSiguiente(dias[n - 1])) };
}

export function pasoDeVista(vista: VistaCitas, fecha: string, sentido: -1 | 1): string {
  return sumarDias(fecha, sentido * (vista === "dia" ? 1 : 7));
}

/** Día AAAA-MM-DD argentino de un instante. */
export function diaAR(iso: string): string {
  return new Date(new Date(iso).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

export function agruparPorDia<T extends { starts_at: string }>(citas: T[], dias: string[]): { dia: string; citas: T[] }[] {
  const mapa = new Map<string, T[]>(dias.map((d) => [d, []]));
  for (const c of citas) mapa.get(diaAR(c.starts_at))?.push(c);
  return dias.map((d) => ({ dia: d, citas: (mapa.get(d) ?? []).sort((a, b) => a.starts_at.localeCompare(b.starts_at)) }));
}

export function tituloDia(fecha: string, hoy = hoyAR()): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  const txt = d.toLocaleDateString("es-AR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
  return fecha === hoy ? `Hoy · ${txt}` : fecha === sumarDias(hoy, 1) ? `Mañana · ${txt}` : txt;
}

export function tituloRango(vista: VistaCitas, fecha: string): string {
  if (vista === "dia") return tituloDia(fecha);
  const l = lunesDe(fecha);
  const f = (x: string) => new Date(`${x}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC", day: "numeric", month: "short" });
  return `Semana del ${f(l)} al ${f(sumarDias(l, 6))}`;
}

export function horaAR(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

/** De «AAAA-MM-DDTHH:mm» (lo que da el campo del navegador, hora argentina) a instante ISO; null si no es válido. */
export function instanteDesdeCampo(v: unknown): string | null {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const DURACIONES = [15, 30, 45, 60, 90] as const;

/** Valida fecha y duración de una cita nueva o movida. Devuelve el error o null. */
export function validarHorario(inicioIso: string | null, minutos: number, ahora = new Date()): string | null {
  if (!inicioIso) return "Elegí la fecha y la hora.";
  if (!Number.isFinite(minutos) || minutos < 10 || minutos > 480) return "La duración tiene que estar entre 10 minutos y 8 horas.";
  if (new Date(inicioIso).getTime() < ahora.getTime() - 5 * 60_000) return "Esa hora ya pasó. Elegí una futura.";
  return null;
}

/** ¿Dos intervalos se pisan? */
export function sePisan(a: { starts_at: string; ends_at: string }, b: { starts_at: string; ends_at: string }): boolean {
  return new Date(a.starts_at) < new Date(b.ends_at) && new Date(b.starts_at) < new Date(a.ends_at);
}

export const ESTADOS_ABIERTOS = ["pendiente", "confirmada"] as const;

/** Qué se puede hacer con una cita según su estado y tipo. */
export function accionesDeCita(c: { status: string; kind?: string | null }): { asistio: boolean; noAsistio: boolean; mover: boolean; cancelar: boolean; reabrir: boolean } {
  const abierta = (ESTADOS_ABIERTOS as readonly string[]).includes(c.status);
  return { asistio: abierta, noAsistio: abierta, mover: abierta && c.kind !== "ia", cancelar: abierta, reabrir: c.status === "ausente" || c.status === "realizada" };
}

/**
 * ¿Se puede pasar la cita a `nuevo`? Usa las mismas reglas que los botones
 * (`accionesDeCita`), para que la API no acepte lo que la pantalla no ofrece
 * (27/11, auditoría): una cita realizada no se cancela y una cancelada no se
 * reabre. Devuelve el motivo del rechazo o `null` si se puede. Pura.
 */
export function motivoCambioDeCitaNoPermitido(c: { status: string; kind?: string | null }, nuevo: string): string | null {
  if (c.status === nuevo) return null; // repetir la misma acción no cambia nada
  const a = accionesDeCita(c);
  const abierta = (ESTADOS_ABIERTOS as readonly string[]).includes(c.status);
  const permitido =
    nuevo === "realizada"
      ? a.asistio
      : nuevo === "ausente"
        ? a.noAsistio
        : nuevo === "cancelada"
          ? a.cancelar
          : nuevo === "pendiente" || nuevo === "confirmada"
            ? abierta || a.reabrir
            : false;
  if (permitido) return null;
  if (c.status === "cancelada") return "La cita está cancelada: no se puede cambiar. Si hace falta, agendá una nueva.";
  if (nuevo === "cancelada") return "La cita ya pasó como realizada o ausente: no se puede cancelar. Si hace falta, reabrila primero.";
  return "Ese cambio no está permitido para esta cita.";
}

/** Texto de recordatorio listo para pegar en el chat. No se envía solo. */
export function textoRecordatorio(nombre: string | null, inicioIso: string, tipo?: string | null): string {
  const d = new Date(inicioIso);
  const dia = d.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "long", day: "numeric", month: "long" });
  const primer = (nombre ?? "").trim().split(/\s+/)[0];
  return `Hola${primer ? ` ${primer}` : ""}, te recordamos tu cita${tipo ? ` (${tipo})` : ""} del ${dia} a las ${horaAR(inicioIso)}. ¿Nos confirmás que podés asistir? Si necesitás cambiarla, avisanos por acá.`;
}
