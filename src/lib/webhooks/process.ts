import { handleInboundMessage } from "@/lib/inbound";
import type { Area } from "@/lib/supabase/database.types";
import { NUEVAS_AREAS_WHATSAPP, envPrefixForArea } from "@/lib/rubros";
import { quarantineWebhook } from "@/lib/webhooks/security";
import { parseWhatsAppMessage } from "@/lib/webhooks/whatsapp-parse";
import { applyDeliveryStatus } from "@/lib/delivery-status";
import { findLineByPhoneNumberId } from "@/lib/profiles";

/**
 * Procesamiento de los eventos de Meta, una vez verificada la firma (o
 * cuando una persona decide reprocesar un evento retenido desde Revisión).
 * Lo que no se puede ubicar o falla al guardarse queda en "retenidos".
 */
export interface ProcessSummary {
  mensajes: number;
  duplicados: number;
  estados: number;
  retenidos: number;
}

/**
 * Línea (phone_number_id) -> área. Se conservan las conexiones existentes
 * tal como están configuradas en las variables privadas; no se reasigna
 * nada por suposición.
 */
export function areaForPhoneNumberId(phoneNumberId: string): Area | null {
  if (phoneNumberId === process.env.WHATSAPP_CIVIL_PHONE_NUMBER_ID) return "civil";
  if (phoneNumberId === process.env.WHATSAPP_PENAL_PHONE_NUMBER_ID) return "penal";
  for (const area of NUEVAS_AREAS_WHATSAPP) {
    const envVar = `${envPrefixForArea(area)}_PHONE_NUMBER_ID`;
    if (process.env[envVar] && phoneNumberId === process.env[envVar]) return area;
  }
  return null;
}

export async function processWhatsAppPayload(payload: any): Promise<ProcessSummary> {
  const summary: ProcessSummary = { mensajes: 0, duplicados: 0, estados: 0, retenidos: 0 };

  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;
      // Primero las líneas registradas en los perfiles; si no, las conexiones de siempre.
      const line = phoneNumberId ? await findLineByPhoneNumberId(phoneNumberId) : null;
      const area = line?.area ?? (phoneNumberId ? areaForPhoneNumberId(phoneNumberId) : null);
      const hasContent = (value?.messages?.length ?? 0) > 0 || (value?.statuses?.length ?? 0) > 0;

      if (!area) {
        if (hasContent) {
          await quarantineWebhook({
            source: "whatsapp",
            reason: "linea_no_asignada",
            accountId: phoneNumberId ?? null,
            payload: { object: payload?.object ?? "whatsapp_business_account", entry: [{ id: entry?.id ?? null, changes: [change] }] },
            detail: "Llegó por una línea que no está asignada a ningún perfil.",
          });
          summary.retenidos++;
        }
        continue;
      }

      for (const message of value?.messages ?? []) {
        try {
          const parsed = parseWhatsAppMessage(message);
          const contactProfile = (value?.contacts ?? []).find((c: any) => c?.wa_id === message?.from);
          const result = await handleInboundMessage({
            area,
            channelType: "whatsapp",
            externalUserId: message.from,
            phone: message.from,
            fullName: contactProfile?.profile?.name ?? null,
            body: parsed.body,
            isButtonClick: parsed.isButtonClick,
            externalMessageId: message.id,
            messageType: parsed.messageType,
            metadata: { ...parsed.metadata, phone_number_id: phoneNumberId },
            aiReadable: parsed.aiReadable,
            lineId: line?.id ?? null,
          });
          if (result.status === "duplicado") summary.duplicados++;
          else summary.mensajes++;
        } catch (err: any) {
          console.error("Error procesando mensaje de WhatsApp:", err);
          await quarantineWebhook({
            source: "whatsapp",
            reason: "error_procesamiento",
            accountId: phoneNumberId ?? null,
            payload: {
              object: payload?.object ?? "whatsapp_business_account",
              entry: [{ id: entry?.id ?? null, changes: [{ field: change?.field ?? "messages", value: { ...value, messages: [message], statuses: [] } }] }],
            },
            detail: String(err?.message ?? err).slice(0, 2000),
          });
          summary.retenidos++;
        }
      }

      for (const status of value?.statuses ?? []) {
        try {
          await applyDeliveryStatus(status);
          summary.estados++;
        } catch (err) {
          console.error("Error guardando estado de entrega:", err);
        }
      }
    }
  }
  return summary;
}

export function resolveAreaAndPlatform(
  pageOrIgId: string
): { area: Area; platform: "instagram" | "facebook" } | null {
  if (pageOrIgId === process.env.FACEBOOK_CIVIL_PAGE_ID) return { area: "civil", platform: "facebook" };
  if (pageOrIgId === process.env.FACEBOOK_PENAL_PAGE_ID) return { area: "penal", platform: "facebook" };
  if (pageOrIgId === process.env.INSTAGRAM_CIVIL_BUSINESS_ID) return { area: "civil", platform: "instagram" };
  if (pageOrIgId === process.env.INSTAGRAM_PENAL_BUSINESS_ID) return { area: "penal", platform: "instagram" };
  return null;
}

function describeMetaMessage(message: any): { body: string; messageType: string; aiReadable: boolean } {
  if (typeof message?.text === "string" && message.text.trim()) {
    return { body: message.text, messageType: "text", aiReadable: true };
  }
  const attachments: any[] = Array.isArray(message?.attachments) ? message.attachments : [];
  if (attachments.length) {
    const kinds = attachments.map((a) => a?.type ?? "archivo").join(", ");
    return { body: `[Adjunto: ${kinds}]`, messageType: attachments[0]?.type ?? "attachment", aiReadable: false };
  }
  return { body: "[Mensaje no compatible]", messageType: "unknown", aiReadable: false };
}

export async function processMetaPayload(payload: any): Promise<ProcessSummary> {
  const summary: ProcessSummary = { mensajes: 0, duplicados: 0, estados: 0, retenidos: 0 };

  for (const entry of payload?.entry ?? []) {
    const resolved = resolveAreaAndPlatform(entry?.id);
    const events: any[] = (entry?.messaging ?? []).filter((e: any) => e?.message && !e.message.is_echo);
    if (!resolved) {
      if (events.length) {
        await quarantineWebhook({
          source: "meta",
          reason: "linea_no_asignada",
          accountId: entry?.id ?? null,
          payload: { object: payload?.object ?? "page", entry: [entry] },
          detail: "Llegó por una página o cuenta que no está asignada a ningún perfil.",
        });
        summary.retenidos++;
      }
      continue;
    }

    for (const event of events) {
      try {
        const described = describeMetaMessage(event.message);
        const result = await handleInboundMessage({
          area: resolved.area,
          channelType: resolved.platform,
          externalUserId: event.sender.id,
          body: described.body,
          externalMessageId: event.message.mid,
          messageType: described.messageType,
          metadata: { attachments: event.message.attachments ?? null, page_id: entry.id },
          aiReadable: described.aiReadable,
        });
        if (result.status === "duplicado") summary.duplicados++;
        else summary.mensajes++;
      } catch (err: any) {
        console.error("Error procesando webhook de Meta:", err);
        await quarantineWebhook({
          source: "meta",
          reason: "error_procesamiento",
          accountId: entry?.id ?? null,
          payload: { object: payload?.object ?? "page", entry: [{ ...entry, messaging: [event] }] },
          detail: String(err?.message ?? err).slice(0, 2000),
        });
        summary.retenidos++;
      }
    }
  }
  return summary;
}
