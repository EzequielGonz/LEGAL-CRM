import { redirect } from "next/navigation";
import { destinoDeCasosViejos } from "@/lib/cartera";

export const dynamic = "force-dynamic";

/** 13/11: la tabla vieja «Captados y casos» se retiró. Cada pestaña lleva a su lista de Contactos. */
export default function CasosPage({ searchParams }: { searchParams: { vista?: string } }) {
  redirect(destinoDeCasosViejos("juridico", searchParams.vista));
}
