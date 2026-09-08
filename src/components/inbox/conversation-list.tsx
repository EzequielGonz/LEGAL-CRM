"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AreaBadge, StatusBadge } from "@/components/ui/badge";

export interface ConversationListItem {
  id: string;
  area: "civil" | "penal";
  status: string;
  last_message_at: string | null;
  ai_enabled: boolean;
  contact_name: string | null;
  channel_type: string;
  last_message_preview: string | null;
}

export function ConversationList({ items }: { items: ConversationListItem[] }) {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(key: string, value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    router.push(`/inbox?${sp.toString()}`);
  }

  return (
    <div className="flex h-full w-80 flex-col border-r border-slate-200 bg-white">
      <div className="space-y-2 border-b border-slate-200 p-3">
        <select
          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus-gold"
          defaultValue={searchParams.get("area") ?? ""}
          onChange={(e) => setFilter("area", e.target.value)}
        >
          <option value="">Todas las áreas</option>
          <option value="civil">Civil</option>
          <option value="penal">Penal</option>
        </select>
        <select
          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus-gold"
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

      <div className="flex-1 overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/inbox/${item.id}`}
            className={`block border-b border-slate-100 px-4 py-3 hover:bg-slate-50 ${
              params?.id === item.id ? "bg-slate-100" : ""
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">
                {item.contact_name ?? "Sin nombre"}
              </span>
              <AreaBadge area={item.area} />
            </div>
            <p className="mb-1 truncate text-xs text-slate-500">
              {item.last_message_preview ?? "Sin mensajes todavía"}
            </p>
            <div className="flex items-center justify-between">
              <StatusBadge status={item.status as any} />
              {!item.ai_enabled && (
                <span className="text-[10px] font-medium uppercase text-orange-600">
                  Tomada por humano
                </span>
              )}
            </div>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="p-4 text-sm text-slate-400">No hay conversaciones con estos filtros.</p>
        )}
      </div>
    </div>
  );
}
