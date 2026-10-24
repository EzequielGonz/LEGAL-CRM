import { createClient } from "@/lib/supabase/server";
import { AgentEditor } from "@/components/agentes/agent-editor";
import { AgentesEtapa3 } from "@/components/agentes/agentes-etapa3";
import { ResumenSeccion } from "@/components/nivel/resumen-seccion";
import { PuntajeBots } from "@/components/agentes/puntaje-bots";
import { RolesPorBase } from "@/components/agentes/roles-por-base";
import { ProbarBotReal } from "@/components/agentes/probar-bot-real";
import { FichaNegocio } from "@/components/agentes/ficha-negocio";

const NOMBRE_AREA: Record<string, string> = {
  civil: "Civil",
  penal: "Penal",
  coberturas_medicas: "Coberturas médicas",
  agencia_0km: "Autos 0 km",
  marketing: "Marketing",
};

/**
 * Agentes IA de un perfil (rediseño 17/10, bloque 3), igual en los cuatro.
 * Simple: quién responde hoy en cada área y la tarea principal (probar una
 * conversación con datos ficticios). Avanzado: biblioteca, versiones,
 * asignaciones y las instrucciones que responden hoy. Esta pantalla no
 * cambia nada sola: cada cambio se guarda aparte.
 */
export async function AgentesPerfilView({
  perfil,
  rubroId,
  areas,
  volver,
  descripcion,
}: {
  perfil: string;
  rubroId: string;
  areas: string[];
  volver: string;
  descripcion: string;
}) {
  const supabase = createClient();
  const { data: agents, error } = await supabase.from("ai_agents").select("*").in("area", areas).order("area");
  const activos = (agents ?? []).filter((a: any) => a.active);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Bot IA</h1>
        <p className="mt-1 text-sm text-slate-700">{descripcion}</p>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
          No se pudieron leer los agentes. No significa que estén apagados: volvé a intentar.
        </p>
      ) : null}

      <PuntajeBots rubroId={rubroId} />

      <ProbarBotReal perfil={perfil} areas={areas} />

      <FichaNegocio perfil={perfil} />

      <RolesPorBase perfil={perfil} />

      <ResumenSeccion
        id="agentes"
        etiqueta="Quién responde hoy"
        estado={
          (agents ?? []).length === 0
            ? "Todavía no hay un agente configurado"
            : activos.length === (agents ?? []).length
            ? "El agente responde los mensajes que entran"
            : activos.length === 0
            ? "El agente está apagado: los mensajes quedan para una persona"
            : `Responde en ${activos.length} de ${(agents ?? []).length} áreas`
        }
        detalle={<p>«Probar el bot real» responde con la misma configuración de hoy y mensajes ficticios: no escribe a nadie ni agenda citas reales.</p>}
        tono={activos.length === (agents ?? []).length && activos.length > 0 ? "ok" : "atencion"}
        puntos={(agents ?? []).map((a: any) => ({
          texto: `${NOMBRE_AREA[a.area] ?? a.area}: ${a.active ? "responde la IA" : "apagado, responde una persona"}`,
          tono: a.active ? ("ok" as const) : ("atencion" as const),
        }))}
        principal={{ texto: "Probar el bot real", href: "#probar-bot" }}
        personalizar={{ href: "#agentes-config", texto: "Personalizar instrucciones" }}
      />

      <div className="solo-avanzado">
        <AgentesEtapa3 perfil={perfil} rubroId={rubroId} areas={areas} volver={volver} />
      </div>

      <section id="agentes-config" tabIndex={-1} aria-labelledby="agentes-config-titulo" className="solo-avanzado">
        <h2 id="agentes-config-titulo" className="mb-2 text-base font-semibold text-slate-900">
          Configuración que responde hoy
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {(agents ?? []).map((agent: any) => (
            <AgentEditor key={agent.id} agent={agent} />
          ))}
          {(agents ?? []).length === 0 && <p className="text-sm text-slate-700">Todavía no hay un agente configurado para este perfil.</p>}
        </div>
      </section>
    </div>
  );
}
