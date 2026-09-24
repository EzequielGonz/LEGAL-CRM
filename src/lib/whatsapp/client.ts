import type { Area } from "@/lib/supabase/database.types";
import { envPrefixForArea } from "@/lib/rubros";

const GRAPH_VERSION = "v21.0";

// Jurídico (civil/penal) sigue usando sus variables de siempre. Los rubros
// nuevos arman el nombre de la variable a partir del area (ver
// envPrefixForArea) — agregar un rubro más no requiere tocar esta función,
// solo cargar sus variables en Vercel con el nombre que corresponde.
function credsFor(area: Area) {
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

/** Envía un mensaje de texto libre (solo válido dentro de la ventana de 24hs). */
export async function sendWhatsAppText(area: Area, to: string, body: string) {
  const { phoneNumberId, accessToken } = credsFor(area);

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send error (${res.status}): ${err}`);
  }

  return res.json();
}

/**
 * Envía un mensaje de plantilla aprobada (necesario para iniciar conversación
 * fuera de la ventana de 24hs, como en las campañas a bases cargadas).
 */
export async function sendWhatsAppTemplate(
  area: Area,
  to: string,
  templateName: string,
  languageCode = "es_AR",
  parameters: string[] = []
) {
  const { phoneNumberId, accessToken } = credsFor(area);

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
                  parameters: parameters.map((text) => ({ type: "text", text })),
                },
              ]
            : undefined,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp template send error (${res.status}): ${err}`);
  }

  return res.json();
}
