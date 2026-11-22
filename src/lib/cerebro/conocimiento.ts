/**
 * Conocimiento que se le enseña al cerebro (22/11). Funciones puras: validación, texto de confirmación y
 * conversión a secciones para la búsqueda. El cerebro NO guarda datos de personas ni claves: se rechazan
 * antes de guardar. Nada se borra: se archiva.
 */
import { pareceDatoPersonal } from "@/lib/bandeja-claude";
import type { SeccionCerebro } from "@/lib/jarvis/cerebro-memoria";

export const TIPOS_CONOCIMIENTO = ["nota", "regla", "documento", "enlace", "aprendizaje"] as const;
export type TipoConocimiento = (typeof TIPOS_CONOCIMIENTO)[number];

export const NOMBRE_TIPO: Record<TipoConocimiento, string> = {
  nota: "Nota",
  regla: "Regla",
  documento: "Documento",
  enlace: "Enlace",
  aprendizaje: "Aprendizaje",
};

export interface Conocimiento {
  id: string;
  rubro_id: string | null;
  tipo: TipoConocimiento;
  titulo: string;
  contenido: string;
  fuente: string | null;
  creado_por: string;
  created_at: string;
  archivada_at: string | null;
}

export interface EntradaConocimiento {
  tipo: TipoConocimiento;
  titulo: string;
  contenido: string;
  fuente: string | null;
}

export const esTipo = (v: unknown): v is TipoConocimiento => typeof v === "string" && (TIPOS_CONOCIMIENTO as readonly string[]).includes(v);

/** Parece una clave o un secreto (para que nunca se guarden en el cerebro). */
export function pareceSecreto(texto: string): boolean {
  return /\b(sk|pk|eyJ|AIza|ghp|gho|xox[bap])[-_A-Za-z0-9]{16,}/.test(texto) || /\b[A-Za-z0-9+/=_-]{40,}\b/.test(texto) || /(contrase(ñ|n)a|password|api[_ -]?key|token)\s*[:=]/i.test(texto);
}

export function validarEntrada(v: unknown): { ok: true; valor: EntradaConocimiento } | { ok: false; error: string } {
  const o = (v ?? {}) as Record<string, unknown>;
  if (!esTipo(o.tipo)) return { ok: false, error: "Elegí qué es: nota, regla, documento, enlace o aprendizaje." };
  const titulo = typeof o.titulo === "string" ? o.titulo.trim() : "";
  const contenido = typeof o.contenido === "string" ? o.contenido.trim() : "";
  const fuente = typeof o.fuente === "string" && o.fuente.trim() ? o.fuente.trim() : null;
  if (titulo.length < 3 || titulo.length > 120) return { ok: false, error: "Poné un título corto (entre 3 y 120 letras)." };
  if (contenido.length < 5) return { ok: false, error: "Escribí qué tiene que saber el cerebro." };
  if (contenido.length > 4000) return { ok: false, error: "Quedó muy largo: acortalo (máximo 4000 letras)." };
  if (fuente && fuente.length > 500) return { ok: false, error: "La fuente quedó muy larga." };
  const junto = `${titulo}\n${contenido}\n${fuente ?? ""}`;
  if (pareceDatoPersonal(junto)) return { ok: false, error: "Sacá teléfonos, documentos o correos: el cerebro no guarda datos de personas." };
  if (pareceSecreto(junto)) return { ok: false, error: "Parece una clave o un código: no se guardan en el cerebro." };
  if (o.tipo === "enlace" && !(fuente ?? contenido).match(/^https?:\/\//i) && !/https?:\/\//i.test(contenido)) return { ok: false, error: "Para un enlace, pegá la dirección completa (que empiece con https://)." };
  return { ok: true, valor: { tipo: o.tipo, titulo, contenido, fuente } };
}

/** Lo aprendido, en el mismo formato que las secciones de los .md, para buscar en todo junto. */
export function aSecciones(items: readonly Pick<Conocimiento, "tipo" | "titulo" | "contenido" | "fuente">[]): SeccionCerebro[] {
  return items.map((c) => ({ archivo: `Aprendido · ${NOMBRE_TIPO[c.tipo] ?? c.tipo}`, titulo: c.titulo, texto: c.fuente ? `${c.contenido}\nFuente: ${c.fuente}` : c.contenido }));
}
