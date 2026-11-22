import { Suspense } from "react";
import { marcasResueltas } from "@/lib/marca-servidor";
import { MenuPerfil } from "@/components/menu-perfil";
import { BarraSalud } from "@/components/salud/barra-salud";
import { EncabezadoPanel, PestanasSeccion } from "@/components/perfiles/encabezado-panel";
import { marcaDe, type SlugPerfil } from "@/lib/marca";
import { variablesAcento } from "@/lib/acento";
import { EnfocarAncla } from "@/components/ui/enfocar-ancla";
import { MasOpciones, NivelProvider } from "@/components/nivel/nivel";
import { Jarvis } from "@/components/jarvis/jarvis";
import { leerMenuPersonal } from "@/lib/personalizacion/servidor";
import { EfectosVidrio } from "@/components/ui/efectos-vidrio";
import { RUBRO_IDS } from "@/lib/rubros";
import { CartelCrisis } from "@/components/perfiles/cartel-crisis";
import { AvisoCodigoAnterior } from "@/components/acceso/aviso-codigo-anterior";

/**
 * Marco común de los paneles (renovado 18/10): paleta del perfil
 * (`data-tema`, y el acento elegido en el lápiz si hay uno), menú de cinco
 * destinos más «Más» (22/11), pestañas de la sección actual, «Más opciones» al pie y el
 * asistente IA (Jarvis). Arriba de cada pantalla, la barra de salud (solo cuando algo
 * frena la operación), transmitida aparte para no demorar el contenido.
 */
export async function MarcoPerfil({ slug, children, sinSalud = false }: { slug: SlugPerfil; children: React.ReactNode; sinSalud?: boolean }) {
  let marca: { nombre: string | null; logo: string | null; acento: string | null } = { nombre: null, logo: null, acento: null };
  // 14/11: marca y menú se leen a la vez (antes, una después de la otra).
  // 13/11: menú a medida de este perfil (nombres, orden y secciones ocultas). Sin dato, el de fábrica.
  const [marcas, menu] = await Promise.all([
    marcasResueltas().catch((err) => {
      console.error("[marco] No se pudo leer la marca del perfil:", err);
      return null;
    }),
    leerMenuPersonal(RUBRO_IDS[slug]).catch(() => null),
  ]);
  const m = marcas?.[slug];
  if (m) marca = { nombre: m.nombre, logo: m.logoPanel, acento: m.colores?.panel ?? null };
  const estilo = (variablesAcento(marca.acento) ?? undefined) as React.CSSProperties | undefined;
  return (
    <NivelProvider>
      <div data-tema={slug} style={estilo} className="marco-panel pp min-h-screen lg:flex">
        {/* 15/11: primero de todo, antes de la barra del celular, para que funcione también ahí. */}
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        {/* 22/11: `pp` baja los detalles premium (sombras en capas, relieve) sobre la estética clásica del panel; sin mesh ni esferas. */}
        <Suspense fallback={<div className="hidden w-[16rem] shrink-0 border-r border-slate-200 bg-white lg:block" aria-hidden="true" />}>
          <MenuPerfil slug={slug} nombre={marca.nombre} logo={marca.logo} menu={menu} />
        </Suspense>
        <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 bg-slate-50 lg:h-screen lg:overflow-y-auto">
          <Suspense fallback={<div className="encabezado-panel" aria-hidden="true" />}>
            <EncabezadoPanel slug={slug} nombre={marca.nombre} menu={menu} />
          </Suspense>
          <div className="lienzo-contenido con-barra-inferior">
            {/* 15/11: persona en crisis sin resolver: va antes que todo. */}
            <Suspense fallback={null}>
              <CartelCrisis slug={slug} />
            </Suspense>
            <Suspense fallback={null}>
              <AvisoCodigoAnterior />
            </Suspense>
            {!sinSalud && (
              <Suspense fallback={null}>
                <BarraSalud slug={slug} />
              </Suspense>
            )}
            <Suspense fallback={null}>
              <PestanasSeccion slug={slug} menu={menu} />
            </Suspense>
            {children}
            <MasOpciones />
          </div>
        </main>
        <EnfocarAncla />
        <EfectosVidrio />
        {/* 22/11: Jarvis, el secretario del panel (orbe + hoja lateral), montado una sola vez acá. Reemplaza al panel del asistente; /asistente sigue en «Más». */}
        <Jarvis slug={slug} nombrePerfil={marca.nombre ?? marcaDe(slug).nombre} />
      </div>
    </NivelProvider>
  );
}
