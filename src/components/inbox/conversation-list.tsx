"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AreaBadge } from "@/components/ui/badge";

export interface ConversationListItem {
  id: string;
  area: string;
  status: string;
  last_message_at: string | null;
  ai_enabled: boolean;
  contact_name: string | null;
  phone: string | null;
  channel_type: string;
  last_message_preview: string | null;
  last_from_contact: boolean;
  attention_state: string | null;
  attention_reason: string | null;
  detained: "detenido" | "retenido" | null;
}

/** La lista se vuelve a pedir al servidor cada 15 s (mientras se ve la pestaña). */
const LIST_REFRESH_MS = 15000;

const ATTENTION_LABEL: Record<string, string> = {
  requiere_humano: "Requiere atención humana",
  humano_en_curso: "Atención humana en curso",
};

/**
 * Lista del Inbox con filtros, búsqueda, total y páginas del lado del
 * servidor (bloques 1.5 y 1.8). Lo que entra se ve sin recargar.
 */
export function ConversationList() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(40);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const page = Math.max(1, Number(searchParams.get("pagina")) || 1);
  const qs = searchParams.toString();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/inbox?${qs}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 40);
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, LIST_REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  function setFilter(key: string, value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    sp.delete("pagina");
    const base = params?.id ? `/inbox/${params.id}` : "/inbox";
    router.push(`${base}?${sp.toString()}`);
  }

  function goPage(p: number) {
    const sp = new URLSearchParams(searchParams.toString());
    if (p > 1) sp.set("pagina", String(p));
    else sp.delete("pagina");
    const base = params?.id ? `/inbox/${params.id}` : "/inbox";
    router.push(`${base}?${sp.toString()}`);
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const keep = qs ? `?${qs}` : "";

  return (
    // Teléfono y tablet chica: lista o conversación, una a la vez (la
    // conversación tiene su «Volver»); desde 768 px, las dos lado a lado.
    <div className={`${params?.id ? "hidden md:flex" : "flex"} h-full w-full shrink-0 flex-col border-r border-slate-200 bg-white md:w-72 xl:w-80`}>
      <div className="space-y-2 border-b border-slate-200 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFilter("q", q.trim());
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nombre o teléfono"
            aria-label="Buscar conversaciones por nombre o teléfono"
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus-gold"
          />
        </form>
        <div className="grid grid-cols-2 gap-2">
          <select
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus-gold"
            aria-label="Área"
            defaultValue={searchParams.get("area") ?? ""}
            onChange={(e) => setFilter("area", e.target.value)}
          >
            <option value="">Todas las áreas</option>
            <option value="civil">Civil</option>
            <option value="penal">Penal</option>
          </select>
          <select
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus-gold"
            aria-label="Canal"
            defaultValue={searchParams.get("canal") ?? ""}
            onChange={(e) => setFilter("canal", e.target.value)}
          >
            <option value="">Todos los canales</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="landing">Landing</option>
          </select>
        </div>
        <select
          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus-gold"
          aria-label="Atención"
          defaultValue={searchParams.get("atencion") ?? ""}
          onChange={(e) => setFilter("atencion", e.target.value)}
        >
          <option value="">Toda la atención</option>
          <option value="requiere_humano">Requiere atención humana</option>
          <option value="humano_en_curso">Atención humana en curso</option>
          <option value="ia">Gestionado por IA</option>
          <option value="detenidos">Detenidos (vista secundaria)</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/inbox/${item.id}${keep}`}
            className={`block border-b border-slate-100 px-4 py-3 hover:bg-slate-50 ${params?.id === item.id ? "bg-slate-100" : ""}`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-medium text-slate-900">{item.contact_name ?? item.phone ?? "Sin nombre"}</span>
              <AreaBadge area={item.area as any} />
            </div>
            <p className={`mb-1 truncate text-xs ${item.last_from_contact ? "font-medium text-slate-700" : "text-slate-500"}`}>
              {item.last_message_preview ?? "Sin mensajes todavía"}
            </p>
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-[10px] font-medium uppercase [overflow-wrap:anywhere]">
              {item.last_message_at && <span className="normal-case text-slate-400">{new Date(item.last_message_at).toLocaleString("es-AR")}</span>}
              {item.attention_state && ATTENTION_LABEL[item.attention_state] && (
                <span className="text-orange-600">
                  {ATTENTION_LABEL[item.attention_state]}
                  {item.attention_reason ? <span className="normal-case"> · {item.attention_reason}</span> : null}
                </span>
              )}
              {!item.ai_enabled && !item.attention_state && <span className="text-orange-600">Tomada por humano</span>}
              {item.detained && <span className="text-red-600">{item.detained}</span>}
            </div>
          </Link>
        ))}
        {!loading && items.length === 0 && <p className="p-4 text-sm text-slate-400">No hay conversaciones con estos filtros.</p>}
        {loading && <p className="p-4 text-sm text-slate-400">Cargando…</p>}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-[11px] text-slate-500">
        <span>{total.toLocaleString("es-AR")} conversaciones</span>
        <span className="flex items-center gap-2">
          <button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => goPage(page - 1)} className="tactil px-2 disabled:text-slate-300">
            ←
          </button>
          {page}/{pages}
          <button type="button" aria-label="Página siguiente" disabled={page >= pages} onClick={() => goPage(page + 1)} className="tactil px-2 disabled:text-slate-300">
            →
          </button>
        </span>
      </div>
    </div>
  );
}
