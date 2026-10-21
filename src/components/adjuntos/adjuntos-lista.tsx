import { EnlaceDetalle } from "@/components/ui/enlaces-navegacion";
import { GuardarAhora } from "@/components/adjuntos/guardar-ahora";
import { KIND_LABEL, STATUS_LABEL, formatBytes, type AttachmentKind, type AttachmentStatus } from "@/lib/adjuntos/modelo";

export interface AttachmentRow {
  id: string;
  kind: string;
  status: string;
  file_name: string | null;
  size_bytes: number | null;
  received_at: string;
  expires_at: string | null;
  last_error: string | null;
  conversation_id?: string | null;
}

const STATUS_TONE: Record<string, string> = {
  guardado: "bg-emerald-50 text-emerald-700",
  pendiente: "bg-amber-50 text-amber-800",
  error: "bg-red-50 text-red-700",
  vencido: "bg-slate-100 text-slate-500",
  demasiado_grande: "bg-slate-100 text-slate-500",
};

/**
 * Originales que mandó la persona (audios, fotos, videos y documentos).
 * Se abren con sesión por un enlace que vence a los pocos minutos. No se
 * comparten solos con nadie: el texto para compartir no los incluye.
 */
export function AdjuntosLista({ rows, showConversation = false }: { rows: AttachmentRow[]; showConversation?: boolean }) {
  if (!rows.length) return <p className="text-xs text-slate-400">No mandó audios, fotos ni documentos.</p>;
  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {rows.map((a) => {
        const canOpen = a.status === "guardado" || a.status === "pendiente" || a.status === "error";
        const canSave = a.status === "pendiente" || a.status === "error";
        return (
          <li key={a.id} className="flex flex-col gap-1 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-slate-800">
                {KIND_LABEL[a.kind as AttachmentKind] ?? a.kind}
                {a.file_name ? ` · ${a.file_name}` : ""}
                {a.size_bytes ? ` · ${formatBytes(a.size_bytes)}` : ""}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[a.status] ?? "bg-slate-100"}`}>
                  {STATUS_LABEL[a.status as AttachmentStatus] ?? a.status}
                </span>
              </p>
              <p className="text-xs text-slate-400">
                Recibido {new Date(a.received_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
                {canSave && a.expires_at ? ` · se puede guardar hasta ${new Date(a.expires_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}` : ""}
                {a.status !== "guardado" && a.last_error ? ` · ${a.last_error}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              {canOpen && (
                <a href={`/api/adjuntos/${a.id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-700 underline">
                  Abrir
                </a>
              )}
              {showConversation && a.conversation_id && (
                <EnlaceDetalle href={`/inbox/${a.conversation_id}`} className="text-slate-500 hover:underline">
                  Conversación
                </EnlaceDetalle>
              )}
              {canSave && <GuardarAhora attachmentId={a.id} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
