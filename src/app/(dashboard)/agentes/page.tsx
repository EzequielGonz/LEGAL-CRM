import { createClient } from "@/lib/supabase/server";
import { AgentEditor } from "@/components/agentes/agent-editor";

export const dynamic = "force-dynamic";

export default async function AgentesPage() {
  const supabase = createClient();
  const { data: agents } = await supabase.from("ai_agents").select("*").order("area");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Agentes IA</h1>
      <p className="mb-6 text-sm text-slate-500">
        Cada área tiene su propio agente. No deben inventar información ni presentarse como
        abogados.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {(agents ?? []).map((agent) => (
          <AgentEditor key={agent.id} agent={agent as any} />
        ))}
      </div>
    </div>
  );
}
