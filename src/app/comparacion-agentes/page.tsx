import { redirect } from "next/navigation";

/** La comparación de agentes se cerró el 21/10: responde siempre el modelo vigente. */
export default function ComparacionCerrada({ searchParams }: { searchParams: { perfil?: string } }) {
  const p = searchParams?.perfil;
  redirect(p && p !== "juridico" ? `/panel/${p}/agentes` : "/agentes");
}
