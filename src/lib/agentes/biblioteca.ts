/**
 * Etapa 2 · Bloque 4 — Biblioteca de agentes (solo configuración y vista).
 *
 * Principal + cuatro derivados por rubro. Los derivados heredan los límites
 * del principal y suman los propios; el conocimiento de cada uno queda
 * separado. Todos están apagados: no existe un estado «activo» y nada de
 * esto cambia al agente que responde hoy (`ai_agents`). Sin simulador,
 * evaluación ni entrenamiento (Fase 3 pausada).
 */

export const CLAVES_AGENTE = ["principal", "juridico", "coberturas_medicas", "agencia_0km", "marketing"] as const;
export type ClaveAgente = (typeof CLAVES_AGENTE)[number];
export const MODOS = ["frio", "consulta_actual", "seguimiento"] as const;
export type Modo = (typeof MODOS)[number];
export const MODO_LABEL: Record<Modo, string> = { frio: "Contacto frío", consulta_actual: "Consulta actual", seguimiento: "Seguimiento" };

export interface AgenteBiblioteca {
  clave: ClaveAgente;
  rol: "principal" | "derivado";
  hereda_de: ClaveAgente | null;
  rubro_id: string | null;
  nombre: string;
  objetivo: string;
  modos: Modo[];
  limites: string[];
  conocimiento: { tema: string; fuente?: string; revisado?: string }[];
  estado: "apagado" | "borrador";
  version: number;
  updated_at?: string;
  updated_by?: string;
}

export function esClaveAgente(v: unknown): v is ClaveAgente {
  return typeof v === "string" && (CLAVES_AGENTE as readonly string[]).includes(v);
}

/** Límites efectivos: los del principal primero, después los propios (sin repetir). */
export function limitesEfectivos(agente: Pick<AgenteBiblioteca, "limites" | "rol">, principal: Pick<AgenteBiblioteca, "limites"> | null): string[] {
  const base = agente.rol === "derivado" && principal ? principal.limites : [];
  return Array.from(new Set([...base, ...agente.limites].map((l) => l.trim()).filter(Boolean)));
}

/** Cosas que parecen credenciales o datos de contacto: nunca se guardan en la biblioteca. */
const PARECE_SECRETO = [/\bEAA[A-Za-z0-9]{20,}/, /\bAIza[0-9A-Za-z_-]{20,}/, /\bsk-[A-Za-z0-9]{16,}/, /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./];

/** Teléfono: una secuencia de 10 o más cifras, con espacios, guiones o «+» entre medio. */
function pareceTelefono(texto: string): boolean {
  return (texto.match(/\+?\d[\d\s().-]{8,}\d/g) ?? []).some((m) => m.replace(/\D/g, "").length >= 10);
}

export function pareceSecretoODatoPersonal(texto: string): boolean {
  return PARECE_SECRETO.some((re) => re.test(texto)) || pareceTelefono(texto);
}

export type CambioAgente = Partial<Pick<AgenteBiblioteca, "nombre" | "objetivo" | "modos" | "limites" | "conocimiento">> & { estado?: unknown };

/**
 * Valida un cambio pedido desde el panel. Nunca permite activar: el estado
 * solo puede quedar «apagado» o «borrador».
 */
export function validarCambioAgente(cambio: CambioAgente): { ok: true; cambio: Partial<AgenteBiblioteca> } | { ok: false; error: string } {
  const out: Partial<AgenteBiblioteca> = {};
  if (cambio.estado !== undefined) {
    if (cambio.estado !== "apagado" && cambio.estado !== "borrador") {
      return { ok: false, error: "La biblioteca es solo configuración: los agentes quedan apagados." };
    }
    out.estado = cambio.estado;
  }
  if (cambio.nombre !== undefined) {
    const n = String(cambio.nombre).trim();
    if (!n || n.length > 80) return { ok: false, error: "El nombre tiene que tener entre 1 y 80 caracteres." };
    out.nombre = n;
  }
  if (cambio.objetivo !== undefined) {
    const o = String(cambio.objetivo).trim();
    if (o.length > 600) return { ok: false, error: "El objetivo admite hasta 600 caracteres." };
    out.objetivo = o;
  }
  if (cambio.modos !== undefined) {
    if (!Array.isArray(cambio.modos) || cambio.modos.some((m) => !(MODOS as readonly string[]).includes(m as string))) {
      return { ok: false, error: "Modo no válido." };
    }
    out.modos = Array.from(new Set(cambio.modos)) as Modo[];
  }
  if (cambio.limites !== undefined) {
    if (!Array.isArray(cambio.limites) || cambio.limites.length > 30) return { ok: false, error: "Límites no válidos." };
    out.limites = cambio.limites.map((l) => String(l).trim().slice(0, 200)).filter(Boolean);
  }
  if (cambio.conocimiento !== undefined) {
    if (!Array.isArray(cambio.conocimiento) || cambio.conocimiento.length > 50) return { ok: false, error: "Conocimiento no válido." };
    out.conocimiento = cambio.conocimiento
      .filter((k) => k && typeof k.tema === "string" && k.tema.trim())
      .map((k) => ({ tema: String(k.tema).trim().slice(0, 300), fuente: k.fuente ? String(k.fuente).slice(0, 300) : undefined, revisado: k.revisado ? String(k.revisado).slice(0, 10) : undefined }));
  }
  const texto = JSON.stringify(out);
  if (pareceSecretoODatoPersonal(texto)) {
    return { ok: false, error: "Parece incluir una clave o un teléfono: la biblioteca no guarda credenciales ni datos de personas." };
  }
  if (Object.keys(out).length === 0) return { ok: false, error: "No hay cambios." };
  return { ok: true, cambio: out };
}
