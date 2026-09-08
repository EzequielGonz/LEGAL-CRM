"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/supabase/database.types";
import { AreaBadge, SourceBadge, StatusBadge } from "@/components/ui/badge";

export interface ThreadContact {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  area: "civil" | "penal";
  status: string;
  source: string;
  qualification_data: Record<string, unknown>;
}

export function ConversationThread({
  conversationId,
  aiEnabled,
  contact,
  initialMessages,
}: {
  conversationId: string;
  aiEnabled: boolean;
  contact: ThreadContact;
  initialMessages: Message[];
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [aiOn, setAiOn] = useState(aiEnabled);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    setDraft("");
    setSending(false);
    // El endpoint siempre apaga el agente IA al mandar un mensaje manual: si
    // no reflejamos esto acá, el checkbox se queda marcado como "activo"
    // hasta que se recargue la página, aunque el backend ya lo desactivó.
    setAiOn(false);
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

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {contact.full_name ?? "Sin nombre"}
            </p>
            <p className="text-xs text-slate-400">{contact.phone ?? contact.email ?? "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            <AreaBadge area={contact.area} />
            <StatusBadge status={contact.status as any} />
            <SourceBadge source={contact.source} />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.direction === "saliente" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md animate-fade-in-up rounded-2xl px-4 py-2 text-sm ${
                  m.direction === "saliente"
                    ? m.sender_type === "admin"
                      ? "bg-gradient-to-br from-slate-800 to-slate-900 text-gold-100 shadow-navy ring-1 ring-gold-500/20"
                      : "bg-blue-600 text-white"
                    : "bg-white text-slate-800 shadow-sm"
                }`}
              >
                <p>{m.body}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    m.direction === "saliente" ? "text-white/60" : "text-slate-400"
                  }`}
                >
                  {m.sender_type === "agente_ia" ? "Agente IA · " : m.sender_type === "admin" ? "Admin · " : ""}
                  {new Date(m.created_at).toLocaleString("es-AR")}
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
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                aiOn
                  ? "Escribir desactiva el agente IA para esta conversación..."
                  : "Escribir un mensaje como administrador..."
              }
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
            />
            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-gold"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>

      <div className="w-72 border-l border-slate-200 bg-white p-4">
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
                <dd className="text-sm text-slate-800">{String(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
