import { AgentesPerfilView } from "@/components/agentes/agentes-perfil-view";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agentes IA" };

export default function AgentesPage() {
  return (
    <AgentesPerfilView
      perfil="agencia_0km"
      rubroId={RUBRO_IDS.agencia_0km}
      areas={["agencia_0km"]}
      volver="/panel/agencia_0km/agentes"
      descripcion="Agente de Autos 0 km. No debe inventar información ni presentarse como parte de otro rubro."
    />
  );
}
