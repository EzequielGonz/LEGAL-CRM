/**
 * Llamados a la acción con origen (18/10). Cada red de cada perfil tiene su
 * enlace a WhatsApp con un mensaje prearmado distinto: cuando la persona
 * escribe, el panel reconoce de dónde vino (`detectarFuente` con los
 * identificadores del perfil) y lo guarda como fuente del contacto. Puro.
 */
import type { Fuente } from "@/lib/fuente";

export type RedOrigen = "instagram" | "facebook" | "landing";

const NOMBRE: Record<RedOrigen, string> = { instagram: "Instagram", facebook: "Facebook", landing: "la web" };

/** Texto que identifica el origen (se busca dentro del primer mensaje). */
export function identificadorOrigen(red: RedOrigen): string {
  return `los vi en ${NOMBRE[red].toLowerCase()}`;
}

/** Mensaje prearmado completo. */
export function mensajePrearmado(red: RedOrigen): string {
  return `Hola, ${identificadorOrigen(red)} y quiero hacer una consulta.`;
}

/** Solo dígitos, con el 549 de la Argentina para celulares. */
export function numeroWhatsApp(v: unknown): string | null {
  const d = typeof v === "string" ? v.replace(/\D/g, "") : "";
  if (d.length < 10) return null;
  if (d.startsWith("549")) return d;
  if (d.startsWith("54")) return `549${d.slice(2)}`;
  return `549${d.replace(/^0/, "")}`;
}

/** Enlace a WhatsApp con el mensaje de origen de esa red. */
export function enlaceWhatsAppOrigen(whatsapp: unknown, red: RedOrigen): string | null {
  const n = numeroWhatsApp(whatsapp);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(mensajePrearmado(red))}`;
}

/** Identificadores de fuente que hay que sumar al perfil para reconocer cada red. */
export function identificadoresDeRedes(): { texto: string; fuente: Fuente }[] {
  return [
    { texto: identificadorOrigen("instagram"), fuente: "instagram" },
    { texto: identificadorOrigen("facebook"), fuente: "facebook" },
    { texto: identificadorOrigen("landing"), fuente: "landing" },
  ];
}

/** Une identificadores sin repetir (por texto normalizado). */
export function unirIdentificadores(actuales: unknown, nuevos: { texto: string; fuente: Fuente }[]): { texto: string; fuente: Fuente }[] {
  const lista = Array.isArray(actuales) ? (actuales as { texto?: unknown; fuente?: unknown }[]).filter((x) => typeof x?.texto === "string" && typeof x?.fuente === "string") as { texto: string; fuente: Fuente }[] : [];
  const vistos = new Set(lista.map((x) => x.texto.trim().toLowerCase()));
  for (const n of nuevos) if (!vistos.has(n.texto.toLowerCase())) lista.push(n);
  return lista;
}
