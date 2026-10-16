import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { rubroIdDe } from "@/lib/indicadores";
import { ContenidoError, cambiarPolitica, cambioPidePin, esCanalOTodos, validarCambioPolitica } from "@/lib/contenido/panel";

export const dynamic = "force-dynamic";

/**
 * PATCH { perfil, canal | "todos", cambios, pin? } — pausar el calendario no
 * pide nada; habilitar la autopublicación o reanudar pide el PIN y exige
 * cuenta conectada y llamado a la acción configurado.
 */
export async function PATCH(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rubroId = rubroIdDe(body?.perfil);
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  if (!esCanalOTodos(body?.canal)) return NextResponse.json({ error: "Canal no válido." }, { status: 400 });
  const v = validarCambioPolitica(body?.cambios);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  if (cambioPidePin(v.cambio)) {
    const pin = await confirmPin(request, body?.pin, "politica_publicacion", { perfil: rubroId, canal: body.canal, ...v.cambio });
    if (!pin.ok) return NextResponse.json({ error: pin.error }, { status: pin.status });
  }
  try {
    const politicas = await cambiarPolitica(rubroId, body.canal, v.cambio);
    return NextResponse.json({ ok: true, politicas });
  } catch (err) {
    const e = err as ContenidoError;
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
