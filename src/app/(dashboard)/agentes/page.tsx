import { AgentesPerfilView } from "@/components/agentes/agentes-perfil-view";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agentes IA" };

export default function AgentesPage() {
  return (
    <AgentesPerfilView
      perfil="juridico"
      rubroId={RUBRO_IDS.juridico}
      areas={["civil", "penal"]}
      volver="/agentes"
      descripcion="Cada área tiene su propio agente. No deben inventar información ni presentarse como abogados."
    />
  );
}
