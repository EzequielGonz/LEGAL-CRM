import { AgentesPerfilView } from "@/components/agentes/agentes-perfil-view";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agentes IA" };

export default function AgentesPage() {
  return (
    <AgentesPerfilView
      perfil="coberturas_medicas"
      rubroId={RUBRO_IDS.coberturas_medicas}
      areas={["coberturas_medicas"]}
      volver="/panel/coberturas_medicas/agentes"
      descripcion="Agente de Coberturas médicas. No debe inventar información ni presentarse como parte de otro rubro."
    />
  );
}
