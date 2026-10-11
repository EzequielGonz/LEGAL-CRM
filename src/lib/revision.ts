/** Textos de la sección Revisión (incidencias, detenciones y mensajes retenidos). */

export const INCIDENCE_LABEL: Record<string, string> = {
  ultimo_mensaje_sin_respuesta: "Último mensaje sin respuesta",
  pregunta_origen_datos: "Preguntó de dónde salieron sus datos",
  numero_menor: "Número informado como de una menor",
  numero_tercero: "Número aportado por un tercero",
  estado_contacto_conversacion: "Estado del contacto distinto del de su conversación",
  plantillas_sin_id: "Plantillas sin identificador del proveedor",
  contactos_sin_base: "Contactos sin base de origen",
  cierre_ganado_sin_aceptacion: "Cierre ganado sin aceptación registrada",
  conversacion_abierta: "Conversación abierta sin motivo de cierre",
  solicitud_supresion_datos: "Pidió que se eliminen sus datos",
  motivo_no_confirmado: "Motivo no confirmado",
  mensaje_posterior_migracion: "Mensaje recibido durante la migración",
  otro: "Otra",
};

export const QUARANTINE_REASON_LABEL: Record<string, string> = {
  firma_invalida: "Firma inválida",
  firma_ausente: "Sin firma",
  linea_no_asignada: "Línea no asignada a un perfil",
  error_procesamiento: "Error al guardar",
};

export interface QuarantineSummary {
  remitente: string | null;
  texto: string | null;
  cantidad: number;
}

/** Resumen legible de un evento retenido (quién escribió y qué), sin procesarlo. */
export function summarizeQuarantine(source: string, payload: any): QuarantineSummary {
  const out: QuarantineSummary = { remitente: null, texto: null, cantidad: 0 };
  try {
    if (source === "whatsapp") {
      for (const entry of payload?.entry ?? []) {
        for (const change of entry?.changes ?? []) {
          const value = change?.value ?? {};
          for (const m of value.messages ?? []) {
            out.cantidad++;
            if (!out.remitente) {
              const name = (value.contacts ?? []).find((c: any) => c?.wa_id === m?.from)?.profile?.name;
              out.remitente = name ? `${name} (${m?.from ?? "?"})` : m?.from ?? null;
              out.texto =
                m?.text?.body ?? m?.button?.text ?? m?.interactive?.button_reply?.title ?? (m?.type ? `[${m.type}]` : null);
            }
          }
          if (!out.cantidad && (value.statuses ?? []).length) {
            out.texto = `${value.statuses.length} estado(s) de entrega`;
          }
        }
      }
    } else {
      for (const entry of payload?.entry ?? []) {
        for (const e of entry?.messaging ?? []) {
          if (!e?.message) continue;
          out.cantidad++;
          if (!out.remitente) {
            out.remitente = e?.sender?.id ?? null;
            out.texto = e?.message?.text ?? "[adjunto]";
          }
        }
      }
    }
  } catch {
    // formato inesperado: se muestra sin resumen
  }
  return out;
}
