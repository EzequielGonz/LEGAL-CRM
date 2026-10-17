/**
 * Menú unificado (16/10, P01 del plan de diseño). Un solo armado para los
 * cuatro perfiles, agrupado por tarea: trabajo diario, captación, agentes y
 * configuración. Jurídico conserva sus direcciones históricas (sin prefijo);
 * los demás perfiles viven bajo /panel/<slug>. Las páginas comunes
 * (oportunidades, contenido, comparación) reciben ?perfil=<slug>.
 */
import type { SlugPerfil } from "@/lib/marca";

export interface ItemMenu {
  href: string;
  label: string;
  /** Prefijo que marca el ítem como activo (por defecto, la ruta del href). */
  match?: string;
  /** Activo solo con coincidencia exacta. */
  exacto?: boolean;
}

export interface GrupoMenu {
  titulo: string;
  items: ItemMenu[];
}

function comun(slug: SlugPerfil, ruta: string): string {
  return `/${ruta}?perfil=${encodeURIComponent(slug)}`;
}

export function menuDePerfil(slug: SlugPerfil): GrupoMenu[] {
  if (slug === "juridico") {
    return [
      {
        titulo: "Trabajo diario",
        items: [
          { href: comun(slug, "hoy"), label: "Inicio", match: "/hoy" },
          { href: comun(slug, "salud"), label: "Salud del sistema", match: "/salud" },
          { href: "/estadisticas", label: "Estadísticas" },
          { href: comun(slug, "oportunidades"), label: "Oportunidades", match: "/oportunidades" },
          { href: "/inbox", label: "Inbox" },
          { href: "/prospectos", label: "Prospectos" },
          { href: "/seguimiento", label: "Seguimiento" },
          { href: "/agenda", label: "Agenda" },
          { href: "/casos-cerrados", label: "Casos" },
        ],
      },
      {
        titulo: "Captación",
        items: [
          { href: "/bases", label: "Bases" },
          { href: "/campanas", label: "Campañas" },
          { href: comun(slug, "contenido"), label: "Contenido", match: "/contenido" },
        ],
      },
      {
        titulo: "Agentes",
        items: [
          { href: "/agentes", label: "Agentes IA" },
          { href: comun(slug, "comparacion-agentes"), label: "Comparación de agentes", match: "/comparacion-agentes" },
          { href: "/revision", label: "Revisión" },
        ],
      },
      { titulo: "Ajustes", items: [{ href: "/configuracion", label: "Configuración" }] },
    ];
  }

  const base = `/panel/${slug}`;
  const diario: ItemMenu[] = [
    { href: comun(slug, "hoy"), label: "Inicio", match: "/hoy" },
    { href: comun(slug, "salud"), label: "Salud del sistema", match: "/salud" },
    { href: comun(slug, "oportunidades"), label: "Oportunidades", match: "/oportunidades" },
    { href: `${base}/seguimiento`, label: "Seguimiento" },
    { href: `${base}/agenda`, label: "Agenda" },
    { href: `${base}/casos-cerrados`, label: "Clientes cerrados" },
  ];
  const captacion: ItemMenu[] = [
    { href: `${base}/bases`, label: "Bases" },
    { href: `${base}/campanas`, label: "Campañas" },
    { href: comun(slug, "contenido"), label: "Contenido", match: "/contenido" },
  ];
  if (slug === "marketing") {
    diario.splice(1, 0, { href: `${base}/estadisticas`, label: "Estadísticas" });
    diario.splice(3, 0,
      { href: `${base}/prospectos`, label: "Prospectos prioritarios" },
      { href: `${base}/presupuestos`, label: "Pide presupuesto" },
      { href: `${base}/consultas-directas`, label: "Consultas directas" },
    );
    captacion.unshift(
      { href: `${base}/extraer`, label: "Extraer negocios" },
      { href: `${base}/captacion`, label: "Captación y análisis" },
    );
  }
  return [
    { titulo: "Trabajo diario", items: diario },
    { titulo: "Captación", items: captacion },
    {
      titulo: "Agentes",
      items: [
        { href: `${base}/agentes`, label: "Agentes IA" },
        { href: comun(slug, "comparacion-agentes"), label: "Comparación de agentes", match: "/comparacion-agentes" },
      ],
    },
    { titulo: "Ajustes", items: [{ href: `${base}/configuracion`, label: "Configuración" }] },
  ];
}

/** Ítem activo: el de prefijo más largo que coincide con la ruta actual. */
export function itemActivo(grupos: GrupoMenu[], pathname: string): string | null {
  let mejor: { href: string; largo: number } | null = null;
  for (const g of grupos) {
    for (const it of g.items) {
      const ruta = it.match ?? it.href.split("?")[0];
      const ok = it.exacto ? pathname === ruta : pathname === ruta || pathname.startsWith(`${ruta}/`);
      if (ok && (!mejor || ruta.length > mejor.largo)) mejor = { href: it.href, largo: ruta.length };
    }
  }
  return mejor?.href ?? null;
}
