/**
 * Presupuestos de Marketing · envío programado (21/10). Pura, sin base.
 *
 * La responsable elige día y hora (hora de Buenos Aires) para que el
 * presupuesto salga solo y no se le escriba al cliente en cualquier horario.
 * Es una salida iniciada por la empresa, así que vale el horario general
 * (reglas comunes §4): lunes a sábado de 8 a 21, sin domingos, con las
 * excepciones del calendario. El servidor corre en UTC: la conversión usa el
 * offset fijo de Argentina (sin horario de verano desde 2009).
 */
import { argentinaMidnight, argentinaParts, isContactAllowed, isValidDay, DEFAULT_CALENDAR, type ContactCalendar } from "@/lib/contacto/reglas";

export const ZONA_AR = "America/Argentina/Buenos_Aires";
/** Como mucho 60 días hacia adelante. */
export const MAX_DIAS_PROGRAMACION = 60;
/** Margen mínimo: al menos 2 minutos en el futuro (el latido corre cada ~1 min). */
export const MARGEN_MIN_MS = 2 * 60_000;

/** «AAAA-MM-DDTHH:mm» en hora de Buenos Aires → instante UTC (null si no es válido). */
export function horaArgentinaAInstante(valor: unknown): Date | null {
  if (typeof valor !== "string") return null;
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(valor.trim());
  if (!m || !isValidDay(m[1])) return null;
  const h = Number(m[2]);
  const min = Number(m[3]);
  if (h > 23 || min > 59) return null;
  return new Date(argentinaMidnight(m[1]).getTime() + (h * 60 + min) * 60_000);
}

/** Instante → «AAAA-MM-DDTHH:mm» en hora de Buenos Aires (para el campo del formulario). */
export function instanteAHoraArgentina(instante: Date): string {
  const p = argentinaParts(instante);
  return `${p.day}T${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** Texto legible: «sábado 24/10 a las 10:30». */
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function describirProgramacion(instante: Date): string {
  const p = argentinaParts(instante);
  const [, mes, dia] = p.day.split("-");
  return `${DIAS[p.weekday]} ${dia}/${mes} a las ${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

export type ResultadoProgramacion = { ok: true; instante: Date } | { ok: false; error: string };

/** Valida la fecha y hora elegidas para el envío. */
export function validarProgramacion(valor: unknown, ahora: Date, calendario: ContactCalendar = DEFAULT_CALENDAR): ResultadoProgramacion {
  const instante = horaArgentinaAInstante(valor);
  if (!instante) return { ok: false, error: "Elegí un día y una hora válidos." };
  if (instante.getTime() < ahora.getTime() + MARGEN_MIN_MS) return { ok: false, error: "Elegí un horario al menos 2 minutos más adelante." };
  if (instante.getTime() > ahora.getTime() + MAX_DIAS_PROGRAMACION * 86_400_000) return { ok: false, error: `Se puede programar hasta ${MAX_DIAS_PROGRAMACION} días hacia adelante.` };
  if (!isContactAllowed(instante, calendario)) {
    return { ok: false, error: `A los clientes se les escribe de lunes a sábado de ${calendario.startHour} a ${calendario.endHour} (hora de Buenos Aires), respetando los días cerrados del calendario. Elegí otro horario.` };
  }
  return { ok: true, instante };
}

/** ¿Ya le toca salir? (programado, sin procesar y con la hora cumplida). */
export function tocaEnviarProgramado(b: { envio_programado_at: string | null; programado_procesado_at: string | null }, ahora: Date): boolean {
  if (!b.envio_programado_at || b.programado_procesado_at) return false;
  return new Date(b.envio_programado_at).getTime() <= ahora.getTime();
}
