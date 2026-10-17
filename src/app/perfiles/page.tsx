import { LogoutButton } from "@/components/acceso/logout-button";
import { PerfilSelector } from "@/components/perfiles/perfil-selector";
import { LamparaDecorativa, SalaLampara, SelloLampara } from "@/components/ui/lampara-dibujo";
import { loadPerfiles } from "@/lib/perfiles-stats";
import { requirePageSession } from "@/lib/acceso/pagina";

export const dynamic = "force-dynamic";

/**
 * Pantalla de Computadora (estilo Netflix): a la izquierda los 4 perfiles
 * (rubros), a la derecha una vista previa en vivo de ese rubro — casos
 * agendados, clientes cerrados, y el nombre + teléfono de los últimos
 * casos cerrados (mismo criterio que /casos-cerrados). "Ingresar al
 * panel →" lleva a /panel/[slug] — para Jurídico eso manda directo a
 * /casos-cerrados; los otros rubros todavía no tienen su motor de leads
 * conectado (Fases 2/3 en curso), así que por ahora muestran un aviso.
 *
 * Esta primera carga trae los datos por el server (rápido, sin parpadeo);
 * después el PerfilSelector se subscribe a Supabase Realtime para que la
 * vista se actualice sola apenas cambia algo en Casos, sin recargar.
 *
 * A propósito NO usa el layout de (dashboard) (no tiene Sidebar ni nada
 * alrededor) — es una pantalla completa, standalone, igual que /inicio.
 */
export default async function PerfilesPage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfiles = await loadPerfiles();

  return (
    <div className="escena-oscura escena-3d flex items-center justify-center px-4 py-12">
      <SalaLampara />
      <LamparaDecorativa className="sala-lampara-lateral sala-lampara-ancha" />

      <div className="escena-capa relative w-full max-w-4xl">
        <div className="mb-8 text-center">
          <SelloLampara className="sello-grande mx-auto mb-5 animate-scale-in" />
          <h1 className="font-serif text-xl font-semibold text-white sm:text-2xl">
            Elegí un perfil
          </h1>
          <p className="mt-1 text-sm text-slate-400">Panel central</p>
          <div className="mt-2">
            <LogoutButton className="text-xs" />
          </div>
        </div>

        <PerfilSelector perfiles={perfiles} />
      </div>
    </div>
  );
}
