import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Area } from "@/lib/supabase/database.types";

/**
 * Genera una URL firmada para que el navegador suba el archivo original
 * (Excel/CSV) DIRECTO a Supabase Storage, sin pasar por esta función
 * serverless.
 *
 * Por qué: antes el archivo viajaba dentro del mismo POST a /api/bases (como
 * multipart/form-data). Las funciones serverless de Vercel tienen un límite
 * de ~4.5MB por request — un archivo más pesado que eso hacía que Vercel
 * rechazara la request ANTES de que nuestro código corriera, devolviendo un
 * texto plano ("Request Entity Too Large") en vez de JSON. El panel
 * intentaba leer eso como JSON y explotaba con "Unexpected token 'R'...".
 * Subiendo el archivo directo a Storage con una URL firmada, el archivo
 * nunca pasa por esta función: solo pasan los datos livianos (nombre, filas
 * ya interpretadas) por /api/bases.
 */
export async function POST(request: Request) {
  const { area, fileName } = await request.json();

  if (area !== "civil" && area !== "penal") {
    return NextResponse.json({ error: "Área inválida" }, { status: 400 });
  }
  if (!fileName || typeof fileName !== "string") {
    return NextResponse.json({ error: "Falta el nombre del archivo" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${area as Area}/${crypto.randomUUID()}/${safeName}`;

  const { data, error } = await supabase.storage
    .from("bases-originales")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "No se pudo preparar la subida del archivo" },
      { status: 500 }
    );
  }

  return NextResponse.json({ path: data.path, token: data.token });
}
