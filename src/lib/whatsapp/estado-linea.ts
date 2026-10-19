/**
 * Estado REAL de una línea de WhatsApp en Meta (18/10). Antes el panel
 * decía «credenciales cargadas» si las variables existían, aunque el número
 * estuviera «Pendiente» en Meta o el token no sirviera. Ahora se le pregunta
 * a Meta (solo lectura: no envía, no registra ni modifica nada) y el panel
 * muestra lo que Meta responde.
 *
 * Nunca devuelve ni registra el token. Los textos son propios: no se copian
 * mensajes de error de Meta.
 */
import { META_GRAPH_VERSION } from "@/lib/plantillas/meta";

export type EstadoLinea = "conectada" | "pendiente" | "con_problema" | "token_invalido" | "sin_acceso" | "sin_credenciales" | "no_comprobado";

export interface InformeLinea {
  estado: EstadoLinea;
  /** Solo «conectada» habilita enviar desde la línea. */
  ok: boolean;
  etiqueta: string;
  detalle: string;
  telefono: string | null;
  nombreVerificado: string | null;
  calidad: string | null;
  nombreEstado: string | null;
}

const CAMPOS = "display_phone_number,verified_name,status,code_verification_status,quality_rating,name_status";

const PROBLEMAS: Record<string, string> = {
  DISCONNECTED: "desconectado",
  DELETED: "eliminado",
  BANNED: "bloqueado por Meta",
  RESTRICTED: "restringido por Meta",
  FLAGGED: "marcado por Meta",
  MIGRATED: "migrado a otra cuenta",
  RATE_LIMITED: "con el límite de envíos alcanzado",
};

const CALIDAD: Record<string, string> = { GREEN: "alta", YELLOW: "media", RED: "baja", UNKNOWN: "sin calificar" };

function informe(estado: EstadoLinea, etiqueta: string, detalle: string, extra: Partial<InformeLinea> = {}): InformeLinea {
  return { estado, ok: estado === "conectada", etiqueta, detalle, telefono: null, nombreVerificado: null, calidad: null, nombreEstado: null, ...extra };
}

/** Interpreta la respuesta de Meta para un número. Pura. */
export function interpretarNumero(j: Record<string, unknown>): InformeLinea {
  const status = typeof j.status === "string" ? j.status.toUpperCase() : "";
  const verificacion = typeof j.code_verification_status === "string" ? j.code_verification_status.toUpperCase() : "";
  const extra: Partial<InformeLinea> = {
    telefono: typeof j.display_phone_number === "string" ? j.display_phone_number : null,
    nombreVerificado: typeof j.verified_name === "string" && j.verified_name ? j.verified_name : null,
    calidad: typeof j.quality_rating === "string" ? CALIDAD[j.quality_rating.toUpperCase()] ?? null : null,
    nombreEstado: typeof j.name_status === "string" ? j.name_status.toUpperCase() : null,
  };
  if (PROBLEMAS[status]) {
    return informe("con_problema", `Con problema: ${PROBLEMAS[status]}`, `Meta informa el número como ${PROBLEMAS[status]}. No se puede enviar hasta resolverlo en el Administrador de WhatsApp.`, extra);
  }
  if (status === "PENDING" || status === "UNVERIFIED") {
    return informe(
      "pendiente",
      "Pendiente en Meta",
      "El número está agregado pero Meta todavía no lo tiene conectado. Hay que completar la verificación y el registro del número en el Administrador de WhatsApp; hasta entonces no puede enviar ni recibir.",
      extra
    );
  }
  if (status === "CONNECTED") {
    if (verificacion && verificacion !== "VERIFIED") {
      return informe("pendiente", "Pendiente de verificación", "El número figura conectado pero su código de verificación no está confirmado en Meta.", extra);
    }
    return informe("conectada", "Conectada", "Meta informa el número conectado.", extra);
  }
  return informe("no_comprobado", "Estado desconocido", status ? `Meta devolvió un estado que el panel no reconoce (${status.toLowerCase()}). Revisalo en el Administrador de WhatsApp.` : "Meta no informó el estado del número. Revisalo en el Administrador de WhatsApp.", extra);
}

/** Interpreta un error de la API de Meta. Pura. */
export function interpretarError(httpStatus: number, codigo: number | null, subcodigo: number | null): InformeLinea {
  if (codigo === 190 || httpStatus === 401) {
    return informe("token_invalido", "Token inválido o vencido", "Meta rechazó el token de acceso de esta línea (inválido, vencido o revocado). Hay que generar uno nuevo y cargarlo en Vercel.");
  }
  if (codigo === 100 || codigo === 10 || codigo === 200 || subcodigo === 33 || httpStatus === 403 || httpStatus === 404) {
    return informe("sin_acceso", "Sin acceso al número", "Meta no encuentra ese número con este token: el identificador del número es incorrecto o el token no tiene acceso a esa cuenta.");
  }
  return informe("no_comprobado", "No se pudo comprobar", `Meta no respondió como se esperaba (código ${codigo ?? httpStatus}). Probá de nuevo en unos minutos.`);
}

type Fetcher = (url: string, init: { headers: Record<string, string>; cache?: RequestCache; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

const MEMORIA_MS = 2 * 60 * 1000;
const memoria = new Map<string, { hasta: number; informe: InformeLinea }>();
/** Solo pruebas. */
export function vaciarMemoriaEstados() {
  memoria.clear();
}

/**
 * Consulta a Meta el estado de la línea cuyas variables empiezan con `clave`
 * (p. ej. WHATSAPP_MARKETING). Solo lectura. Con `memoria: true` reutiliza por
 * 2 minutos una respuesta definitiva (nunca un «no se pudo comprobar»), para
 * no consultar a Meta en cada vuelta del envío automático.
 */
export async function consultarEstadoLinea(
  clave: string,
  opciones: { env?: Record<string, string | undefined>; fetchImpl?: Fetcher; timeoutMs?: number; memoria?: boolean } = {}
): Promise<InformeLinea> {
  if (opciones.memoria) {
    const guardado = memoria.get(clave);
    if (guardado && guardado.hasta > Date.now()) return guardado.informe;
    const nuevo = await consultarEstadoLinea(clave, { ...opciones, memoria: false });
    if (nuevo.estado !== "no_comprobado") memoria.set(clave, { hasta: Date.now() + MEMORIA_MS, informe: nuevo });
    return nuevo;
  }
  const env = opciones.env ?? process.env;
  const numeroId = env[`${clave}_PHONE_NUMBER_ID`]?.trim();
  const token = env[`${clave}_ACCESS_TOKEN`]?.trim();
  if (!numeroId || !token) {
    return informe("sin_credenciales", "Faltan variables", `Faltan ${!numeroId ? `${clave}_PHONE_NUMBER_ID` : ""}${!numeroId && !token ? " y " : ""}${!token ? `${clave}_ACCESS_TOKEN` : ""} en Vercel.`);
  }
  const fetchImpl: Fetcher = opciones.fetchImpl ?? ((url, init) => fetch(url, init));
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(numeroId)}?fields=${CAMPOS}`;
  try {
    const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(opciones.timeoutMs ?? 7000) });
    const texto = await res.text();
    let json: any = null;
    try {
      json = texto ? JSON.parse(texto) : null;
    } catch {
      json = null;
    }
    if (!res.ok || json?.error) {
      return interpretarError(res.status, typeof json?.error?.code === "number" ? json.error.code : null, typeof json?.error?.error_subcode === "number" ? json.error.error_subcode : null);
    }
    return interpretarNumero(json ?? {});
  } catch {
    return informe("no_comprobado", "No se pudo comprobar", "No hubo respuesta de Meta a tiempo. Probá de nuevo en unos minutos.");
  }
}

/** Consulta varias líneas en paralelo; devuelve el informe por clave. */
export async function consultarEstadosLineas(claves: string[], opciones: Parameters<typeof consultarEstadoLinea>[1] = {}): Promise<Record<string, InformeLinea>> {
  const unicas = Array.from(new Set(claves));
  const filas = await Promise.all(unicas.map(async (k) => [k, await consultarEstadoLinea(k, opciones)] as const));
  return Object.fromEntries(filas);
}
