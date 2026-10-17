import { AgentesPerfilView } from "@/components/agentes/agentes-perfil-view";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agentes IA" };

export default function AgentesPage() {
  return (
    <AgentesPerfilView
      perfil="marketing"
      rubroId={RUBRO_IDS.marketing}
      areas={["marketing"]}
      volver="/panel/marketing/agentes"
      descripcion="Agente de Marketing. No debe inventar información ni presentarse como parte de otro rubro."
    />
  );
}
