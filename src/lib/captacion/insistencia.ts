/** Reglas puras de insistencia ante un rechazo (24/10). */
/**
 * 24/10 (aprobado por la responsable): fuera de Marketing, el bot insiste una
 * sola vez con algo útil antes de detener, salvo ante un pedido explícito de
 * no recibir mensajes, enojo o número equivocado. Las bases son compradas: ante
 * una pregunta por el origen, disculpa y detención (regla ORIGEN, 24/10).
 */
/**
 * 24/10 (aprobado por la responsable): ante un «ahora no» no se insiste, en
 * ningún rubro. Reemplaza la regla anterior de insistir una vez preguntando
 * día y horario. Vale para el botón y para el texto equivalente.
 */
const AHORA_NO =
  "- Si dice «ahora no», «no por ahora», «más adelante», que está ocupado o que no tiene tiempo (con un botón o con sus palabras): NO insistas, no preguntes día ni horario y no ofrezcas mandarle nada. Respondé con un único mensaje, corto y cálido, que no hay problema y que quedás a disposición por acá cuando quiera retomarlo. No prometas volver a escribirle. No uses detener_contacto ni evaluar_calificacion: la persona sigue disponible.";
/**
 * 24/10 (decisión de la responsable, reemplaza la de explicar el origen):
 * quien pregunta de dónde salió su número o pide la baja recibe una disculpa
 * y se lo detiene. El agente es asesor y no tiene el dato del origen (lo
 * atiende el equipo de marketing): no lo explica ni lo inventa.
 */
const ORIGEN =
  "- Si dice que no hizo ninguna consulta, pregunta de dónde salió su número o pide que borren sus datos: usá detener_contacto (motivo pregunta_procedencia o solicitud_eliminacion) y respondé solo la disculpa que te indica la herramienta. Sos asesor y no tenés el dato de cómo llegó su contacto (lo maneja el equipo de marketing): no lo expliques ni inventes detalles.";
const SIN_BASE =
  "- Nunca digas «base», «base de datos» ni que lo das de baja «de la base»: si pide no recibir más mensajes, decí que no le vamos a escribir más. Nunca prometas escribirle «en unos días».";

export function reglaDeRechazo(slug: string, modo: "campana" | "entrante" = "campana"): string[] {
  const detenerYa = "- Si pide que no le escriban más, se enoja o es un número equivocado: usá detener_contacto y respondé solo una disculpa breve. Nunca insistas en estos casos.";
  if (slug === "marketing") {
    return [
      "- Si la persona rechaza el contacto, se enoja, es un número equivocado, ya resolvió su caso o ya tiene abogado: usá detener_contacto y respondé solo una disculpa breve.",
      AHORA_NO,
      ORIGEN,
      SIN_BASE,
    ];
  }
  const oferta =
    (slug === "juridico" || slug === "civil" || slug === "penal") && modo === "entrante"
      ? "ofrecé una evaluación sin costo de su caso como segunda opinión"
      : slug === "juridico" || slug === "civil" || slug === "penal"
      ? "ofrecé una revisión gratis como segunda opinión (muchas veces hay una diferencia a cobrar con la ART)"
      : slug === "coberturas_medicas"
      ? "ofrecé que un asesor le compare sin costo si puede pagar menos por la misma cobertura o una mejor"
      : "ofrecé que un asesor le cuente sin compromiso opciones y financiación";
  return [
    "- Prioridad: estas reglas sobre rechazos y sobre el origen del contacto prevalecen sobre el guion del rubro. Si el guion dice «no insistas», «respondé exactamente» otra frase sobre el origen o menciona que «nos figuraba tu registro como caso pendiente», no lo uses: seguí estas reglas.",
    detenerYa,
    `- Si dice que ya lo resolvió, que ya tiene abogado o asesor, o que ya compró/contrató, o responde «no, gracias» o «no me interesa» sin más (con un botón o con sus palabras): insistí UNA sola vez, breve y sin presión: ${oferta}.${slug === "juridico" || slug === "civil" || slug === "penal" ? " Si ya tiene abogado, no lo cuestiones ni hables mal de él: solo preguntá si le serviría una segunda opinión; si dice que no, detener_contacto." : ""}`,
    AHORA_NO,
    "- Si pide otro día u horario para hablar, preguntale cuál le queda mejor.",
    ORIGEN,
    "- Si ya insististe una vez en esta conversación y vuelve a decir que no (o no le interesa): usá detener_contacto y respondé solo una disculpa breve. Nunca insistas dos veces.",
    SIN_BASE,
  ];
}
