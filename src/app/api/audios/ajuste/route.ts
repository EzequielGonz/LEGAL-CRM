import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS } from "@/lib/rubros";
import { audiosEncendidos } from "@/lib/audios/reglas";
import { cambiarAudiosDePerfil, leerLlaveAudios } from "@/lib/audios/transcribir";

export const dynamic = "force-dynamic";

/**
 * Enciende o apaga «El bot entiende los audios» en UN perfil. No enciende
 * ningún bot ni levanta ninguna pausa: solo decide si un audio se pasa a
 * texto antes de que el bot (donde ya responde) lo lea.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const { perfil, encendido } = await request.json().catch(() => ({ perfil: null, encendido: null }));
  if (typeof perfil !== "string" || !(perfil in RUBRO_IDS)) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  if (typeof encendido !== "boolean") return NextResponse.json({ error: "Falta indicar si se enciende o se apaga." }, { status: 400 });
  const supabase = createAdminClient();
  try {
    const antes = audiosEncendidos(await leerLlaveAudios(supabase), perfil);
    await cambiarAudiosDePerfil(perfil, encendido, "panel", supabase);
    await supabase.from("ops_change_log").insert({
      actor: "panel",
      action: encendido ? "encender_audios_a_texto" : "apagar_audios_a_texto",
      target: `system_settings:audios_a_texto:${perfil}`,
      before: { encendido: antes },
      after: { encendido },
    });
    return NextResponse.json({ ok: true, perfil, encendido });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
