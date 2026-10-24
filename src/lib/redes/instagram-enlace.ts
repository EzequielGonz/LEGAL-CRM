/**
 * Instagram por enlace (24/10): sin la API de Meta vinculada, el perfil se
 * muestra desde su dirección pública. Pura.
 */
export function usuarioDeInstagram(entrada: unknown): string | null {
  const t = String(entrada ?? "").trim();
  if (!t) return null;
  const sinArroba = t.replace(/^@/, "");
  if (/^[A-Za-z0-9._]{1,30}$/.test(sinArroba)) return sinArroba.toLowerCase();
  const m = /^(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:[?#].*)?$/i.exec(t);
  if (!m) return null;
  const u = m[1].toLowerCase();
  return ["p", "reel", "reels", "explore", "stories", "accounts"].includes(u) ? null : u;
}

export const claveInstagramEnlace = (slug: string) => `instagram_enlace_${slug}`;
