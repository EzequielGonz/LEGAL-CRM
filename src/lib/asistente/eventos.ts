/**
 * Eventos y textos compartidos del asistente (22/11). Sin React ni pantallas: Jarvis (que se carga en
 * todas las pantallas del perfil) los importa desde acá y no arrastra el panel viejo del asistente.
 */
export const EVENTO_ASISTENTE = "crm:asistente";

export function abrirAsistente(texto?: string) {
  window.dispatchEvent(new CustomEvent(EVENTO_ASISTENTE, { detail: texto ?? null }));
}

export interface Propuesta {
  id: string;
  tipo: string;
  titulo: string;
  resumen: string;
  estado: string;
  resultado?: any;
  detalle?: any;
  avance?: { hechas: number; total: number } | null;
}

export function textoResultado(p: Propuesta): string | null {
  const r = p.resultado;
  if (!r) return null;
  if (r.error) return `No se pudo: ${r.error}`;
  if (p.tipo === "publicaciones") {
    const prog = r.por_estado?.programada ?? 0;
    const partes = [`${r.hechas ?? r.total} de ${r.total} guardadas`];
    if (r.en_metricool) partes.push(`${r.en_metricool} programadas en Metricool`);
    else if (prog) partes.push(`${prog} programadas`);
    const esperan = (r.por_estado?.lista ?? 0) + (r.por_estado?.retenida ?? 0);
    if (esperan) partes.push(`${esperan} esperan: ${r.motivos?.[0] ?? "revisá Publicaciones"}`);
    return partes.join(" · ");
  }
  if (p.tipo === "cambio_agente") return r.deshecho ? "Cambio deshecho: el bot volvió a sus instrucciones anteriores." : "Listo: el bot ya responde con las instrucciones nuevas.";
  if (p.tipo === "pausar_campana") return "Campaña pausada.";
  if (p.tipo === "crear_campana") return `Campaña creada en borrador con ${r.destinatarios_agregados ?? 0} destinatarios pendientes. No se envió nada: para lanzarla pedímelo o hacelo desde Campañas.`;
  if (p.tipo === "asignar_linea_campana") return "Línea de la campaña actualizada.";
  if (p.tipo === "limite_campana") return r.limite_diario ? `Listo: la campaña envía como máximo ${r.limite_diario} mensajes por día.` : "Listo: la campaña quedó sin límite diario propio.";
  if (p.tipo === "lanzar_campana") return "Campaña lanzada: los envíos siguen el ritmo y el horario configurados. Podés pausarla cuando quieras.";
  if (p.tipo === "asignar_agente") return `Agente ${r.estado === "activa" ? "activado" : r.estado === "pausada" ? "pausado" : "apagado"}.`;
  if (p.tipo === "personalizar_menu") return r.deshecho ? "Cambio deshecho: el menú volvió a como estaba." : "Listo: el menú de este perfil ya cambió. Si no lo ves, recargá la página.";
  if (p.tipo === "version_bot_crear") return `Versión creada (v${r.version ?? "?"}). Todavía no rige: probala o usala desde «Versiones de este perfil».`;
  if (p.tipo === "version_bot_usar") return `Listo: el bot ya usa la v${r.version ?? "?"} en las charlas nuevas (en hasta 1 minuto).`;
  if (p.tipo === "version_bot_volver") return "Listo: el bot volvió a la versión anterior (en hasta 1 minuto).";
  if (p.tipo === "operacion_panel") return `Hecho: ${String(r.operacion ?? p.titulo).toLowerCase()}.`;
  return "Listo.";
}

