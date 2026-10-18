/**
 * Prioridades del Inicio de cada perfil (rediseño 17/10, bloque 3). Pura:
 * ordena lo pendiente por urgencia y dice qué hacer con cada cosa. Una
 * cifra que no se pudo leer es «Sin datos» (null), nunca cero.
 */
export interface Pendiente {
  clave: string;
  titulo: string;
  cantidad: number | null;
  accion: string;
  porQue: string;
  href: string;
  urgente: boolean;
}

const ORDEN: Omit<Pendiente, "cantidad" | "href">[] = [
  { clave: "captado_sin_derivar", titulo: "Captados para derivar", accion: "Derivar", porQue: "Aceptaron el siguiente paso y todavía no se pasaron al profesional.", urgente: true },
  { clave: "requiere_humano", titulo: "Conversaciones que piden una persona", accion: "Responder", porQue: "Pidieron hablar con alguien: la IA no responde en esos chats hasta que una persona los atienda.", urgente: true },
  { clave: "revision_pendiente", titulo: "Conversaciones para revisar", accion: "Revisar", porQue: "Quedaron marcadas para que una persona las mire.", urgente: false },
  { clave: "contenido_retenido", titulo: "Piezas de contenido retenidas", accion: "Ver motivos", porQue: "No se publican hasta resolver el motivo indicado en cada una.", urgente: false },
  { clave: "seguimiento_caido", titulo: "Seguimientos caídos", accion: "Ver seguimientos", porQue: "El seguimiento no avanzó y conviene decidir qué hacer.", urgente: false },
  { clave: "derivado_sin_resultado", titulo: "Derivados sin resultado", accion: "Registrar resultado", porQue: "Se derivaron y todavía no se anotó qué pasó después.", urgente: false },
];

export function prioridadesDeInicio(input: {
  conteos: Record<string, number | null>;
  contenidoRetenido: number | null;
  enlace: (clave: string) => string;
  enlaceContenido: string;
}): Pendiente[] {
  return ORDEN.map((p) => ({
    ...p,
    cantidad: p.clave === "contenido_retenido" ? input.contenidoRetenido : input.conteos[p.clave] ?? null,
    href: p.clave === "contenido_retenido" ? input.enlaceContenido : input.enlace(p.clave),
  }));
}

/** Siguiente paso de una ficha, en una frase (vista Simple). Pura. */
export function siguientePasoFicha(o: {
  capture_state?: string | null;
  attention_state?: string | null;
  derivation_state?: string | null;
  post_derivation_state?: string | null;
  followup_state?: string | null;
  review_required?: boolean | null;
  detenido?: boolean;
} | null): { texto: string; urgente: boolean } {
  if (!o) return { texto: "Todavía no tiene oportunidad registrada: no hay nada pendiente.", urgente: false };
  if (o.detenido) return { texto: "Contacto detenido: no sale ningún mensaje automático. Revisá el motivo antes de hacer algo.", urgente: true };
  if (o.attention_state === "requiere_humano") return { texto: "Pidió hablar con una persona: respondé desde la conversación.", urgente: true };
  if (o.attention_state === "humano_en_curso") return { texto: "Una persona está atendiendo esta conversación.", urgente: false };
  if (o.capture_state === "captado" && o.derivation_state !== "derivado") return { texto: "Captado: falta derivarlo al profesional.", urgente: true };
  if (o.capture_state === "captado" && o.derivation_state === "derivado" && !o.post_derivation_state) return { texto: "Derivado: cuando sepas qué pasó, registrá el resultado.", urgente: false };
  if (o.review_required) return { texto: "Quedó marcado para revisar.", urgente: false };
  if (o.followup_state === "caido") return { texto: "El seguimiento no avanzó: decidí si se vuelve a intentar.", urgente: false };
  if (o.capture_state === "perdido") return { texto: "Marcado como perdido: no hay acciones pendientes.", urgente: false };
  if (o.followup_state === "activo") return { texto: "En seguimiento automático: no hace falta hacer nada por ahora.", urgente: false };
  return { texto: "La conversación está en curso con el agente: no hace falta hacer nada por ahora.", urgente: false };
}

/**
 * Estado de una oportunidad en pocas palabras, para la columna «Qué pasa»
 * del nivel Simple. Mismo orden de prioridad que `siguientePasoFicha`. Pura.
 */
export function estadoCorto(o: {
  contact_state?: string | null;
  capture_state?: string | null;
  attention_state?: string | null;
  derivation_state?: string | null;
  review_required?: boolean | null;
  detenido?: boolean;
}): { texto: string; tono: "bloqueo" | "atencion" | "ok" | "info" } {
  if (o.detenido) return { texto: "Detenido", tono: "bloqueo" };
  if (o.attention_state === "requiere_humano") return { texto: "Espera a una persona", tono: "atencion" };
  if (o.attention_state === "humano_en_curso") return { texto: "Lo atiende una persona", tono: "info" };
  if (o.capture_state === "captado") return o.derivation_state === "derivado" ? { texto: "Derivado", tono: "ok" } : { texto: "Captado: falta derivar", tono: "atencion" };
  if (o.review_required) return { texto: "Para revisar", tono: "atencion" };
  if (o.capture_state === "perdido") return { texto: "Perdido", tono: "info" };
  if (o.contact_state === "error_contacto") return { texto: "No se pudo contactar", tono: "atencion" };
  if (o.contact_state === "respondio") return { texto: o.capture_state === "en_seguimiento" ? "En seguimiento" : "Respondió", tono: "info" };
  if (o.contact_state === "contactado_sin_respuesta") return { texto: "Sin respuesta", tono: "info" };
  return { texto: "Sin contactar", tono: "info" };
}
