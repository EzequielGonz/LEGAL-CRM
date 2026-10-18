/**
 * Perfiles de Facebook e Instagram de cada marca (reorganización 2, 18/10),
 * con la API oficial de Meta (Graph API) y el token de la página guardado en
 * la configuración privada del servidor (nunca en la base ni en el chat).
 *
 *  - Facebook: se pueden leer y cambiar la descripción corta, la
 *    descripción, el teléfono, la web, los mails y la foto de perfil.
 *  - Instagram: Meta solo deja LEER el perfil (biografía, foto, web,
 *    seguidores). La biografía y la foto se cambian en la app de Instagram.
 *
 * Variables por perfil (en Vercel): FACEBOOK_<CLAVE>_PAGE_ID,
 * FACEBOOK_<CLAVE>_PAGE_ACCESS_TOKEN e INSTAGRAM_<CLAVE>_BUSINESS_ID.
 */
import { META_GRAPH_VERSION } from "@/lib/plantillas/meta";
import type { SlugPerfil } from "@/lib/marca";

/** Clave de las variables de cada perfil (Jurídico usa las de Civil, que ya existían). */
export const CLAVE_REDES: Record<SlugPerfil, string> = {
  juridico: "CIVIL",
  agencia_0km: "AGENCIA_0KM",
  coberturas_medicas: "COBERTURAS_MEDICAS",
  marketing: "MARKETING",
};

export function variablesRedes(slug: SlugPerfil) {
  const k = CLAVE_REDES[slug];
  return { pagina: `FACEBOOK_${k}_PAGE_ID`, token: `FACEBOOK_${k}_PAGE_ACCESS_TOKEN`, instagram: `INSTAGRAM_${k}_BUSINESS_ID` };
}

export interface PaginaFacebook {
  nombre: string;
  enlace: string | null;
  foto: string | null;
  seguidores: number | null;
  about: string;
  description: string;
  phone: string;
  website: string;
  emails: string[];
}

export interface PerfilInstagram {
  usuario: string;
  nombre: string | null;
  biografia: string;
  web: string | null;
  foto: string | null;
  seguidores: number | null;
  publicaciones: number | null;
}

export class RedError extends Error {
  constructor(message: string, public campo?: string, public status = 400) {
    super(message);
  }
}

/** Valida y limpia lo editable de la página de Facebook. Pura. */
export function validarPaginaFacebook(v: Record<string, unknown>): Pick<PaginaFacebook, "about" | "description" | "phone" | "website" | "emails"> {
  const texto = (k: string, max: number) => {
    const x = typeof v[k] === "string" ? (v[k] as string).trim() : "";
    if (x.length > max) throw new RedError(`Máximo ${max} caracteres.`, k);
    return x;
  };
  const about = texto("about", 255);
  const description = texto("description", 5000);
  const phone = texto("phone", 40);
  if (phone && !/^\+?[\d\s()-]{6,}$/.test(phone)) throw new RedError("El teléfono no es válido.", "phone");
  const website = texto("website", 500);
  if (website && !/^https?:\/\/[^\s]+$/.test(website)) throw new RedError("La web tiene que empezar con https://.", "website");
  const emails = (Array.isArray(v.emails) ? v.emails : typeof v.emails === "string" ? (v.emails as string).split(/[,;\s]+/) : [])
    .map((e) => (typeof e === "string" ? e.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);
  for (const e of emails) if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new RedError(`El mail «${e}» no es válido.`, "emails");
  return { about, description, phone, website, emails };
}

function acceso(slug: SlugPerfil) {
  const n = variablesRedes(slug);
  const pagina = process.env[n.pagina]?.trim();
  const token = process.env[n.token]?.trim();
  const instagram = process.env[n.instagram]?.trim() || null;
  return { pagina, token, instagram, nombres: n };
}

export function estadoVinculacion(slug: SlugPerfil) {
  const a = acceso(slug);
  return { facebook: !!(a.pagina && a.token), instagram: !!(a.instagram && a.token), variables: a.nombres };
}

const BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

async function graph(url: string, init?: RequestInit) {
  const res = await fetch(url, { cache: "no-store", ...init });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* sin JSON */
  }
  if (!res.ok || json?.error) throw new RedError(json?.error?.error_user_msg || json?.error?.message || `Meta respondió ${res.status}`, undefined, 502);
  return json;
}

function exigir(slug: SlugPerfil) {
  const a = acceso(slug);
  if (!a.pagina || !a.token) throw new RedError(`Falta vincular la página de Facebook (variables ${a.nombres.pagina} y ${a.nombres.token} en Vercel).`, undefined, 409);
  return a as { pagina: string; token: string; instagram: string | null };
}

export async function leerPaginaFacebook(slug: SlugPerfil): Promise<PaginaFacebook> {
  const { pagina, token } = exigir(slug);
  const campos = "name,link,about,description,phone,website,emails,followers_count,picture.type(large){url}";
  const j = await graph(`${BASE}/${encodeURIComponent(pagina)}?fields=${encodeURIComponent(campos)}`, { headers: { Authorization: `Bearer ${token}` } });
  return {
    nombre: j.name ?? "",
    enlace: j.link ?? null,
    foto: j.picture?.data?.url ?? null,
    seguidores: typeof j.followers_count === "number" ? j.followers_count : null,
    about: j.about ?? "",
    description: j.description ?? "",
    phone: j.phone ?? "",
    website: j.website ?? "",
    emails: Array.isArray(j.emails) ? j.emails : [],
  };
}

export async function guardarPaginaFacebook(slug: SlugPerfil, datos: ReturnType<typeof validarPaginaFacebook>) {
  const { pagina, token } = exigir(slug);
  const body = new URLSearchParams();
  body.set("about", datos.about);
  body.set("description", datos.description);
  body.set("phone", datos.phone);
  body.set("website", datos.website);
  body.set("emails", JSON.stringify(datos.emails));
  await graph(`${BASE}/${encodeURIComponent(pagina)}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
}

export async function subirFotoPaginaFacebook(slug: SlugPerfil, bytes: ArrayBuffer, tipo: string) {
  const { pagina, token } = exigir(slug);
  if (!/^image\/(jpeg|png)$/.test(tipo)) throw new RedError("La foto tiene que ser JPG o PNG.", "foto");
  if (bytes.byteLength > 4 * 1024 * 1024) throw new RedError("La foto pesa más de 4 MB.", "foto");
  const form = new FormData();
  form.set("source", new Blob([bytes], { type: tipo }), tipo === "image/png" ? "foto.png" : "foto.jpg");
  await graph(`${BASE}/${encodeURIComponent(pagina)}/picture`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
}

export async function leerPerfilInstagram(slug: SlugPerfil): Promise<PerfilInstagram> {
  const a = acceso(slug);
  if (!a.instagram || !a.token) throw new RedError(`Falta vincular Instagram (variable ${a.nombres.instagram} y el token de la página en Vercel).`, undefined, 409);
  const campos = "username,name,biography,website,profile_picture_url,followers_count,media_count";
  const j = await graph(`${BASE}/${encodeURIComponent(a.instagram)}?fields=${encodeURIComponent(campos)}`, { headers: { Authorization: `Bearer ${a.token}` } });
  return {
    usuario: j.username ?? "",
    nombre: j.name ?? null,
    biografia: j.biography ?? "",
    web: j.website ?? null,
    foto: j.profile_picture_url ?? null,
    seguidores: typeof j.followers_count === "number" ? j.followers_count : null,
    publicaciones: typeof j.media_count === "number" ? j.media_count : null,
  };
}
