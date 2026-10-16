import { createClient } from "@/lib/supabase/server";
import { AgentEditor } from "@/components/agentes/agent-editor";
import { AgentesEtapa3 } from "@/components/agentes/agentes-etapa3";

export const dynamic = "force-dynamic";

export default async function AgentesPage() {
  const supabase = createClient();
  // Filtrado a civil/penal: sin esto, los agentes de los rubros nuevos
  // (Agencia 0KM, etc.) aparecían mezclados acá — cada rubro ahora tiene su
  // propia página de Agentes en su panel dedicado (/panel/<rubro>/agentes).
  const { data: agents } = await supabase
    .from("ai_agents")
    .select("*")
    .in("area", ["civil", "penal"])
    .order("area");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Agentes IA</h1>
      <p className="mb-6 text-sm text-slate-500">
        Cada área tiene su propio agente. No deben inventar información ni presentarse como
        abogados.
      </p>

      <div className="mb-6">
        <AgentesEtapa3 perfil="juridico" rubroId="11111111-1111-1111-1111-111111111111" areas={["civil", "penal"]} volver="/agentes" />
      </div>

      <h2 className="mb-2 text-base font-semibold text-slate-800">Configuración que responde hoy</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {(agents ?? []).map((agent) => (
          <AgentEditor key={agent.id} agent={agent as any} />
        ))}
      </div>
    </div>
  );
}
