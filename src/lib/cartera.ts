/**
 * Cartera de oportunidades (reorganización 2, 18/10). Lo que vale la pena,
 * agrupado y compacto, en tres vistas:
 *
 *  - Conversaciones: lo que está caliente y se puede cerrar ya (captados por
 *    derivar, quienes agendaron, quienes están hablando, quienes quieren
 *    hablar con alguien).
 *  - Contactos: la cartera ya trabajada (clientes derivados, ventas, citas,
 *    reagendadas, Fase 2, seguimiento y repesca).
 *  - Recuperar: lo que se cayó (seguimientos caídos, perdidos, quienes dejaron
 *    de responder). Las quejas y pedidos de no contacto van aparte, chicos.
 *
 * La base fría (sin contactar, sin respuesta) no aparece acá: vive en
 * Prospectos, agrupada por base. Las definiciones son puras; los grupos de
 * oportunidades usan los mismos indicadores que sus listas completas.
 */
import type { SlugPerfil } from "@/lib/marca";

export type VistaCartera = "conversaciones" | "contactos" | "descartados";
export type FiltroCitas = "proximas" | "proximas_sin_derivar" | "reagendadas" | "fase2";
export type Tono = "caliente" | "ok" | "info" | "alerta";

export interface GrupoCartera {
  clave: string;
  titulo: string;
  /** Una línea: qué son y qué hacer. */
  detalle: string;
  tono: Tono;
  /** Acción principal de cada ficha. */
  accion: "derivar" | "chat" | "ficha";
  fuente: { tipo: "oportunidades"; indicador: string } | { tipo: "citas"; filtro: FiltroCitas };
}

const op = (indicador: string) => ({ tipo: "oportunidades" as const, indicador });
const citas = (filtro: FiltroCitas) => ({ tipo: "citas" as const, filtro });

export const VISTAS_CARTERA: Record<VistaCartera, { titulo: string; bajada: string; grupos: GrupoCartera[] }> = {
  conversaciones: {
    titulo: "Activos",
    bajada: "Las conversaciones que sirven, de la más cerca de cerrar a la más lejos. Lo urgente está en Hoy; los descartados, en su pestaña.",
    grupos: [
      { clave: "captados", titulo: "Para cerrar", detalle: "Captados: aceptaron el siguiente paso. Pasalos al profesional.", tono: "caliente", accion: "derivar", fuente: op("captado_sin_derivar") },
      { clave: "posibles", titulo: "Posible captación a revisar", detalle: "El bot no está seguro de que hayan concretado la llamada: decidilo vos.", tono: "caliente", accion: "ficha", fuente: op("posible_captacion") },
      { clave: "escribieron", titulo: "Te escribieron", detalle: "La última palabra es de ellos y nadie les contestó.", tono: "alerta", accion: "chat", fuente: op("te_escribio") },
      { clave: "piden", titulo: "Oportunidades reales", detalle: "Esperan a una persona y tienen interés, ordenados del más cerca de cerrar al más lejos.", tono: "alerta", accion: "chat", fuente: op("piden_persona") },
      { clave: "agendaron", titulo: "Agendaron", detalle: "Tienen una cita próxima y todavía no se derivaron.", tono: "caliente", accion: "ficha", fuente: citas("proximas_sin_derivar") },
      { clave: "hablando", titulo: "Hablando ahora", detalle: "La charla está en curso con el bot.", tono: "info", accion: "chat", fuente: op("hablando_ahora") },
    ],
  },
  contactos: {
    titulo: "Etapas",
    bajada: "Todas las personas del perfil, según en qué etapa están. Chats es para conversar; acá ves el recorrido completo.",
    grupos: [
      { clave: "clientes", titulo: "Clientes derivados", detalle: "Captados y derivados. Registrá cómo terminó cada uno.", tono: "ok", accion: "ficha", fuente: op("derivado") },
      { clave: "ventas", titulo: "Ventas concretadas", detalle: "Derivados que cerraron la operación.", tono: "ok", accion: "ficha", fuente: op("venta") },
      { clave: "citas", titulo: "Citas próximas", detalle: "Todas las citas que vienen, incluidas las de Fase 2.", tono: "caliente", accion: "ficha", fuente: citas("proximas") },
      { clave: "reagendadas", titulo: "Citas reagendadas", detalle: "Se reprogramaron una vez: confirmá que se den.", tono: "alerta", accion: "ficha", fuente: citas("reagendadas") },
      { clave: "fase2", titulo: "Fase 2", detalle: "Revisión agendada con la IA.", tono: "info", accion: "ficha", fuente: citas("fase2") },
      { clave: "seguimiento", titulo: "En seguimiento", detalle: "No escriben hace más de 3 días. El sistema les manda un mensaje más y, si en 24 horas no contestan, pasan a Caídos. No hay que hacer nada.", tono: "info", accion: "chat", fuente: op("dejaron_de_responder") },
      { clave: "repesca", titulo: "En repesca", detalle: "Terminaron el seguimiento sin avanzar: para volver a intentar a mano.", tono: "info", accion: "ficha", fuente: op("repesca") },
    ],
  },
  // 12/11 (pedido de la responsable): lo que no sirve no se mezcla con lo que sí.
  // 13/11: «Para recuperar» se retiró. Quien dejó de contestar pasa solo a Caídos y vive acá,
  // fuera del trabajo del día. No se borra nada.
  descartados: {
    titulo: "Descartados",
    bajada: "Los que ya no siguen. Están acá para consultarlos; no aparecen en Hoy ni en Activos.",
    grupos: [
      { clave: "sin_respuesta", titulo: "Quedaron sin respuesta", detalle: "Escribieron hace más de una semana y nadie les contestó. Mirá el último mensaje y decidí si los retomás.", tono: "alerta", accion: "chat", fuente: op("quedaron_sin_respuesta") },
      { clave: "caidos", titulo: "Caídos", detalle: "Dejaron de contestar. Ya recibieron el último mensaje o pasó demasiado tiempo. Si alguno vuelve a escribir, vuelve solo a la conversación.", tono: "info", accion: "ficha", fuente: op("seguimiento_caido") },
      { clave: "perdidos", titulo: "Perdidos", detalle: "Dijeron que no, con su motivo. Revisá el motivo antes de reintentar.", tono: "info", accion: "ficha", fuente: op("perdido_comercial") },
      { clave: "no_contactar", titulo: "No quieren que les escriban", detalle: "Bajas, quejas y números equivocados. El bot ya no les escribe.", tono: "info", accion: "ficha", fuente: op("detencion_reciente") },
    ],
  },
};

export function vistaCartera(v: unknown): VistaCartera {
  return v === "contactos" || v === "descartados" ? v : "conversaciones";
}

/** Grupo elegido: el pedido si existe; si no, el primero con algo; si no, el primero. */
export function grupoElegido(vista: VistaCartera, pedido: unknown, conteos: Record<string, number | null>): GrupoCartera {
  const grupos = VISTAS_CARTERA[vista].grupos;
  const porPedido = grupos.find((g) => g.clave === pedido);
  if (porPedido) return porPedido;
  return grupos.find((g) => (conteos[g.clave] ?? 0) > 0) ?? grupos[0];
}

/** Enlace a la conversación según el perfil (Jurídico usa la bandeja). */
export function enlaceConversacion(slug: SlugPerfil, conversationId: string): string {
  return slug === "juridico" ? `/inbox/${conversationId}` : `/conversacion/${conversationId}`;
}

/** Inicio de la semana (lunes 0:00, hora de Argentina) en UTC. Pura. */
export function inicioDeSemana(ahora: Date): Date {
  const ar = new Date(ahora.getTime() - 3 * 3600 * 1000);
  const dia = (ar.getUTCDay() + 6) % 7; // lunes = 0
  const lunes = Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), ar.getUTCDate() - dia, 3, 0, 0);
  return new Date(lunes);
}

const TZ = "America/Argentina/Buenos_Aires";

/** «hoy 14:30», «ayer 9:05» o «mar 21 oct 10:00», en hora de Argentina. Pura. */
export function cuandoCorto(iso: string | null | undefined, ahora = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dia = (x: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(x);
  const hora = d.toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  if (dia(d) === dia(ahora)) return `hoy ${hora}`;
  if (dia(d) === dia(new Date(ahora.getTime() - 24 * 3600 * 1000))) return `ayer ${hora}`;
  if (dia(d) === dia(new Date(ahora.getTime() + 24 * 3600 * 1000))) return `mañana ${hora}`;
  return `${d.toLocaleDateString("es-AR", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" })} ${hora}`;
}

/** Iniciales para el avatar de una ficha. Pura. */
export function iniciales(nombre: string | null | undefined): string {
  const partes = (nombre ?? "").trim().split(/\s+/).filter((p) => /\p{L}/u.test(p));
  if (!partes.length) return "·";
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

/**
 * Vista previa de un mensaje en palabras (13/11): la lista de chats mostraba
 * textos internos («[Plantilla de campaña "X": nombre_tecnico] Primer contacto…»).
 * Pura: se prueba sola.
 */
export function previaLegible(texto: string | null | undefined): string {
  const t = String(texto ?? "").trim();
  if (!t) return "Sin mensajes todavía";
  const m = t.match(/^(Vos: )?\[Plantilla de campaña "([^"]+)":[^\]]*\]/);
  if (m) return `${m[1] ?? ""}Primer mensaje de la campaña «${m[2]}»`;
  return t
    .replace(/^(Vos: )?\[Plantilla [^\]]*\]\s*/, "$1Mensaje de plantilla · ")
    .replace(/\[Audio\]/g, "Audio")
    .replace(/\[Reacción ([^\]]*)\]/g, "Reaccionó $1")
    .replace(/\[Mensaje no compatible[^\]]*\]/g, "Mensaje que no se puede mostrar")
    .replace(/ · $/, "");
}

/**
 * 13/11 · La tabla vieja «Captados y casos» se retiró: cada una de sus
 * pestañas tiene su lista en Contactos. La dirección vieja lleva a la nueva.
 */
export function destinoDeCasosViejos(slug: string, vista: string | null | undefined): string {
  const q = `perfil=${slug}`;
  switch (vista) {
    case "derivados":
      return `/contactos?${q}&grupo=clientes`;
    case "seguimiento":
      return `/contactos?${q}&grupo=seguimiento`;
    case "caidos":
      return `/descartados?${q}&grupo=caidos`;
    case "perdidos":
      return `/descartados?${q}&grupo=perdidos`;
    default:
      return `/conversaciones?${q}&grupo=captados`;
  }
}
