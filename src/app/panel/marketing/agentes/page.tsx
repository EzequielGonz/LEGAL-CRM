import { createClient } from "@/lib/supabase/server";
import { AgentEditor } from "@/components/agentes/agent-editor";
import { AgentesEtapa3 } from "@/components/agentes/agentes-etapa3";

export const dynamic = "force-dynamic";

export default async function AgentesMarketingPage() {
  const supabase = createClient();
  const { data: agents } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("area", "marketing")
    .order("area");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Agentes IA</h1>
      <p className="mb-6 text-sm text-slate-500">
        Agente de Marketing. No debe inventar información ni presentarse como parte de otro
        rubro.
      </p>

      <div className="mb-6">
        <AgentesEtapa3 perfil="marketing" rubroId="44444444-4444-4444-4444-444444444444" areas={["marketing"]} volver="/panel/marketing/agentes" />
      </div>

      <h2 className="mb-2 text-base font-semibold text-slate-800">Configuración que responde hoy</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {(agents ?? []).map((agent) => (
          <AgentEditor key={agent.id} agent={agent as any} />
        ))}
        {(agents ?? []).length === 0 && (
          <p className="text-sm text-slate-400">
            Todavía no hay un agente configurado para Marketing.
          </p>
        )}
      </div>
    </div>
  );
}
