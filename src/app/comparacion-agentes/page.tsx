import { redirect } from "next/navigation";

/** La comparación de agentes se cerró el 21/10: responde siempre el modelo vigente. */
export default async function ComparacionCerrada(props: { searchParams: Promise<{ perfil?: string }> }) {
  const searchParams = await props.searchParams;
  const p = searchParams?.perfil;
  redirect(p && p !== "juridico" ? `/panel/${p}/agentes` : "/agentes");
}
