/**
 * Perfil de empresa de WhatsApp de cada línea (18/10): foto, info,
 * descripción, dirección, mail, webs y rubro, con la API oficial de Meta
 * (WhatsApp Cloud API). El token es el de la línea, en la configuración
 * privada del servidor.
 */
import { META_GRAPH_VERSION } from "@/lib/plantillas/meta";

export const VERTICALES = [
  "UNDEFINED", "OTHER", "AUTO", "BEAUTY", "APPAREL", "EDU", "ENTERTAIN", "EVENT_PLAN", "FINANCE", "GROCERY", "GOVT", "HOTEL",
  "HEALTH", "NONPROFIT", "PROF_SERVICES", "RETAIL", "TRAVEL", "RESTAURANT",
] as const;

export const VERTICAL_LABEL: Record<string, string> = {
  UNDEFINED: "Sin definir", OTHER: "Otro", AUTO: "Automotor", BEAUTY: "Belleza", APPAREL: "Indumentaria", EDU: "Educación",
  ENTERTAIN: "Entretenimiento", EVENT_PLAN: "Eventos", FINANCE: "Finanzas", GROCERY: "Almacén", GOVT: "Gobierno", HOTEL: "Hotelería",
  HEALTH: "Salud", NONPROFIT: "Sin fines de lucro", PROF_SERVICES: "Servicios profesionales", RETAIL: "Comercio", TRAVEL: "Turismo", RESTAURANT: "Gastronomía",
};

export interface PerfilWhatsApp {
  about: string;
  description: string;
  address: string;
  email: string;
  websites: string[];
  vertical: string;
  profile_picture_url?: string | null;
}

export class PerfilError extends Error {
  constructor(message: string, public campo?: string, public status = 400) {
    super(message);
  }
}

/** Valida y limpia lo que se va a mandar a Meta. Pura. */
export function validarPerfil(v: Record<string, unknown>): Omit<PerfilWhatsApp, "profile_picture_url"> {
  const texto = (k: string, max: number) => {
    const x = typeof v[k] === "string" ? (v[k] as string).trim() : "";
    if (x.length > max) throw new PerfilError(`Máximo ${max} caracteres.`, k);
    return x;
  };
  const about = texto("about", 139);
  const description = texto("description", 512);
  const address = texto("address", 256);
  const email = texto("email", 128);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PerfilError("El mail no es válido.", "email");
  const websites = (Array.isArray(v.websites) ? v.websites : [])
    .map((w) => (typeof w === "string" ? w.trim() : ""))
    .filter(Boolean)
    .slice(0, 2);
  for (const w of websites) if (!/^https?:\/\/[^\s]+$/.test(w) || w.length > 256) throw new PerfilError("Cada web tiene que empezar con https://.", "websites");
  const vertical = typeof v.vertical === "string" && (VERTICALES as readonly string[]).includes(v.vertical) ? v.vertical : "UNDEFINED";
  return { about, description, address, email, websites, vertical };
}

function acceso(credentialKey: string) {
  const phoneId = process.env[`${credentialKey}_PHONE_NUMBER_ID`]?.trim();
  const token = process.env[`${credentialKey}_ACCESS_TOKEN`]?.trim();
  if (!phoneId || !token) throw new PerfilError(`Falta la configuración privada de la línea (${credentialKey}_PHONE_NUMBER_ID / _ACCESS_TOKEN).`, undefined, 409);
  return { phoneId, token };
}

async function graph(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* sin JSON */
  }
  if (!res.ok) throw new PerfilError(json?.error?.error_user_msg || json?.error?.message || `Meta respondió ${res.status}`, undefined, 502);
  return json;
}

export async function leerPerfilWhatsApp(credentialKey: string): Promise<PerfilWhatsApp> {
  const { phoneId, token } = acceso(credentialKey);
  const j = await graph(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(phoneId)}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  const d = j?.data?.[0] ?? {};
  return {
    about: d.about ?? "",
    description: d.description ?? "",
    address: d.address ?? "",
    email: d.email ?? "",
    websites: Array.isArray(d.websites) ? d.websites : [],
    vertical: d.vertical ?? "UNDEFINED",
    profile_picture_url: d.profile_picture_url ?? null,
  };
}

export async function guardarPerfilWhatsApp(credentialKey: string, datos: Omit<PerfilWhatsApp, "profile_picture_url">, fotoHandle?: string | null): Promise<void> {
  const { phoneId, token } = acceso(credentialKey);
  const cuerpo: Record<string, unknown> = { messaging_product: "whatsapp", ...datos };
  if (!datos.websites.length) delete cuerpo.websites;
  if (fotoHandle) cuerpo.profile_picture_handle = fotoHandle;
  await graph(`https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(phoneId)}/whatsapp_business_profile`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
}

/**
 * Sube la foto con la carga por partes de Meta y devuelve el identificador
 * que después se usa para cambiar la foto del perfil.
 */
export async function subirFotoPerfil(credentialKey: string, archivo: ArrayBuffer, tipo: string): Promise<string> {
  const { token } = acceso(credentialKey);
  const appId = process.env.META_APP_ID?.trim();
  if (!appId) throw new PerfilError("Falta META_APP_ID en la configuración privada.", undefined, 409);
  if (!/^image\/(jpeg|png)$/.test(tipo)) throw new PerfilError("La foto tiene que ser JPG o PNG.", "foto");
  if (archivo.byteLength > 5 * 1024 * 1024) throw new PerfilError("La foto puede pesar hasta 5 MB.", "foto");
  const sesion = await graph(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(appId)}/uploads?file_length=${archivo.byteLength}&file_type=${encodeURIComponent(tipo)}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } }
  );
  if (!sesion?.id) throw new PerfilError("Meta no abrió la carga de la foto.", undefined, 502);
  const subida = await graph(`https://graph.facebook.com/${META_GRAPH_VERSION}/${sesion.id}`, {
    method: "POST",
    headers: { Authorization: `OAuth ${token}`, file_offset: "0" },
    body: archivo,
  });
  if (!subida?.h) throw new PerfilError("Meta no devolvió la foto subida.", undefined, 502);
  return String(subida.h);
}
