import type { ClaveCifra, FilaParaHoy, PerfilResumen } from "@/lib/resumen/filas";
import { CIFRAS_SEMANA, totalSemana, variacion, type ClaveSemana, type CifrasPerfilSemana, type Variacion } from "@/lib/asistente/semana-reglas";

/**
 * Pedidos a Jarvis desde el Resumen y el Cerebro (22/11). Funciones puras: arman el texto que se
 * deja escrito para Jarvis. Todos terminan pidiendo confirmación: Jarvis propone y el dueño confirma
 * antes de que se ejecute nada. Sin datos de personas, solo cifras y nombres de perfil.
 */
export const CIERRE_CONFIRMAR = "Proponémelo paso a paso y no ejecutes nada hasta que yo te lo confirme.";

/** Dirección del asistente con el pedido en la URL. */
export function urlAsistente(pedido: string): string {
  return `/asistente?pedido=${encodeURIComponent(pedido.slice(0, 600))}`;
}

const POR_CLAVE: Record<ClaveCifra, (perfil: string, n: string) => string> = {
  esperan: (p, n) => `En ${p} hay ${n} esperando respuesta. Mostrame cuáles son y proponeme cómo responderlas.`,
  alertas: (p, n) => `En ${p} hay ${n} alerta(s) de Salud. Explicámelas en simple y proponeme cómo resolverlas.`,
  citasHoy: (p, n) => `En ${p} hay ${n} cita(s) hoy. Resumime la agenda del día y qué hay que preparar.`,
  sinDerivar: (p, n) => `En ${p} hay ${n} captado(s) sin derivar. Proponeme a quién derivar cada uno y cómo.`,
  propuestas: (p, n) => `En ${p} hay ${n} propuesta(s) tuyas por confirmar. Listámelas y decime cuál conviene confirmar primero.`,
};

/** Fila con la cifra a mano: el número exacto va en el pedido. */
export function pedidoDeFila(f: FilaParaHoy, perfiles: PerfilResumen[]): string {
  const clave = f.clave.slice(f.slug.length + 1) as ClaveCifra;
  const valor = perfiles.find((p) => p.slug === f.slug)?.cifras.find((c) => c.clave === clave)?.valor;
  const texto = POR_CLAVE[clave]?.(f.perfil, valor == null ? "varios" : String(valor)) ?? `Ayudame con esto en ${f.perfil}.`;
  return `${texto} ${CIERRE_CONFIRMAR}`;
}

/** Pedido para confirmar las propuestas pendientes. */
export function pedidoPropuestas(total: number): string {
  return `Tengo ${total} propuesta(s) por confirmar. Mostrámelas una por una, con qué haría cada una, y esperá mi OK antes de ejecutar cualquiera.`;
}

/** Total de lo pendiente en los cuatro perfiles; null si algún dato no se pudo leer (no se muestra un total engañoso). */
export function totalPendiente(perfiles: PerfilResumen[]): number | null {
  let t = 0;
  for (const p of perfiles)
    for (const c of p.cifras) {
      if (c.clave === "citasHoy") continue; // las citas no son una tarea pendiente: se muestran aparte
      if (c.valor === null) return null;
      t += c.valor;
    }
  return t;
}

export function totalPropuestas(perfiles: PerfilResumen[]): { total: number | null; porPerfil: { slug: string; nombre: string; valor: number | null }[] } {
  const porPerfil = perfiles.map((p) => ({ slug: p.slug, nombre: p.nombre, valor: p.cifras.find((c) => c.clave === "propuestas")?.valor ?? null }));
  const total = porPerfil.some((x) => x.valor === null) ? null : porPerfil.reduce((a, x) => a + (x.valor ?? 0), 0);
  return { total, porPerfil };
}

export interface ComparacionSemana {
  clave: ClaveSemana;
  titulo: string;
  actual: number | null;
  anterior: number | null;
  variacion: Variacion;
}

const CLAVES_COMPARADAS: ClaveSemana[] = ["captados", "respondieron", "derivados", "enviados"];

/** Cifras de la semana de los cuatro perfiles contra la anterior. Sin dato: actual y variación quedan en «—». */
export function comparacionSemanal(perfiles: CifrasPerfilSemana[] | null): ComparacionSemana[] {
  const t = perfiles && perfiles.length ? totalSemana(perfiles) : null;
  return CLAVES_COMPARADAS.map((clave) => {
    const titulo = CIFRAS_SEMANA.find((c) => c.clave === clave)?.titulo ?? clave;
    const actual = t ? t[clave].actual : null;
    const anterior = t ? t[clave].anterior : null;
    return { clave, titulo, actual, anterior, variacion: variacion(actual, anterior) };
  });
}
