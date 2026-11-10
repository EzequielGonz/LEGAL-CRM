import qrcode from "qrcode-generator";

/**
 * Dibuja el QR de Wasender como imagen (10/11). Wasender devuelve el QR como
 * texto («2@…»): el panel lo convierte en una imagen GIF (data URL) para
 * escanearla desde WhatsApp del celular de la línea (Dispositivos
 * vinculados). Es una imagen, no HTML: no se inyecta nada en la página.
 * Puro: se prueba solo.
 */
export function qrComoImagen(texto: string): string {
  const q = qrcode(0, "M");
  q.addData(texto);
  q.make();
  return q.createDataURL(6, 4);
}
