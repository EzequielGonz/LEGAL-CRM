import { requirePageSession } from "@/lib/acceso/pagina";
import { ContenidoMuestra } from "./contenido";

export const metadata = { title: "Muestra de diseño", robots: { index: false, follow: false } };

/** Muestra privada de la fundación visual premium (22/11). Ver `contenido.tsx`. */
export default async function DisenoMuestraPage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  return <ContenidoMuestra />;
}
