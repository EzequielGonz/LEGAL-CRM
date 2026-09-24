// Cálculo de las estadísticas por rubro que se usan en la vista previa de
// /perfiles. Vive en un archivo aparte (sin "use client") para que lo
// pueda usar tanto el server component (primera carga) como el client
// component (refrescos en vivo) sin duplicar la lógica.
export type RubroRow = {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  description: string | null;
};

export type ContactStatRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  rubro_id: string;
  status: string;
  updated_at: string;
};

export type PerfilStats = RubroRow & {
  agendados: number;
  cerrados: number;
  casos: { id: string; full_name: string | null; phone: string | null }[];
};

// Mismo criterio de "cerrado" que usa la pantalla de Casos
// (/casos-cerrados): ganados + perdidos. Así el número que se ve acá
// siempre coincide con el total de esa pantalla.
const ESTADOS_CERRADO = ["cerrado_ganado", "cerrado_perdido"];
const CASOS_PREVIEW_LIMIT = 8;

export function buildPerfiles(rubros: RubroRow[], rows: ContactStatRow[]): PerfilStats[] {
  return rubros.map((r) => {
    const deRubro = rows.filter((c) => c.rubro_id === r.id);
    const cerradosRows = deRubro.filter((c) => ESTADOS_CERRADO.includes(c.status));

    return {
      ...r,
      agendados: deRubro.filter((c) => c.status === "agendado").length,
      cerrados: cerradosRows.length,
      casos: cerradosRows.slice(0, CASOS_PREVIEW_LIMIT).map((c) => ({
        id: c.id,
        full_name: c.full_name,
        phone: c.phone,
      })),
    };
  });
}

// Estados que trae la query base (agendado + los dos de cerrado): si se
// agrega algún estado nuevo a futuro, se actualiza acá nomás.
export const RELEVANT_STATUSES = ["agendado", ...ESTADOS_CERRADO];
