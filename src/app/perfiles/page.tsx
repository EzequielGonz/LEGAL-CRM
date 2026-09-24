import { createClient } from "@/lib/supabase/server";
import { PerfilSelector } from "@/components/perfiles/perfil-selector";

export const dynamic = "force-dynamic";

/**
 * Pantalla de Computadora (estilo Netflix): a la izquierda los 4 perfiles
 * (rubros), a la derecha una vista previa de estadísticas del rubro
 * seleccionado (casos agendados / clientes cerrados) antes de entrar de
 * lleno al panel de ese rubro. "Ingresar" lleva a /panel/[slug] — para
 * Jurídico eso redirige al panel completo de siempre; los otros rubros
 * todavía no tienen su motor de leads conectado (Fases 2/3 en curso), así
 * que por ahora muestran un aviso en vez del panel completo.
 *
 * A propósito NO usa el layout de (dashboard) (no tiene Sidebar ni nada
 * alrededor) — es una pantalla completa, standalone, igual que /inicio.
 */
export default async function PerfilesPage() {
  const supabase = createClient();

  const [{ data: rubros }, { data: statRows }] = await Promise.all([
    supabase
      .from("rubros")
      .select("id, slug, name, emoji, description")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("contacts")
      .select("rubro_id, status")
      .in("status", ["agendado", "cerrado_ganado"]),
  ]);

  const perfiles = (rubros ?? []).map((r: any) => {
    const rows = (statRows ?? []).filter((c: any) => c.rubro_id === r.id);
    return {
      ...r,
      agendados: rows.filter((c: any) => c.status === "agendado").length,
      cerrados: rows.filter((c: any) => c.status === "cerrado_ganado").length,
    };
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-float rounded-full bg-gold-500/10 blur-3xl" />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 animate-float rounded-full bg-gold-500/10 blur-3xl"
        style={{ animationDelay: "1.2s" }}
      />

      <div className="relative w-full max-w-4xl">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 font-serif text-lg font-bold text-slate-950 shadow-gold">
            E
          </span>
          <h1 className="font-serif text-xl font-semibold text-white sm:text-2xl">
            Elegí un perfil
          </h1>
          <p className="mt-1 text-sm text-slate-400">Estudio Vita — Panel central</p>
        </div>

        <PerfilSelector perfiles={perfiles} />
      </div>
    </div>
  );
}
