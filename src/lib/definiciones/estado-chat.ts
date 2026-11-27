/**
 * Qué estado se muestra en el detalle de un chat (22/11, pendiente 15c). Pura: solo decide qué se ve.
 *
 * El detalle mostraba «Cerrado (ganado)» junto a «Requiere atención humana». Los dos datos son ciertos
 * (la persona quedó captada y espera que alguien la derive), pero juntos se contradicen. Regla:
 *  - perdido: «Cerrado (perdido)»; nunca espera a una persona.
 *  - captado: el estado es «Captado: falta derivar» (o «Derivado»); el pedido de una persona está incluido
 *    en eso y no se repite. Solo se agrega la atención cuando una persona ya lo está atendiendo.
 *  - el resto: el estado de la conversación y, aparte, la atención si la hay.
 */
const ATENCION_TEXTO: Record<string, string> = { requiere_humano: "Requiere atención humana", humano_en_curso: "Atención humana en curso" };

const ESTADO_CONTACTO: Record<string, string> = {
  nuevo: "Nuevo",
  en_conversacion: "En conversación",
  esperando_respuesta_prospecto: "Esperando prospecto",
  calificando: "Calificando",
  calificado: "Calificado",
  no_califica: "No califica",
  agendado: "Agendado",
  cerrado_ganado: "Cerrado (ganado)",
  cerrado_perdido: "Cerrado (perdido)",
  requiere_atencion_humana: "Requiere atención humana",
};

export function atencionVisible(o: { captureState?: string | null; attentionState?: string | null; attentionReason?: string | null }): string | null {
  const a = o.attentionState;
  if (!a || a === "ia") return null;
  if (o.captureState === "perdido") return null;
  // Un captado que «requiere humano» sin un pedido propio (motivo) solo espera que lo deriven: ya lo dice
  // «Captado: falta derivar». Con un motivo (escribió de nuevo, duda del profesional…) sí hay un pedido real.
  if (o.captureState === "captado" && a === "requiere_humano" && !o.attentionReason) return null;
  return ATENCION_TEXTO[a] ?? null;
}

export function estadoVisibleDelChat(i: {
  contactStatus: string;
  conversationStatus?: string | null;
  captureState?: string | null;
  attentionState?: string | null;
  attentionReason?: string | null;
  derivationState?: string | null;
}): { principal: string; atencion: string | null } {
  const atencion = atencionVisible({ captureState: i.captureState, attentionState: i.attentionState, attentionReason: i.attentionReason });
  if (i.captureState === "perdido" || i.contactStatus === "cerrado_perdido") return { principal: "Cerrado (perdido)", atencion: null };
  if (i.captureState === "captado" || i.contactStatus === "cerrado_ganado") {
    return { principal: i.derivationState === "derivado" ? "Derivado" : "Captado: falta derivar", atencion };
  }
  // «Requiere atención humana» como estado de conversación es lo mismo que la etiqueta de atención: no se repite.
  const principal = i.contactStatus === "requiere_atencion_humana" ? ESTADO_CONTACTO.en_conversacion : ESTADO_CONTACTO[i.contactStatus] ?? i.contactStatus;
  return { principal, atencion };
}
