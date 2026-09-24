"use client";

import { useState } from "react";
import { AreaBadge } from "@/components/ui/badge";
import type { Area } from "@/lib/supabase/database.types";

/**
 * Tarjeta de un caso en la pantalla de Teléfono ("Casos listos para
 * derivar"). El botón "Enviar a WhatsApp" NO manda nada automáticamente:
 * abre WhatsApp (wa.me, sin número puesto) con el texto ya armado — ahí
 * mismo la persona elige a qué profesional/contacto mandárselo y confirma
 * el envío ella misma, como cualquier link de WhatsApp normal.
 *
 * `derived_at` en la base es solo un tilde visual de "ya lo mandé" (se
 * marca apenas se toca el botón, no cuando de verdad se confirma el envío
 * en WhatsApp, porque eso ya pasa fuera de nuestra app) — así la persona
 * que va revisando esta lista no tiene que acordarse a mano cuáles ya
 * pasó. El caso no desaparece de la lista al marcarse: sigue ahí por si
 * hace falta reenviarlo.
 */
export function CasoCard({
  contactId,
  fullName,
  phone,
  area,
  waText,
  initiallyDerived,
}: {
  contactId: string;
  fullName: string;
  phone: string;
  area: Area;
  waText: string;
  initiallyDerived: boolean;
}) {
  const [derived, setDerived] = useState(initiallyDerived);
  const [sending, setSending] = useState(false);

  async function handleEnviar() {
    setSending(true);
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank");
    setDerived(true);
    try {
      await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ derived_at: new Date().toISOString() }),
      });
    } catch {
      // Si falla el guardado del tilde no pasa nada grave: el mensaje ya se
      // abrió en WhatsApp igual, y se puede volver a tocar el botón.
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{fullName}</p>
          <p className="text-sm text-slate-500">{phone}</p>
        </div>
        <AreaBadge area={area} />
      </div>

      {derived && (
        <p className="mb-3 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
          ✓ Enviado
        </p>
      )}

      <button
        onClick={handleEnviar}
        disabled={sending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        📲 {derived ? "Reenviar a WhatsApp" : "Enviar a WhatsApp"}
      </button>
    </div>
  );
}
