/**
 * Por qué está parado cada perfil (22/11, hallazgos 15 §3 ítem 9). Pura.
 *
 * Tres perfiles llevaban entre 19 y 26 días sin enviar, cada uno por una causa distinta (pago de Meta,
 * calidad baja, línea sin acceso con una pausa «de domingo» que nadie levantó) y Hoy no lo decía: Coberturas
 * figuraba con calidad alta. Ahora Hoy lista los motivos, del más grave al menos grave, con qué hacer.
 * Nunca muestra nombres internos (`WHATSAPP_*`, motivos sueltos como «ad» o «domingo»).
 */

export interface LineaMetaParo {
  nombre: string;
  /** conectada, pendiente, con_problema, token_invalido, sin_acceso, sin_credenciales, no_comprobado */
  estado: string | null;
  ok: boolean;
  etiqueta?: string | null;
  calidad?: string | null;
}

export interface DatosParo {
  pausaGeneral: { ia: boolean; envios: boolean };
  lineasMeta: LineaMetaParo[];
  lineasWasender: { nombre: string; estado: string | null; habilitada: boolean }[];
  campanas: { nombre: string; status: string; pauseReason?: string | null }[];
  agenteActivo: boolean;
}

export interface MotivoParo {
  tono: "rojo" | "amarillo";
  texto: string;
}

/** Traduce el motivo guardado en una campaña pausada a palabras (el campo es texto libre). Pura. */
export function motivoDePausaLegible(motivo: string | null | undefined): string {
  const t = String(motivo ?? "").trim();
  if (!t) return "Sin motivo registrado";
  if (/\bWHATSAPP_[A-Z0-9_]+/.test(t)) return t.replace(/\bWHATSAPP_[A-Z0-9_]+/g, "la conexión de la línea");
  if (/^domingo$/i.test(t)) return "Se pausó por ser domingo (no se envía los domingos) y nadie la reanudó";
  if (/^[a-záéíóúñ_]{1,12}$/i.test(t) && !t.includes(" ")) return `Pausada a mano con el motivo «${t}»: alguien lo anotó así; reanudala o cambiale el motivo`;
  return t;
}

const ESTADO_LINEA_TEXTO: Record<string, string> = {
  sin_acceso: "no tiene acceso al número en Meta: no recibe ni contesta",
  token_invalido: "el token de acceso de Meta no sirve (vencido o revocado)",
  con_problema: "Meta informa un problema con el número",
  pendiente: "el número está pendiente en Meta",
  sin_credenciales: "faltan las credenciales de la línea",
};

export function motivosDeParo(d: DatosParo): MotivoParo[] {
  const out: MotivoParo[] = [];
  if (d.pausaGeneral.envios) out.push({ tono: "rojo", texto: "La pausa general de envíos está activa: no sale ningún mensaje automático (campañas, seguimientos, recontactos). Se levanta desde Configuración." });
  if (d.pausaGeneral.ia) out.push({ tono: "amarillo", texto: "Las respuestas de la IA están en pausa general: nadie contesta a quien escribe hasta que se levante." });

  if (d.lineasMeta.length === 0 && d.lineasWasender.length === 0) {
    out.push({ tono: "rojo", texto: "Sin línea de WhatsApp: el perfil no puede enviar ni recibir. Falta conectar una línea." });
  }
  for (const l of d.lineasMeta) {
    if (!l.ok) {
      const que = (l.estado && ESTADO_LINEA_TEXTO[l.estado]) || l.etiqueta || "no se pudo comprobar con Meta";
      out.push({ tono: "rojo", texto: `Línea ${l.nombre}: ${que}.` });
    } else if (l.calidad === "baja") {
      out.push({ tono: "rojo", texto: `Línea ${l.nombre}: calidad baja en Meta. Las campañas se pausan solas mientras siga así; las respuestas a quien escribe siguen.` });
    }
  }
  for (const w of d.lineasWasender) {
    if (w.estado !== "connected") out.push({ tono: "rojo", texto: `Wasender ${w.nombre}: desconectada. Hay que escanear el QR para que vuelva a enviar.` });
    else if (!w.habilitada) out.push({ tono: "amarillo", texto: `Wasender ${w.nombre}: conectada pero con los envíos apagados.` });
  }
  for (const c of d.campanas) {
    if (c.status === "pausada") out.push({ tono: "amarillo", texto: `Campaña ${c.nombre} pausada: ${motivoDePausaLegible(c.pauseReason)}.` });
  }
  if (!d.agenteActivo) out.push({ tono: "amarillo", texto: "El agente de este perfil está apagado: los mensajes que llegan quedan para atención manual." });
  const orden = { rojo: 0, amarillo: 1 } as const;
  return out.sort((a, b) => orden[a.tono] - orden[b.tono]);
}
