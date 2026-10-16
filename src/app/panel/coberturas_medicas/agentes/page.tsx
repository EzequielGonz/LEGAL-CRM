import { createClient } from "@/lib/supabase/server";
import { AgentEditor } from "@/components/agentes/agent-editor";
import { AgentesEtapa3 } from "@/components/agentes/agentes-etapa3";

export const dynamic = "force-dynamic";

export default async function AgentesCoberturasMedicasPage() {
  const supabase = createClient();
  const { data: agents } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("area", "coberturas_medicas")
    .order("area");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Agentes IA</h1>
      <p className="mb-6 text-sm text-slate-500">
        Agente de Coberturas Médicas. No debe inventar información ni presentarse como parte de
        otro rubro.
      </p>

      <div className="mb-6">
        <AgentesEtapa3 perfil="coberturas_medicas" rubroId="33333333-3333-3333-3333-333333333333" areas={["coberturas_medicas"]} volver="/panel/coberturas_medicas/agentes" />
      </div>

      <h2 className="mb-2 text-base font-semibold text-slate-800">Configuración que responde hoy</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {(agents ?? []).map((agent) => (
          <AgentEditor key={agent.id} agent={agent as any} />
        ))}
        {(agents ?? []).length === 0 && (
          <p className="text-sm text-slate-400">
            Todavía no hay un agente configurado para Coberturas Médicas.
          </p>
        )}
      </div>
    </div>
  );
}
