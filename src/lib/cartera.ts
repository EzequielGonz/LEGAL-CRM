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

export type VistaCartera = "conversaciones" | "contactos" | "recuperar";
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
    titulo: "Conversaciones",
    bajada: "Las oportunidades reales, para cerrar. Cuando derivás a alguien, pasa a Contactos.",
    grupos: [
      { clave: "captados", titulo: "Captados para derivar", detalle: "Aceptaron el siguiente paso: pasalos al profesional.", tono: "caliente", accion: "derivar", fuente: op("captado_sin_derivar") },
      { clave: "agendaron", titulo: "Agendaron", detalle: "Tienen una cita próxima y todavía no se derivaron.", tono: "caliente", accion: "ficha", fuente: citas("proximas_sin_derivar") },
      { clave: "hablando", titulo: "Hablando ahora", detalle: "La charla está en curso con el agente.", tono: "info", accion: "chat", fuente: op("hablando_ahora") },
      { clave: "piden", titulo: "Quieren hablar con alguien", detalle: "Interesados que pidieron una persona: respondé desde el chat.", tono: "alerta", accion: "chat", fuente: op("piden_persona") },
    ],
  },
  contactos: {
    titulo: "Contactos",
    bajada: "Tu cartera: clientes, citas y seguimientos. La base fría está en Prospectos.",
    grupos: [
      { clave: "clientes", titulo: "Clientes derivados", detalle: "Captados y derivados. Registrá cómo terminó cada uno.", tono: "ok", accion: "ficha", fuente: op("derivado") },
      { clave: "ventas", titulo: "Ventas concretadas", detalle: "Derivados que cerraron la operación.", tono: "ok", accion: "ficha", fuente: op("venta") },
      { clave: "citas", titulo: "Citas próximas", detalle: "Todas las citas que vienen, incluidas las de Fase 2.", tono: "caliente", accion: "ficha", fuente: citas("proximas") },
      { clave: "reagendadas", titulo: "Citas reagendadas", detalle: "Se reprogramaron una vez: confirmá que se den.", tono: "alerta", accion: "ficha", fuente: citas("reagendadas") },
      { clave: "fase2", titulo: "Fase 2", detalle: "Revisión agendada con la IA.", tono: "info", accion: "ficha", fuente: citas("fase2") },
      { clave: "seguimiento", titulo: "En seguimiento", detalle: "Seguimiento automático en curso.", tono: "info", accion: "chat", fuente: op("seguimiento_activo") },
      { clave: "repesca", titulo: "En repesca", detalle: "Terminaron el seguimiento sin avanzar: para volver a intentar.", tono: "info", accion: "ficha", fuente: op("repesca") },
    ],
  },
  recuperar: {
    titulo: "Revisión",
    bajada: "Lo que se cayó y todavía se puede recuperar.",
    grupos: [
      { clave: "caidos", titulo: "Seguimientos caídos", detalle: "El seguimiento no avanzó: decidí si se vuelve a intentar.", tono: "alerta", accion: "ficha", fuente: op("seguimiento_caido") },
      { clave: "frenados", titulo: "Dejaron de responder", detalle: "Respondieron y la charla quedó a medias hace más de 3 días.", tono: "alerta", accion: "chat", fuente: op("dejaron_de_responder") },
      { clave: "perdidos", titulo: "Perdidos", detalle: "Perdidos por motivo comercial. Revisá el motivo antes de reintentar.", tono: "info", accion: "ficha", fuente: op("perdido_comercial") },
    ],
  },
};

export function vistaCartera(v: unknown): VistaCartera {
  return v === "contactos" || v === "recuperar" ? v : "conversaciones";
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
