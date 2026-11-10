/**
 * Reglas de las líneas de Wasender (10/11). Puras: se prueban solas.
 */

export const ESTADOS_LINEA: Record<string, { texto: string; tono: "ok" | "aviso" | "error" | "neutro" }> = {
  connected: { texto: "Conectada", tono: "ok" },
  need_scan: { texto: "Falta escanear el QR", tono: "aviso" },
  connecting: { texto: "Conectando…", tono: "neutro" },
  need_passkey: { texto: "Pide passkey en el celular", tono: "aviso" },
  disconnected: { texto: "Desconectada", tono: "error" },
  logged_out: { texto: "Sesión cerrada desde el celular", tono: "error" },
  expired: { texto: "Vencida: hay que volver a escanear", tono: "error" },
  creando: { texto: "Creando en Wasender…", tono: "neutro" },
  error: { texto: "No se pudo crear", tono: "error" },
};

export function etiquetaEstado(estado: string | null | undefined): { texto: string; tono: "ok" | "aviso" | "error" | "neutro" } {
  const e = (estado ?? "").toLowerCase();
  return ESTADOS_LINEA[e] ?? { texto: e ? `Estado: ${e}` : "Sin estado", tono: "neutro" };
}

/** ¿Hay que mostrar el QR? */
export function pideQr(estado: string | null | undefined): boolean {
  const e = (estado ?? "").toLowerCase();
  return e === "need_scan" || e === "connecting" || e === "expired" || e === "logged_out" || e === "disconnected";
}

/** Número en formato internacional («+» y dígitos) o null si no es válido. */
export function telefonoValido(texto: string | null | undefined): string | null {
  const d = String(texto ?? "").replace(/\D/g, "");
  return d.length >= 8 && d.length <= 15 ? `+${d}` : null;
}

/**
 * ¿El número ya figura en una línea de Meta? Nunca se escanea por QR una línea
 * que está en la API de Meta: dejaría de funcionar allá.
 */
export function esNumeroDeMeta(telefono: string, numerosMeta: (string | null | undefined)[]): boolean {
  const d = telefono.replace(/\D/g, "");
  if (!d) return false;
  return numerosMeta.some((n) => {
    const m = String(n ?? "").replace(/\D/g, "");
    if (m.length < 8) return false;
    // Coincide si uno termina con el otro (con o sin el 54 y el 9 de los celulares).
    return d.endsWith(m.slice(-10)) || m.endsWith(d.slice(-10));
  });
}

/** Sufijo para registros: nunca el número completo. */
export function ultimosDigitos(telefono: string): string {
  const d = telefono.replace(/\D/g, "");
  return d ? `…${d.slice(-4)}` : "";
}

/** Una línea solo se habilita para enviar si está conectada. */
export function puedeHabilitar(estado: string | null | undefined): boolean {
  return (estado ?? "").toLowerCase() === "connected";
}
