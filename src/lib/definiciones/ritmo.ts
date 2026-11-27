/**
 * Texto del ritmo diario de una línea de Wasender (22/11, pendiente 15b). Pura.
 * Con la sesión cerrada o los envíos apagados NO se dice «puede enviar N»: no puede enviar nada.
 */
export function textoRitmoDeLinea(l: { estado: string | null; habilitada: boolean; calentamiento: { dia: number; limite: number; porCalentamiento: boolean } }): string {
  if ((l.estado ?? "") !== "connected") return "Sin sesión abierta: no envía nada hasta volver a vincular el número con el QR.";
  if (!l.habilitada) return "Los envíos están apagados: no sale nada por esta línea hasta encenderlos.";
  const c = l.calentamiento;
  return c.porCalentamiento
    ? `Día ${c.dia} de calentamiento: hoy puede enviar hasta ${c.limite} mensajes de campaña. Sube sola cada semana.`
    : `Campañas: hasta ${c.limite} mensajes por día.`;
}
