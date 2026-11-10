/**
 * Eco de los envíos del panel (10/11). Wasender avisa también los mensajes que
 * salen desde el panel («message.sent» o un mensaje propio en
 * «messages.upsert»), con un id distinto del msgId que devolvió al enviar
 * (no está documentado que coincidan). Para no duplicarlos ni confundirlos con
 * un mensaje escrito desde el celular, se emparejan con los envíos del panel
 * que siguen pendientes de confirmación: misma conversación, mismo texto (o
 * mismo tipo de archivo) y pocos minutos de diferencia. Puro: se prueba solo.
 */

/** Ventana para emparejar un eco con el envío del panel. */
export const VENTANA_ECO_MS = 3 * 60_000;

export interface PendienteEco {
  id: string;
  body: string | null;
  message_type: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface Eco {
  /** Texto del eco (o null si no se pudo leer). */
  cuerpo: string | null;
  /** Tipo según el webhook (text, image, video, document, audio…). */
  tipoMensaje: string | null;
  esArchivo: boolean;
  lineaId: string;
}

export function normalizar(texto: string | null | undefined): string {
  return String(texto ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Devuelve el id del mensaje del panel que corresponde a este eco, o null. */
export function elegirEco(pendientes: PendienteEco[], eco: Eco, ahora: Date): string | null {
  const desde = ahora.getTime() - VENTANA_ECO_MS;
  const candidatos = pendientes
    .filter((p) => {
      const md = p.metadata ?? {};
      if (md.wasender_pendiente !== true || md.wasender_line_id !== eco.lineaId) return false;
      const t = Date.parse(p.created_at);
      return !Number.isNaN(t) && t >= desde && t <= ahora.getTime() + 60_000;
    })
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  if (!candidatos.length) return null;
  if (eco.esArchivo) {
    const tipo = eco.tipoMensaje === "image" || eco.tipoMensaje === "video" || eco.tipoMensaje === "document" ? eco.tipoMensaje : null;
    const m = candidatos.find((p) => tipo !== null && p.message_type === tipo);
    return m?.id ?? null;
  }
  const texto = normalizar(eco.cuerpo);
  if (texto) {
    const m = candidatos.find((p) => !p.message_type || p.message_type === "text" ? normalizar(p.body) === texto : false);
    if (m) return m.id;
    return null;
  }
  // Sin texto legible: solo si hay un único envío pendiente.
  return candidatos.length === 1 ? candidatos[0].id : null;
}
