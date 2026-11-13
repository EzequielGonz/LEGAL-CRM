import { redirect } from "next/navigation";
import { perfilActivo } from "@/lib/perfil-activo";

/**
 * «Para recuperar» se retiró el 13/11 (decisión de la responsable: quien deja
 * de contestar recibe un mensaje más a los 3 días y, si en 24 horas no
 * responde, pasa solo a Caídos). La dirección queda para no romper enlaces y
 * lleva a Descartados → Caídos del perfil.
 */
export default async function Pagina(props: { searchParams: Promise<{ perfil?: string }> }) {
 const searchParams = await props.searchParams;
 redirect(`/descartados?perfil=${await perfilActivo(searchParams.perfil)}&grupo=caidos`);
}
