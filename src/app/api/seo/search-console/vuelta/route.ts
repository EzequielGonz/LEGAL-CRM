import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { cifrarToken, configuracionSearchConsole, intercambiarCodigo, verificarEstado } from "@/lib/seo/search-console";

export const dynamic = "force-dynamic";

/** Vuelta de OAuth: verifica el estado firmado, canjea el código y guarda el token cifrado. */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const cfg = configuracionSearchConsole();
  if (!cfg.lista) return NextResponse.json({ error: "Search Console no está habilitado en el servidor." }, { status: 409 });
  const sp = new URL(request.url).searchParams;
  const estado = verificarEstado(sp.get("state") ?? "", Date.now());
  if (!estado.ok) return NextResponse.json({ error: "El pedido de conexión venció o no es válido. Volvé a intentar." }, { status: 400 });
  const code = sp.get("code");
  if (!code) return NextResponse.json({ error: sp.get("error") ?? "Conexión cancelada." }, { status: 400 });
  const r = await intercambiarCodigo(code);
  const supabase = createAdminClient();
  if (!r.refreshToken) {
    await supabase
      .from("search_console_connections")
      .upsert({ rubro_id: estado.rubroId, estado: "sin_conectar", ultimo_error: r.error, updated_at: new Date().toISOString() }, { onConflict: "rubro_id" });
    return NextResponse.json({ error: `No se pudo conectar: ${r.error}` }, { status: 502 });
  }
  await supabase.from("search_console_connections").upsert(
    {
      rubro_id: estado.rubroId,
      estado: "conectado",
      refresh_token_cifrado: cifrarToken(r.refreshToken),
      conectado_at: new Date().toISOString(),
      ultimo_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "rubro_id" }
  );
  return NextResponse.redirect(new URL("/contenido?conectado=search_console", request.url));
}
