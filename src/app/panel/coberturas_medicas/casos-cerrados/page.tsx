import { redirect } from "next/navigation";
import { destinoDeCasosViejos } from "@/lib/cartera";

export const dynamic = "force-dynamic";

/** 13/11: la tabla vieja «Captados y casos» se retiró. Cada pestaña lleva a su lista de Contactos. */
export default async function CasosPage(props: { searchParams: Promise<{ vista?: string }> }) {
  const searchParams = await props.searchParams;
  redirect(destinoDeCasosViejos("coberturas_medicas", searchParams.vista));
}
