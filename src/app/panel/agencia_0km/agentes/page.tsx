import { createClient } from "@/lib/supabase/server";
import { AgentEditor } from "@/components/agentes/agent-editor";

export const dynamic = "force-dynamic";

export default async function Agentes0kmPage() {
  const supabase = createClient();
  const { data: agents } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("area", "agencia_0km")
    .order("area");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Agentes IA</h1>
      <p className="mb-6 text-sm text-slate-500">
        Agente de Agencia 0KM. No debe inventar información ni presentarse como parte de otro
        rubro.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {(agents ?? []).map((agent) => (
          <AgentEditor key={agent.id} agent={agent as any} />
        ))}
        {(agents ?? []).length === 0 && (
          <p className="text-sm text-slate-400">
            Todavía no hay un agente configurado para Agencia 0KM.
          </p>
        )}
      </div>
    </div>
  );
}
