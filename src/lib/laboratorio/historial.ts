/**
 * Laboratorio · historial de cambios (22/11). Función pura: arma una línea de tiempo con lo que ya guarda
 * la base (roles creados, cambiados y archivados; ficha del negocio; versiones de la biblioteca de
 * agentes). No inventa nada: si un dato no está, no aparece.
 */

export interface EventoHistorial {
  /** ISO. */
  cuando: string;
  tipo: "rol_creado" | "rol_cambiado" | "rol_archivado" | "ficha" | "agente";
  titulo: string;
  detalle: string;
}

interface FilaRol { nombre: string; creado_por?: string | null; archived_at?: string | null; archived_note?: string | null; created_at?: string | null; updated_at?: string | null }
interface FilaVersion { clave: string; version: number; motivo?: string | null; created_at: string }

const valido = (iso: unknown): iso is string => typeof iso === "string" && !Number.isNaN(new Date(iso).getTime());

export function armarHistorial(entrada: { roles: FilaRol[]; fichaActualizada: string | null; versiones: FilaVersion[] }, max = 40): EventoHistorial[] {
  const out: EventoHistorial[] = [];
  for (const r of entrada.roles) {
    if (valido(r.created_at)) out.push({ cuando: r.created_at, tipo: "rol_creado", titulo: `Rol «${r.nombre}» creado`, detalle: r.creado_por === "operador" || !r.creado_por ? "Lo creó el equipo." : `Lo creó ${r.creado_por}.` });
    // Un cambio posterior a la creación (más de un minuto después) cuenta como cambio.
    if (valido(r.updated_at) && valido(r.created_at) && new Date(r.updated_at).getTime() - new Date(r.created_at).getTime() > 60_000 && !r.archived_at) {
      out.push({ cuando: r.updated_at, tipo: "rol_cambiado", titulo: `Rol «${r.nombre}» cambiado`, detalle: "Se actualizó el texto o la asignación del rol." });
    }
    if (valido(r.archived_at)) out.push({ cuando: r.archived_at, tipo: "rol_archivado", titulo: `Rol «${r.nombre}» archivado`, detalle: r.archived_note?.trim() ? r.archived_note.trim().slice(0, 160) : "Quedó archivado, no borrado." });
  }
  if (valido(entrada.fichaActualizada)) out.push({ cuando: entrada.fichaActualizada, tipo: "ficha", titulo: "Ficha del negocio guardada", detalle: "El bot usa la ficha nueva desde la respuesta siguiente." });
  for (const v of entrada.versiones) {
    if (valido(v.created_at)) out.push({ cuando: v.created_at, tipo: "agente", titulo: `Agente «${v.clave}» v${v.version}`, detalle: v.motivo?.trim() ? v.motivo.trim().slice(0, 160) : "Nueva versión de la biblioteca." });
  }
  return out.sort((a, b) => b.cuando.localeCompare(a.cuando)).slice(0, max);
}
