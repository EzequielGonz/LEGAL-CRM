import clsx from "clsx";
import type { Area, ConversationStatus } from "@/lib/supabase/database.types";

export function AreaBadge({ area }: { area: Area }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        area === "civil" ? "bg-civil-light text-civil" : "bg-penal-light text-penal"
      )}
    >
      {area === "civil" ? "Civil" : "Penal"}
    </span>
  );
}

export const STATUS_LABEL: Record<ConversationStatus, string> = {
  nuevo: "Nuevo",
  en_conversacion: "En conversación",
  esperando_respuesta_prospecto: "Esperando prospecto",
  calificando: "Calificando",
  calificado: "Calificado",
  no_califica: "No califica",
  agendado: "Agendado",
  cerrado_ganado: "Cerrado (ganado)",
  cerrado_perdido: "Cerrado (perdido)",
  requiere_atencion_humana: "Requiere atención humana",
};

const STATUS_COLOR: Record<ConversationStatus, string> = {
  nuevo: "bg-slate-100 text-slate-700",
  en_conversacion: "bg-blue-100 text-blue-700",
  esperando_respuesta_prospecto: "bg-amber-100 text-amber-700",
  calificando: "bg-indigo-100 text-indigo-700",
  calificado: "bg-teal-100 text-teal-700",
  no_califica: "bg-slate-200 text-slate-600",
  agendado: "bg-gold-100 text-gold-800 ring-1 ring-gold-500/30",
  cerrado_ganado: "bg-green-100 text-green-700",
  cerrado_perdido: "bg-red-100 text-red-700",
  requiere_atencion_humana: "bg-orange-100 text-orange-700",
};

export function StatusBadge({ status }: { status: ConversationStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_COLOR[status]
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  organico_instagram: "Instagram",
  organico_facebook: "Facebook",
  organico_whatsapp: "WhatsApp",
  anuncio_instagram: "Anuncio Instagram",
  anuncio_facebook: "Anuncio Facebook",
  landing: "Landing",
  base_de_datos: "Base de datos",
};

export function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      {SOURCE_LABEL[source] ?? source}
    </span>
  );
}
