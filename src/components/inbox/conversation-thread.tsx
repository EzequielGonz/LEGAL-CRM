"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Area, Message } from "@/lib/supabase/database.types";
import { AreaBadge, SourceBadge, StatusBadge } from "@/components/ui/badge";
import { mergePoll, type DeliveryUpdate } from "@/lib/inbox/estados";

export interface ThreadContact {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  area: Area;
  status: string;
  source: string;
  qualification_data: Record<string, unknown>;
}

type ThreadMessage = Message & {
  message_type?: string | null;
  duplicate_of?: string | null;
  delivery_status?: string | null;
  delivery_status_at?: string | null;
};

/**
 * Tipos de mensaje con un archivo original: se guarda en el almacenamiento
 * privado y se abre desde acá (con sesión, por un enlace que vence a los
 * pocos minutos). "file" es el documento de Instagram/Facebook.
 */
const MEDIA_TYPES = new Set(["audio", "image", "video", "document", "sticker", "file"]);
const MEDIA_ACTION: Record<string, string> = {
  audio: "Escuchar audio",
  image: "Ver foto",
  video: "Ver video",
  document: "Abrir documento",
  file: "Abrir documento",
  sticker: "Ver sticker",
};

/** Cuántos archivos trae el mensaje (Instagram/Facebook pueden traer varios). */
function attachmentCount(m: ThreadMessage): number {
  const list = (m.metadata as any)?.attachments;
  return Array.isArray(list) && list.length > 1 ? Math.min(list.length, 10) : 1;
}

/** Cada cuánto se consultan mensajes nuevos mientras la pestaña está visible. */
const POLL_MS = 5000;

const DELIVERY_LABEL: Record<string, string> = {
  enviado: "Enviado",
  entregado: "Entregado",
  leido: "Leído",
  fallido: "No entregado",
};

export function ConversationThread({
  conversationId,
  aiEnabled,
  contact,
  initialMessages,
  ficha,
}: {
  conversationId: string;
  aiEnabled: boolean;
  contact: ThreadContact;
  initialMessages: Message[];
  /** Ficha compartida (la misma que en Prospectos), renderizada en el servidor. */
  ficha?: React.ReactNode;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages as ThreadMessage[]);
  const [aiOn, setAiOn] = useState(aiEnabled);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAtRef = useRef<string | null>(
    initialMessages.length ? initialMessages[initialMessages.length - 1].created_at : null
  );

  // Lecturas del lado del servidor (la clave pública ya no lee tablas):
  // se piden los mensajes posteriores al último que se ve en pantalla y el
  // estado de entrega actual de los salientes (Enviado → Entregado → Leído).
  const traerNuevos = useCallback(async () => {
    const qs = lastAtRef.current ? `?after=${encodeURIComponent(lastAtRef.current)}` : "";
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages${qs}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages?: ThreadMessage[]; estados?: DeliveryUpdate[] };
      const recibidos = data.messages ?? [];
      setMessages((prev) => mergePoll(prev, recibidos, data.estados ?? []));
      if (recibidos.length) lastAtRef.current = recibidos[recibidos.length - 1].created_at;
    } catch {
      // sin conexión: se reintenta en el próximo ciclo
    }
  }, [conversationId]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") traerNuevos();
    };
    const interval = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [traerNuevos]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    if (!draft.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendError(data.error ?? "No se pudo enviar el mensaje.");
        // El chat se toma antes de enviar: aunque el envío falle, la IA ya quedó apagada.
        if (res.status === 502 && !String(data.error ?? "").startsWith("No se pudo pausar")) setAiOn(false);
        return;
      }
      setDraft("");
      // El chat pasa a atención humana antes de enviar el mensaje manual.
      setAiOn(false);
      await traerNuevos();
    } finally {
      setSending(false);
    }
  }

  async function toggleAi() {
    const next = !aiOn;
    setAiOn(next);
    await fetch(`/api/conversations/${conversationId}/toggle-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ai_enabled: next }),
    });
  }

  const visibles = messages.filter((m) => !m.duplicate_of);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <div className="flex min-h-[70vh] min-w-0 flex-1 flex-col lg:min-h-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">
              {contact.full_name ?? "Sin nombre"}
            </p>
            <p className="text-xs text-slate-600 [overflow-wrap:anywhere]">{contact.phone ?? contact.email ?? "—"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AreaBadge area={contact.area} />
            <StatusBadge status={contact.status as any} />
            <SourceBadge source={contact.source} />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3 sm:p-5">
          {visibles.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.direction === "saliente" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`min-w-0 max-w-[85%] animate-fade-in-up rounded-2xl px-4 py-2 text-sm [overflow-wrap:anywhere] sm:max-w-md ${
                  m.direction === "saliente"
                    ? m.sender_type === "admin"
                      ? "bg-gradient-to-br from-slate-800 to-slate-900 text-gold-100 shadow-navy ring-1 ring-gold-500/20"
                      : "bg-blue-600 text-white"
                    : "bg-white text-slate-800 shadow-sm"
                }`}
              >
                {m.message_type && m.message_type !== "text" && m.message_type !== "button" && (
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    {m.message_type}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{m.body}</p>
                {m.direction === "entrante" && m.message_type && MEDIA_TYPES.has(m.message_type) && (
                  <div className="mt-1.5 space-y-1">
                    {m.message_type === "audio" && (
                      <audio controls preload="none" className="max-w-full" src={`/api/adjuntos/mensaje/${m.id}`} />
                    )}
                    {Array.from({ length: attachmentCount(m) }, (_, n) => (
                      <a
                        key={n}
                        href={`/api/adjuntos/mensaje/${m.id}${n ? `?n=${n}` : ""}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-3 inline-block text-xs font-medium underline"
                      >
                        {MEDIA_ACTION[m.message_type!] ?? "Abrir archivo"}
                        {attachmentCount(m) > 1 ? ` ${n + 1}` : ""}
                      </a>
                    ))}
                    <p className="text-[10px] opacity-60">Original en almacenamiento privado (solo con sesión).</p>
                  </div>
                )}
                <p
                  className={`mt-1 text-[10px] ${
                    m.direction === "saliente" ? "text-white/60" : "text-slate-400"
                  }`}
                >
                  {m.sender_type === "agente_ia" ? "Agente IA · " : m.sender_type === "admin" ? "Admin · " : ""}
                  {new Date(m.created_at).toLocaleString("es-AR")}
                  {m.direction === "saliente" && m.delivery_status
                    ? ` · ${DELIVERY_LABEL[m.delivery_status] ?? m.delivery_status}`
                    : ""}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input type="checkbox" checked={aiOn} onChange={toggleAi} />
              Agente IA activo en esta conversación
            </label>
          </div>
          {sendError && <p className="mb-2 text-xs text-red-600">{sendError}</p>}
          <div className="flex min-w-0 gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                aiOn
                  ? "Escribir desactiva el agente IA para esta conversación..."
                  : "Escribir un mensaje como administrador..."
              }
              aria-label="Mensaje"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
            />
            <button onClick={handleSend} disabled={sending} className="btn-gold">
              {sending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full shrink-0 border-t border-slate-200 bg-white p-4 lg:w-80 lg:overflow-y-auto lg:border-l lg:border-t-0">
        {ficha && <div className="mb-5">{ficha}</div>}
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Datos recopilados por la IA</h3>
        {Object.keys(contact.qualification_data ?? {}).length === 0 ? (
          <p className="text-xs text-slate-400">Todavía no hay datos recopilados.</p>
        ) : (
          <dl className="space-y-2">
            {Object.entries(contact.qualification_data).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs font-medium uppercase text-slate-400">
                  {key.replaceAll("_", " ")}
                </dt>
                <dd className="text-sm text-slate-800 [overflow-wrap:anywhere]">{String(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
