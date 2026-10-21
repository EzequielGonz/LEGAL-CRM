import type { Area } from "@/lib/supabase/database.types";

const GRAPH_VERSION = "v21.0";

function pageTokenFor(area: Area) {
  // 21/10: cada perfil con su página (antes solo Civil y Penal).
  return process.env[`FACEBOOK_${area.toUpperCase()}_PAGE_ACCESS_TOKEN`] ?? "";
}

/**
 * Envía un mensaje de texto por Instagram o Facebook Messenger usando la
 * Graph API de Meta. `recipientId` es el PSID/IGSID del contacto.
 */
export async function sendMetaMessage(
  area: Area,
  platform: "instagram" | "facebook",
  recipientId: string,
  body: string
) {
  const token = pageTokenFor(area);
  const endpoint =
    platform === "instagram"
      ? `https://graph.facebook.com/${GRAPH_VERSION}/me/messages?platform=instagram`
      : `https://graph.facebook.com/${GRAPH_VERSION}/me/messages`;

  const res = await fetch(`${endpoint}${endpoint.includes("?") ? "&" : "?"}access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: body },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta (${platform}) send error (${res.status}): ${err}`);
  }

  return res.json();
}
