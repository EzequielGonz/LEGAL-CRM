import type { Area } from "@/lib/supabase/database.types";
import { envPrefixForArea } from "@/lib/rubros";
import { WhatsAppSendError, WhatsAppUnconfirmedError } from "@/lib/envios/errores";

// Los errores se definen en src/lib/envios/errores.ts (se clasifican ahí);
// se reexportan para quien ya los importaba desde este archivo.
export { WhatsAppSendError, WhatsAppUnconfirmedError };

const GRAPH_VERSION = "v21.0";
/** Tiempo máximo de espera de una llamada a Meta. Si vence, el resultado es incierto. */
export const META_TIMEOUT_MS = 20_000;

function metaCodeOf(raw: string): number | null {
  try {
    const code = JSON.parse(raw)?.error?.code;
    return typeof code === "number" ? code : null;
  } catch {
    return null;
  }
}

/** Parámetro del cuerpo: texto simple (variables numeradas) o con nombre (variables con nombre). */
export type TemplateBodyParameter = string | { text: string; parameter_name?: string };

// Jurídico (civil/penal) sigue usando sus variables de siempre. Los rubros
// nuevos arman el nombre de la variable a partir del area (ver
// envPrefixForArea) — agregar un rubro más no requiere tocar esta función,
// solo cargar sus variables en Vercel con el nombre que corresponde.
export function whatsappCredentials(area: Area, credentialKey?: string | null) {
  // Línea elegida (perfil → líneas): se usan las variables de esa línea.
  if (credentialKey) {
    const phoneNumberId = process.env[`${credentialKey}_PHONE_NUMBER_ID`];
    const accessToken = process.env[`${credentialKey}_ACCESS_TOKEN`];
    if (!phoneNumberId || !accessToken) {
      throw new Error(
        `Faltan las variables privadas ${credentialKey}_PHONE_NUMBER_ID / ${credentialKey}_ACCESS_TOKEN de la línea.`
      );
    }
    return { phoneNumberId, accessToken };
  }
  if (area === "civil") {
    return {
      phoneNumberId: process.env.WHATSAPP_CIVIL_PHONE_NUMBER_ID!,
      accessToken: process.env.WHATSAPP_CIVIL_ACCESS_TOKEN!,
    };
  }
  if (area === "penal") {
    return {
      phoneNumberId: process.env.WHATSAPP_PENAL_PHONE_NUMBER_ID!,
      accessToken: process.env.WHATSAPP_PENAL_ACCESS_TOKEN!,
    };
  }

  const prefix = envPrefixForArea(area);
  const phoneNumberId = process.env[`${prefix}_PHONE_NUMBER_ID`];
  const accessToken = process.env[`${prefix}_ACCESS_TOKEN`];

  if (!phoneNumberId || !accessToken) {
    throw new Error(
      `Faltan las variables de entorno ${prefix}_PHONE_NUMBER_ID / ${prefix}_ACCESS_TOKEN en Vercel para el área "${area}".`
    );
  }

  return { phoneNumberId, accessToken };
}

/**
 * POST a la API de mensajes con tiempo límite. Si Meta responde con error,
 * lanza WhatsAppSendError (el mensaje seguro no salió). Si no hay respuesta
 * (red, tiempo vencido) se propaga el error original: el resultado es
 * incierto. Si responde bien pero no se puede leer la respuesta, lanza
 * WhatsAppUnconfirmedError.
 */
async function postMessage(phoneNumberId: string, accessToken: string, payload: unknown, label: string): Promise<any> {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(META_TIMEOUT_MS),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new WhatsAppSendError(`${label} (${res.status}): ${raw.slice(0, 2000)}`, res.status, metaCodeOf(raw));
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new WhatsAppUnconfirmedError(`Meta respondió ${res.status} con un contenido que no se pudo leer.`);
  }
}

/** Envía un mensaje de texto libre (solo válido dentro de la ventana de 24hs). */
export async function sendWhatsAppText(
  area: Area,
  to: string,
  body: string,
  opts: { credentialKey?: string | null } = {}
) {
  const { phoneNumberId, accessToken } = whatsappCredentials(area, opts.credentialKey);
  return postMessage(
    phoneNumberId,
    accessToken,
    { messaging_product: "whatsapp", to, type: "text", text: { body } },
    "WhatsApp send error"
  );
}

/**
 * Envía un mensaje de plantilla aprobada (necesario para iniciar conversación
 * fuera de la ventana de 24hs, como en las campañas a bases cargadas).
 * Devuelve la respuesta de Meta; si Meta no devuelve el identificador del
 * mensaje, lanza WhatsAppUnconfirmedError (no se puede confirmar el envío).
 */
export async function sendWhatsAppTemplate(
  area: Area,
  to: string,
  templateName: string,
  languageCode = "es_AR",
  parameters: TemplateBodyParameter[] = [],
  opts: { credentialKey?: string | null } = {}
) {
  const { phoneNumberId, accessToken } = whatsappCredentials(area, opts.credentialKey);
  const result = await postMessage(
    phoneNumberId,
    accessToken,
    {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: parameters.length
          ? [
              {
                type: "body",
                parameters: parameters.map((p) =>
                  typeof p === "string"
                    ? { type: "text", text: p }
                    : p.parameter_name
                    ? { type: "text", parameter_name: p.parameter_name, text: p.text }
                    : { type: "text", text: p.text }
                ),
              },
            ]
          : undefined,
      },
    },
    "WhatsApp template send error"
  );
  if (!result?.messages?.[0]?.id) {
    throw new WhatsAppUnconfirmedError("Meta respondió sin el identificador del mensaje: no se puede confirmar el envío.");
  }
  return result;
}
