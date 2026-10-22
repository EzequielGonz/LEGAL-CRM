import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fotos y videos salientes (22/10): desde el chat y junto al presupuesto.
 * Se suben al depósito privado con un enlace firmado de un solo uso y Meta
 * los descarga con un enlace firmado temporal.
 */
export const BUCKET_SALIENTES = "chat-salientes";
/** Límites de WhatsApp: imágenes 5 MB, videos 16 MB. */
export const MAX_IMAGEN = 5 * 1024 * 1024;
export const MAX_VIDEO = 16 * 1024 * 1024;

const EXT: Record<string, "image" | "video"> = { jpg: "image", jpeg: "image", png: "image", webp: "image", mp4: "video", "3gp": "video", mov: "video" };

/** Tipo de medio según el nombre del archivo (null si no se admite). Pura. */
export function tipoMedio(nombre: string): "image" | "video" | null {
  const ext = (nombre.split(".").pop() ?? "").toLowerCase();
  return EXT[ext] ?? null;
}

export async function urlSubidaSaliente(prefijo: string, nombre: string, bucket = BUCKET_SALIENTES) {
  if (!tipoMedio(nombre)) throw new Error("Formato no admitido: subí una foto (JPG, PNG o WEBP) o un video (MP4).");
  const ext = (nombre.split(".").pop() ?? "").toLowerCase();
  const path = `${prefijo}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`No se pudo preparar la subida: ${error?.message ?? "sin enlace"}`);
  return { path, token: (data as any).token as string, bucket };
}

export async function enlaceFirmado(path: string, bucket = BUCKET_SALIENTES) {
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) throw new Error("No se pudo abrir el archivo subido.");
  return data.signedUrl;
}
