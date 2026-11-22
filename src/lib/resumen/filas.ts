import type { SlugPerfil } from "@/lib/marca";

/**
 * «Resumen de todo» (22/11): lo pendiente de cada perfil en cinco cifras y la
 * franja «Para hacer hoy». Funciones puras: sin datos personales, solo números.
 * Una cifra que no se pudo leer es `null` y se muestra «—», nunca 0.
 */
export type ClaveCifra = "esperan" | "sinDerivar" | "citasHoy" | "propuestas" | "alertas";

export interface CifraResumen {
  clave: ClaveCifra;
  etiqueta: string;
  /** null = no se pudo leer. */
  valor: number | null;
  /** Pantalla del perfil donde se resuelve. */
  href: string;
}

export interface PerfilResumen {
  slug: SlugPerfil;
  nombre: string;
  cifras: CifraResumen[];
}

export interface FilaParaHoy {
  clave: string;
  slug: SlugPerfil;
  perfil: string;
  texto: string;
  href: string;
  urgencia: number;
}

const ETIQUETAS: Record<ClaveCifra, string> = {
  esperan: "Esperan respuesta",
  sinDerivar: "Captados sin derivar",
  citasHoy: "Citas de hoy",
  propuestas: "Propuestas por confirmar",
  alertas: "Alertas de Salud",
};

export function etiquetaCifra(c: ClaveCifra): string {
  return ETIQUETAS[c];
}

export function hrefsDePerfil(slug: SlugPerfil): Record<ClaveCifra, string> {
  const base = slug === "juridico" ? "" : `/panel/${slug}`;
  const q = encodeURIComponent(slug);
  return {
    esperan: `/hoy?perfil=${q}&todo=1#hoy-cola`,
    sinDerivar: `/hoy?perfil=${q}&todo=1#hoy-captados`,
    citasHoy: `${base}/agenda`,
    propuestas: `/bandeja?perfil=${q}`,
    alertas: `/salud?perfil=${q}`,
  };
}

export function armarCifras(slug: SlugPerfil, v: Record<ClaveCifra, number | null>): CifraResumen[] {
  const h = hrefsDePerfil(slug);
  return (Object.keys(ETIQUETAS) as ClaveCifra[]).map((clave) => ({ clave, etiqueta: ETIQUETAS[clave], valor: v[clave], href: h[clave] }));
}

const es = (n: number) => n.toLocaleString("es-AR");
const plural = (n: number, uno: string, varios: string) => `${es(n)} ${n === 1 ? uno : varios}`;

/** Orden de urgencia: quien espera, alertas, citas, derivar, propuestas. */
const TEXTO: Record<ClaveCifra, { urgencia: number; f: (n: number) => string }> = {
  esperan: { urgencia: 1, f: (n) => `Responder a ${plural(n, "persona", "personas")}` },
  alertas: { urgencia: 2, f: (n) => `Revisar ${plural(n, "alerta", "alertas")} de Salud` },
  citasHoy: { urgencia: 3, f: (n) => `${plural(n, "cita", "citas")} hoy` },
  sinDerivar: { urgencia: 4, f: (n) => `Derivar a ${plural(n, "captado", "captados")}` },
  propuestas: { urgencia: 5, f: (n) => `Confirmar ${plural(n, "propuesta", "propuestas")} de Jarvis` },
};

/** Lo más urgente de todo el panel, máximo `max` filas; ignora ceros y datos sin leer. */
export function filasParaHoy(perfiles: PerfilResumen[], max = 5): FilaParaHoy[] {
  const filas: FilaParaHoy[] = [];
  for (const p of perfiles)
    for (const c of p.cifras) {
      if (c.valor === null || c.valor <= 0) continue;
      const t = TEXTO[c.clave];
      filas.push({ clave: `${p.slug}-${c.clave}`, slug: p.slug, perfil: p.nombre, texto: t.f(c.valor), href: c.href, urgencia: t.urgencia });
    }
  return filas.sort((a, b) => a.urgencia - b.urgencia || a.perfil.localeCompare(b.perfil, "es")).slice(0, Math.max(0, max));
}

/** Valor para mostrar: «—» si no se pudo leer. */
export function textoCifra(v: number | null): string {
  return v === null ? "—" : es(v);
}

/** Cantidad de cifras que no se pudieron leer en todo el panel. */
export function cifrasSinLeer(perfiles: PerfilResumen[]): number {
  return perfiles.reduce((a, p) => a + p.cifras.filter((c) => c.valor === null).length, 0);
}
