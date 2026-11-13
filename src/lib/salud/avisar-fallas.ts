/**
 * Aviso a los dispositivos del equipo por una falla del sistema (13/11).
 * Decisión de la responsable: las fallas nuestras se avisan en un lugar
 * propio, separado de las incidencias de personas. El aviso lleva al bloque
 * «Fallas del sistema» de Salud del perfil. No lleva datos de nadie y no le
 * escribe a ningún contacto: solo llega a los navegadores que activaron los
 * avisos.
 */
import { MARCAS, type SlugPerfil } from "@/lib/marca";
import { leerFallas, type Falla } from "@/lib/salud/fallas";

const PERFILES: SlugPerfil[] = ["juridico", "coberturas_medicas", "agencia_0km", "marketing"];

/** Desde cuántos casos una falla merece interrumpir a alguien. Lo demás se ve en Salud. */
export const UMBRAL_AVISO: Record<string, number> = {
  // Un mensaje suelto que no sale suele ser un número mal cargado: no es una falla.
  fallidos: 5,
  bot: 1,
  audios: 3,
  retenidos: 1,
};

/** Qué fallas se avisan. Los seguimientos y archivos pendientes se resuelven solos o desde Salud. Pura. */
export function fallasParaAvisar(fallas: Falla[]): Falla[] {
  return fallas.filter((f) => UMBRAL_AVISO[f.clave] !== undefined && f.cantidad >= UMBRAL_AVISO[f.clave]);
}

/** Día en hora de Argentina (AAAA-MM-DD). Pura. */
export function diaAr(ahora: Date): string {
  return new Date(ahora.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);
}

/** Un aviso por tipo de falla, por perfil y por día: no se repite cada diez minutos. Pura. */
export function claveDeAviso(slug: string, falla: Pick<Falla, "clave" | "alcance">, ahora: Date): string {
  return `falla:${falla.alcance === "sistema" ? "sistema" : slug}:${falla.clave}:${diaAr(ahora)}`;
}

/** Texto del aviso. Sin nombres ni teléfonos. Pura. */
export function textoDeAviso(slug: SlugPerfil, falla: Falla): { title: string; body: string; url: string } {
  return {
    title: falla.alcance === "sistema" ? "Falla del sistema" : `Falla del sistema · ${MARCAS[slug].nombre}`,
    body: `${falla.titulo}. Tocá para verlo en Salud.`,
    url: `/salud?perfil=${slug}#fallas`,
  };
}

export async function avisarFallasDelSistema(ahora: Date = new Date()): Promise<{ avisadas: number; revisadas: number }> {
  const { sendToDevices } = await import("@/lib/push");
  let avisadas = 0;
  let revisadas = 0;
  const yaDelSistema = new Set<string>();
  for (const slug of PERFILES) {
    const fallas = fallasParaAvisar(await leerFallas(slug, ahora).catch(() => []));
    for (const f of fallas) {
      const clave = claveDeAviso(slug, f, ahora);
      // Las fallas de todo el sistema aparecen en los cuatro perfiles: se avisan una vez.
      if (yaDelSistema.has(clave)) continue;
      if (f.alcance === "sistema") yaDelSistema.add(clave);
      revisadas++;
      const t = textoDeAviso(slug, f);
      const { results } = await sendToDevices({ ...t, tag: `falla-${f.clave}`, kind: "aviso", eventKey: clave });
      if (results.some((r) => r.status === "enviado")) avisadas++;
    }
  }
  return { avisadas, revisadas };
}

/** El latido terminó con error: un aviso por hora como mucho. */
export async function avisarLatidoFallido(ahora: Date = new Date()): Promise<void> {
  try {
    const { sendToDevices } = await import("@/lib/push");
    await sendToDevices({
      title: "Falla del sistema",
      body: "La tarea que mueve campañas y seguimientos terminó con un error. Tocá para verlo en Salud.",
      url: "/salud",
      tag: "falla-latido",
      kind: "aviso",
      eventKey: `falla:latido:${ahora.toISOString().slice(0, 13)}`,
    });
  } catch (err) {
    console.error("[salud] No se pudo avisar la falla del latido:", err);
  }
}
