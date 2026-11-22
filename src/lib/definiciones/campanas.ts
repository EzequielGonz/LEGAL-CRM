/**
 * Estado de una campaña para Hoy y Salud (22/11, pendiente 15h). Pura.
 *
 * Antes Hoy decía «Campaña enviando» (0 de 182) mientras Salud contaba 17 mensajes fallidos en 24 horas: una
 * campaña «en curso» sin ningún envío exitoso no está enviando. Ahora los dos usan esta definición:
 *  - pausada: pausada, con su motivo;
 *  - frenada: en curso pero la línea no puede enviar;
 *  - con fallas: en curso, sin ningún envío y con fallidos, o con más fallidos de 24 h que enviados;
 *  - enviando: en curso con envíos, con el avance real «N de M» y los fallidos si los hay.
 */
import { motivoPausaLegible } from "@/lib/textos/pantalla";

export type TonoCampana = "verde" | "amarillo" | "rojo" | "gris";

export interface DatosCampana {
  status: string;
  pauseReason?: string | null;
  nombre: string;
  /** La línea de la campaña no puede enviar (Wasender desconectada o apagada). */
  frenadaPorLinea?: boolean;
  /** Destinatarios de la campaña. */
  prospectos: number;
  /** Destinatarios con mensaje enviado (incluye entregados y leídos). */
  enviados: number;
  /** Destinatarios cuyo envío falló (campaña completa). */
  fallidos: number;
  /** Mensajes salientes fallidos del perfil en las últimas 24 horas (misma cuenta que Salud). */
  fallidos24h: number;
}

export function estadoDeCampana(c: DatosCampana): { tono: TonoCampana; texto: string } {
  if (c.status === "pausada") {
    // Integración 22/11: el motivo con palabras claras del rediseño («ad», «domingo» → nota a mano).
    const m = motivoPausaLegible(c.pauseReason);
    return { tono: "amarillo", texto: `Campaña «${c.nombre}» ${m.startsWith("pausada") ? m : `pausada · ${m}`}`.slice(0, 120) };
  }
  if (c.status !== "en_curso") return { tono: "gris", texto: `Campaña ${c.status} · ${c.nombre}` };
  if (c.frenadaPorLinea) return { tono: "rojo", texto: "Campaña frenada · la línea de Wasender no puede enviar" };
  const avance = `${c.enviados.toLocaleString("es-AR")} de ${c.prospectos.toLocaleString("es-AR")}`;
  const fallas = Math.max(c.fallidos24h, 0);
  if (c.enviados === 0 && (c.fallidos > 0 || fallas > 0)) {
    return { tono: "rojo", texto: `Campaña con fallas · ${avance} enviados, ${Math.max(c.fallidos, fallas).toLocaleString("es-AR")} no salieron` };
  }
  if (fallas > 0 && fallas > c.enviados) return { tono: "rojo", texto: `Campaña con fallas · ${avance} enviados y ${fallas.toLocaleString("es-AR")} fallidos en 24 h` };
  if (fallas > 0) return { tono: "amarillo", texto: `Campaña enviando · ${avance} · ${fallas.toLocaleString("es-AR")} fallidos en 24 h` };
  return { tono: "verde", texto: `Campaña enviando · ${avance}` };
}
