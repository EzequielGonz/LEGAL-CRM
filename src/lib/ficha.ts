/**
 * Ficha y texto compartido (bloque 1.7). Pura: sin acceso a la base.
 *
 * Por defecto el texto lleva nombre y apellido, barrio y teléfono. Los
 * extras se eligen a mano y se ven antes de compartir. Origen, notas y
 * conversación nunca salen solos. Compartir no cambia ningún estado.
 */
export interface ShareField {
  key: string;
  label: string;
  value: string;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

/** Clave normalizada: minúsculas, sin acentos, separadores como espacios. */
function normKey(key: string): string {
  return key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Un domicilio nunca es el barrio: son la dirección completa.
const ADDRESS_WORDS = /\b(domicilio|direccion|calle|altura|piso|depto|dpto|departamento)\b/;
// Orden de preferencia para el barrio: primero el campo "barrio".
const BARRIO_PRIORITY: RegExp[] = [/\bbarrio\b/, /\blocalidad\b/, /\b(partido|municipio)\b/, /\bciudad\b/, /\bzona\b/];

/** Prioridad de una columna como barrio (0 = barrio) o null si no lo es. */
export function barrioRank(key: string): number | null {
  const k = normKey(key);
  if (BARRIO_PRIORITY[0].test(k)) return 0; // "barrio", "barrio del domicilio", etc.
  if (ADDRESS_WORDS.test(k)) return null;
  for (let i = 1; i < BARRIO_PRIORITY.length; i++) if (BARRIO_PRIORITY[i].test(k)) return i;
  return null;
}

/** ¿La columna es un domicilio o dirección? (dato opcional, nunca barrio) */
export function isAddressKey(key: string): boolean {
  return barrioRank(key) === null && ADDRESS_WORDS.test(normKey(key));
}

/**
 * Barrio: el campo "barrio" tiene prioridad, después localidad, partido,
 * ciudad y zona; ante la misma prioridad, primero lo cargado en la ficha y
 * después la columna de la base original. El domicilio nunca se usa como
 * barrio (queda como dato opcional para elegir al compartir).
 */
export function findBarrio(
  qualificationData: Record<string, unknown> | null | undefined,
  baseRow: Record<string, unknown> | null | undefined
): string | null {
  let best: { rank: number; source: number; value: string } | null = null;
  [qualificationData ?? {}, baseRow ?? {}].forEach((source, sourceIndex) => {
    for (const [k, v] of Object.entries(source)) {
      const rank = barrioRank(k);
      const value = typeof v === "object" ? null : str(v);
      if (rank === null || !value) continue;
      if (!best || rank < best.rank || (rank === best.rank && sourceIndex < best.source)) {
        best = { rank, source: sourceIndex, value };
      }
    }
  });
  return (best as { value: string } | null)?.value ?? null;
}

export function humanizeKey(key: string): string {
  const t = key.replaceAll("_", " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Campos opcionales que se pueden sumar al texto (nunca origen, notas ni
 * conversación). Ninguno viene marcado: se eligen a mano y se ven antes de
 * compartir. El domicilio completo (de la ficha o de la base original)
 * aparece acá como opción, nunca como barrio.
 */
export function optionalShareFields(input: {
  email?: string | null;
  dni?: string | null;
  areaLabel?: string | null;
  qualificationData?: Record<string, unknown> | null;
  /** fila de la base original: aporta solo el domicilio o la dirección */
  baseRow?: Record<string, unknown> | null;
}): ShareField[] {
  const out: ShareField[] = [];
  const addressValues = new Set<string>();
  const push = (field: ShareField, isAddress: boolean) => {
    const sig = field.value.replace(/\s+/g, " ").trim().toLowerCase();
    if (isAddress) {
      if (addressValues.has(sig)) return; // mismo domicilio en la ficha y en la base: una sola vez
      addressValues.add(sig);
    }
    out.push(field);
  };
  if (str(input.dni)) push({ key: "dni", label: "DNI/CUIL", value: str(input.dni)! }, false);
  if (str(input.email)) push({ key: "email", label: "Email", value: str(input.email)! }, false);
  if (str(input.areaLabel)) push({ key: "area", label: "Área", value: str(input.areaLabel)! }, false);
  for (const [k, v] of Object.entries(input.qualificationData ?? {})) {
    if (barrioRank(k) !== null) continue; // el barrio ya va siempre en el texto
    const value = typeof v === "object" ? null : str(v);
    if (value) push({ key: `q:${k}`, label: humanizeKey(k), value }, isAddressKey(k));
  }
  for (const [k, v] of Object.entries(input.baseRow ?? {})) {
    if (!isAddressKey(k)) continue; // de la base original solo se ofrece el domicilio
    const value = typeof v === "object" ? null : str(v);
    if (value) push({ key: `b:${k}`, label: humanizeKey(k), value }, true);
  }
  return out;
}

export function buildShareText(input: {
  fullName: string | null;
  barrio: string | null;
  phone: string | null;
  extras: ShareField[];
}): string {
  const lines = [
    `Nombre y apellido: ${input.fullName ?? "—"}`,
    `Barrio: ${input.barrio ?? "—"}`,
    `Teléfono: ${input.phone ? `+${input.phone.replace(/^\+/, "")}` : "—"}`,
    ...input.extras.map((e) => `${e.label}: ${e.value}`),
  ];
  return lines.join("\n");
}
