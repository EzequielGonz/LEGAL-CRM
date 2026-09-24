import { createClient } from "@/lib/supabase/server";
import { CasoCard } from "@/components/derivar/caso-card";

export const dynamic = "force-dynamic";

const SENDER_LABEL: Record<string, string> = {
  prospecto: "Cliente",
  agente_ia: "Asistente",
  admin: "Estudio",
};

/**
 * Arma el texto que se manda por WhatsApp: toda la info del caso (datos de
 * contacto + lo que recopiló la IA) más la conversación completa, en un
 * texto prolijo y ordenado — para que el profesional que lo reciba tenga
 * todo el contexto sin tener que entrar al panel.
 */
function buildWaText(contact: any, messages: any[]): string {
  const lines: string[] = [];

  lines.push("🆕 CASO LISTO PARA DERIVAR");
  lines.push("");
  lines.push(`Nombre: ${contact.full_name ?? "(no informado)"}`);
  lines.push(`Teléfono: ${contact.phone ?? "(no informado)"}`);
  lines.push(`Área: ${(contact.area ?? "").toUpperCase()}`);
  if (contact.email) lines.push(`Email: ${contact.email}`);

  const datos = Object.entries(contact.qualification_data ?? {}) as [string, unknown][];
  if (datos.length > 0) {
    lines.push("");
    lines.push("Información recopilada:");
    for (const [key, value] of datos) {
      lines.push(`- ${key.replaceAll("_", " ")}: ${value}`);
    }
  }

  if (messages.length > 0) {
    lines.push("");
    lines.push("——— Conversación ———");
    for (const m of messages) {
      if (!m.body) continue;
      const label = SENDER_LABEL[m.sender_type] ?? m.sender_type;
      const hora = new Date(m.created_at).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      lines.push(`[${hora}] ${label}: ${m.body}`);
    }
  }

  return lines.join("\n");
}

/**
 * Pantalla de Teléfono: "Casos listos para derivar". Es standalone (no usa
 * el layout de (dashboard), no tiene Sidebar ni ningún otro link) — a
 * propósito, para que quien entra acá solo pueda ver esta lista y mandar
 * los casos por WhatsApp, sin poder navegar a ningún otro lado del sistema.
 *
 * Los casos que aparecen acá son específicamente los que se cerraron solos
 * al terminar el cuestionario de "Mi caso está pendiente" (intake-flow.ts):
 * contacto en "Cerrado (ganado)" Y con la conversación en
 * intake_step = "completado". No cualquier caso cerrado a mano desde otro
 * lado entra acá — esto es puntualmente la cola de casos que salieron del
 * cuestionario automático y todavía hay que derivar a un profesional.
 *
 * Arriba de la lista se muestra un resumen de estadísticas de los 4
 * rubros (casos agendados / clientes cerrados), como pidió Vita — así
 * desde el celular se puede ver de un vistazo cómo viene cada rubro, no
 * solo Jurídico (que es, por ahora, el único con datos reales).
 */
export default async function DerivarPage() {
  const supabase = createClient();

  const [{ data: contacts }, { data: rubros }, { data: statRows }] = await Promise.all([
    supabase
      .from("contacts")
      .select(
        "id, full_name, phone, area, email, qualification_data, derived_at, updated_at, rubros(name, emoji), conversations!inner(id, intake_step, messages(id, sender_type, body, created_at))"
      )
      .eq("status", "cerrado_ganado")
      .eq("conversations.intake_step", "completado")
      .order("updated_at", { ascending: false }),
    supabase
      .from("rubros")
      .select("id, name, emoji")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("contacts").select("rubro_id, status").in("status", ["agendado", "cerrado_ganado"]),
  ]);

  const casos = (contacts ?? []).map((c: any) => {
    const conv = Array.isArray(c.conversations) ? c.conversations[0] : c.conversations;
    const messages = ((conv?.messages ?? []) as any[])
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const rubro = Array.isArray(c.rubros) ? c.rubros[0] : c.rubros;
    return { ...c, messages, rubro };
  });

  const resumenRubros = (rubros ?? []).map((r: any) => {
    const rows = (statRows ?? []).filter((c: any) => c.rubro_id === r.id);
    return {
      ...r,
      agendados: rows.filter((c: any) => c.status === "agendado").length,
      cerrados: rows.filter((c: any) => c.status === "cerrado_ganado").length,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-6 shadow-navy">
        <p className="text-xs uppercase tracking-wider text-gold-300">Estudio Vita</p>
        <h1 className="font-serif text-xl font-semibold text-white">Casos listos para derivar</h1>
        <p className="mt-1 text-sm text-slate-300">
          {casos.length === 0
            ? "No hay casos nuevos por ahora."
            : `${casos.length} caso${casos.length === 1 ? "" : "s"} esperando.`}
        </p>
      </header>

      <div className="flex gap-3 overflow-x-auto px-4 pb-1 pt-4">
        {resumenRubros.map((r: any) => (
          <div
            key={r.id}
            className="min-w-[140px] shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <p className="text-lg leading-none">{r.emoji}</p>
            <p className="mt-1 truncate text-xs font-medium text-slate-500">{r.name}</p>
            <div className="mt-1.5 flex items-center gap-3">
              <span>
                <span className="text-sm font-semibold text-slate-900">{r.agendados}</span>{" "}
                <span className="text-[10px] text-slate-400">agend.</span>
              </span>
              <span>
                <span className="text-sm font-semibold text-slate-900">{r.cerrados}</span>{" "}
                <span className="text-[10px] text-slate-400">cerr.</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 px-4 py-5">
        {casos.map((c: any) => (
          <CasoCard
            key={c.id}
            contactId={c.id}
            fullName={c.full_name ?? "Sin nombre"}
            phone={c.phone ?? "—"}
            area={c.area}
            rubroName={c.rubro?.name}
            rubroEmoji={c.rubro?.emoji}
            waText={buildWaText(c, c.messages)}
            initiallyDerived={Boolean(c.derived_at)}
          />
        ))}

        {casos.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            Todavía no hay casos cerrados para derivar.
          </p>
        )}
      </div>
    </div>
  );
}
