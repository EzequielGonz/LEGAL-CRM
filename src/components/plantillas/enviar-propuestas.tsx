"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LineaView {
  id: string;
  label: string;
  active: boolean;
  access: { ok: boolean; missing: string[] };
}

/**
 * Envía a Meta, para su revisión, las plantillas propuestas del rubro de cada
 * línea. Primero muestra qué se enviaría y pide confirmación. No manda
 * mensajes a personas.
 */
export function EnviarPropuestas({ lines }: { lines: LineaView[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function enviar(lineId: string) {
    setBusy(lineId);
    setMsg(null);
    try {
      const call = (confirmar: boolean) =>
        fetch("/api/plantillas/enviar-a-meta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ line_id: lineId, confirmar }),
        }).then(async (r) => ({ ok: r.ok, d: await r.json().catch(() => ({})) }));

      const prev = await call(false);
      if (!prev.ok) {
        setMsg({ ok: false, text: prev.d.error ?? (prev.d.faltantes ? `Falta: ${prev.d.faltantes.join(", ")}` : "No se pudo preparar el envío.") });
        return;
      }
      const resultados: any[] = prev.d.resultados ?? [];
      const nuevas = resultados.filter((x) => x.estado === "se_enviaría");
      const existentes = resultados.filter((x) => x.estado === "ya_existe").length;
      const conError = resultados.filter((x) => x.estado === "error");
      if (conError.length) {
        setMsg({ ok: false, text: `No se pudo comprobar la cuenta: ${conError[0].detalle ?? "error de Meta"}` });
        return;
      }
      if (nuevas.length === 0) {
        setMsg({ ok: true, text: `No hay plantillas nuevas para enviar (${existentes} ya existen en Meta).` });
        return;
      }
      const ok = window.confirm(
        `Se enviarán ${nuevas.length} plantilla(s) a Meta para su revisión (${existentes} ya existen y se omiten).\n\nNo se envía ningún mensaje a personas. ¿Confirmás?`
      );
      if (!ok) {
        setMsg({ ok: true, text: "Envío cancelado. No se envió nada a Meta." });
        return;
      }
      const res = await call(true);
      if (!res.ok) {
        setMsg({ ok: false, text: res.d.error ?? "No se pudo enviar." });
        return;
      }
      const r: any[] = res.d.resultados ?? [];
      const enviadas = r.filter((x) => x.estado === "enviada_a_revision").length;
      const fallas = r.filter((x) => x.estado === "error");
      setMsg({
        ok: fallas.length === 0,
        text: `${enviadas} plantilla(s) enviadas a revisión de Meta.${
          fallas.length ? ` ${fallas.length} con error: ${fallas.map((x) => `${x.nombre} (${x.detalle})`).join("; ")}.` : ""
        } Usá «Leer plantillas de Meta» para ver su estado.`,
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const activas = lines.filter((l) => l.active);
  if (activas.length === 0) return null;
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3 text-sm">
      <p className="font-medium text-slate-800">Enviar propuestas a revisión de Meta</p>
      <p className="text-xs text-slate-500">
        Registra en la cuenta de WhatsApp Business de la línea las plantillas propuestas de este rubro. Meta las revisa (de minutos a 24 horas).
        No se envía ningún mensaje a personas; las que ya existen se omiten.
      </p>
      <div className="flex flex-wrap gap-2">
        {activas.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => enviar(l.id)}
            disabled={!l.access.ok || busy !== null}
            title={l.access.ok ? "" : `Falta en la configuración privada: ${l.access.missing.join(", ")}`}
            className="rounded-lg border border-slate-800 bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {busy === l.id ? "Enviando…" : `Enviar desde «${l.label}»`}
          </button>
        ))}
      </div>
      <p role="status" className={`text-xs ${msg?.ok ? "text-green-700" : "font-medium text-red-700"}`}>{msg?.text ?? ""}</p>
    </div>
  );
}
