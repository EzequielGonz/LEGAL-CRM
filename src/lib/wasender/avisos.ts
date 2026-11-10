import type { Area } from "@/lib/supabase/database.types";
import { sendWhatsAppText } from "@/lib/whatsapp/client";
import { destinoAviso } from "@/lib/wasender/equivalencias";
import { enviarPorWasender, LineaWasenderNoDisponible } from "@/lib/wasender/envio";

/**
 * Avisos internos al equipo (10/11, bloque 2): nuevo cliente agendado, caso
 * calificado, lead de Marketing. Son mensajes a los teléfonos del equipo,
 * nunca a prospectos. Salen por Wasender si el perfil tiene línea de avisos o
 * si la conexión de Meta del área ya se pasó a Wasender; si no, por Meta,
 * exactamente como antes.
 */
export async function enviarAvisoInterno(area: Area, telefono: string, texto: string): Promise<void> {
  const destino = await destinoAviso(area).catch((err) => {
    console.error("[avisos] No se pudo decidir por dónde sale el aviso; sale por Meta como siempre:", err);
    return { proveedor: "meta" } as const;
  });
  if (destino.proveedor === "meta") {
    await sendWhatsAppText(area, telefono, texto);
    return;
  }
  try {
    await enviarPorWasender({ lineaId: destino.lineaId, to: telefono, body: texto });
  } catch (err) {
    // Un aviso al equipo no se pierde por una línea de avisos apagada: si la conexión de Meta del
    // área sigue en Meta, sale por ahí. Si ya se pasó a Wasender, no hay a dónde más mandarlo.
    if (err instanceof LineaWasenderNoDisponible && !destino.obligatorio) {
      await sendWhatsAppText(area, telefono, texto);
      return;
    }
    throw err;
  }
}
