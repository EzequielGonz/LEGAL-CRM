/**
 * Horario de atención (regla de la responsable, 18/10, para los cuatro
 * perfiles). La IA responde las 24 h. Los asesores atienden de lunes a
 * sábado de 8 a 21 (hora de Argentina; las 21:00 ya no valen). Fuera de esa
 * franja la IA igual capta: toma los datos y deja acordado el llamado con un
 * asesor para el próximo horario hábil. Puro: sin base ni red.
 */
const OFFSET_AR_HORAS = -3;

function enArgentina(ahora: Date) {
  const d = new Date(ahora.getTime() + OFFSET_AR_HORAS * 3600 * 1000);
  return { dia: d.getUTCDay(), hora: d.getUTCHours() };
}

/** ¿Hay asesores en horario? (lunes a sábado, de 8:00 a 20:59). */
export function enHorarioAsesores(ahora: Date): boolean {
  const { dia, hora } = enArgentina(ahora);
  return dia !== 0 && hora >= 8 && hora < 21;
}

/** Próxima franja de asesores, en palabras («hoy desde las 8», «mañana desde las 8», «el lunes desde las 8»). */
export function proximaFranja(ahora: Date): string {
  const { dia, hora } = enArgentina(ahora);
  if (dia !== 0 && hora < 8) return "hoy desde las 8";
  const manana = (dia + 1) % 7;
  return manana === 0 ? "el lunes desde las 8" : "mañana desde las 8";
}

/** Bloque que se suma a las instrucciones del agente en cada respuesta. */
export function bloqueHorarioAtencion(ahora: Date): string {
  const base =
    "Horario de atención: vos respondés las 24 horas, todos los días. Los asesores atienden de lunes a sábado de 8 a 21 (hora de Argentina).";
  if (enHorarioAsesores(ahora)) return `${base} Ahora es horario de asesores.`;
  return [
    `${base} Ahora es FUERA del horario de los asesores.`,
    "Atendé igual, con normalidad, y buscá captar: entendé qué necesita, conseguí los datos que faltan y calificá como siempre.",
    `Cuando corresponda el siguiente paso, acordá día y franja para que un asesor lo llame ${proximaFranja(ahora)} (si tenés consultar_disponibilidad y agendar_cita, usalas; si no, guardá el día y la franja que prefiere con guardar_datos_calificacion en el campo disponibilidad_para_contacto).`,
    "No digas que no hay nadie ni dejes la charla para mañana: seguí atendiendo vos y dejá todo listo para que el asesor solo cierre.",
  ].join(" ");
}
