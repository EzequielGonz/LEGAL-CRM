/**
 * Traduce un mensaje entrante de WhatsApp Cloud API a lo que se guarda en
 * `messages`. Todos los tipos se conservan (antes solo se guardaban texto y
 * botones; audios, imágenes, documentos, etc. se perdían).
 *
 * Función pura: sin acceso a red ni base (se prueba con tests unitarios).
 */
export interface ParsedInbound {
  body: string;
  messageType: string;
  /** true si es la respuesta a un botón o lista (no texto libre). */
  isButtonClick: boolean;
  /** true si el agente IA puede leerlo (texto o respuesta de botón). */
  aiReadable: boolean;
  metadata: Record<string, unknown>;
}

const MEDIA_LABEL: Record<string, string> = {
  image: "Imagen",
  video: "Video",
  audio: "Audio",
  voice: "Audio",
  document: "Documento",
  sticker: "Sticker",
};

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

export function parseWhatsAppMessage(message: any): ParsedInbound {
  const type: string = typeof message?.type === "string" ? message.type : "unknown";
  const base: Record<string, unknown> = {
    provider_type: type,
    provider_timestamp: str(message?.timestamp),
  };
  if (message?.context?.id) base.reply_to_external_id = message.context.id;
  if (message?.referral) base.referral = message.referral; // anuncios "clic a WhatsApp"

  switch (type) {
    case "text":
      return {
        body: message?.text?.body ?? "",
        messageType: "text",
        isButtonClick: false,
        aiReadable: true,
        metadata: base,
      };

    case "button":
      return {
        body: str(message?.button?.text) ?? str(message?.button?.payload) ?? "",
        messageType: "button",
        isButtonClick: true,
        aiReadable: true,
        metadata: { ...base, button_payload: message?.button?.payload ?? null },
      };

    case "interactive": {
      const reply = message?.interactive?.button_reply ?? message?.interactive?.list_reply ?? null;
      const title = str(reply?.title) ?? "";
      const description = str(reply?.description);
      return {
        body: description ? `${title} — ${description}` : title,
        messageType: "interactive",
        isButtonClick: true,
        aiReadable: true,
        metadata: { ...base, interactive_type: message?.interactive?.type ?? null, reply_id: reply?.id ?? null },
      };
    }

    case "image":
    case "video":
    case "audio":
    case "voice":
    case "document":
    case "sticker": {
      const media = message?.[type] ?? {};
      const label = MEDIA_LABEL[type] ?? type;
      const caption = str(media?.caption);
      const filename = str(media?.filename);
      const body = caption
        ? `[${label}] ${caption}`
        : filename
        ? `[${label}] ${filename}`
        : `[${label}]`;
      return {
        body,
        messageType: type === "voice" ? "audio" : type,
        isButtonClick: false,
        aiReadable: false,
        metadata: {
          ...base,
          media_id: media?.id ?? null,
          mime_type: media?.mime_type ?? null,
          sha256: media?.sha256 ?? null,
          filename,
          requiere_revision: true,
        },
      };
    }

    case "location": {
      const loc = message?.location ?? {};
      const parts = [str(loc?.name), str(loc?.address)].filter(Boolean).join(" · ");
      const coords =
        typeof loc?.latitude === "number" && typeof loc?.longitude === "number"
          ? `${loc.latitude}, ${loc.longitude}`
          : "";
      return {
        body: `[Ubicación] ${[parts, coords].filter(Boolean).join(" — ")}`.trim(),
        messageType: "location",
        isButtonClick: false,
        aiReadable: false,
        metadata: { ...base, location: loc, requiere_revision: true },
      };
    }

    case "contacts": {
      const contacts: any[] = Array.isArray(message?.contacts) ? message.contacts : [];
      const desc = contacts
        .map((c) => {
          const name = str(c?.name?.formatted_name) ?? "Sin nombre";
          const phone = str(c?.phones?.[0]?.phone) ?? str(c?.phones?.[0]?.wa_id) ?? "";
          return phone ? `${name} (${phone})` : name;
        })
        .join(", ");
      return {
        body: `[Contacto compartido] ${desc}`.trim(),
        messageType: "contacts",
        isButtonClick: false,
        aiReadable: false,
        // Números aportados por terceros: se guardan como dato, nunca se usan solos.
        metadata: { ...base, shared_contacts: contacts, requiere_revision: true },
      };
    }

    case "reaction":
      return {
        body: `[Reacción ${message?.reaction?.emoji ?? ""}]`.replace(" ]", "]"),
        messageType: "reaction",
        isButtonClick: false,
        aiReadable: false,
        metadata: { ...base, reaction_to: message?.reaction?.message_id ?? null },
      };

    default:
      return {
        body: `[Mensaje no compatible: ${type}]`,
        messageType: type,
        isButtonClick: false,
        aiReadable: false,
        metadata: { ...base, errors: message?.errors ?? null, requiere_revision: true },
      };
  }
}

/** Estados de entrega de WhatsApp → estado guardado en `messages.delivery_status`. */
export function mapDeliveryStatus(status: unknown): "enviado" | "entregado" | "leido" | "fallido" | null {
  switch (status) {
    case "sent":
      return "enviado";
    case "delivered":
      return "entregado";
    case "read":
      return "leido";
    case "failed":
      return "fallido";
    default:
      return null;
  }
}

/** Orden para no retroceder un estado (un "entregado" tardío no pisa un "leído"). */
export const DELIVERY_RANK: Record<string, number> = { enviado: 1, entregado: 2, leido: 3, fallido: 4 };
