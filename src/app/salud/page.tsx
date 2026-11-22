import { leerFallas, type Falla } from "@/lib/salud/fallas";
import { perfilActivo } from "@/lib/perfil-activo";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { leerSalud, type ItemSalud } from "@/lib/salud";
import { leerSaludWasender } from "@/lib/wasender/salud";
import { SaludVista } from "@/components/salud/salud-vista";

export const dynamic = "force-dynamic";
export const metadata = { title: "Salud del sistema" };


/**
 * Salud del sistema (rediseño 17/10, bloque 3). Simple: qué frena el
 * trabajo, qué consecuencia tiene y quién lo resuelve, en lenguaje llano.
 * Avanzado: el tablero completo con el detalle técnico. Los problemas se ven
 * en los dos niveles. Solo lectura.
 */
export default async function SaludPage(props: { searchParams: Promise<{ perfil?: string }> }) {
  const searchParams = await props.searchParams;
  const slug: SlugPerfil = await perfilActivo(searchParams.perfil);
  // 15/11: los datos se empiezan a pedir acá y se esperan adentro del marco, así la marca y el
  // menú del marco se leen a la vez que la salud (antes el marco esperaba a que terminara todo).
  // 12/11: las líneas de Wasender también son salud del sistema (antes no aparecían).
  const datos = Promise.all([leerSalud(), leerSaludWasender().catch(() => []), leerFallas(slug).catch(() => [])]);
  // Si el marco falla antes de esperar los datos, el rechazo no queda sin atender (el contenido lo vuelve a ver).
  datos.catch(() => {});
  return (
    <MarcoPerfil slug={slug} sinSalud>
      <SaludContenido slug={slug} datos={datos} />
    </MarcoPerfil>
  );
}


async function SaludContenido({ slug, datos }: { slug: SlugPerfil; datos: Promise<[ItemSalud[], ItemSalud[], Falla[]]> }) {
  const [base, wasender, fallas] = await datos;
  return <SaludVista slug={slug} base={base} wasender={wasender} fallas={fallas} />;
}
