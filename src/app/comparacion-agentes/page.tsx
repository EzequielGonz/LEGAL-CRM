import { requirePageSession } from "@/lib/acceso/pagina";

export const dynamic = "force-dynamic";

// Sección en preparación: se completa con la entrega del bloque 16/10.
export default async function ComparacionAgentesPage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-2xl font-semibold text-slate-900">Comparación de agentes</h1>
      <p className="mt-2 text-sm text-slate-600">Esta sección se habilita con la próxima entrega.</p>
    </div>
  );
}
