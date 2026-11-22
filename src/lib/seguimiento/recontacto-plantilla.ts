/**
 * Recontacto de las 72 h por plantilla de Meta (22/11, pedido del dueño). Reglas puras: se prueban solas.
 *
 * Textual: «el segundo contacto a las 72 h… acá el límite es Meta, es relanzar una campaña de
 * recontacto automático con plantillas de Meta, mientras se migre a Wasender… mientras tanto hacelo
 * desde plantillas y automático».
 *
 * Qué cambia en el contacto 2 del seguimiento (los contactos 3 siguen como estaban):
 *  - Fuera de la ventana de 24 h de Meta un texto libre no sale: el contacto 2 va con la plantilla
 *    APROBADA de recontacto del rubro (propósito «recontacto», asignada a la línea en el panel).
 *    Dentro de la ventana sigue como hoy.
 *  - Sin plantilla de recontacto en el rubro, no sale nada: queda pendiente con el motivo.
 *  - Una sola vez por oportunidad y como máximo una por teléfono cada 30 días dentro del rubro (decisión
 *    del director, 22/11; el teléfono se compara normalizado, con o sin el «9» argentino); tope diario
 *    por rubro (`max_dia`); nunca a quien pidió no recibir; lunes a sábado de 8 a 21
 *    (sin domingos); dentro del límite diario de la línea; nunca por una línea con calidad baja ni
 *    frenada. La reserva y la compuerta del seguimiento siguen igual: nunca sale dos veces.
 *  - No cierra ventas por conversación: la plantilla solo reabre la charla. Si la persona responde,
 *    sigue el bot como hoy.
 *  - Wasender: cuando el perfil se pase a Wasender, el recontacto sale por ahí (punto de extensión
 *    `via: "wasender"`, todavía sin conectar: hoy deja la tarea pendiente con el motivo).
 *
 * Encendido por rubro en `system_settings` (`recontacto_plantilla_meta`). Sin esa clave, o con el
 * rubro apagado, el seguimiento sale exactamente como antes.
 */
import { isContactAllowed, messageKindAllowed, type ContactCalendar, DEFAULT_CALENDAR } from "@/lib/contacto/reglas";
import { normalizePhoneAR } from "@/lib/phone";

export const CLAVE_RECONTACTO_PLANTILLA = "recontacto_plantilla_meta";
export const PROPOSITO_RECONTACTO = "recontacto" as const;
/** Marca de la tarea de seguimiento que salió (o puede haber salido) con la plantilla de recontacto. */
export const CANAL_PLANTILLA_RECONTACTO = "plantilla_recontacto";
/** Estados de una tarea que cuentan como «ya recibió el recontacto» (incluye lo incierto: nunca se reenvía). */
export const ESTADOS_QUE_CUENTAN = ["enviando", "enviada", "a_revisar"] as const;
/** Ventana de «como máximo un recontacto por teléfono dentro del rubro» (decisión del director, 22/11). */
export const VENTANA_RECONTACTO_DIAS = 30;
/** Tope diario de recontactos por rubro si el perfil no trae `max_dia`. */
export const MAX_DIA_POR_DEFECTO = 40;
/** Cuánto se corre una tarea que quedó pendiente por un motivo del recontacto, y hasta dónde como máximo. */
export const REINTENTO_MIN = 45;
export const TOPE_REINTENTO_HORAS = 75;

/** Clave del teléfono para comparar personas: normalizado (54 + 9 + área + abonado), con o sin el «9». */
export function claveTelefono(telefono: string | null | undefined): string {
  const n = normalizePhoneAR(telefono ?? "").phone;
  if (n) return n;
  return String(telefono ?? "").replace(/\D/g, "");
}

/** Desde cuándo cuenta un recontacto recibido como «reciente» para la ventana de 30 días. */
export function desdeVentanaRecontacto(ahora: Date): Date {
  return new Date(ahora.getTime() - VENTANA_RECONTACTO_DIAS * 24 * 3_600_000);
}

/**
 * Nueva hora de una tarea que queda pendiente (o espera) por un motivo del recontacto: ahora + 45 min,
 * con tope en la base + 75 h. Así no se queda al frente de la lista de vencidas tapando al resto de las
 * tareas (las 5 más viejas son las que se miran en cada latido).
 */
export function proximoIntento(ahora: Date, baseAt: Date): Date {
  const siguiente = ahora.getTime() + REINTENTO_MIN * 60_000;
  const tope = baseAt.getTime() + TOPE_REINTENTO_HORAS * 3_600_000;
  return new Date(Math.min(siguiente, tope));
}

export const PERFILES_RECONTACTO = ["juridico", "coberturas_medicas", "agencia_0km", "marketing"] as const;
export type PerfilRecontacto = (typeof PERFILES_RECONTACTO)[number];

/** Por dónde sale el recontacto del rubro. «wasender» es el punto de extensión para la migración. */
export type ViaRecontacto = "meta_plantilla" | "wasender";

export interface ConfigRecontactoRubro {
  activo: boolean;
  via: ViaRecontacto;
  /** Tope de recontactos por plantilla por día (hora argentina) en el rubro. */
  maxDia: number;
}

function maxDiaDe(v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return MAX_DIA_POR_DEFECTO;
  return Math.floor(v);
}

/** Configuración de un rubro. Cualquier cosa que no sea un `activo: true` explícito es apagado. */
export function configDelRubro(valor: unknown, perfil: string): ConfigRecontactoRubro {
  const v = (valor && typeof valor === "object" ? (valor as Record<string, unknown>)[perfil] : null) as Record<string, unknown> | boolean | null;
  if (v === true) return { activo: true, via: "meta_plantilla", maxDia: MAX_DIA_POR_DEFECTO };
  if (!v || typeof v !== "object") return { activo: false, via: "meta_plantilla", maxDia: MAX_DIA_POR_DEFECTO };
  return { activo: v.activo === true, via: v.via === "wasender" ? "wasender" : "meta_plantilla", maxDia: maxDiaDe(v.max_dia) };
}

export type CanalDelContacto =
  /** Como antes del 22/11 (rubro apagado, contacto 3 o ventana abierta). */
  | { canal: "como_hoy"; motivo: string }
  /** Fuera de la ventana de 24 h: plantilla de recontacto del rubro. */
  | { canal: "plantilla_recontacto" }
  /** Punto de extensión: el rubro ya se pasó a Wasender (todavía sin conectar). */
  | { canal: "wasender" };

/**
 * Por dónde sale el contacto de seguimiento de una conversación de Meta. `ultimoEntranteAt` abre la
 * ventana de 24 h de Meta; `ahora` es el momento del envío.
 */
export function canalDelContacto(d: { config: ConfigRecontactoRubro; paso: 2 | 3; ultimoEntranteAt: Date | null; ahora: Date }): CanalDelContacto {
  if (!d.config.activo) return { canal: "como_hoy", motivo: "Recontacto por plantilla apagado en el perfil" };
  if (d.paso !== 2) return { canal: "como_hoy", motivo: "El contacto 3 sigue como antes" };
  if (messageKindAllowed(d.ultimoEntranteAt, d.ahora) === "texto_libre") return { canal: "como_hoy", motivo: "Ventana de 24 h abierta" };
  if (d.config.via === "wasender") return { canal: "wasender" };
  return { canal: "plantilla_recontacto" };
}

export const TEXTO_SIN_PLANTILLA =
  "El perfil no tiene una plantilla de recontacto aprobada para esta línea: fuera de la ventana de 24 h no sale nada. Queda pendiente hasta que se cargue en Meta y se asigne en Plantillas (propósito «Recontacto»).";
export const TEXTO_WASENDER_PENDIENTE =
  "El recontacto de este perfil está configurado para salir por Wasender, que todavía no está conectado a este paso: no se envía y queda pendiente.";
export const TEXTO_YA_RECIBIO = `Ya recibió un recontacto por plantilla en los últimos ${VENTANA_RECONTACTO_DIAS} días (mismo teléfono, mismo perfil): no se manda otro. La oportunidad sigue su curso.`;
export const TEXTO_TOPE_DIA = (max: number) => `El perfil llegó a su tope de ${max} recontactos por plantilla por hoy: queda pendiente y sale otro día.`;
export const TEXTO_CALIDAD_SIN_LEER = "No se pudo leer la calidad de la línea en Meta: no se envía el recontacto hasta poder comprobarla.";

export type DecisionRecontacto =
  | { salir: true }
  /** No sale y no va a salir: la tarea se cancela con el motivo. */
  | { salir: false; destino: "cancelar"; motivo: string; /** true = la oportunidad pasa a «caído»; false = solo se cancela la tarea. */ caer: boolean }
  /** No sale ahora: queda pendiente y se vuelve a mirar en el próximo latido. */
  | { salir: false; destino: "pendiente"; motivo: string }
  /** Fuera del horario: espera a la próxima franja (la decide el calendario del seguimiento). */
  | { salir: false; destino: "esperar"; motivo: string };

export interface DatosRecontacto {
  ahora: Date;
  calendar?: ContactCalendar;
  /** Hay plantilla de recontacto aprobada y asignada a la línea. */
  hayPlantilla: boolean;
  /** La persona (mismo teléfono normalizado, mismo rubro) recibió un recontacto en los últimos 30 días. null = no se pudo saber. */
  yaRecibio: boolean | null;
  /** Motivo de detención o baja vigente (pidió no recibir), o null. */
  baja: string | null;
  /** No se pudo comprobar la detención (la lectura falló): no sale, pero tampoco se cancela. */
  bajaSinComprobar?: boolean;
  /** Calidad de la línea en Meta («alta», «media», «baja», «sin calificar»); null = no se pudo leer. */
  calidadLinea: string | null;
  /** Freno automático de la línea (motivo) o null. */
  freno: string | null;
  /** Límite diario de la línea (null = sin límite) y lo que ya salió hoy por ella. */
  limiteDiario: number | null;
  enviadosHoy: number | null;
  /** Tope diario del rubro (`max_dia`) y recontactos por plantilla que ya salieron hoy en el rubro (null = no se pudo leer). */
  maxDia: number;
  recontactosHoyRubro: number | null;
}

/** ¿Puede salir ya el recontacto por plantilla? El orden importa: lo que no va a salir nunca, primero. */
export function decidirRecontacto(d: DatosRecontacto): DecisionRecontacto {
  if (d.baja) return { salir: false, destino: "cancelar", motivo: `Pidió no recibir mensajes: ${d.baja}`, caer: true };
  if (d.bajaSinComprobar) return { salir: false, destino: "pendiente", motivo: "No se pudo comprobar si la persona pidió no recibir mensajes: no se envía." };
  // Ya recibió uno en la ventana: se cancela con motivo, pero la oportunidad NO pasa a «caído».
  if (d.yaRecibio === true) return { salir: false, destino: "cancelar", motivo: TEXTO_YA_RECIBIO, caer: false };
  if (d.yaRecibio === null) return { salir: false, destino: "pendiente", motivo: "No se pudo comprobar si ya recibió el recontacto: no se envía (se prefiere no escribir dos veces)." };
  if (!isContactAllowed(d.ahora, d.calendar ?? DEFAULT_CALENDAR)) {
    return { salir: false, destino: "esperar", motivo: "Fuera del horario de contacto (lunes a sábado de 8 a 21)." };
  }
  if (!d.hayPlantilla) return { salir: false, destino: "pendiente", motivo: TEXTO_SIN_PLANTILLA };
  const calidad = String(d.calidadLinea ?? "").trim().toLowerCase();
  if (!calidad) return { salir: false, destino: "pendiente", motivo: TEXTO_CALIDAD_SIN_LEER };
  if (calidad === "baja") {
    return { salir: false, destino: "pendiente", motivo: "La línea tiene calidad baja en Meta: no sale el recontacto hasta que mejore." };
  }
  if (d.freno) return { salir: false, destino: "pendiente", motivo: d.freno };
  // Tope diario del rubro: rige siempre, con o sin límite diario de la línea.
  if (d.recontactosHoyRubro === null) return { salir: false, destino: "pendiente", motivo: "No se pudo leer cuántos recontactos salieron hoy en el perfil: no se envía." };
  if (d.recontactosHoyRubro >= d.maxDia) return { salir: false, destino: "pendiente", motivo: TEXTO_TOPE_DIA(d.maxDia) };
  if (d.limiteDiario != null) {
    if (d.enviadosHoy === null) return { salir: false, destino: "pendiente", motivo: "No se pudo leer cuánto envió hoy la línea: no se envía." };
    if (d.enviadosHoy >= d.limiteDiario) {
      return { salir: false, destino: "pendiente", motivo: `La línea llegó a su límite de ${d.limiteDiario} envíos por hoy: el recontacto queda pendiente.` };
    }
  }
  return { salir: true };
}

/**
 * Texto propuesto de la plantilla de recontacto por rubro (para cargar en Meta si se quiere una propia,
 * distinta del contacto 2). Rioplatense, corta, sin precios y con opción de baja. Variable {{1}}: nombre.
 */
export const TEXTO_PROPUESTO: Record<PerfilRecontacto, { nombre: string; cuerpo: string; botones: string[] }> = {
  juridico: {
    nombre: "jur_recontacto_72h",
    cuerpo: "Hola {{1}}, te escribo de nuevo por tu consulta. Si querés, la retomamos para que el estudio la revise sin costo. Si preferís que no te escribamos más, tocá «No me escriban más».",
    botones: ["Sí, retomemos", "Ahora no", "No me escriban más"],
  },
  coberturas_medicas: {
    nombre: "cob_recontacto_72h",
    cuerpo: "Hola {{1}}, te escribo de nuevo por tu cobertura. Si querés, lo retomamos y un asesor te compara opciones sin compromiso. Si preferís que no te escribamos más, tocá «No me escriban más».",
    botones: ["Sí, retomemos", "Ahora no", "No me escriban más"],
  },
  agencia_0km: {
    nombre: "autos_recontacto_72h",
    cuerpo: "Hola {{1}}, te escribo de nuevo por el 0 km. Si querés, lo retomamos y un vendedor te cuenta opciones según lo que buscás. Si preferís que no te escribamos más, tocá «No me escriban más».",
    botones: ["Sí, retomemos", "Ahora no", "No me escriban más"],
  },
  marketing: {
    nombre: "mkt_recontacto_72h",
    cuerpo: "Hola {{1}}, te escribo de nuevo por la propuesta para tu negocio. Si te sirve, la retomamos y el equipo te la prepara. Si preferís que no te escribamos más, tocá «No me escriban más».",
    botones: ["Sí, retomemos", "Ahora no", "No me escriban más"],
  },
};
