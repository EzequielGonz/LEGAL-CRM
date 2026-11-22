/**
 * Jarvis · memoria del navegador (22/11). Todo en try/catch: sin almacenamiento
 * (ventana privada, bloqueado) Jarvis anda igual, solo que no recuerda.
 * La charla se guarda por perfil: nunca se mezcla con la de otro rubro.
 */
import type { Propuesta } from "@/lib/asistente/eventos";
import { hechosValidos, type HechoJarvis } from "@/lib/jarvis/historial";
import type { TarjetaJarvis } from "@/lib/jarvis/tablero";

export interface MensajeJarvis {
  rol: "usuario" | "jarvis";
  texto: string;
  propuestas?: Propuesta[];
  enlaces?: { href: string; texto: string }[];
  borradores?: { para: string | null; texto: string }[];
  /** Vuelta 6: gráficos y listas armados con lo que leyó Jarvis. */
  tarjetas?: TarjetaJarvis[];
  error?: boolean;
}

const MAX_MENSAJES = 30;

function sesion(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
function local(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function leerCharla(slug: string): MensajeJarvis[] {
  try {
    const crudo = sesion()?.getItem(`jarvis:charla:${slug}`);
    if (!crudo) return [];
    const v = JSON.parse(crudo);
    return Array.isArray(v) ? (v as MensajeJarvis[]).slice(-MAX_MENSAJES) : [];
  } catch {
    return [];
  }
}

export function guardarCharla(slug: string, mensajes: MensajeJarvis[]) {
  try {
    sesion()?.setItem(`jarvis:charla:${slug}`, JSON.stringify(mensajes.slice(-MAX_MENSAJES)));
  } catch {
    /* sin espacio o bloqueado: no se recuerda */
  }
}

export function leerAbierto(): boolean {
  try {
    return sesion()?.getItem("jarvis:abierto") === "1";
  } catch {
    return false;
  }
}
export function guardarAbierto(v: boolean) {
  try {
    sesion()?.setItem("jarvis:abierto", v ? "1" : "0");
  } catch {
    /* nada */
  }
}

/** Día (AAAA-MM-DD, Argentina) del último parte cerrado en este navegador. */
export function leerParteCerrado(slug: string): string | null {
  try {
    return local()?.getItem(`jarvis:parte-cerrado:${slug}`) ?? null;
  } catch {
    return null;
  }
}
export function guardarParteCerrado(slug: string, dia: string) {
  try {
    local()?.setItem(`jarvis:parte-cerrado:${slug}`, dia);
  } catch {
    /* nada */
  }
}

export function leerUltimaVisita(slug: string): string | null {
  try {
    return local()?.getItem(`jarvis:visita:${slug}`) ?? null;
  } catch {
    return null;
  }
}
export function guardarUltimaVisita(slug: string, iso: string) {
  try {
    local()?.setItem(`jarvis:visita:${slug}`, iso);
  } catch {
    /* nada */
  }
}

/** Parte del día guardado 10 minutos en la sesión, para no pedirlo en cada cambio de pantalla. */
export interface ParteGuardado {
  t: number;
  datos: unknown;
}
export function leerParteCache(slug: string, ahoraMs: number): unknown | null {
  try {
    const crudo = sesion()?.getItem(`jarvis:parte-cache:${slug}`);
    if (!crudo) return null;
    const v = JSON.parse(crudo) as ParteGuardado;
    return ahoraMs - v.t < 10 * 60_000 ? v.datos : null;
  } catch {
    return null;
  }
}
export function guardarParteCache(slug: string, datos: unknown, ahoraMs: number) {
  try {
    sesion()?.setItem(`jarvis:parte-cache:${slug}`, JSON.stringify({ t: ahoraMs, datos }));
  } catch {
    /* nada */
  }
}

/** Historial de lo confirmado (por perfil, en el navegador; se filtra por día al mostrarlo). */
export function leerHechos(slug: string): HechoJarvis[] {
  try {
    const crudo = local()?.getItem(`jarvis:hechos:${slug}`);
    return crudo ? hechosValidos(JSON.parse(crudo)) : [];
  } catch {
    return [];
  }
}
export function guardarHechos(slug: string, hechos: HechoJarvis[]) {
  try {
    local()?.setItem(`jarvis:hechos:${slug}`, JSON.stringify(hechos));
  } catch {
    /* nada */
  }
}

/** Caché corta en la sesión (por ejemplo, el tablero de la semana: 2 minutos). */
export function leerCacheSesion(clave: string, ahoraMs: number, vigenciaMs: number): unknown | null {
  try {
    const crudo = sesion()?.getItem(`jarvis:cache:${clave}`);
    if (!crudo) return null;
    const v = JSON.parse(crudo) as ParteGuardado;
    return ahoraMs - v.t < vigenciaMs ? v.datos : null;
  } catch {
    return null;
  }
}
export function guardarCacheSesion(clave: string, datos: unknown, ahoraMs: number) {
  try {
    sesion()?.setItem(`jarvis:cache:${clave}`, JSON.stringify({ t: ahoraMs, datos }));
  } catch {
    /* nada */
  }
}
